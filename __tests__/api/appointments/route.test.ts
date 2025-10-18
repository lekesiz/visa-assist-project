import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/appointments/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createAuthenticatedRequest,
  createRequestWithBody,
  expectErrorResponse,
  expectSuccessResponse,
  mockUser
} from '../test-helpers'

// Mock the entire supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Type the mocked function
const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/appointments', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockedCreateClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/appointments', () => {
    const mockAppointments = [
      {
        id: 'apt-1',
        user_id: mockUser.id,
        application_id: 'app-1',
        appointment_type: 'visa-appointment',
        appointment_date: '2024-02-15T10:00:00Z',
        location: 'berlin-consulate',
        duration_minutes: 30,
        status: 'scheduled',
        notes: 'Initial appointment',
        reminder_enabled: true,
        application: {
          id: 'app-1',
          visa_type: 'student',
          status: 'in_progress'
        }
      },
      {
        id: 'apt-2',
        user_id: mockUser.id,
        application_id: null,
        appointment_type: 'consultation',
        appointment_date: '2024-02-20T14:00:00Z',
        location: 'online',
        duration_minutes: 60,
        status: 'scheduled',
        notes: null,
        reminder_enabled: false,
        application: null
      }
    ]

    it('should return appointments for authenticated user', async () => {
      // Configure the mock to return data when the query chain is executed
      mockSupabase.range.mockResolvedValue({
        data: mockAppointments,
        error: null,
        count: 2
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.appointments).toHaveLength(2)
      expect(data.appointments).toEqual(mockAppointments)
      expect(data.pagination).toEqual({
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false
      })

      // Check that groupedByDate is created correctly
      expect(data.groupedByDate).toEqual({
        '2024-02-15': [mockAppointments[0]],
        '2024-02-20': [mockAppointments[1]]
      })

      // Verify Supabase query
      expect(mockSupabase.from).toHaveBeenCalledWith('appointments')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockSupabase.order).toHaveBeenCalledWith('appointment_date', { ascending: true })
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
    })

    it('should filter appointments by status', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockAppointments[0]],
        error: null,
        count: 1
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments?status=scheduled'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.appointments).toHaveLength(1)
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'scheduled')
    })

    it('should filter appointments by type', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [mockAppointments[0]],
        error: null,
        count: 1
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments?type=visa-appointment'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSupabase.eq).toHaveBeenCalledWith('appointment_type', 'visa-appointment')
    })

    it('should filter appointments by date range', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockAppointments,
        error: null,
        count: 2
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments?start_date=2024-02-01&end_date=2024-02-28'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSupabase.gte).toHaveBeenCalledWith('appointment_date', '2024-02-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('appointment_date', '2024-02-28')
    })

    it('should handle pagination', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockAppointments.slice(0, 1),
        error: null,
        count: 50
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments?limit=20&offset=20'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.pagination).toEqual({
        total: 50,
        limit: 20,
        offset: 20,
        hasMore: true
      })
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39)
    })

    it('should return empty array when no appointments exist', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.appointments).toEqual([])
      expect(data.groupedByDate).toEqual({})
      expect(data.pagination.total).toBe(0)
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should handle database errors', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      await expectErrorResponse(response, 500, 'Failed to fetch appointments')
    })
  })

  describe('POST /api/appointments', () => {
    const validAppointmentData = {
      application_id: 'app-123',
      appointment_type: 'visa-appointment',
      appointment_date: '2024-03-01',
      appointment_time: '10:00',
      location: 'berlin-consulate',
      duration_minutes: 30,
      notes: 'Bring all documents',
      reminder_enabled: true,
      reminder_hours: 24
    }

    it('should create a new appointment', async () => {
      const createdAppointment = {
        id: 'new-apt-id',
        user_id: mockUser.id,
        ...validAppointmentData,
        appointment_date: '2024-03-01T10:00:00Z',
        status: 'scheduled',
        reminder_sent: false
      }

      // Mock appointment creation
      // First, mock the conflict check query
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })
      // Then mock the insert operation
      mockSupabase.single.mockResolvedValueOnce({
        data: createdAppointment,
        error: null
      })

      // Mock related operations
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      // Mock email send
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        validAppointmentData,
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.appointment).toMatchObject(createdAppointment)
      expect(data.message).toBe('Appointment scheduled successfully')

      // Verify appointment was created
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          appointment_type: validAppointmentData.appointment_type,
          location: validAppointmentData.location
        })
      )

      // Verify reminder was scheduled
      expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_tasks')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          task_type: 'appointment_reminder',
          entity_type: 'appointment',
          entity_id: createdAppointment.id
        })
      )

      // Verify application was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('applications')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          has_appointment: true,
          next_appointment_date: expect.any(String)
        })
      )

      // Verify activity log
      expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs')

      // Verify email was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/email/send',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('appointment_confirmation')
        })
      )
    })

    it('should reject appointment if time slot is already booked', async () => {
      // Mock existing appointment at same time
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ id: 'existing-apt' }],
        error: null
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        validAppointmentData,
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'This time slot is already booked')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        appointment_type: 'consultation'
        // Missing date and time
      }

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        invalidData,
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Appointment type, date, and time are required')
    })

    it('should create appointment without application_id', async () => {
      const appointmentWithoutApp = {
        ...validAppointmentData,
        application_id: null
      }

      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null })
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-apt', ...appointmentWithoutApp },
        error: null
      })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        appointmentWithoutApp,
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      // Should not update applications table
      expect(mockSupabase.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ has_appointment: true })
      )
    })

    it('should create appointment without reminder', async () => {
      const appointmentWithoutReminder = {
        ...validAppointmentData,
        reminder_enabled: false
      }

      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null })
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-apt', ...appointmentWithoutReminder },
        error: null
      })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        appointmentWithoutReminder,
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectSuccessResponse(response)

      // Should not create scheduled task for reminder
      const scheduledTaskCalls = mockSupabase.from.mock.calls.filter(
        call => call[0] === 'scheduled_tasks'
      )
      expect(scheduledTaskCalls).toHaveLength(0)
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        validAppointmentData
      )

      const response = await POST(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should handle database errors during creation', async () => {
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null })
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments',
        validAppointmentData,
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to create appointment')
    })
  })
})