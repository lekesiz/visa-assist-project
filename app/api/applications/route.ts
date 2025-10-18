import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { withErrorHandler, getUserFromHeaders, NotFoundError, ConflictError } from '@/lib/error-handler'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validateRequestBody, validateQueryParams, paginationSchema, dateSchema } from '@/lib/validations/common'

// Validation schemas
const listApplicationsQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'in_progress', 'submitted', 'approved', 'rejected']).optional(),
  visa_type: z.enum(['tourist', 'business', 'student', 'work', 'family_reunion']).optional(),
})

const createApplicationSchema = z.object({
  visa_type: z.enum(['tourist', 'business', 'student', 'work', 'family_reunion']),
  target_country: z.string().length(2).default('DE'),
  purpose_of_travel: z.string().min(10).max(500),
  planned_travel_date: dateSchema.optional(),
  duration_of_stay: z.number().min(1).max(365).optional(),
  notes: z.string().max(1000).optional(),
})

// GET - List all applications for the authenticated user
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.read)
  if (!rateLimitResult.success) return rateLimitResult.error

  // Get user from middleware
  const user = getUserFromHeaders(request.headers)
  
  const supabase = await createClient()

  // Validate query parameters
  const searchParams = new URL(request.url).searchParams
  const params = validateQueryParams(searchParams, listApplicationsQuerySchema)
  
  // Ensure required pagination values are set
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  // Build query
  let query = supabase
    .from('applications')
    .select(`
      *,
      documents:documents(count),
      appointments:appointments(
        id,
        appointment_date,
        appointment_type,
        status
      ),
      ai_analyses:ai_analyses(
        analysis_type,
        confidence_score,
        created_at
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.visa_type) {
    query = query.eq('visa_type', params.visa_type)
  }

  // Apply sorting
  if (params.sortBy) {
    query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  const offset = (page - 1) * limit
  const { data, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Database error fetching applications:', error)
    throw error
  }

  return NextResponse.json({
    success: true,
    data: data || [],
    pagination: {
      page: params.page,
      limit: params.limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / params.limit),
      hasMore: (count || 0) > offset + params.limit
    }
  })
})

// POST - Create a new application
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.api)
  if (!rateLimitResult.success) return rateLimitResult.error

  // Get user from middleware
  const user = getUserFromHeaders(request.headers)
  
  const supabase = await createClient()

  // Validate request body
  const body = await validateRequestBody(request, createApplicationSchema)

  // Check if user has an active application
  const { data: activeApp } = await supabase
    .from('applications')
    .select('id, status, visa_type')
    .eq('user_id', user.id)
    .in('status', ['draft', 'in_progress', 'submitted'])
    .single()

  if (activeApp) {
    throw new ConflictError(
      'You already have an active application',
      {
        existingApplicationId: activeApp.id,
        status: activeApp.status,
        visaType: activeApp.visa_type
      }
    )
  }

  // Create new application
  const { data: application, error: createError } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      visa_type: body.visa_type,
      target_country: body.target_country,
      purpose_of_travel: body.purpose_of_travel,
      planned_travel_date: body.planned_travel_date,
      duration_of_stay: body.duration_of_stay,
      notes: body.notes,
      status: 'draft',
      current_step: 1,
      total_steps: 8,
      progress_percentage: 0,
      checklist_items: getDefaultChecklist(body.visa_type),
      is_premium: false
    })
    .select()
    .single()

  if (createError) {
    console.error('Database error creating application:', createError)
    throw createError
  }

  // Create initial activity log
  await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      entity_type: 'application',
      entity_id: application.id,
      action: 'created',
      details: {
        visa_type: body.visa_type,
        purpose_of_travel: body.purpose_of_travel
      }
    })

  return NextResponse.json({
    success: true,
    data: application,
    message: 'Application created successfully'
  }, { status: 201 })
})

// Helper function to get default checklist based on visa type
function getDefaultChecklist(visaType: string) {
  const commonItems = [
    { id: 'personal_info', label: 'Personal Information', completed: false, required: true },
    { id: 'passport', label: 'Valid Passport', completed: false, required: true },
    { id: 'photo', label: 'Biometric Photo', completed: false, required: true },
    { id: 'travel_insurance', label: 'Travel Insurance', completed: false, required: true },
    { id: 'accommodation', label: 'Accommodation Proof', completed: false, required: true },
    { id: 'financial_proof', label: 'Financial Proof', completed: false, required: true }
  ]

  const visaSpecificItems: Record<string, any[]> = {
    tourist: [
      { id: 'return_ticket', label: 'Return Flight Ticket', completed: false, required: true },
      { id: 'itinerary', label: 'Travel Itinerary', completed: false, required: true }
    ],
    business: [
      { id: 'invitation_letter', label: 'Business Invitation Letter', completed: false, required: true },
      { id: 'company_docs', label: 'Company Documents', completed: false, required: true }
    ],
    student: [
      { id: 'admission_letter', label: 'University Admission Letter', completed: false, required: true },
      { id: 'blocked_account', label: 'Blocked Account Proof', completed: false, required: true },
      { id: 'motivation_letter', label: 'Motivation Letter', completed: false, required: true }
    ],
    work: [
      { id: 'work_contract', label: 'Employment Contract', completed: false, required: true },
      { id: 'qualification_docs', label: 'Qualification Documents', completed: false, required: true },
      { id: 'denklik', label: 'Denklik/Recognition', completed: false, required: false }
    ],
    family_reunion: [
      { id: 'family_proof', label: 'Family Relationship Proof', completed: false, required: true },
      { id: 'sponsor_docs', label: 'Sponsor Documents', completed: false, required: true },
      { id: 'marriage_cert', label: 'Marriage Certificate', completed: false, required: false }
    ]
  }

  return [
    ...commonItems,
    ...(visaSpecificItems[visaType] || [])
  ]
}