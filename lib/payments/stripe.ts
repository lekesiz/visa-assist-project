import Stripe from 'stripe'

// Lazy initialize Stripe to avoid errors during build
let stripeClient: Stripe | null = null

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia' as any,
      typescript: true,
    })
  }
  return stripeClient
}

// Export helper - note: this is for backwards compatibility
export const stripe = null as any

export interface CreatePaymentIntentParams {
  amount: number // in cents
  currency: string
  userId: string
  applicationId?: string
  description?: string
  metadata?: Record<string, string>
}

export interface CreateCheckoutSessionParams {
  priceId: string
  userId: string
  applicationId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

/**
 * Create a payment intent for one-time payments
 */
export async function createPaymentIntent({
  amount,
  currency,
  userId,
  applicationId,
  description,
  metadata = {}
}: CreatePaymentIntentParams) {
  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount,
      currency,
      description: description || 'Visa Assist Service Payment',
      metadata: {
        user_id: userId,
        application_id: applicationId || '',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    }
  } catch (error) {
    console.error('Stripe payment intent error:', error)
    throw new Error('Failed to create payment intent')
  }
}

/**
 * Create a checkout session for subscription or one-time purchases
 */
export async function createCheckoutSession({
  priceId,
  userId,
  applicationId,
  successUrl,
  cancelUrl,
  metadata = {}
}: CreateCheckoutSessionParams) {
  try {
    const session = await getStripeClient().checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // Use 'subscription' for recurring payments
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        application_id: applicationId || '',
        ...metadata
      },
      customer_creation: 'always',
      payment_method_types: ['card'],
    })

    return {
      sessionId: session.id,
      url: session.url
    }
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    throw new Error('Failed to create checkout session')
  }
}

/**
 * Retrieve payment intent status
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntentId)
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata
    }
  } catch (error) {
    console.error('Stripe retrieve payment intent error:', error)
    throw new Error('Failed to retrieve payment intent')
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await getStripeClient().paymentIntents.cancel(paymentIntentId)
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      canceledAt: paymentIntent.canceled_at
    }
  } catch (error) {
    console.error('Stripe cancel payment intent error:', error)
    throw new Error('Failed to cancel payment intent')
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  try {
    const refund = await getStripeClient().refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // Optional: partial refund
      reason: 'requested_by_customer'
    })
    
    return {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      created: refund.created
    }
  } catch (error) {
    console.error('Stripe refund error:', error)
    throw new Error('Failed to create refund')
  }
}

/**
 * List all payment methods for a customer
 */
export async function listPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await getStripeClient().paymentMethods.list({
      customer: customerId,
      type: 'card',
    })
    
    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year
      } : null,
      created: pm.created
    }))
  } catch (error) {
    console.error('Stripe list payment methods error:', error)
    throw new Error('Failed to list payment methods')
  }
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Handle webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      return {
        type: 'payment_success',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      }
    }

    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object as Stripe.PaymentIntent
      return {
        type: 'payment_failed',
        paymentIntentId: failedPayment.id,
        error: failedPayment.last_payment_error?.message
      }
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      return {
        type: 'checkout_completed',
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata
      }
    }

    default:
      return {
        type: 'unhandled',
        eventType: event.type
      }
  }
}