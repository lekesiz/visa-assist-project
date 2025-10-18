import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/payments/create/route'
import { createClient } from '@/lib/supabase/server'
import { createPayment } from '@/lib/payments/provider'
import {
  mockUser,
  createRequestWithBody,
  expectErrorResponse,
  expectSuccessResponse
} from '../../test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock the payment provider
jest.mock('@/lib/payments/provider', () => ({
  createPayment: jest.fn(),
  PaymentProvider: jest.fn()
}))

describe('/api/payments/create', () => {
  let mockSupabaseClient: any
  let mockCreatePayment: jest.MockedFunction<typeof createPayment>

  // Test data
  const validPaymentData = {
    provider: 'stripe',
    serviceType: 'visa_application',
    applicationId: 'app-123',
    currency: 'EUR',
    returnUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel'
  }

  const mockUserProfile = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com'
  }

  const mockPaymentRecord = {
    id: 'payment-123',
    user_id: mockUser.id,
    application_id: 'app-123',
    amount: 19900,
    currency: 'EUR',
    status: 'pending',
    payment_type: 'visa_application',
    payment_method: 'stripe',
    metadata: {
      service_type: 'visa_application',
      user_email: 'john.doe@example.com',
      user_name: 'John Doe'
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const mockPaymentResult = {
    provider: 'stripe',
    paymentId: 'pi_test123',
    status: 'pending',
    amount: { amount: 19900, currency: 'EUR' },
    clientSecret: 'pi_test123_secret',
    approvalUrl: undefined,
    metadata: { payment_record_id: 'payment-123', service_type: 'visa_application' }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a comprehensive mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: mockUser }, 
          error: null 
        })
      },
      from: jest.fn().mockImplementation((table: string) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn()
        }

        switch (table) {
          case 'user_profiles':
            baseQuery.single.mockResolvedValue({ 
              data: mockUserProfile, 
              error: null 
            })
            break
          case 'payments':
            baseQuery.single.mockResolvedValue({ 
              data: mockPaymentRecord, 
              error: null 
            })
            break
          case 'activity_logs':
            baseQuery.insert.mockResolvedValue({ data: null, error: null })
            break
          default:
            baseQuery.single.mockResolvedValue({ data: null, error: null })
        }

        return baseQuery
      })
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)

    // Setup payment provider mock
    mockCreatePayment = createPayment as jest.MockedFunction<typeof createPayment>
    mockCreatePayment.mockResolvedValue(mockPaymentResult)
  })

  describe('POST /api/payments/create', () => {
    it('should create a payment successfully with all valid data', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        validPaymentData
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      // Verify response structure
      expect(data.success).toBe(true)
      expect(data.payment).toMatchObject({
        id: 'payment-123',
        provider: 'stripe',
        amount: 19900,
        currency: 'EUR',
        clientSecret: 'pi_test123_secret',
        paymentId: 'pi_test123'
      })

      // Verify payment provider was called correctly
      expect(mockCreatePayment).toHaveBeenCalledWith({
        provider: 'stripe',
        amount: { amount: 19900, currency: 'EUR' },
        userId: mockUser.id,
        applicationId: 'app-123',
        description: 'Visa Assist - visa_application',
        returnUrl: 'https://example.com/success?payment_id=payment-123',
        cancelUrl: 'https://example.com/cancel?payment_id=payment-123',
        metadata: {
          payment_record_id: 'payment-123',
          service_type: 'visa_application'
        }
      })
    })

    it('should create payment with custom amount when serviceType is not provided', async () => {
      const customPaymentData = {
        ...validPaymentData,
        serviceType: undefined,
        customAmount: 5000 // €50
      }

      // Update mock to return custom amount
      const customPaymentRecord = { ...mockPaymentRecord, amount: 5000, payment_type: 'custom' }
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn()
        }

        switch (table) {
          case 'user_profiles':
            baseQuery.single.mockResolvedValue({ data: mockUserProfile, error: null })
            break
          case 'payments':
            baseQuery.single.mockResolvedValue({ data: customPaymentRecord, error: null })
            break
          case 'activity_logs':
            baseQuery.insert.mockResolvedValue({ data: null, error: null })
            break
          default:
            baseQuery.single.mockResolvedValue({ data: null, error: null })
        }

        return baseQuery
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        customPaymentData
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.payment.amount).toBe(5000)
      expect(mockCreatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: { amount: 5000, currency: 'EUR' },
          description: 'Visa Assist - Service Payment'
        })
      )
    })

    it('should create PayPal payment when provider is paypal', async () => {
      const paypalData = {
        ...validPaymentData,
        provider: 'paypal'
      }

      const paypalResult = {
        ...mockPaymentResult,
        provider: 'paypal',
        paymentId: 'order_123',
        clientSecret: undefined,
        approvalUrl: 'https://paypal.com/approve/order_123'
      }

      mockCreatePayment.mockResolvedValue(paypalResult)

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        paypalData
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.payment.provider).toBe('paypal')
      expect(data.payment.approvalUrl).toBe('https://paypal.com/approve/order_123')
      expect(data.payment.clientSecret).toBeUndefined()
    })

    it('should handle all service types with correct pricing', async () => {
      const serviceTypes = [
        { type: 'basic_consultation', expectedAmount: 4900 },
        { type: 'visa_application', expectedAmount: 19900 },
        { type: 'premium_support', expectedAmount: 39900 },
        { type: 'denklik_service', expectedAmount: 14900 },
        { type: 'job_match_service', expectedAmount: 9900 },
        { type: 'document_review', expectedAmount: 2900 },
        { type: 'appointment_booking', expectedAmount: 3900 },
        { type: 'express_service', expectedAmount: 9900 }
      ]

      for (const { type, expectedAmount } of serviceTypes) {
        jest.clearAllMocks()

        // Update mock for this service type
        const servicePaymentRecord = { ...mockPaymentRecord, amount: expectedAmount, payment_type: type }
        mockSupabaseClient.from.mockImplementation((table: string) => {
          const baseQuery = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn()
          }

          switch (table) {
            case 'user_profiles':
              baseQuery.single.mockResolvedValue({ data: mockUserProfile, error: null })
              break
            case 'payments':
              baseQuery.single.mockResolvedValue({ data: servicePaymentRecord, error: null })
              break
            case 'activity_logs':
              baseQuery.insert.mockResolvedValue({ data: null, error: null })
              break
            default:
              baseQuery.single.mockResolvedValue({ data: null, error: null })
          }

          return baseQuery
        })

        ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)

        const request = createRequestWithBody(
          'http://localhost:3000/api/payments/create',
          { ...validPaymentData, serviceType: type }
        )

        const response = await POST(request)
        const data = await expectSuccessResponse(response)

        expect(data.payment.amount).toBe(expectedAmount)
        expect(mockCreatePayment).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: { amount: expectedAmount, currency: 'EUR' }
          })
        )
      }
    })

    // Error cases
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        validPaymentData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should return 400 when neither serviceType nor customAmount is provided', async () => {
      const invalidData = {
        ...validPaymentData,
        serviceType: undefined,
        customAmount: undefined
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        invalidData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Service type or custom amount is required')
    })

    it('should return 400 when returnUrl is missing', async () => {
      const invalidData = {
        ...validPaymentData,
        returnUrl: undefined
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        invalidData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Return and cancel URLs are required')
    })

    it('should return 400 when cancelUrl is missing', async () => {
      const invalidData = {
        ...validPaymentData,
        cancelUrl: undefined
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        invalidData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Return and cancel URLs are required')
    })

    it('should return 400 when serviceType is invalid', async () => {
      const invalidData = {
        ...validPaymentData,
        serviceType: 'invalid_service'
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        invalidData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Invalid service type')
    })

    it('should handle database error when creating payment record', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn()
        }

        switch (table) {
          case 'user_profiles':
            baseQuery.single.mockResolvedValue({ data: mockUserProfile, error: null })
            break
          case 'payments':
            baseQuery.single.mockResolvedValue({ 
              data: null, 
              error: new Error('Database insert failed') 
            })
            break
          default:
            baseQuery.single.mockResolvedValue({ data: null, error: null })
        }

        return baseQuery
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        validPaymentData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to create payment')
    })

    it('should handle payment provider error', async () => {
      mockCreatePayment.mockRejectedValue(new Error('Payment provider error'))

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        validPaymentData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to create payment')
    })

    it('should handle missing user profile gracefully', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn()
        }

        switch (table) {
          case 'user_profiles':
            baseQuery.single.mockResolvedValue({ data: null, error: null })
            break
          case 'payments':
            const paymentWithoutProfile = {
              ...mockPaymentRecord,
              metadata: {
                service_type: 'visa_application',
                user_email: mockUser.email,
                user_name: ''
              }
            }
            baseQuery.single.mockResolvedValue({ data: paymentWithoutProfile, error: null })
            break
          case 'activity_logs':
            baseQuery.insert.mockResolvedValue({ data: null, error: null })
            break
          default:
            baseQuery.single.mockResolvedValue({ data: null, error: null })
        }

        return baseQuery
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/payments/create',
        validPaymentData
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
    })

    it('should handle malformed JSON request', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to create payment')
    })
  })

  describe('GET /api/payments/create', () => {
    const mockPayment = {
      id: 'payment-123',
      user_id: mockUser.id,
      application_id: 'app-123',
      amount: 19900,
      currency: 'EUR',
      status: 'pending',
      payment_type: 'visa_application',
      payment_method: 'stripe',
      provider_payment_id: 'pi_test123',
      created_at: '2024-01-01T00:00:00.000Z'
    }

    it('should get payment status by payment_id', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: mockPayment, 
          error: null 
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/payments/create?payment_id=payment-123')

      const response = await GET(request)
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.payment).toMatchObject(mockPayment)
    })

    it('should get payment status by provider_payment_id', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: mockPayment, 
          error: null 
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/payments/create?provider_payment_id=pi_test123')

      const response = await GET(request)
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.payment).toMatchObject(mockPayment)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/payments/create?payment_id=payment-123')

      const response = await GET(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should return 400 when no payment ID is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create')

      const response = await GET(request)
      await expectErrorResponse(response, 400, 'Payment ID is required')
    })

    it('should return 404 when payment is not found', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Not found') 
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/payments/create?payment_id=nonexistent')

      const response = await GET(request)
      await expectErrorResponse(response, 404, 'Payment not found')
    })

    it('should return 404 when payment belongs to different user', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: null 
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/payments/create?payment_id=payment-123')

      const response = await GET(request)
      await expectErrorResponse(response, 404, 'Payment not found')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error'))
      }))

      const request = new NextRequest('http://localhost:3000/api/payments/create?payment_id=payment-123')

      const response = await GET(request)
      await expectErrorResponse(response, 500, 'Failed to get payment status')
    })
  })
})