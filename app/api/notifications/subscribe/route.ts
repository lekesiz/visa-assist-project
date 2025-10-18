import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription, device_info } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Valid subscription object is required' },
        { status: 400 }
      )
    }

    // Store push subscription
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          device_info,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (error) {
        throw error
      }
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          device_info,
          is_active: true
        })

      if (error) {
        throw error
      }
    }

    // Update user preferences to enable push notifications
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        push_notifications: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    })

  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    )
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    if (!endpoint) {
      // Remove all subscriptions for the user
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        throw error
      }
    } else {
      // Remove specific subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint)

      if (error) {
        throw error
      }
    }

    // Check if user has any remaining subscriptions
    const { count } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // If no active subscriptions, disable push notifications
    if (count === 0) {
      await supabase
        .from('user_preferences')
        .update({
          push_notifications: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    })

  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    )
  }
}

// GET - Get active subscriptions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, device_info, created_at, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      count: subscriptions?.length || 0
    })

  } catch (error) {
    console.error('Failed to fetch push subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch push subscriptions' },
      { status: 500 }
    )
  }
}