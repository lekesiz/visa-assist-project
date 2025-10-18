import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmPayment, PaymentProvider } from '@/lib/payments/provider'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, providerPaymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    if (paymentRecord.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Payment already completed',
        payment: paymentRecord
      })
    }

    // Confirm with payment provider
    const result = await confirmPayment(
      paymentRecord.payment_method as PaymentProvider,
      providerPaymentId || paymentRecord.provider_payment_id
    )

    // Update payment record
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: result.status,
        provider_data: {
          ...paymentRecord.provider_data,
          confirmation: result
        },
        confirmed_at: result.status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // If payment completed, update application
    if (result.status === 'completed' && paymentRecord.application_id) {
      await supabase
        .from('applications')
        .update({
          payment_status: 'paid',
          is_premium: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.application_id)
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'payment',
        entity_id: paymentId,
        action: result.status === 'completed' ? 'payment_completed' : 'payment_updated',
        details: {
          status: result.status,
          provider: paymentRecord.payment_method
        }
      })

    // Send confirmation email if completed
    if (result.status === 'completed') {
      // TODO: Trigger email service
      console.log('Payment completed, should send confirmation email')
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      status: result.status
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}