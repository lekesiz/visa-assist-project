// Email template content for development/testing
// In production, these would be SendGrid dynamic templates

export const emailTemplates = {
  welcome: {
    subject: 'Welcome to Visa Assist!',
    html: (data: { firstName: string; verificationUrl?: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Visa Assist!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>Thank you for joining Visa Assist! We're excited to help you with your visa application journey to Germany.</p>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Complete your profile to get personalized recommendations</li>
                <li>Upload your documents for AI-powered analysis</li>
                <li>Track your application progress in real-time</li>
                <li>Get matched with suitable job opportunities</li>
              </ul>
              
              ${data.verificationUrl ? `
                <p>Please verify your email address to get started:</p>
                <center>
                  <a href="${data.verificationUrl}" class="button">Verify Email</a>
                </center>
              ` : ''}
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,<br>The Visa Assist Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Visa Assist. All rights reserved.</p>
              <p>This email was sent to you because you signed up for Visa Assist.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: { firstName: string; verificationUrl?: string }) => `
      Welcome to Visa Assist!
      
      Hi ${data.firstName},
      
      Thank you for joining Visa Assist! We're excited to help you with your visa application journey to Germany.
      
      What's Next?
      - Complete your profile to get personalized recommendations
      - Upload your documents for AI-powered analysis
      - Track your application progress in real-time
      - Get matched with suitable job opportunities
      
      ${data.verificationUrl ? `Please verify your email address: ${data.verificationUrl}` : ''}
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The Visa Assist Team
    `
  },

  applicationSubmitted: {
    subject: 'Application Submitted Successfully',
    html: (data: { applicationId: string; visaType: string; dashboardUrl: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Submitted!</h1>
            </div>
            <div class="content">
              <p>Great news! Your ${data.visaType} visa application has been successfully submitted.</p>
              
              <div class="info-box">
                <strong>Application ID:</strong> ${data.applicationId}<br>
                <strong>Type:</strong> ${data.visaType}<br>
                <strong>Status:</strong> Submitted<br>
                <strong>Submitted on:</strong> ${new Date().toLocaleDateString()}
              </div>
              
              <h3>What Happens Next?</h3>
              <ol>
                <li><strong>Review:</strong> Our AI system will analyze your application</li>
                <li><strong>Verification:</strong> We'll verify all your documents</li>
                <li><strong>Appointment:</strong> You'll receive appointment scheduling options</li>
                <li><strong>Updates:</strong> We'll notify you of any status changes</li>
              </ol>
              
              <center>
                <a href="${data.dashboardUrl}" class="button">View Application</a>
              </center>
              
              <p>You can track your application progress anytime from your dashboard.</p>
              
              <p>Best regards,<br>The Visa Assist Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Visa Assist. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: { applicationId: string; visaType: string; dashboardUrl: string }) => `
      Application Submitted!
      
      Great news! Your ${data.visaType} visa application has been successfully submitted.
      
      Application Details:
      - Application ID: ${data.applicationId}
      - Type: ${data.visaType}
      - Status: Submitted
      - Submitted on: ${new Date().toLocaleDateString()}
      
      What Happens Next?
      1. Review: Our AI system will analyze your application
      2. Verification: We'll verify all your documents
      3. Appointment: You'll receive appointment scheduling options
      4. Updates: We'll notify you of any status changes
      
      View your application: ${data.dashboardUrl}
      
      You can track your application progress anytime from your dashboard.
      
      Best regards,
      The Visa Assist Team
    `
  },

  paymentConfirmation: {
    subject: 'Payment Confirmation',
    html: (data: { amount: string; paymentId: string; serviceType: string; invoiceUrl?: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .receipt { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .receipt-row:last-child { border-bottom: none; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Confirmed!</h1>
            </div>
            <div class="content">
              <p>Thank you for your payment. Your transaction has been processed successfully.</p>
              
              <div class="receipt">
                <h3 style="margin-top: 0;">Payment Receipt</h3>
                <div class="receipt-row">
                  <span>Payment ID:</span>
                  <span>${data.paymentId}</span>
                </div>
                <div class="receipt-row">
                  <span>Service:</span>
                  <span>${data.serviceType}</span>
                </div>
                <div class="receipt-row">
                  <span>Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="receipt-row">
                  <span>Amount:</span>
                  <span>${data.amount}</span>
                </div>
              </div>
              
              ${data.invoiceUrl ? `
                <center>
                  <a href="${data.invoiceUrl}" class="button">Download Invoice</a>
                </center>
              ` : ''}
              
              <p>A copy of this receipt has been saved to your account for your records.</p>
              
              <p>If you have any questions about this payment, please contact our support team.</p>
              
              <p>Best regards,<br>The Visa Assist Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Visa Assist. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: { amount: string; paymentId: string; serviceType: string; invoiceUrl?: string }) => `
      Payment Confirmed!
      
      Thank you for your payment. Your transaction has been processed successfully.
      
      Payment Receipt
      ---------------
      Payment ID: ${data.paymentId}
      Service: ${data.serviceType}
      Date: ${new Date().toLocaleDateString()}
      Amount: ${data.amount}
      
      ${data.invoiceUrl ? `Download Invoice: ${data.invoiceUrl}` : ''}
      
      A copy of this receipt has been saved to your account for your records.
      
      If you have any questions about this payment, please contact our support team.
      
      Best regards,
      The Visa Assist Team
    `
  },

  appointmentReminder: {
    subject: 'Appointment Reminder',
    html: (data: { date: string; time: string; location: string; type: string; documentsRequired?: string[] }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .appointment-card { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #f59e0b; }
            .info-item { margin: 10px 0; }
            .checklist { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Reminder</h1>
            </div>
            <div class="content">
              <p>This is a reminder about your upcoming appointment:</p>
              
              <div class="appointment-card">
                <div class="info-item"><strong>Type:</strong> ${data.type}</div>
                <div class="info-item"><strong>Date:</strong> ${data.date}</div>
                <div class="info-item"><strong>Time:</strong> ${data.time}</div>
                <div class="info-item"><strong>Location:</strong> ${data.location}</div>
              </div>
              
              ${data.documentsRequired && data.documentsRequired.length > 0 ? `
                <div class="checklist">
                  <h3>Required Documents:</h3>
                  <ul>
                    ${data.documentsRequired.map(doc => `<li>${doc}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <h3>Important Reminders:</h3>
              <ul>
                <li>Please arrive 15 minutes early</li>
                <li>Bring all original documents</li>
                <li>Ensure all documents are complete and valid</li>
                <li>Dress professionally</li>
              </ul>
              
              <p>If you need to reschedule, please do so at least 24 hours in advance.</p>
              
              <p>Best regards,<br>The Visa Assist Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Visa Assist. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: { date: string; time: string; location: string; type: string; documentsRequired?: string[] }) => `
      Appointment Reminder
      
      This is a reminder about your upcoming appointment:
      
      Type: ${data.type}
      Date: ${data.date}
      Time: ${data.time}
      Location: ${data.location}
      
      ${data.documentsRequired && data.documentsRequired.length > 0 ? `
      Required Documents:
      ${data.documentsRequired.map(doc => `- ${doc}`).join('\n')}
      ` : ''}
      
      Important Reminders:
      - Please arrive 15 minutes early
      - Bring all original documents
      - Ensure all documents are complete and valid
      - Dress professionally
      
      If you need to reschedule, please do so at least 24 hours in advance.
      
      Best regards,
      The Visa Assist Team
    `
  }
}

// Helper function to get template
export function getEmailTemplate(
  templateName: keyof typeof emailTemplates,
  format: 'html' | 'text',
  data: any
): string {
  const template = emailTemplates[templateName]
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`)
  }
  
  return format === 'html' ? template.html(data) : template.text(data)
}

// Helper function to get subject
export function getEmailSubject(templateName: keyof typeof emailTemplates): string {
  const template = emailTemplates[templateName]
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`)
  }
  
  return template.subject
}