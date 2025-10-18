import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'd-welcome123',
  VERIFICATION: 'd-verify123',
  PASSWORD_RESET: 'd-reset123',
  APPLICATION_SUBMITTED: 'd-submitted123',
  APPLICATION_APPROVED: 'd-approved123',
  APPLICATION_REJECTED: 'd-rejected123',
  PAYMENT_CONFIRMATION: 'd-payment123',
  APPOINTMENT_REMINDER: 'd-appointment123',
  DOCUMENT_VERIFIED: 'd-document123',
  AI_ANALYSIS_COMPLETE: 'd-analysis123'
}

// From email configuration
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@visa-assist.com'
const FROM_NAME = 'Visa Assist'

export interface SendEmailParams {
  to: string
  subject?: string
  templateId?: string
  dynamicTemplateData?: Record<string, any>
  text?: string
  html?: string
}

/**
 * Send email using SendGrid
 */
export async function sendEmail({
  to,
  subject,
  templateId,
  dynamicTemplateData,
  text,
  html
}: SendEmailParams) {
  try {
    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      }
    }

    if (templateId) {
      // Use dynamic template
      msg.templateId = templateId
      if (dynamicTemplateData) {
        msg.dynamicTemplateData = dynamicTemplateData
      }
    } else {
      // Use text/html content
      if (!subject) {
        throw new Error('Subject is required when not using template')
      }
      msg.subject = subject
      if (text) msg.text = text
      if (html) msg.html = html
    }

    const [response] = await sgMail.send(msg)
    
    return {
      success: true,
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode
    }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    
    if (error.response) {
      console.error('SendGrid response error:', error.response.body)
    }
    
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  verificationUrl?: string
) {
  return sendEmail({
    to: email,
    templateId: EMAIL_TEMPLATES.WELCOME,
    dynamicTemplateData: {
      firstName,
      verificationUrl,
      supportEmail: 'support@visa-assist.com',
      year: new Date().getFullYear()
    }
  })
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`
  
  return sendEmail({
    to: email,
    templateId: EMAIL_TEMPLATES.VERIFICATION,
    dynamicTemplateData: {
      verificationUrl,
      expiresIn: '24 hours'
    }
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  
  return sendEmail({
    to: email,
    templateId: EMAIL_TEMPLATES.PASSWORD_RESET,
    dynamicTemplateData: {
      resetUrl,
      expiresIn: '1 hour'
    }
  })
}

/**
 * Send application status update email
 */
export async function sendApplicationStatusEmail(
  email: string,
  applicationId: string,
  status: 'submitted' | 'approved' | 'rejected',
  additionalInfo?: Record<string, any>
) {
  const templateMap = {
    submitted: EMAIL_TEMPLATES.APPLICATION_SUBMITTED,
    approved: EMAIL_TEMPLATES.APPLICATION_APPROVED,
    rejected: EMAIL_TEMPLATES.APPLICATION_REJECTED
  }
  
  return sendEmail({
    to: email,
    templateId: templateMap[status],
    dynamicTemplateData: {
      applicationId,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/applications/${applicationId}`,
      ...additionalInfo
    }
  })
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  paymentDetails: {
    amount: number
    currency: string
    paymentId: string
    serviceType: string
    invoiceUrl?: string
  }
) {
  return sendEmail({
    to: email,
    templateId: EMAIL_TEMPLATES.PAYMENT_CONFIRMATION,
    dynamicTemplateData: {
      ...paymentDetails,
      formattedAmount: `${(paymentDetails.amount / 100).toFixed(2)} ${paymentDetails.currency}`
    }
  })
}

/**
 * Send appointment reminder email
 */
export async function sendAppointmentReminderEmail(
  email: string,
  appointmentDetails: {
    date: string
    time: string
    location: string
    type: string
    appointmentId: string
    documentsRequired?: string[]
  }
) {
  return sendEmail({
    to: email,
    templateId: EMAIL_TEMPLATES.APPOINTMENT_REMINDER,
    dynamicTemplateData: appointmentDetails
  })
}

/**
 * Send batch emails (max 1000 per request)
 */
export async function sendBatchEmails(
  recipients: Array<{
    email: string
    data?: Record<string, any>
  }>,
  templateId: string,
  commonData?: Record<string, any>
) {
  try {
    const personalizations = recipients.map(recipient => ({
      to: recipient.email,
      dynamicTemplateData: {
        ...commonData,
        ...recipient.data
      }
    }))

    const msg = {
      personalizations,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId
    }

    const [response] = await sgMail.send(msg)
    
    return {
      success: true,
      statusCode: response.statusCode,
      recipientCount: recipients.length
    }
  } catch (error: any) {
    console.error('SendGrid batch error:', error)
    throw new Error(`Failed to send batch emails: ${error.message}`)
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get email statistics (if using SendGrid Event Webhook)
 */
export async function getEmailStats(messageId: string) {
  // This would require setting up SendGrid Event Webhook
  // and storing events in your database
  console.log('Email stats for:', messageId)
  return {
    sent: true,
    delivered: false,
    opened: false,
    clicked: false,
    bounced: false,
    spam: false
  }
}