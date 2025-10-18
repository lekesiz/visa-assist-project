import { NextRequest } from 'next/server'
import { GET, PUT, DELETE, PATCH } from '@/app/api/appointments/[id]/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createAuthenticatedRequest,
  createRequestWithBody,
  expectErrorResponse,
  expectSuccessResponse,
  mockUser
} from '../../test-helpers'

// Mock the entire supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Type the mocked function
const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/appointments/[id]', () => {
  let mockSupabase: any
  const appointmentId = 'apt-123'

  const mockAppointment = {
    id: appointmentId,
    user_id: mockUser.id,
    application_id: 'app-123',
    appointment_type: 'visa-appointment',
    appointment_date: '2024-03-01T10:00:00Z',
    location: 'berlin-consulate',
    duration_minutes: 30,
    status: 'scheduled',
    notes: 'Bring passport',
    reminder_enabled: true,
    reminder_sent: false,
    application: {
      id: 'app-123',
      visa_type: 'student',
      status: 'in_progress',
      target_country: 'Turkey'
    },
    reminders: [
      {
        id: 'task-123',
        scheduled_for: '2024-02-29T10:00:00Z',
        status: 'pending'
      }
    ]
  }

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockedCreateClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/appointments/[id]', () => {
    it('should return appointment details with time calculations', async () => {
      // Mock current date
      const mockDate = new Date('2024-02-28T10:00:00Z')
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      mockSupabase.single.mockResolvedValue({
        data: mockAppointment,
        error: null
      })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      const response = await GET(request, { params: { id: appointmentId } })

      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.appointment).toMatchObject(mockAppointment)
      expect(data.appointment.timeUntil).toEqual({
        hours: 24,
        days: 1,
        isPast: false
      })

      // Verify Supabase query
      expect(mockSupabase.from).toHaveBeenCalledWith('appointments')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', appointmentId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)

      jest.restoreAllMocks()
    })

    it('should handle past appointments', async () => {
      const pastAppointment = {
        ...mockAppointment,
        appointment_date: '2024-01-01T10:00:00Z'
      }

      const mockDate = new Date('2024-02-01T10:00:00Z')
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      mockSupabase.single.mockResolvedValue({
        data: pastAppointment,
        error: null
      })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      const response = await GET(request, { params: { id: appointmentId } })

      const data = await expectSuccessResponse(response)

      expect(data.appointment.timeUntil.isPast).toBe(true)
      expect(data.appointment.timeUntil.hours).toBeLessThan(0)

      jest.restoreAllMocks()
    })

    it('should return 404 if appointment not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      const response = await GET(request, { params: { id: appointmentId } })

      await expectErrorResponse(response, 404, 'Appointment not found')
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new NextRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      const response = await GET(request, { params: { id: appointmentId } })

      await expectErrorResponse(response, 401, 'Unauthorized')
    })
  })

  describe('PUT /api/appointments/[id]', () => {
    const updateData = {
      appointment_date: '2024-03-05',
      appointment_time: '14:00',
      location: 'munich-consulate',
      duration_minutes: 45,
      notes: 'Updated notes',
      reminder_enabled: true,
      reminder_hours: 48
    }

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })
    })

    it('should update appointment successfully', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockAppointment, error: null }) // Fetch existing
        .mockResolvedValueOnce({ data: { ...mockAppointment, ...updateData }, error: null }) // Update

      mockSupabase.insert.mockResolvedValue({ data: null, error: null })
      mockSupabase.update.mockResolvedValue({ data: null, error: null })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        updateData,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PUT(request, { params: { id: appointmentId } })
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.message).toBe('Appointment updated successfully')

      // Verify appointment was updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_date: '2024-03-05T14:00:00.000Z',
          location: 'munich-consulate',
          duration_minutes: 45,
          notes: 'Updated notes',
          reminder_enabled: true
        })
      )

      // Verify reminder was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_tasks')

      // Verify activity log
      expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs')

      // Verify email was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/email/send',
        expect.objectContaining({
          body: expect.stringContaining('appointment_updated')
        })
      )
    })

    it('should not allow updating completed appointments', async () => {
      const completedAppointment = {
        ...mockAppointment,
        status: 'completed'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: completedAppointment,
        error: null
      })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        updateData,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PUT(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 400, 'Cannot modify completed appointments')
    })

    it('should not allow updating cancelled appointments', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: 'cancelled'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: cancelledAppointment,
        error: null
      })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        updateData,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PUT(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 400, 'Cannot modify cancelled appointments')
    })

    it('should not allow scheduling appointments in the past', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockAppointment,
        error: null
      })

      const pastUpdateData = {
        appointment_date: '2023-01-01',
        appointment_time: '10:00'
      }

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        pastUpdateData,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PUT(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 400, 'Cannot schedule appointments in the past')
    })

    it('should allow partial updates', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockAppointment, error: null })
        .mockResolvedValueOnce({ data: { ...mockAppointment, notes: 'New notes' }, error: null })

      const partialUpdate = {
        notes: 'New notes'
      }

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        partialUpdate,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PUT(request, { params: { id: appointmentId } })
      await expectSuccessResponse(response)

      // Verify only notes were updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'New notes',
          updated_at: expect.any(String)
        })
      )
    })

    it('should return 404 if appointment not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found')
      })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        updateData,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PUT(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 404, 'Appointment not found')
    })
  })

  describe('DELETE /api/appointments/[id]', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })
    })

    it('should cancel appointment successfully', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockAppointment, error: null }) // Fetch
        .mockResolvedValueOnce({ data: { ...mockAppointment, status: 'cancelled' }, error: null }) // Update

      mockSupabase.select.mockResolvedValue({ data: [], error: null }) // No other appointments
      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}?reason=User%20request`
      )
      request.method = 'DELETE'

      const response = await DELETE(request, { params: { id: appointmentId } })
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.message).toBe('Appointment cancelled successfully')

      // Verify appointment was cancelled
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancelled_at: expect.any(String),
          cancellation_reason: 'User request'
        })
      )

      // Verify reminder was cancelled
      expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_tasks')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled'
        })
      )

      // Verify application was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('applications')

      // Verify activity log
      expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs')

      // Verify email was sent
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/email/send',
        expect.objectContaining({
          body: expect.stringContaining('appointment_cancelled')
        })
      )
    })

    it('should handle default cancellation reason', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockAppointment, error: null })
        .mockResolvedValueOnce({ data: { ...mockAppointment, status: 'cancelled' }, error: null })

      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      request.method = 'DELETE'

      const response = await DELETE(request, { params: { id: appointmentId } })
      await expectSuccessResponse(response)

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cancellation_reason: 'User cancelled'
        })
      )
    })

    it('should not cancel already cancelled appointment', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: 'cancelled'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: cancelledAppointment,
        error: null
      })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      request.method = 'DELETE'

      const response = await DELETE(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 400, 'Appointment is already cancelled')
    })

    it('should update application when other appointments exist', async () => {
      const otherAppointments = [
        { appointment_date: '2024-03-10T15:00:00Z' }
      ]

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockAppointment, error: null })
        .mockResolvedValueOnce({ data: { ...mockAppointment, status: 'cancelled' }, error: null })

      mockSupabase.select.mockResolvedValue({ data: otherAppointments, error: null })
      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      request.method = 'DELETE'

      const response = await DELETE(request, { params: { id: appointmentId } })
      await expectSuccessResponse(response)

      // Verify application was updated with next appointment
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          has_appointment: true,
          next_appointment_date: '2024-03-10T15:00:00Z'
        })
      )
    })

    it('should return 404 if appointment not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found')
      })

      const request = createAuthenticatedRequest(
        `http://localhost:3000/api/appointments/${appointmentId}`
      )
      request.method = 'DELETE'

      const response = await DELETE(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 404, 'Appointment not found')
    })
  })

  describe('PATCH /api/appointments/[id]', () => {
    it('should update appointment status to in_progress', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockAppointment, status: 'in_progress' },
        error: null
      })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { status: 'in_progress' },
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PATCH(request, { params: { id: appointmentId } })
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.message).toBe('Appointment marked as in_progress')

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          updated_at: expect.any(String)
        })
      )
    })

    it('should update appointment status to completed with timestamp', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockAppointment, status: 'completed' },
        error: null
      })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { status: 'completed' },
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PATCH(request, { params: { id: appointmentId } })
      await expectSuccessResponse(response)

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          updated_at: expect.any(String),
          completed_at: expect.any(String)
        })
      )
    })

    it('should update appointment status to no_show', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockAppointment, status: 'no_show' },
        error: null
      })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { status: 'no_show' },
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PATCH(request, { params: { id: appointmentId } })
      const data = await expectSuccessResponse(response)

      expect(data.message).toBe('Appointment marked as no_show')
    })

    it('should reject invalid status values', async () => {
      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { status: 'invalid-status' },
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PATCH(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 400, 'Invalid status')
    })

    it('should log status changes in activity log', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockAppointment, status: 'completed' },
        error: null
      })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { status: 'completed' },
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PATCH(request, { params: { id: appointmentId } })
      await expectSuccessResponse(response)

      expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'appointment_completed',
          details: expect.objectContaining({
            previous_status: 'scheduled',
            new_status: 'completed'
          })
        })
      )
    })

    it('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = createRequestWithBody(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { status: 'completed' },
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await PATCH(request, { params: { id: appointmentId } })
      await expectErrorResponse(response, 400, 'Failed to update appointment status')
    })
  })
})