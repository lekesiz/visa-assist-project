import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // read, unread
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (status === 'read') {
      query = query.eq('is_read', true)
    } else if (status === 'unread') {
      query = query.eq('is_read', false)
    }
    
    if (type) {
      query = query.eq('type', type)
    }
    
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    // Group notifications by date
    const groupedNotifications = data?.reduce((acc, notification) => {
      const date = new Date(notification.created_at).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(notification)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      notifications: data || [],
      groupedNotifications,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      unreadCount: unreadCount || 0
    })

  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Create a new notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or system
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create notifications' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      recipient_id,
      type,
      title,
      message,
      priority = 'medium',
      data = {},
      action_url,
      action_label
    } = body

    // Validate required fields
    if (!recipient_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Recipient, type, title, and message are required' },
        { status: 400 }
      )
    }

    // Create notification
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipient_id,
        type,
        title,
        message,
        priority,
        data,
        action_url,
        action_label,
        is_read: false,
        is_system: true
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Send real-time notification if user is online
    await supabase.channel(`user:${recipient_id}`)
      .send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notification
      })

    // Send email notification based on user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('email_notifications')
      .eq('user_id', recipient_id)
      .single()

    if (preferences?.email_notifications) {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notification',
          to: recipient_id, // Will be resolved to email in the email API
          data: {
            notificationType: type,
            title,
            message,
            actionUrl: action_url
          }
        })
      })
    }

    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification created successfully'
    })

  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds, markAll } = await request.json()

    if (!markAll && (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0)) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!markAll) {
      query = query.in('id', notificationIds)
    }

    const { data, error } = await query.select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: markAll ? 'All notifications marked as read' : 'Notifications marked as read'
    })

  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'
    const deleteRead = searchParams.get('read') === 'true'

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (notificationId) {
      query = query.eq('id', notificationId)
    } else if (deleteRead) {
      query = query.eq('is_read', true)
    } else if (!deleteAll) {
      return NextResponse.json(
        { error: 'Specify notification ID or deletion type' },
        { status: 400 }
      )
    }

    const { error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: notificationId ? 'Notification deleted' : 
               deleteAll ? 'All notifications deleted' : 
               'Read notifications deleted'
    })

  } catch (error) {
    console.error('Failed to delete notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}

// Helper function to create notifications (for internal use)
export async function createNotification({
  userId,
  type,
  title,
  message,
  priority = 'medium',
  data = {},
  actionUrl,
  actionLabel
}: {
  userId: string
  type: string
  title: string
  message: string
  priority?: 'low' | 'medium' | 'high'
  data?: Record<string, any>
  actionUrl?: string
  actionLabel?: string
}) {
  const supabase = await createClient()
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      priority,
      data,
      action_url: actionUrl,
      action_label: actionLabel,
      is_read: false,
      is_system: true
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return null
  }

  // Send real-time notification
  await supabase.channel(`user:${userId}`)
    .send({
      type: 'broadcast',
      event: 'new_notification',
      payload: notification
    })

  return notification
}