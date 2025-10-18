import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { constructWebhookEvent, handleWebhookEvent } from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Construct and verify webhook event
    const event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Handle the event
    const result = await handleWebhookEvent(event)

    if (result.type === 'unhandled') {
      console.log(`Unhandled webhook event: ${result.eventType}`)
      return NextResponse.json({ received: true })
    }

    // Initialize Supabase admin client for webhook processing
    const supabase = await createClient()

    switch (result.type) {
      case 'payment_success':
        // Update payment status
        const { data: payment } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            confirmed_at: new Date().toISOString(),
            provider_data: {
              webhook_event: event.type,
              payment_intent_id: result.paymentIntentId
            }
          })
          .eq('provider_payment_id', result.paymentIntentId)
          .select()
          .single()

        if (payment) {
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
                provider: 'stripe'
              }
            })
        }
        break

      case 'payment_failed':
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            error_message: result.error,
            provider_data: {
              webhook_event: event.type,
              payment_intent_id: result.paymentIntentId,
              error: result.error
            }
          })
          .eq('provider_payment_id', result.paymentIntentId)
        break

      case 'checkout_completed':
        // Handle checkout session completion
        const metadata = result.metadata
        if (metadata?.payment_record_id) {
          await supabase
            .from('payments')
            .update({
              status: result.paymentStatus === 'paid' ? 'completed' : 'processing',
              provider_data: {
                webhook_event: event.type,
                session_id: result.sessionId
              }
            })
            .eq('id', metadata.payment_record_id)
        }
        break
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}

// Stripe webhooks require raw body
export const config = {
  api: {
    bodyParser: false
  }
}