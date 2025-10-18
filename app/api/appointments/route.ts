import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all appointments for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        *,
        application:applications!application_id (
          id,
          visa_type,
          status
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('appointment_type', type)
    }
    if (startDate) {
      query = query.gte('appointment_date', startDate)
    }
    if (endDate) {
      query = query.lte('appointment_date', endDate)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('appointment_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Group appointments by date for calendar view
    const groupedByDate = data?.reduce((acc, appointment) => {
      const date = appointment.appointment_date.split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(appointment)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      appointments: data || [],
      groupedByDate,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Failed to fetch appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      application_id,
      appointment_type,
      appointment_date,
      appointment_time,
      location,
      duration_minutes = 30,
      notes,
      reminder_enabled = true,
      reminder_hours = 24
    } = body

    // Validate required fields
    if (!appointment_type || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Appointment type, date, and time are required' },
        { status: 400 }
      )
    }

    // Combine date and time
    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`)
    
    // Check if the time slot is available
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', appointmentDateTime.toISOString())
      .eq('location', location)
      .neq('status', 'cancelled')
      .limit(1)

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 400 }
      )
    }

    // Create appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        application_id,
        appointment_type,
        appointment_date: appointmentDateTime.toISOString(),
        location: location || 'To be confirmed',
        duration_minutes,
        status: 'scheduled',
        notes,
        reminder_enabled,
        reminder_sent: false,
        metadata: {
          reminder_hours,
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Create reminder if enabled
    if (reminder_enabled) {
      const reminderDate = new Date(appointmentDateTime)
      reminderDate.setHours(reminderDate.getHours() - reminder_hours)
      
      await supabase
        .from('scheduled_tasks')
        .insert({
          task_type: 'appointment_reminder',
          scheduled_for: reminderDate.toISOString(),
          entity_type: 'appointment',
          entity_id: appointment.id,
          user_id: user.id,
          status: 'pending',
          metadata: {
            appointment_id: appointment.id,
            appointment_type,
            appointment_date: appointmentDateTime.toISOString(),
            location
          }
        })
    }

    // Update application if linked
    if (application_id) {
      await supabase
        .from('applications')
        .update({
          has_appointment: true,
          next_appointment_date: appointmentDateTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', application_id)
        .eq('user_id', user.id)
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'appointment',
        entity_id: appointment.id,
        action: 'appointment_scheduled',
        details: {
          type: appointment_type,
          date: appointment_date,
          time: appointment_time,
          location
        }
      })

    // Send confirmation email
    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment_confirmation',
        to: user.email,
        data: {
          appointmentDetails: {
            date: appointment_date,
            time: appointment_time,
            location,
            type: appointment_type,
            appointmentId: appointment.id
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment scheduled successfully'
    })

  } catch (error) {
    console.error('Failed to create appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

// Get available time slots
export async function getAvailableSlots(date: string, location?: string) {
  const supabase = await createClient()
  
  // Define business hours (9 AM - 5 PM)
  const slots = []
  const startHour = 9
  const endHour = 17
  const slotDuration = 30 // minutes

  // Get all appointments for the date
  const { data: bookedAppointments } = await supabase
    .from('appointments')
    .select('appointment_date, duration_minutes')
    .gte('appointment_date', `${date}T00:00:00`)
    .lt('appointment_date', `${date}T23:59:59`)
    .eq('location', location || 'default')
    .neq('status', 'cancelled')

  // Create time slots
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const slotDateTime = new Date(`${date}T${slotTime}:00`)
      
      // Check if slot is available
      const isBooked = bookedAppointments?.some(appointment => {
        const appointmentStart = new Date(appointment.appointment_date)
        const appointmentEnd = new Date(appointmentStart)
        appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.duration_minutes)
        
        return slotDateTime >= appointmentStart && slotDateTime < appointmentEnd
      })

      if (!isBooked) {
        slots.push({
          time: slotTime,
          available: true,
          dateTime: slotDateTime.toISOString()
        })
      }
    }
  }

  return slots
}