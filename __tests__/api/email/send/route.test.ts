import { NextRequest } from 'next/server'
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
import {
  createMockSupabaseClient,
  createAuthenticatedRequest,
  createRequestWithBody,
  mockUser,
  expectErrorResponse,
  expectSuccessResponse,
  mockEnvironment
} from '../../test-helpers'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/email/sendgrid', () => ({
  sendEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendApplicationStatusEmail: jest.fn(),
  sendPaymentConfirmationEmail: jest.fn(),
  sendAppointmentReminderEmail: jest.fn(),
  validateEmail: jest.fn()
}))

jest.mock('@/lib/email/templates', () => ({
  getEmailTemplate: jest.fn(),
  getEmailSubject: jest.fn()
}))

// Import the route handlers after mocks are set up
import { POST, GET } from '@/app/api/email/send/route'

describe('/api/email/send', () => {
  let mockSupabase: any
  const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>
  const mockSendWelcomeEmail = sendWelcomeEmail as jest.MockedFunction<typeof sendWelcomeEmail>
  const mockSendApplicationStatusEmail = sendApplicationStatusEmail as jest.MockedFunction<typeof sendApplicationStatusEmail>
  const mockSendPaymentConfirmationEmail = sendPaymentConfirmationEmail as jest.MockedFunction<typeof sendPaymentConfirmationEmail>
  const mockSendAppointmentReminderEmail = sendAppointmentReminderEmail as jest.MockedFunction<typeof sendAppointmentReminderEmail>
  const mockValidateEmail = validateEmail as jest.MockedFunction<typeof validateEmail>
  const mockGetEmailTemplate = getEmailTemplate as jest.MockedFunction<typeof getEmailTemplate>
  const mockGetEmailSubject = getEmailSubject as jest.MockedFunction<typeof getEmailSubject>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default Supabase mock
    mockSupabase = createMockSupabaseClient({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null
            })
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'email-log-123' },
              error: null
            })
          }))
        }))
      }))
    })
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    
    // Set up default email service mocks
    mockValidateEmail.mockReturnValue(true)
    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
      statusCode: 202
    })
    mockSendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: 'welcome-message-id',
      statusCode: 202
    })
    mockSendApplicationStatusEmail.mockResolvedValue({
      success: true,
      messageId: 'status-message-id',
      statusCode: 202
    })
    mockSendPaymentConfirmationEmail.mockResolvedValue({
      success: true,
      messageId: 'payment-message-id',
      statusCode: 202
    })
    mockSendAppointmentReminderEmail.mockResolvedValue({
      success: true,
      messageId: 'appointment-message-id',
      statusCode: 202
    })
    
    // Set up template mocks
    mockGetEmailTemplate.mockReturnValue('<html>Test Template</html>')
    mockGetEmailSubject.mockReturnValue('Test Subject')
  })

  describe('POST /api/email/send - Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        { type: 'welcome', to: 'test@example.com' }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should allow authenticated users to send emails', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'test@example.com',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/email/send - Email Validation', () => {
    it('should validate email address', async () => {
      mockValidateEmail.mockReturnValue(false)

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'invalid-email',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Invalid email address')
      expect(mockValidateEmail).toHaveBeenCalledWith('invalid-email')
    })

    it('should proceed with valid email address', async () => {
      mockValidateEmail.mockReturnValue(true)

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'valid@example.com',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)
      expect(mockValidateEmail).toHaveBeenCalledWith('valid@example.com')
    })
  })

  describe('POST /api/email/send - Welcome Email', () => {
    it('should send welcome email successfully', async () => {
      const emailData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify'
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'john@example.com',
          data: emailData
        }
      )

      const response = await POST(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        'john@example.com',
        'John',
        'https://example.com/verify'
      )
      expect(responseData).toMatchObject({
        success: true,
        messageId: 'welcome-message-id',
        emailLogId: 'email-log-123'
      })
    })

    it('should handle welcome email with default firstName', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'user@example.com',
          data: {}
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        'user@example.com',
        'User',
        undefined
      )
    })
  })

  describe('POST /api/email/send - Application Status Email', () => {
    it('should send application status email successfully', async () => {
      const emailData = {
        applicationId: 'app-123',
        status: 'approved',
        additionalInfo: { message: 'Congratulations!' }
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'application_status',
          to: 'user@example.com',
          data: emailData
        }
      )

      const response = await POST(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockSendApplicationStatusEmail).toHaveBeenCalledWith(
        'user@example.com',
        'app-123',
        'approved',
        { message: 'Congratulations!' }
      )
      expect(responseData.messageId).toBe('status-message-id')
    })

    it('should require applicationId and status', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'application_status',
          to: 'user@example.com',
          data: { applicationId: 'app-123' } // Missing status
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Application ID and status are required')
    })

    it('should require both applicationId and status', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'application_status',
          to: 'user@example.com',
          data: { status: 'approved' } // Missing applicationId
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Application ID and status are required')
    })
  })

  describe('POST /api/email/send - Payment Confirmation Email', () => {
    it('should send payment confirmation email successfully', async () => {
      const paymentDetails = {
        amount: 5000, // €50.00 in cents
        currency: 'EUR',
        paymentId: 'pay-123',
        serviceType: 'Visa Application Review',
        invoiceUrl: 'https://example.com/invoice'
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'payment_confirmation',
          to: 'user@example.com',
          data: { paymentDetails }
        }
      )

      const response = await POST(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockSendPaymentConfirmationEmail).toHaveBeenCalledWith(
        'user@example.com',
        paymentDetails
      )
      expect(responseData.messageId).toBe('payment-message-id')
    })

    it('should require payment details', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'payment_confirmation',
          to: 'user@example.com',
          data: {}
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Payment details are required')
    })
  })

  describe('POST /api/email/send - Appointment Reminder Email', () => {
    it('should send appointment reminder email successfully', async () => {
      const appointmentDetails = {
        date: '2024-06-15',
        time: '10:00 AM',
        location: 'German Consulate, New York',
        type: 'Visa Interview',
        appointmentId: 'apt-123',
        documentsRequired: ['Passport', 'Application Form', 'Photo']
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'appointment_reminder',
          to: 'user@example.com',
          data: { appointmentDetails }
        }
      )

      const response = await POST(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockSendAppointmentReminderEmail).toHaveBeenCalledWith(
        'user@example.com',
        appointmentDetails
      )
      expect(responseData.messageId).toBe('appointment-message-id')
    })

    it('should require appointment details', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'appointment_reminder',
          to: 'user@example.com',
          data: {}
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Appointment details are required')
    })
  })

  describe('POST /api/email/send - Custom Email', () => {
    it('should allow admin to send custom email', async () => {
      // Mock admin user
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const customEmailData = {
        subject: 'Custom Notification',
        content: {
          html: '<p>Custom HTML content</p>',
          text: 'Custom text content'
        },
        customData: { name: 'John' }
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'custom',
          to: 'user@example.com',
          subject: customEmailData.subject,
          content: customEmailData.content,
          data: customEmailData.customData
        }
      )

      const response = await POST(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Custom Notification',
        templateId: undefined,
        dynamicTemplateData: customEmailData.customData,
        text: 'Custom text content',
        html: '<p>Custom HTML content</p>'
      })
      expect(responseData.messageId).toBe('test-message-id')
    })

    it('should reject custom email from non-admin users', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'custom',
          to: 'user@example.com',
          subject: 'Custom Email',
          content: { html: '<p>Content</p>' }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 403, 'Unauthorized to send custom emails')
    })

    it('should require subject for custom emails', async () => {
      // Mock admin user
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'custom',
          to: 'user@example.com',
          content: { html: '<p>Content</p>' }
          // Missing subject
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Subject and content/template are required')
    })

    it('should require content or templateId for custom emails', async () => {
      // Mock admin user
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'custom',
          to: 'user@example.com',
          subject: 'Test Subject'
          // Missing content and templateId
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Subject and content/template are required')
    })
  })

  describe('POST /api/email/send - Test Email (Development)', () => {
    beforeEach(() => {
      // Mock development environment
      process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('should send test email in development environment', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: {
            template: 'welcome',
            firstName: 'Test User'
          }
        }
      )

      const response = await POST(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('welcome', 'html', {
        template: 'welcome',
        firstName: 'Test User'
      })
      expect(mockGetEmailTemplate).toHaveBeenCalledWith('welcome', 'text', {
        template: 'welcome',
        firstName: 'Test User'
      })
      expect(mockGetEmailSubject).toHaveBeenCalledWith('welcome')
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<html>Test Template</html>',
        text: '<html>Test Template</html>'
      })
    })

    it('should use default template for test emails', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: {}
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('welcome', 'html', {})
      expect(mockGetEmailTemplate).toHaveBeenCalledWith('welcome', 'text', {})
    })

    it('should reject test emails in production', async () => {
      process.env.NODE_ENV = 'production'

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: { template: 'welcome' }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Test emails not allowed in production')
    })
  })

  describe('POST /api/email/send - Unknown Email Type', () => {
    it('should reject unknown email types', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'unknown_type',
          to: 'user@example.com',
          data: {}
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Unknown email type: unknown_type')
    })
  })

  describe('POST /api/email/send - Email Logging', () => {
    it('should log sent emails to database', async () => {
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'email-log-456' },
            error: null
          })
        }))
      }))

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs' && callCount === 0) {
          callCount++
          return { insert: mockInsert }
        } else if (table === 'activity_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null })
          }
        }
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'user@example.com',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        recipient: 'user@example.com',
        email_type: 'welcome',
        subject: 'Welcome to Visa Assist!',
        status: 'sent',
        provider: 'sendgrid',
        metadata: {
          messageId: 'welcome-message-id',
          data: { firstName: 'John' }
        }
      })
    })

    it('should create activity log entry', async () => {
      const mockActivityInsert = jest.fn().mockResolvedValue({ data: null, error: null })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs' && callCount === 0) {
          callCount++
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'email-log-789' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'activity_logs') {
          return { insert: mockActivityInsert }
        }
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'user@example.com',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockActivityInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        entity_type: 'email',
        entity_id: 'email-log-789',
        action: 'email_sent',
        details: {
          type: 'welcome',
          recipient: 'user@example.com'
        }
      })
    })
  })

  describe('POST /api/email/send - Error Handling', () => {
    it('should handle email service errors', async () => {
      mockSendWelcomeEmail.mockRejectedValue(new Error('SendGrid API error'))

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'user@example.com',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to send email')
    })

    it('should log failed email attempts', async () => {
      mockSendWelcomeEmail.mockRejectedValue(new Error('SendGrid API error'))

      const mockFailedInsert = jest.fn().mockResolvedValue({ data: null, error: null })

      // Mock the second call to createClient for error logging
      let clientCallCount = 0
      ;(createClient as jest.Mock).mockImplementation(() => {
        clientCallCount++
        if (clientCallCount === 1) {
          return mockSupabase
        } else {
          return {
            auth: {
              getUser: jest.fn().mockResolvedValue({
                data: { user: mockUser },
                error: null
              })
            },
            from: jest.fn(() => ({
              insert: mockFailedInsert
            }))
          }
        }
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'welcome',
          to: 'user@example.com',
          data: { firstName: 'John' }
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(500)

      expect(mockFailedInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        recipient: 'unknown', // request.body is undefined in test
        email_type: 'unknown',
        subject: 'Unknown',
        status: 'failed',
        error_message: 'SendGrid API error',
        provider: 'sendgrid'
      })
    })

    it('should handle template processing errors', async () => {
      mockGetEmailTemplate.mockImplementation(() => {
        throw new Error('Template not found')
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: { template: 'nonexistent' }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to send email')
    })
  })

  describe('GET /api/email/send - Email Logs', () => {
    it('should fetch email logs for authenticated user', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: mockUser.id,
          recipient: 'user1@example.com',
          email_type: 'welcome',
          status: 'sent',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'log-2',
          user_id: mockUser.id,
          recipient: 'user2@example.com',
          email_type: 'application_status',
          status: 'delivered',
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
          count: 2
        })
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs') {
          return {
            select: jest.fn().mockReturnValue(mockQuery)
          }
        }
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send')
      const response = await GET(request)
      const responseData = await expectSuccessResponse(response)

      expect(responseData).toMatchObject({
        success: true,
        logs: mockLogs,
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      })
    })

    it('should filter email logs by status', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs') {
          return {
            select: jest.fn().mockReturnValue(mockQuery)
          }
        }
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send?status=failed')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'failed')
    })

    it('should filter email logs by type', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs') {
          return {
            select: jest.fn().mockReturnValue(mockQuery)
          }
        }
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send?type=welcome')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockQuery.eq).toHaveBeenCalledWith('email_type', 'welcome')
    })

    it('should allow admin to view all email logs', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs') {
          return {
            select: jest.fn().mockReturnValue(mockQuery)
          }
        }
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Admin should not have user_id filter
      expect(mockQuery.eq).not.toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should handle pagination parameters', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 50
        })
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs') {
          return {
            select: jest.fn().mockReturnValue(mockQuery)
          }
        }
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send?limit=20&offset=20')
      const response = await GET(request)
      const responseData = await expectSuccessResponse(response)

      expect(mockQuery.range).toHaveBeenCalledWith(20, 39)
      expect(responseData.pagination).toMatchObject({
        total: 50,
        limit: 20,
        offset: 20,
        hasMore: true
      })
    })

    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send')
      const response = await GET(request)

      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'user' },
                  error: null
                })
              }))
            }))
          }
        } else if (table === 'email_logs') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
                count: null
              })
            }))
          }
        }
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/email/send')
      const response = await GET(request)

      await expectErrorResponse(response, 500, 'Failed to fetch email logs')
    })
  })

  describe('Email Template Processing', () => {
    it('should process HTML templates correctly', async () => {
      const templateData = { firstName: 'John', verificationUrl: 'https://example.com/verify' }
      mockGetEmailTemplate.mockReturnValue('<html><body>Hello John</body></html>')

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: templateData
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('welcome', 'html', templateData)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<html><body>Hello John</body></html>'
        })
      )
    })

    it('should process text templates correctly', async () => {
      const templateData = { firstName: 'John' }
      mockGetEmailTemplate
        .mockReturnValueOnce('<html>HTML content</html>') // HTML call
        .mockReturnValueOnce('Plain text content') // Text call

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: templateData
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('welcome', 'text', templateData)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Plain text content'
        })
      )
    })

    it('should handle template errors gracefully', async () => {
      mockGetEmailTemplate.mockImplementation(() => {
        throw new Error('Template compilation error')
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/email/send',
        {
          type: 'test',
          to: 'test@example.com',
          data: { template: 'welcome' }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to send email')
    })
  })
})