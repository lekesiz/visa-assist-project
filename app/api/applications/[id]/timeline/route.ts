import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get application timeline/activity log
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify application belongs to user
    const { data: application } = await supabase
      .from('applications')
      .select('id, created_at, status, visa_type')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get all activity logs for this application
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', 'application')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: true })

    if (activityError) {
      throw activityError
    }

    // Get document uploads
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, document_type, file_name, created_at, verification_status')
      .eq('application_id', params.id)
      .order('created_at', { ascending: true })

    if (docError) {
      throw docError
    }

    // Get appointments
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('id, appointment_type, appointment_date, status, created_at')
      .eq('application_id', params.id)
      .order('created_at', { ascending: true })

    if (apptError) {
      throw apptError
    }

    // Get AI analyses
    const { data: analyses, error: analysisError } = await supabase
      .from('ai_analyses')
      .select('id, analysis_type, confidence_score, created_at')
      .eq('entity_type', 'application')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: true })

    if (analysisError) {
      throw analysisError
    }

    // Get payments
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('id, amount, currency, status, payment_type, created_at')
      .eq('application_id', params.id)
      .order('created_at', { ascending: true })

    if (paymentError) {
      throw paymentError
    }

    // Build timeline
    const timeline = []

    // Add application creation
    timeline.push({
      id: `app-created-${application.id}`,
      type: 'application_created',
      title: 'Application Created',
      description: `${application.visa_type} visa application created`,
      timestamp: application.created_at,
      icon: 'document',
      status: 'completed'
    })

    // Add activities
    activities?.forEach(activity => {
      timeline.push({
        id: `activity-${activity.id}`,
        type: 'activity',
        title: getActivityTitle(activity.action),
        description: getActivityDescription(activity),
        timestamp: activity.created_at,
        icon: getActivityIcon(activity.action),
        status: 'completed',
        details: activity.details
      })
    })

    // Add document uploads
    documents?.forEach(doc => {
      timeline.push({
        id: `doc-${doc.id}`,
        type: 'document_upload',
        title: 'Document Uploaded',
        description: `${doc.document_type} - ${doc.file_name}`,
        timestamp: doc.created_at,
        icon: 'upload',
        status: doc.verification_status || 'pending',
        documentId: doc.id
      })
    })

    // Add appointments
    appointments?.forEach(appt => {
      timeline.push({
        id: `appt-${appt.id}`,
        type: 'appointment',
        title: `${appt.appointment_type} Appointment`,
        description: `Scheduled for ${new Date(appt.appointment_date).toLocaleDateString()}`,
        timestamp: appt.created_at,
        icon: 'calendar',
        status: appt.status,
        appointmentId: appt.id,
        appointmentDate: appt.appointment_date
      })
    })

    // Add AI analyses
    analyses?.forEach(analysis => {
      timeline.push({
        id: `ai-${analysis.id}`,
        type: 'ai_analysis',
        title: 'AI Analysis Completed',
        description: `${analysis.analysis_type} - Confidence: ${Math.round(analysis.confidence_score * 100)}%`,
        timestamp: analysis.created_at,
        icon: 'ai',
        status: 'completed',
        analysisId: analysis.id
      })
    })

    // Add payments
    payments?.forEach(payment => {
      timeline.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: `Payment ${payment.status}`,
        description: `${payment.payment_type} - ${payment.amount} ${payment.currency}`,
        timestamp: payment.created_at,
        icon: 'payment',
        status: payment.status,
        paymentId: payment.id
      })
    })

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Add current status
    timeline.push({
      id: `status-current`,
      type: 'current_status',
      title: 'Current Status',
      description: `Application is ${application.status}`,
      timestamp: new Date().toISOString(),
      icon: 'status',
      status: application.status
    })

    return NextResponse.json({
      success: true,
      timeline,
      summary: {
        totalEvents: timeline.length,
        documentsUploaded: documents?.length || 0,
        appointmentsScheduled: appointments?.length || 0,
        analysesCompleted: analyses?.length || 0,
        paymentsProcessed: payments?.length || 0
      }
    })

  } catch (error) {
    console.error('Failed to fetch timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}

// Helper functions
function getActivityTitle(action: string): string {
  const titles: Record<string, string> = {
    created: 'Application Created',
    updated: 'Application Updated',
    submitted: 'Application Submitted',
    cancelled: 'Application Cancelled',
    approved: 'Application Approved',
    rejected: 'Application Rejected',
    document_uploaded: 'Document Uploaded',
    appointment_scheduled: 'Appointment Scheduled',
    payment_completed: 'Payment Completed',
    note_added: 'Note Added'
  }
  return titles[action] || action.charAt(0).toUpperCase() + action.slice(1)
}

function getActivityDescription(activity: any): string {
  if (activity.details?.fields_updated) {
    return `Updated: ${activity.details.fields_updated.join(', ')}`
  }
  if (activity.details?.status) {
    return `Status changed to ${activity.details.status}`
  }
  return activity.action
}

function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    created: 'plus',
    updated: 'edit',
    submitted: 'send',
    cancelled: 'x',
    approved: 'check',
    rejected: 'x',
    document_uploaded: 'upload',
    appointment_scheduled: 'calendar',
    payment_completed: 'credit-card',
    note_added: 'message'
  }
  return icons[action] || 'activity'
}