import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, handleWebhookEvent } from '@/lib/payments/paypal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headersList = headers()
    
    // Get PayPal webhook headers
    const webhookHeaders = {
      'paypal-auth-algo': headersList.get('paypal-auth-algo') || '',
      'paypal-cert-url': headersList.get('paypal-cert-url') || '',
      'paypal-transmission-id': headersList.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': headersList.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': headersList.get('paypal-transmission-time') || ''
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(
      process.env.PAYPAL_WEBHOOK_ID!,
      webhookHeaders,
      body
    )

    if (!isValid) {
      console.error('Invalid PayPal webhook signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    // Handle the event
    const result = await handleWebhookEvent(body)

    if (result.type === 'unhandled') {
      console.log(`Unhandled PayPal webhook event: ${result.eventType}`)
      return NextResponse.json({ received: true })
    }

    // Initialize Supabase admin client
    const supabase = await createClient()

    switch (result.type) {
      case 'payment_completed':
        // Find payment by order ID or capture ID
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .or(`provider_payment_id.eq.${result.orderId},provider_payment_id.eq.${result.captureId}`)
          .single()

        if (payment) {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              confirmed_at: new Date().toISOString(),
              provider_payment_id: result.captureId, // Update to capture ID
              provider_data: {
                ...payment.provider_data,
                webhook_event: body.event_type,
                capture_id: result.captureId,
                order_id: result.orderId
              }
            })
            .eq('id', payment.id)

          // Update application if linked
          if (payment.application_id) {
            await supabase
              .from('applications')
              .update({
                payment_status: 'paid',
                is_premium: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', payment.application_id)
          }

          // Log activity
          await supabase
            .from('activity_logs')
            .insert({
              user_id: payment.user_id,
              entity_type: 'payment',
              entity_id: payment.id,
              action: 'payment_completed',
              details: {
                amount: result.amount,
                currency: result.currency,
                provider: 'paypal'
              }
            })
        }
        break

      case 'payment_refunded':
        // Update payment status
        const { data: refundedPayment } = await supabase
          .from('payments')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            refund_amount: Math.round(parseFloat(result.amount) * 100),
            provider_data: {
              webhook_event: body.event_type,
              refund_id: result.refundId
            }
          })
          .eq('provider_payment_id', result.captureId)
          .select()
          .single()

        if (refundedPayment) {
          // Log activity
          await supabase
            .from('activity_logs')
            .insert({
              user_id: refundedPayment.user_id,
              entity_type: 'payment',
              entity_id: refundedPayment.id,
              action: 'payment_refunded',
              details: {
                refund_amount: result.amount,
                refund_id: result.refundId,
                provider: 'paypal'
              }
            })
        }
        break

      case 'payment_denied':
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            error_message: result.reason || 'Payment denied',
            provider_data: {
              webhook_event: body.event_type,
              denial_reason: result.reason
            }
          })
          .eq('provider_payment_id', result.captureId)
        break
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}