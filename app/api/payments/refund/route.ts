import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// import { refundPayment, PaymentProvider } from '@/lib/payments/provider'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, amount, reason } = body

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
      .single()

    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify user owns this payment or is admin
    if (paymentRecord.user_id !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to refund this payment' },
          { status: 403 }
        )
      }
    }

    // Check payment status
    if (paymentRecord.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only refund completed payments' },
        { status: 400 }
      )
    }

    // Check if already refunded
    if (paymentRecord.status === 'refunded') {
      return NextResponse.json(
        { error: 'Payment already refunded' },
        { status: 400 }
      )
    }

    // Process refund with payment provider
    const refundResult = await refundPayment(
      paymentRecord.payment_method as PaymentProvider,
      paymentRecord.provider_payment_id,
      amount // Optional partial refund
    )

    // Update payment record
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_amount: refundResult.amount,
        refund_reason: reason,
        provider_data: {
          ...paymentRecord.provider_data,
          refund: refundResult
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // If linked to application, update status
    if (paymentRecord.application_id) {
      await supabase
        .from('applications')
        .update({
          payment_status: 'refunded',
          is_premium: false,
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
        action: 'payment_refunded',
        details: {
          refund_id: refundResult.refundId,
          amount: refundResult.amount,
          currency: refundResult.currency,
          reason,
          refunded_by: user.id
        }
      })

    // Create notification for user
    if (paymentRecord.user_id !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentRecord.user_id,
          type: 'payment_refunded',
          title: 'Payment Refunded',
          message: `Your payment of ${refundResult.amount / 100} ${refundResult.currency} has been refunded.`,
          data: {
            payment_id: paymentId,
            refund_amount: refundResult.amount,
            reason
          }
        })
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refundResult.refundId,
        amount: refundResult.amount,
        currency: refundResult.currency,
        status: refundResult.status,
        paymentId: paymentId
      },
      message: 'Payment refunded successfully'
    })

  } catch (error) {
    console.error('Payment refund error:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}