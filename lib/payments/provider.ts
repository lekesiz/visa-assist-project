export type PaymentProvider = 'stripe' | 'paypal'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentAmount {
  amount: number // in cents for Stripe, decimal string for PayPal
  currency: string
}

export interface CreatePaymentParams {
  provider: PaymentProvider
  amount: PaymentAmount
  userId: string
  applicationId?: string
  description?: string
  returnUrl: string
  cancelUrl: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  provider: PaymentProvider
  paymentId: string
  status: PaymentStatus
  amount: PaymentAmount
  approvalUrl?: string
  clientSecret?: string
  metadata?: Record<string, any>
}

/**
 * Create a payment with the specified provider
 */
export async function createPayment({
  provider,
  amount,
  userId,
  applicationId,
  description,
  returnUrl,
  cancelUrl,
  metadata = {}
}: CreatePaymentParams): Promise<PaymentResult> {
  switch (provider) {
    case 'stripe': {
      // For Stripe, create a payment intent
      const stripeService = await import('./stripe')
      const stripeResult = await stripeService.createPaymentIntent({
        amount: amount.amount,
        currency: amount.currency,
        userId,
        applicationId,
        description,
        metadata
      })

      return {
        provider: 'stripe',
        paymentId: stripeResult.paymentIntentId,
        status: 'pending',
        amount,
        clientSecret: stripeResult.clientSecret,
        metadata
      }
    }

    case 'paypal': {
      // For PayPal, create an order
      const paypalService = await import('./paypal')
      const paypalResult = await paypalService.createOrder({
        amount: (amount.amount / 100).toFixed(2), // Convert cents to decimal
        currency: amount.currency,
        userId,
        applicationId,
        description,
        returnUrl,
        cancelUrl
      })

      return {
        provider: 'paypal',
        paymentId: paypalResult.orderId,
        status: 'pending',
        amount,
        approvalUrl: paypalResult.approvalUrl,
        metadata
      }
    }

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}

/**
 * Capture/confirm a payment
 */
export async function confirmPayment(
  provider: PaymentProvider,
  paymentId: string
): Promise<PaymentResult> {
  switch (provider) {
    case 'stripe': {
      // Stripe payment intents are confirmed client-side
      const stripeService = await import('./stripe')
      const stripePayment = await stripeService.getPaymentIntent(paymentId)
      
      return {
        provider: 'stripe',
        paymentId: stripePayment.id,
        status: mapStripeStatus(stripePayment.status),
        amount: {
          amount: stripePayment.amount,
          currency: stripePayment.currency
        },
        metadata: stripePayment.metadata
      }
    }

    case 'paypal': {
      // Capture PayPal order after approval
      const paypalService = await import('./paypal')
      const paypalCapture = await paypalService.captureOrder(paymentId)
      
      return {
        provider: 'paypal',
        paymentId: paypalCapture.captureId,
        status: mapPayPalStatus(paypalCapture.status),
        amount: {
          amount: Math.round(parseFloat(paypalCapture.amount) * 100), // Convert to cents
          currency: paypalCapture.currency
        },
        metadata: {
          userId: paypalCapture.userId,
          applicationId: paypalCapture.applicationId
        }
      }
    }

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}

/**
 * Cancel a payment
 */
export async function cancelPayment(
  provider: PaymentProvider,
  paymentId: string
): Promise<void> {
  switch (provider) {
    case 'stripe':
      await stripeService.cancelPaymentIntent(paymentId)
      break

    case 'paypal':
      // PayPal orders expire automatically if not captured
      // No explicit cancel API needed
      break

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  provider: PaymentProvider,
  paymentId: string,
  amount?: number
): Promise<{
  refundId: string
  amount: number
  currency: string
  status: string
}> {
  switch (provider) {
    case 'stripe':
      const stripeRefund = await stripeService.createRefund(paymentId, amount)
      return {
        refundId: stripeRefund.id,
        amount: stripeRefund.amount,
        currency: stripeRefund.currency,
        status: stripeRefund.status
      }

    case 'paypal':
      // For PayPal, we need the capture ID, not order ID
      const paypalRefund = await paypalService.refundPayment(
        paymentId,
        amount ? (amount / 100).toFixed(2) : undefined,
        amount ? 'EUR' : undefined // Default currency
      )
      
      return {
        refundId: paypalRefund.refundId,
        amount: Math.round(parseFloat(paypalRefund.amount || '0') * 100),
        currency: paypalRefund.currency || 'EUR',
        status: paypalRefund.status
      }

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(
  provider: PaymentProvider,
  paymentId: string
): Promise<PaymentStatus> {
  switch (provider) {
    case 'stripe':
      const stripePayment = await stripeService.getPaymentIntent(paymentId)
      return mapStripeStatus(stripePayment.status)

    case 'paypal':
      const paypalOrder = await paypalService.getOrder(paymentId)
      return mapPayPalStatus(paypalOrder.status)

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}

/**
 * Map Stripe payment intent status to our status
 */
function mapStripeStatus(stripeStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'requires_payment_method': 'pending',
    'requires_confirmation': 'pending',
    'requires_action': 'pending',
    'processing': 'processing',
    'requires_capture': 'processing',
    'succeeded': 'completed',
    'canceled': 'cancelled',
    'failed': 'failed'
  }
  
  return statusMap[stripeStatus] || 'pending'
}

/**
 * Map PayPal order status to our status
 */
function mapPayPalStatus(paypalStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'CREATED': 'pending',
    'SAVED': 'pending',
    'APPROVED': 'processing',
    'VOIDED': 'cancelled',
    'COMPLETED': 'completed',
    'PAYER_ACTION_REQUIRED': 'pending'
  }
  
  return statusMap[paypalStatus] || 'pending'
}

// Export service types
export * from './stripe'
export * from './paypal'