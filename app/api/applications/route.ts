import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all applications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const visaType = searchParams.get('visa_type')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

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
    if (status) {
      query = query.eq('status', status)
    }
    if (visaType) {
      query = query.eq('visa_type', visaType)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      applications: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Failed to fetch applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

// POST - Create a new application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { visa_type, target_country = 'DE', purpose_of_travel, planned_travel_date } = body

    // Validate required fields
    if (!visa_type || !purpose_of_travel) {
      return NextResponse.json(
        { error: 'Visa type and purpose of travel are required' },
        { status: 400 }
      )
    }

    // Check if user has an active application
    const { data: activeApp } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['draft', 'in_progress', 'submitted'])
      .single()

    if (activeApp) {
      return NextResponse.json(
        { error: 'You already have an active application. Please complete or cancel it first.' },
        { status: 400 }
      )
    }

    // Create new application
    const { data: application, error: createError } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        visa_type,
        target_country,
        purpose_of_travel,
        planned_travel_date,
        status: 'draft',
        current_step: 1,
        total_steps: 8,
        progress_percentage: 0,
        checklist_items: getDefaultChecklist(visa_type),
        is_premium: false
      })
      .select()
      .single()

    if (createError) {
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
          visa_type,
          purpose_of_travel
        }
      })

    return NextResponse.json({
      success: true,
      application,
      message: 'Application created successfully'
    })

  } catch (error) {
    console.error('Failed to create application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}

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

  const visaSpecificItems = {
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
    ...(visaSpecificItems[visaType as keyof typeof visaSpecificItems] || [])
  ]
}