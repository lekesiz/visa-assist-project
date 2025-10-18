import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  createMockSupabaseClient, 
  createAuthenticatedRequest,
  createRequestWithBody,
  mockUser,
  expectErrorResponse,
  expectSuccessResponse
} from '../test-helpers'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: {
    api: 'api',
    read: 'read'
  }
}))

jest.mock('@/lib/error-handler', () => {
  const { mockUser } = require('../test-helpers')
  return {
    withErrorHandler: (handler: any) => handler,
    getUserFromHeaders: jest.fn().mockReturnValue(mockUser),
    NotFoundError: class NotFoundError extends Error {},
    ConflictError: class ConflictError extends Error {}
  }
})

// Import the route handlers after mocks are set up
import { GET, POST } from '@/app/api/applications/route'

describe('/api/applications', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })),
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
              })
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'app-123',
                user_id: mockUser.id,
                visa_type: 'tourist',
                status: 'draft'
              },
              error: null
            })
          }))
        }))
      }))
    })
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('GET /api/applications', () => {
    it('should list applications for authenticated user', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          user_id: mockUser.id,
          visa_type: 'tourist',
          status: 'draft',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'app-2',
          user_id: mockUser.id,
          visa_type: 'student',
          status: 'submitted',
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      // Mock the query chain
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockApplications,
          error: null,
          count: 2
        })
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/applications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasMore: false
      })
    })

    it('should filter applications by status', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/applications?status=submitted'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'submitted')
    })

    it('should filter applications by visa type', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/applications?visa_type=student'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockQuery.eq).toHaveBeenCalledWith('visa_type', 'student')
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

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery)
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/applications?page=2&limit=20'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockQuery.range).toHaveBeenCalledWith(20, 39) // offset 20, limit 20
      expect(data.pagination).toMatchObject({
        page: 2,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasMore: true
      })
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed'),
            count: null
          })
        })
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/applications')
      
      await expect(GET(request)).rejects.toThrow('Database connection failed')
    })
  })

  describe('POST /api/applications', () => {
    const validApplicationData = {
      visa_type: 'tourist',
      target_country: 'DE',
      purpose_of_travel: 'Tourism and sightseeing in Germany',
      planned_travel_date: '2024-06-01',
      duration_of_stay: 14
    }

    it('should create a new application', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/applications',
        validApplicationData
      )
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: 'app-123',
        visa_type: 'tourist',
        status: 'draft'
      })
      expect(data.message).toBe('Application created successfully')
    })

    it('should prevent creating duplicate active applications', async () => {
      // Mock existing active application
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'existing-app',
              status: 'in_progress',
              visa_type: 'student'
            },
            error: null
          })
        })
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/applications',
        validApplicationData
      )
      
      await expect(POST(request)).rejects.toThrow('You already have an active application')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        visa_type: 'invalid_type',
        purpose_of_travel: 'Short' // Too short
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/applications',
        invalidData
      )
      
      await expect(POST(request)).rejects.toThrow()
    })

    it('should set default checklist items based on visa type', async () => {
      let capturedInsertData: any

      // Setup mocks for both queries
      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'applications' && callCount === 0) {
          callCount++
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          }
        } else if (table === 'applications' && callCount === 1) {
          callCount++
          return {
            insert: jest.fn((data) => {
              capturedInsertData = data
              return {
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: { ...data, id: 'new-app' },
                  error: null
                })
              }
            })
          }
        } else {
          return { insert: jest.fn().mockResolvedValue({ data: null, error: null }) }
        }
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/applications',
        { ...validApplicationData, visa_type: 'student' }
      )
      
      await POST(request)

      expect(capturedInsertData).toBeDefined()
      expect(capturedInsertData.checklist_items).toBeDefined()
      expect(capturedInsertData.checklist_items).toContainEqual(
        expect.objectContaining({ id: 'admission_letter', required: true })
      )
    })

    it('should create activity log entry', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })
      
      // Setup mocks for both queries
      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'applications' && callCount === 0) {
          callCount++
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          }
        } else if (table === 'applications' && callCount === 1) {
          callCount++
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'app-123', visa_type: 'tourist', status: 'draft' },
                error: null
              })
            })
          }
        } else if (table === 'activity_logs') {
          return { insert: mockInsert }
        }
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/applications',
        validApplicationData
      )
      
      await POST(request)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          entity_type: 'application',
          entity_id: 'app-123',
          action: 'created'
        })
      )
    })

    it('should handle database errors during creation', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/applications',
        validApplicationData
      )
      
      await expect(POST(request)).rejects.toThrow('Database error')
    })
  })
})