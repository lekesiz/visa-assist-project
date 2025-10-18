import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Notification types and their default settings
const NOTIFICATION_TYPES = {
  application_updates: {
    label: 'Application Updates',
    description: 'Status changes, document verifications, and progress updates',
    defaultEnabled: true,
    channels: ['in_app', 'email']
  },
  appointment_reminders: {
    label: 'Appointment Reminders',
    description: 'Upcoming appointments and schedule changes',
    defaultEnabled: true,
    channels: ['in_app', 'email', 'sms']
  },
  payment_notifications: {
    label: 'Payment Notifications',
    description: 'Payment confirmations, refunds, and receipts',
    defaultEnabled: true,
    channels: ['in_app', 'email']
  },
  ai_analysis: {
    label: 'AI Analysis Results',
    description: 'Document analysis, denklik results, and recommendations',
    defaultEnabled: true,
    channels: ['in_app', 'email']
  },
  job_matches: {
    label: 'Job Opportunities',
    description: 'New job matches and application deadlines',
    defaultEnabled: true,
    channels: ['in_app', 'email']
  },
  marketing: {
    label: 'News & Updates',
    description: 'Platform updates, tips, and promotional offers',
    defaultEnabled: false,
    channels: ['email']
  },
  system: {
    label: 'System Notifications',
    description: 'Security alerts, maintenance notices, and important updates',
    defaultEnabled: true,
    channels: ['in_app', 'email']
  }
}

// GET - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        notification_types: Object.entries(NOTIFICATION_TYPES).reduce((acc, [key, value]) => {
          acc[key] = {
            enabled: value.defaultEnabled,
            channels: value.channels.filter(channel => {
              if (channel === 'email') return true
              if (channel === 'in_app') return true
              return false
            })
          }
          return acc
        }, {} as Record<string, any>)
      }

      return NextResponse.json({
        success: true,
        preferences: defaultPreferences,
        isDefault: true,
        types: NOTIFICATION_TYPES
      })
    }

    return NextResponse.json({
      success: true,
      preferences,
      isDefault: false,
      types: NOTIFICATION_TYPES
    })

  } catch (error) {
    console.error('Failed to fetch preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_notifications,
      sms_notifications,
      push_notifications,
      notification_types,
      quiet_hours
    } = body

    // Validate notification types if provided
    if (notification_types) {
      for (const [type, settings] of Object.entries(notification_types)) {
        if (!(type in NOTIFICATION_TYPES)) {
          return NextResponse.json(
            { error: `Invalid notification type: ${type}` },
            { status: 400 }
          )
        }
        
        const typeSettings = settings as any
        if (typeSettings.channels && Array.isArray(typeSettings.channels)) {
          const validChannels = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES].channels
          const invalidChannels = typeSettings.channels.filter(
            (channel: string) => !validChannels.includes(channel)
          )
          
          if (invalidChannels.length > 0) {
            return NextResponse.json(
              { error: `Invalid channels for ${type}: ${invalidChannels.join(', ')}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    const updateData = {
      email_notifications,
      sms_notifications,
      push_notifications,
      notification_types,
      quiet_hours,
      updated_at: new Date().toISOString()
    }

    if (existingPrefs) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      // Create new preferences
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...updateData
        })
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'preferences',
        entity_id: user.id,
        action: 'notification_preferences_updated',
        details: {
          changes: Object.keys(body)
        }
      })

    return NextResponse.json({
      success: true,
      preferences: result.data,
      message: 'Preferences updated successfully'
    })

  } catch (error) {
    console.error('Failed to update preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

// POST - Test notification settings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channel } = await request.json()

    if (!channel || !['email', 'sms', 'push', 'in_app'].includes(channel)) {
      return NextResponse.json(
        { error: 'Valid channel is required' },
        { status: 400 }
      )
    }

    // Send test notification based on channel
    switch (channel) {
      case 'email':
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'test',
            to: user.email,
            data: {
              template: 'test_notification',
              firstName: 'User',
              message: 'This is a test email notification from Visa Assist.'
            }
          })
        })
        break

      case 'in_app':
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'test',
            title: 'Test Notification',
            message: 'This is a test in-app notification. If you can see this, your notifications are working!',
            priority: 'low',
            data: { test: true },
            is_system: true
          })
        break

      case 'sms':
        // SMS would require integration with a service like Twilio
        return NextResponse.json({
          success: true,
          message: 'SMS notifications are not yet implemented'
        })

      case 'push':
        // Push notifications would require service worker setup
        return NextResponse.json({
          success: true,
          message: 'Push notifications require browser permission'
        })
    }

    return NextResponse.json({
      success: true,
      message: `Test ${channel} notification sent successfully`
    })

  } catch (error) {
    console.error('Failed to send test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}