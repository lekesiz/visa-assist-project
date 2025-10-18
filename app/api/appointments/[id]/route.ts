import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get a single appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        application:applications!application_id (
          id,
          visa_type,
          status,
          target_country
        ),
        reminders:scheduled_tasks (
          id,
          scheduled_for,
          status
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Calculate time until appointment
    const now = new Date()
    const appointmentDate = new Date(appointment.appointment_date)
    const hoursUntil = Math.floor((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    const daysUntil = Math.floor(hoursUntil / 24)

    return NextResponse.json({
      success: true,
      appointment: {
        ...appointment,
        timeUntil: {
          hours: hoursUntil,
          days: daysUntil,
          isPast: hoursUntil < 0
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch appointment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

// PUT - Update an appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      appointment_date,
      appointment_time,
      location,
      duration_minutes,
      notes,
      reminder_enabled,
      reminder_hours
    } = body

    // Get existing appointment
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if appointment can be modified
    if (existingAppointment.status === 'completed' || existingAppointment.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot modify ${existingAppointment.status} appointments` },
        { status: 400 }
      )
    }

    // Check if appointment is in the past
    const appointmentDateTime = appointment_date && appointment_time
      ? new Date(`${appointment_date}T${appointment_time}`)
      : new Date(existingAppointment.appointment_date)

    if (appointmentDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule appointments in the past' },
        { status: 400 }
      )
    }

    // Update appointment
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (appointment_date && appointment_time) {
      updateData.appointment_date = appointmentDateTime.toISOString()
    }
    if (location !== undefined) {
      updateData.location = location
    }
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }
    if (reminder_enabled !== undefined) {
      updateData.reminder_enabled = reminder_enabled
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Update reminder if date changed
    if (appointment_date && appointment_time && reminder_enabled) {
      const reminderDate = new Date(appointmentDateTime)
      reminderDate.setHours(reminderDate.getHours() - (reminder_hours || 24))
      
      await supabase
        .from('scheduled_tasks')
        .update({
          scheduled_for: reminderDate.toISOString(),
          status: 'pending',
          metadata: {
            appointment_id: params.id,
            appointment_type: existingAppointment.appointment_type,
            appointment_date: appointmentDateTime.toISOString(),
            location: updateData.location || existingAppointment.location
          }
        })
        .eq('entity_type', 'appointment')
        .eq('entity_id', params.id)
        .eq('task_type', 'appointment_reminder')
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'appointment',
        entity_id: params.id,
        action: 'appointment_updated',
        details: {
          changes: Object.keys(updateData).filter(key => key !== 'updated_at'),
          previous_date: existingAppointment.appointment_date,
          new_date: updateData.appointment_date
        }
      })

    // Send update notification
    if (appointment_date && appointment_time) {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment_updated',
          to: user.email,
          data: {
            appointmentDetails: {
              date: appointment_date,
              time: appointment_time,
              location: updateData.location || existingAppointment.location,
              type: existingAppointment.appointment_type,
              appointmentId: params.id
            }
          }
        })
      })
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully'
    })

  } catch (error) {
    console.error('Failed to update appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      )
    }

    // Get cancellation reason from query params
    const { searchParams } = new URL(request.url)
    const cancellationReason = searchParams.get('reason') || 'User cancelled'

    // Cancel appointment
    const { data: cancelledAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Cancel reminder
    await supabase
      .from('scheduled_tasks')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('entity_type', 'appointment')
      .eq('entity_id', params.id)
      .eq('task_type', 'appointment_reminder')
      .eq('status', 'pending')

    // Update application if linked
    if (appointment.application_id) {
      // Check if there are other appointments
      const { data: otherAppointments } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('application_id', appointment.application_id)
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .neq('id', params.id)
        .order('appointment_date', { ascending: true })
        .limit(1)

      await supabase
        .from('applications')
        .update({
          has_appointment: otherAppointments && otherAppointments.length > 0,
          next_appointment_date: otherAppointments?.[0]?.appointment_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.application_id)
        .eq('user_id', user.id)
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'appointment',
        entity_id: params.id,
        action: 'appointment_cancelled',
        details: {
          appointment_type: appointment.appointment_type,
          appointment_date: appointment.appointment_date,
          reason: cancellationReason
        }
      })

    // Send cancellation email
    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment_cancelled',
        to: user.email,
        data: {
          appointmentDetails: {
            date: new Date(appointment.appointment_date).toLocaleDateString(),
            time: new Date(appointment.appointment_date).toLocaleTimeString(),
            location: appointment.location,
            type: appointment.appointment_type,
            appointmentId: params.id,
            cancellationReason
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully'
    })

  } catch (error) {
    console.error('Failed to cancel appointment:', error)
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    )
  }
}

// PATCH - Quick status update
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!status || !['scheduled', 'in_progress', 'completed', 'no_show'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update appointment status
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Failed to update appointment status' },
        { status: 400 }
      )
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'appointment',
        entity_id: params.id,
        action: `appointment_${status}`,
        details: {
          previous_status: appointment.status,
          new_status: status
        }
      })

    return NextResponse.json({
      success: true,
      appointment,
      message: `Appointment marked as ${status}`
    })

  } catch (error) {
    console.error('Failed to update appointment status:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment status' },
      { status: 500 }
    )
  }
}