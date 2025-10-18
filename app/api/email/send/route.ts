import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  sendEmail, 
  sendWelcomeEmail,
  sendApplicationStatusEmail,
  sendPaymentConfirmationEmail,
  sendAppointmentReminderEmail,
  validateEmail 
} from '@/lib/email/sendgrid'
import { getEmailTemplate, getEmailSubject } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to send emails
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // Only admins can send arbitrary emails
    const isAdmin = profile?.role === 'admin'

    const body = await request.json()
    const { 
      type, 
      to, 
      data: emailData,
      templateId,
      subject,
      content 
    } = body

    // Validate email address
    if (!validateEmail(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    let result
    let emailType = type
    let emailSubject = subject

    // Handle different email types
    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(
          to,
          emailData.firstName || 'User',
          emailData.verificationUrl
        )
        emailSubject = 'Welcome to Visa Assist!'
        break

      case 'application_status':
        if (!emailData.applicationId || !emailData.status) {
          return NextResponse.json(
            { error: 'Application ID and status are required' },
            { status: 400 }
          )
        }
        result = await sendApplicationStatusEmail(
          to,
          emailData.applicationId,
          emailData.status,
          emailData.additionalInfo
        )
        emailSubject = `Application ${emailData.status}`
        break

      case 'payment_confirmation':
        if (!emailData.paymentDetails) {
          return NextResponse.json(
            { error: 'Payment details are required' },
            { status: 400 }
          )
        }
        result = await sendPaymentConfirmationEmail(
          to,
          emailData.paymentDetails
        )
        emailSubject = 'Payment Confirmation'
        break

      case 'appointment_reminder':
        if (!emailData.appointmentDetails) {
          return NextResponse.json(
            { error: 'Appointment details are required' },
            { status: 400 }
          )
        }
        result = await sendAppointmentReminderEmail(
          to,
          emailData.appointmentDetails
        )
        emailSubject = 'Appointment Reminder'
        break

      case 'custom':
        // Only admins can send custom emails
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Unauthorized to send custom emails' },
            { status: 403 }
          )
        }

        if (!subject || (!content && !templateId)) {
          return NextResponse.json(
            { error: 'Subject and content/template are required for custom emails' },
            { status: 400 }
          )
        }

        result = await sendEmail({
          to,
          subject,
          templateId,
          dynamicTemplateData: emailData,
          text: content?.text,
          html: content?.html
        })
        break

      case 'test':
        // For development - use local templates
        if (process.env.NODE_ENV !== 'production') {
          const templateName = emailData.template || 'welcome'
          const html = getEmailTemplate(templateName, 'html', emailData)
          const text = getEmailTemplate(templateName, 'text', emailData)
          emailSubject = getEmailSubject(templateName)
          
          result = await sendEmail({
            to,
            subject: emailSubject,
            html,
            text
          })
        } else {
          return NextResponse.json(
            { error: 'Test emails not allowed in production' },
            { status: 400 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    // Log email sent
    const { data: emailLog } = await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        recipient: to,
        email_type: emailType,
        subject: emailSubject,
        status: 'sent',
        provider: 'sendgrid',
        metadata: {
          messageId: result.messageId,
          data: emailData
        }
      })
      .select()
      .single()

    // Create activity log
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'email',
        entity_id: emailLog?.id || 'unknown',
        action: 'email_sent',
        details: {
          type: emailType,
          recipient: to
        }
      })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      emailLogId: emailLog?.id
    })

  } catch (error) {
    console.error('Email send error:', error)
    
    // Log failed email attempt
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('email_logs')
        .insert({
          user_id: user.id,
          recipient: request.body?.to || 'unknown',
          email_type: request.body?.type || 'unknown',
          subject: request.body?.subject || 'Unknown',
          status: 'failed',
          error_message: error.message,
          provider: 'sendgrid'
        })
    }
    
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get email logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const emailType = searchParams.get('type')

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Build query
    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })

    // Non-admins can only see their own emails
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (emailType) {
      query = query.eq('email_type', emailType)
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
      logs: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Failed to fetch email logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    )
  }
}