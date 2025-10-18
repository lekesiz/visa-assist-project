import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DemoService } from '@/lib/demo/demo-service'

// In production, you would import Stripe here
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16'
// })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, currency, description, metadata } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      )
    }

    // Demo mode
    if (DemoService.isDemoMode() || !process.env.STRIPE_SECRET_KEY) {
      // Return mock payment intent
      return NextResponse.json({
        clientSecret: 'demo_secret_' + Date.now(),
        paymentIntentId: 'demo_pi_' + Date.now(),
        amount,
        currency
      })
    }

    // Production mode - create real payment intent
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount), // Amount in cents
    //   currency: currency.toLowerCase(),
    //   description,
    //   metadata: {
    //     userId: user.id,
    //     ...metadata
    //   },
    //   automatic_payment_methods: {
    //     enabled: true
    //   }
    // })

    // // Store payment intent in database
    // await supabase.from('payments').insert({
    //   user_id: user.id,
    //   payment_intent_id: paymentIntent.id,
    //   amount: amount / 100, // Convert back to currency units
    //   currency: currency.toUpperCase(),
    //   status: 'pending',
    //   description,
    //   metadata
    // })

    // return NextResponse.json({
    //   clientSecret: paymentIntent.client_secret,
    //   paymentIntentId: paymentIntent.id
    // })

    // For now, return mock response
    return NextResponse.json({
      clientSecret: 'prod_secret_' + Date.now(),
      paymentIntentId: 'prod_pi_' + Date.now(),
      amount,
      currency
    })

  } catch (error) {
    console.error('Stripe payment intent error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create payment intent'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}