import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/appointments/available-slots/route'
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

describe('/api/appointments/available-slots', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockedCreateClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/appointments/available-slots', () => {
    const mockExistingAppointments = [
      {
        appointment_date: '2024-03-01T10:00:00Z',
        duration_minutes: 30
      },
      {
        appointment_date: '2024-03-01T14:30:00Z',
        duration_minutes: 60
      }
    ]

    it('should return available slots for a given date', async () => {
      mockSupabase.select.mockResolvedValue({
        data: mockExistingAppointments,
        error: null
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01&location=berlin-consulate'
      )
      const response = await GET(request)

      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.date).toBe('2024-03-01')
      expect(data.location).toEqual({
        name: 'Turkish Consulate Berlin',
        address: 'Heerstraße 4, 14052 Berlin',
        capacity: 20,
        workingHours: { start: 9, end: 17 }
      })
      expect(data.slots).toBeDefined()
      expect(Array.isArray(data.slots)).toBe(true)

      // Verify that booked slots are marked as unavailable
      const bookedSlot = data.slots.find((slot: any) => slot.time === '10:00')
      expect(bookedSlot?.available).toBe(false)

      // Verify lunch break is excluded
      const lunchSlot = data.slots.find((slot: any) => slot.time === '12:00')
      expect(lunchSlot).toBeUndefined()

      // Verify available slots have correct properties
      const availableSlot = data.slots.find((slot: any) => slot.available === true)
      expect(availableSlot).toMatchObject({
        time: expect.any(String),
        dateTime: expect.any(String),
        available: true,
        capacity: 20,
        booked: expect.any(Number),
        availableSpots: expect.any(Number)
      })

      // Verify Supabase query
      expect(mockSupabase.from).toHaveBeenCalledWith('appointments')
      expect(mockSupabase.gte).toHaveBeenCalledWith('appointment_date', '2024-03-01T00:00:00')
      expect(mockSupabase.lte).toHaveBeenCalledWith('appointment_date', '2024-03-01T23:59:59')
      expect(mockSupabase.eq).toHaveBeenCalledWith('location', 'berlin-consulate')
      expect(mockSupabase.neq).toHaveBeenCalledWith('status', 'cancelled')
    })

    it('should handle different appointment types and durations', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01&type=consultation&duration=60'
      )
      const response = await GET(request)

      const data = await expectSuccessResponse(response)

      expect(data.appointmentType).toBe('consultation')
      expect(data.duration).toBe(60)

      // Verify 60-minute slots don't overlap
      const slots = data.slots
      for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i].time.split(':')[0] === slots[i + 1].time.split(':')[0]) {
          // If same hour, minutes should differ by at least 60
          const currentMin = parseInt(slots[i].time.split(':')[1])
          const nextMin = parseInt(slots[i + 1].time.split(':')[1])
          expect(nextMin - currentMin).toBeGreaterThanOrEqual(60)
        }
      }
    })

    it('should handle online appointments with extended hours', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01&location=online'
      )
      const response = await GET(request)

      const data = await expectSuccessResponse(response)

      expect(data.location.name).toBe('Online Consultation')
      expect(data.location.workingHours).toEqual({ start: 8, end: 20 })
      expect(data.location.capacity).toBe(50)

      // Verify extended hours
      const firstSlot = data.slots[0]
      const lastSlot = data.slots[data.slots.length - 1]
      expect(firstSlot.time).toBe('08:00')
      expect(parseInt(lastSlot.time.split(':')[0])).toBeLessThan(20)
    })

    it('should not return slots for weekends', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-02' // Saturday
      )
      const response = await GET(request)

      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.slots).toEqual([])
      expect(data.message).toBe('No appointments available on weekends')
    })

    it('should not return past slots for today', async () => {
      // Mock current time as 14:00
      const mockDate = new Date('2024-03-01T14:00:00Z')
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01'
      )
      const response = await GET(request)

      const data = await expectSuccessResponse(response)

      // All slots before 14:00 should be excluded
      const slots = data.slots
      slots.forEach((slot: any) => {
        const [hour, minute] = slot.time.split(':').map(Number)
        const slotTime = hour * 60 + minute
        expect(slotTime).toBeGreaterThan(14 * 60) // After 14:00
      })

      jest.restoreAllMocks()
    })

    it('should return user appointments for the day', async () => {
      const userAppointments = [
        { id: 'user-apt-1', appointment_date: '2024-03-01T10:00:00Z' }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // General appointments
        .mockResolvedValueOnce({ data: userAppointments, error: null }) // User appointments

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01'
      )
      const response = await GET(request)

      const data = await expectSuccessResponse(response)

      expect(data.userHasAppointment).toBe(true)
      expect(data.userAppointments).toEqual(userAppointments)
    })

    it('should validate date parameter is required', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots'
      )
      const response = await GET(request)

      await expectErrorResponse(response, 400, 'Date parameter is required')
    })

    it('should reject past dates', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2023-01-01'
      )
      const response = await GET(request)

      await expectErrorResponse(response, 400, 'Cannot check slots for past dates')
    })

    it('should validate location parameter', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01&location=invalid-location'
      )
      const response = await GET(request)

      await expectErrorResponse(response, 400, 'Invalid location')
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = new NextRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01'
      )
      const response = await GET(request)

      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should handle database errors', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/appointments/available-slots?date=2024-03-01'
      )
      const response = await GET(request)

      await expectErrorResponse(response, 500, 'Failed to get available slots')
    })
  })

  describe('POST /api/appointments/available-slots', () => {
    it('should check availability for multiple dates', async () => {
      const dates = ['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04', '2024-03-05']
      
      const mockAppointments = [
        { appointment_date: '2024-03-01T10:00:00Z' },
        { appointment_date: '2024-03-01T11:00:00Z' },
        { appointment_date: '2024-03-03T14:00:00Z' }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockAppointments,
        error: null
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates, location: 'berlin-consulate' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.success).toBe(true)
      expect(data.location.name).toBe('Turkish Consulate Berlin')
      expect(data.availability).toHaveLength(5)

      // Check availability calculation
      const march1 = data.availability.find((a: any) => a.date === '2024-03-01')
      expect(march1).toMatchObject({
        date: '2024-03-01',
        available: true,
        isWeekend: false,
        totalBooked: 2,
        maxCapacity: expect.any(Number),
        availabilityPercentage: expect.any(Number)
      })

      // Check weekend
      const march2 = data.availability.find((a: any) => a.date === '2024-03-02')
      expect(march2).toMatchObject({
        date: '2024-03-02',
        available: false,
        isWeekend: true,
        totalBooked: 0,
        maxCapacity: 0,
        availabilityPercentage: 0
      })
    })

    it('should validate dates array is required', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { location: 'berlin-consulate' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Dates array is required')
    })

    it('should validate dates array is not empty', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates: [], location: 'berlin-consulate' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Dates array is required')
    })

    it('should limit to maximum 30 dates', async () => {
      const dates = Array(31).fill('2024-03-01')

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates, location: 'berlin-consulate' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Maximum 30 dates allowed')
    })

    it('should validate location', async () => {
      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates: ['2024-03-01'], location: 'invalid-location' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Invalid location')
    })

    it('should calculate capacity correctly', async () => {
      // Mock appointments that fill up capacity
      const fullDayAppointments = []
      // Berlin consulate: 7 working hours * 2 slots/hour * 20 capacity = 280 max daily appointments
      for (let i = 0; i < 280; i++) {
        fullDayAppointments.push({
          appointment_date: `2024-03-01T${9 + Math.floor(i / 40)}:${(i % 2) * 30}:00Z`
        })
      }

      mockSupabase.select.mockResolvedValue({
        data: fullDayAppointments.slice(0, 100), // Partially booked
        error: null
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates: ['2024-03-01'], location: 'berlin-consulate' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      const availability = data.availability[0]
      expect(availability.totalBooked).toBe(100)
      expect(availability.maxCapacity).toBe(280)
      expect(availability.availabilityPercentage).toBe(64) // (180/280)*100 ≈ 64
      expect(availability.available).toBe(true)
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates: ['2024-03-01'] },
        { method: 'POST' }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should handle database errors', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = createRequestWithBody(
        'http://localhost:3000/api/appointments/available-slots',
        { dates: ['2024-03-01'], location: 'berlin-consulate' },
        {
          method: 'POST',
          headers: { Authorization: `Bearer mock-token-${mockUser.id}` }
        }
      )

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to check availability')
    })
  })
})