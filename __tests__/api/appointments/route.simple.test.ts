import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/appointments/route'

// Mock the supabase module with a more direct approach
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }))
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}))

describe('/api/appointments - Simplified Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('GET /api/appointments', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return appointments for authenticated user', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      
      // Mock auth
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock appointments data
      const mockAppointments = [
        {
          id: 'apt-1',
          user_id: mockUser.id,
          appointment_type: 'visa-appointment',
          appointment_date: '2024-03-01T10:00:00Z',
          status: 'scheduled'
        }
      ]

      // Create a complete mock chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockAppointments,
          error: null,
          count: 1
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.appointments).toHaveLength(1)
      expect(data.appointments[0].id).toBe('apt-1')
      expect(data.pagination.total).toBe(1)
    })

    it('should handle query parameters correctly', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest(
        'http://localhost:3000/api/appointments?status=scheduled&type=visa-appointment&start_date=2024-03-01&end_date=2024-03-31'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      
      // Verify filters were applied
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'scheduled')
      expect(mockQuery.eq).toHaveBeenCalledWith('appointment_type', 'visa-appointment')
      expect(mockQuery.gte).toHaveBeenCalledWith('appointment_date', '2024-03-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('appointment_date', '2024-03-31')
    })

    it('should handle database errors gracefully', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
          count: null
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch appointments')
    })
  })

  describe('POST /api/appointments', () => {
    const validAppointmentData = {
      appointment_type: 'visa-appointment',
      appointment_date: '2024-03-01',
      appointment_time: '10:00',
      location: 'berlin-consulate'
    }

    it('should return 401 when user is not authenticated', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAppointmentData)
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate required fields', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const incompleteData = {
        appointment_type: 'visa-appointment'
        // Missing date and time
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Appointment type, date, and time are required')
    })

    it('should check for conflicting appointments', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      // Mock conflict check - appointment exists
      const conflictCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'existing-apt' }], // Conflict exists
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(conflictCheckQuery)

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAppointmentData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('This time slot is already booked')
    })

    it('should create appointment when no conflicts exist', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      // Mock successful appointment creation flow
      const createdAppointment = {
        id: 'new-apt-123',
        user_id: mockUser.id,
        ...validAppointmentData,
        appointment_date: '2024-03-01T10:00:00Z',
        status: 'scheduled'
      }

      // Mock for conflict check
      const conflictCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [], // No conflicts
          error: null
        })
      }

      // Mock for insert
      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: createdAppointment,
          error: null
        })
      }

      // Mock for other operations (scheduled tasks, activity logs, etc.)
      const genericQuery = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      }

      // Setup mock to return different queries based on table
      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'appointments' && callCount === 0) {
          callCount++
          return conflictCheckQuery
        } else if (table === 'appointments' && callCount === 1) {
          return insertQuery
        }
        return genericQuery
      })

      // Mock fetch for email sending
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAppointmentData)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.appointment.id).toBe('new-apt-123')
      expect(data.message).toBe('Appointment scheduled successfully')

      // Verify email was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/email/send',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('appointment_confirmation')
        })
      )
    })

    it('should handle database errors during creation', async () => {
      const { createClient } = require('@/lib/supabase/server')
      const mockSupabase = createClient()
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      // Mock conflict check - no conflicts
      const conflictCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      // Mock insert failure
      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      }

      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'appointments' && callCount === 0) {
          callCount++
          return conflictCheckQuery
        }
        return insertQuery
      })

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAppointmentData)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to create appointment')
    })
  })
})