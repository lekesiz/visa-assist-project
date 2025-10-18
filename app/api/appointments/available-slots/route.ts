import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Define appointment locations with their capacities
const LOCATIONS = {
  'berlin-consulate': {
    name: 'Turkish Consulate Berlin',
    address: 'Heerstraße 4, 14052 Berlin',
    capacity: 20, // appointments per slot
    workingHours: { start: 9, end: 17 }
  },
  'munich-consulate': {
    name: 'Turkish Consulate Munich',
    address: 'Menzinger Str. 3, 80638 München',
    capacity: 15,
    workingHours: { start: 9, end: 16 }
  },
  'frankfurt-consulate': {
    name: 'Turkish Consulate Frankfurt',
    address: 'Kennedyallee 111, 60596 Frankfurt am Main',
    capacity: 18,
    workingHours: { start: 9, end: 17 }
  },
  'online': {
    name: 'Online Consultation',
    address: 'Video Call',
    capacity: 50,
    workingHours: { start: 8, end: 20 }
  }
}

// GET - Get available appointment slots
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const location = searchParams.get('location') || 'berlin-consulate'
    const appointmentType = searchParams.get('type') || 'visa-appointment'
    const duration = parseInt(searchParams.get('duration') || '30')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Validate date is not in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      return NextResponse.json(
        { error: 'Cannot check slots for past dates' },
        { status: 400 }
      )
    }

    // Get location details
    const locationInfo = LOCATIONS[location as keyof typeof LOCATIONS]
    if (!locationInfo) {
      return NextResponse.json(
        { error: 'Invalid location' },
        { status: 400 }
      )
    }

    // Check if date is a weekend or holiday
    const dayOfWeek = selectedDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({
        success: true,
        date,
        location: locationInfo,
        slots: [],
        message: 'No appointments available on weekends'
      })
    }

    // Get all appointments for the date and location
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`
    
    const { data: bookedAppointments } = await supabase
      .from('appointments')
      .select('appointment_date, duration_minutes')
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay)
      .eq('location', location)
      .neq('status', 'cancelled')

    // Generate time slots
    const slots = []
    const { start: startHour, end: endHour } = locationInfo.workingHours
    const slotDuration = duration // in minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Skip lunch break (12:00 - 13:00)
        if (hour === 12 && minute < 60) {
          continue
        }

        // Don't create slots that would extend beyond working hours
        const slotEndHour = hour + Math.floor((minute + slotDuration) / 60)
        const slotEndMinute = (minute + slotDuration) % 60
        if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMinute > 0)) {
          continue
        }

        const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const slotDateTime = new Date(`${date}T${slotTime}:00`)
        
        // Count bookings for this slot
        const bookingsInSlot = bookedAppointments?.filter(appointment => {
          const appointmentStart = new Date(appointment.appointment_date)
          const appointmentEnd = new Date(appointmentStart)
          appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.duration_minutes)
          
          const slotStart = slotDateTime
          const slotEnd = new Date(slotDateTime)
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)
          
          // Check for overlap
          return appointmentStart < slotEnd && appointmentEnd > slotStart
        }).length || 0

        const availableCapacity = locationInfo.capacity - bookingsInSlot
        const isAvailable = availableCapacity > 0

        // Only show future slots for today
        if (date === today.toISOString().split('T')[0]) {
          const now = new Date()
          if (slotDateTime <= now) {
            continue
          }
        }

        slots.push({
          time: slotTime,
          dateTime: slotDateTime.toISOString(),
          available: isAvailable,
          capacity: locationInfo.capacity,
          booked: bookingsInSlot,
          availableSpots: availableCapacity
        })
      }
    }

    // Get user's existing appointments for the day
    const { data: userAppointments } = await supabase
      .from('appointments')
      .select('id, appointment_date')
      .eq('user_id', user.id)
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay)
      .neq('status', 'cancelled')

    return NextResponse.json({
      success: true,
      date,
      location: locationInfo,
      appointmentType,
      duration,
      slots,
      userHasAppointment: userAppointments && userAppointments.length > 0,
      userAppointments: userAppointments || []
    })

  } catch (error) {
    console.error('Failed to get available slots:', error)
    return NextResponse.json(
      { error: 'Failed to get available slots' },
      { status: 500 }
    )
  }
}

// POST - Check multiple dates for availability
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dates, location = 'berlin-consulate' } = await request.json()

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Dates array is required' },
        { status: 400 }
      )
    }

    // Limit to 30 days
    if (dates.length > 30) {
      return NextResponse.json(
        { error: 'Maximum 30 dates allowed' },
        { status: 400 }
      )
    }

    // Get location info
    const locationInfo = LOCATIONS[location as keyof typeof LOCATIONS]
    if (!locationInfo) {
      return NextResponse.json(
        { error: 'Invalid location' },
        { status: 400 }
      )
    }

    // Get all appointments for the date range
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]
    
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_date')
      .gte('appointment_date', `${startDate}T00:00:00`)
      .lte('appointment_date', `${endDate}T23:59:59`)
      .eq('location', location)
      .neq('status', 'cancelled')

    // Calculate availability for each date
    const availability = dates.map(date => {
      const dayAppointments = appointments?.filter(apt => 
        apt.appointment_date.startsWith(date)
      ).length || 0

      const dayOfWeek = new Date(date).getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      // Calculate max daily capacity
      const workingHours = locationInfo.workingHours.end - locationInfo.workingHours.start - 1 // -1 for lunch
      const slotsPerHour = 60 / 30 // 30-minute slots
      const maxDailyCapacity = workingHours * slotsPerHour * locationInfo.capacity

      return {
        date,
        available: !isWeekend && dayAppointments < maxDailyCapacity,
        isWeekend,
        totalBooked: dayAppointments,
        maxCapacity: isWeekend ? 0 : maxDailyCapacity,
        availabilityPercentage: isWeekend ? 0 : Math.round(((maxDailyCapacity - dayAppointments) / maxDailyCapacity) * 100)
      }
    })

    return NextResponse.json({
      success: true,
      location: locationInfo,
      availability
    })

  } catch (error) {
    console.error('Failed to check availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}