import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayment, PaymentProvider } from '@/lib/payments/provider'

// Define service prices (in cents)
const SERVICE_PRICES = {
  basic_consultation: 4900, // €49
  visa_application: 19900, // €199
  premium_support: 39900, // €399
  denklik_service: 14900, // €149
  job_match_service: 9900, // €99
  document_review: 2900, // €29
  appointment_booking: 3900, // €39
  express_service: 9900, // €99 (additional)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      provider = 'stripe',
      serviceType,
      applicationId,
      currency = 'EUR',
      customAmount,
      returnUrl,
      cancelUrl
    } = body

    // Validate required fields
    if (!serviceType && !customAmount) {
      return NextResponse.json(
        { error: 'Service type or custom amount is required' },
        { status: 400 }
      )
    }

    if (!returnUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Return and cancel URLs are required' },
        { status: 400 }
      )
    }

    // Determine amount
    const amount = customAmount || SERVICE_PRICES[serviceType as keyof typeof SERVICE_PRICES]
    if (!amount) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('user_id', user.id)
      .single()

    // Create payment record in database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        application_id: applicationId,
        amount,
        currency,
        status: 'pending',
        payment_type: serviceType || 'custom',
        payment_method: provider,
        metadata: {
          service_type: serviceType,
          user_email: profile?.email || user.email,
          user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
        }
      })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    // Create payment with provider
    const paymentResult = await createPayment({
      provider: provider as PaymentProvider,
      amount: { amount, currency },
      userId: user.id,
      applicationId,
      description: `Visa Assist - ${serviceType || 'Service Payment'}`,
      returnUrl: `${returnUrl}?payment_id=${paymentRecord.id}`,
      cancelUrl: `${cancelUrl}?payment_id=${paymentRecord.id}`,
      metadata: {
        payment_record_id: paymentRecord.id,
        service_type: serviceType
      }
    })

    // Update payment record with provider details
    await supabase
      .from('payments')
      .update({
        provider_payment_id: paymentResult.paymentId,
        provider_data: {
          client_secret: paymentResult.clientSecret,
          approval_url: paymentResult.approvalUrl
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id)

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'payment',
        entity_id: paymentRecord.id,
        action: 'payment_initiated',
        details: {
          provider,
          amount,
          currency,
          service_type: serviceType
        }
      })

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        provider,
        amount,
        currency,
        clientSecret: paymentResult.clientSecret,
        approvalUrl: paymentResult.approvalUrl,
        paymentId: paymentResult.paymentId
      }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// GET - Get payment status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const providerPaymentId = searchParams.get('provider_payment_id')

    if (!paymentId && !providerPaymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)

    if (paymentId) {
      query = query.eq('id', paymentId)
    } else if (providerPaymentId) {
      query = query.eq('provider_payment_id', providerPaymentId)
    }

    const { data: payment, error } = await query.single()

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      payment
    })

  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}