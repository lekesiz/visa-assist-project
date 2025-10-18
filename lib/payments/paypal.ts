import axios from 'axios'

// PayPal API configuration
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!

interface PayPalToken {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
    
    const response = await axios.post<PayPalToken>(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error('PayPal auth error:', error)
    throw new Error('Failed to authenticate with PayPal')
  }
}

export interface CreateOrderParams {
  amount: string // e.g., "100.00"
  currency: string // e.g., "EUR"
  userId: string
  applicationId?: string
  description?: string
  returnUrl: string
  cancelUrl: string
}

/**
 * Create a PayPal order
 */
export async function createOrder({
  amount,
  currency,
  userId,
  applicationId,
  description,
  returnUrl,
  cancelUrl
}: CreateOrderParams) {
  try {
    const accessToken = await getAccessToken()

    const order = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        },
        description: description || 'Visa Assist Service Payment',
        custom_id: JSON.stringify({
          user_id: userId,
          application_id: applicationId
        })
      }],
      application_context: {
        brand_name: 'Visa Assist',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      order,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const approveLink = response.data.links.find((link: any) => link.rel === 'approve')

    return {
      orderId: response.data.id,
      status: response.data.status,
      approvalUrl: approveLink?.href
    }
  } catch (error) {
    console.error('PayPal create order error:', error)
    throw new Error('Failed to create PayPal order')
  }
}

/**
 * Capture a PayPal order after approval
 */
export async function captureOrder(orderId: string) {
  try {
    const accessToken = await getAccessToken()

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const capture = response.data.purchase_units[0].payments.captures[0]
    const customData = JSON.parse(response.data.purchase_units[0].custom_id || '{}')

    return {
      captureId: capture.id,
      status: capture.status,
      amount: capture.amount.value,
      currency: capture.amount.currency_code,
      userId: customData.user_id,
      applicationId: customData.application_id,
      capturedAt: capture.create_time
    }
  } catch (error) {
    console.error('PayPal capture error:', error)
    throw new Error('Failed to capture PayPal order')
  }
}

/**
 * Get order details
 */
export async function getOrder(orderId: string) {
  try {
    const accessToken = await getAccessToken()

    const response = await axios.get(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      id: response.data.id,
      status: response.data.status,
      amount: response.data.purchase_units[0].amount.value,
      currency: response.data.purchase_units[0].amount.currency_code,
      createdAt: response.data.create_time
    }
  } catch (error) {
    console.error('PayPal get order error:', error)
    throw new Error('Failed to get PayPal order')
  }
}

/**
 * Refund a captured payment
 */
export async function refundPayment(captureId: string, amount?: string, currency?: string) {
  try {
    const accessToken = await getAccessToken()

    const body: any = {}
    if (amount && currency) {
      body.amount = {
        value: amount,
        currency_code: currency
      }
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      refundId: response.data.id,
      status: response.data.status,
      amount: response.data.amount?.value,
      currency: response.data.amount?.currency_code,
      refundedAt: response.data.create_time
    }
  } catch (error) {
    console.error('PayPal refund error:', error)
    throw new Error('Failed to refund PayPal payment')
  }
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  webhookId: string,
  headers: Record<string, string>,
  body: any
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken()

    const verificationRequest = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: body
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      verificationRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('PayPal webhook verification error:', error)
    return false
  }
}

/**
 * Handle webhook events
 */
export async function handleWebhookEvent(event: any) {
  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      return {
        type: 'payment_completed',
        captureId: event.resource.id,
        amount: event.resource.amount.value,
        currency: event.resource.amount.currency_code,
        orderId: event.resource.supplementary_data?.related_ids?.order_id
      }

    case 'PAYMENT.CAPTURE.REFUNDED':
      return {
        type: 'payment_refunded',
        refundId: event.resource.refund_id,
        captureId: event.resource.id,
        amount: event.resource.amount.value,
        currency: event.resource.amount.currency_code
      }

    case 'PAYMENT.CAPTURE.DENIED':
      return {
        type: 'payment_denied',
        captureId: event.resource.id,
        reason: event.resource.status_details?.reason
      }

    default:
      return {
        type: 'unhandled',
        eventType: event.event_type
      }
  }
}