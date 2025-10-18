'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'

interface PayPalCheckoutProps {
  amount: number
  currency: string
  description: string
  onSuccess: (orderId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

export default function PayPalCheckout({ 
  amount, 
  currency, 
  description, 
  onSuccess, 
  onError,
  onCancel
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    // In production, you would load the PayPal SDK here
    // const script = document.createElement('script')
    // script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}`
    // script.async = true
    // document.body.appendChild(script)
    
    // return () => {
    //   document.body.removeChild(script)
    // }
  }, [currency])

  const handlePayPalClick = async () => {
    setLoading(true)

    try {
      if (DemoService.isDemoMode()) {
        // Demo mode - simulate PayPal redirect
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Show approval simulation
        setApproving(true)
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Simulate success
        onSuccess('demo_paypal_order_' + Date.now())
      } else {
        // Create PayPal order
        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount,
            currency,
            description
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create PayPal order')
        }

        const { orderId, approvalUrl } = await response.json()
        
        // In production, you would either:
        // 1. Redirect to PayPal
        // window.location.href = approvalUrl
        
        // 2. Or use PayPal SDK buttons
        // paypal.Buttons({
        //   createOrder: () => orderId,
        //   onApprove: async (data) => {
        //     // Capture the order
        //     const captureResponse = await fetch('/api/paypal/capture-order', {
        //       method: 'POST',
        //       headers: { 'Content-Type': 'application/json' },
        //       body: JSON.stringify({ orderId: data.orderID })
        //     })
        //     
        //     if (captureResponse.ok) {
        //       onSuccess(data.orderID)
        //     } else {
        //       throw new Error('Failed to capture payment')
        //     }
        //   },
        //   onError: (err) => {
        //     onError(err.message)
        //   }
        // }).render('#paypal-button-container')
        
        // For now, simulate the flow
        setApproving(true)
      }
    } catch (error: any) {
      onError(error.message || 'PayPal payment failed')
      setLoading(false)
      setApproving(false)
    }
  }

  const handleSimulatedApproval = async (approved: boolean) => {
    if (approved) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSuccess('demo_paypal_approved_' + Date.now())
    } else {
      setApproving(false)
      setLoading(false)
    }
  }

  if (approving) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">PayPal Payment</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          {DemoService.isDemoMode() ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Approve Payment</h3>
                <p className="text-gray-600 mb-4">
                  Simulate PayPal payment approval for €{amount.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => handleSimulatedApproval(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleSimulatedApproval(true)}>
                  Approve Payment
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Redirecting to PayPal...</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PayPal Checkout</CardTitle>
        <CardDescription>
          Pay securely with your PayPal account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount to pay:</span>
            <span className="text-2xl font-bold">
              {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}
              {amount.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* PayPal Benefits */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Buyer Protection</p>
              <p className="text-sm text-gray-600">
                Get a full refund if your eligible order doesn't arrive
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Secure Payment</p>
              <p className="text-sm text-gray-600">
                We don't share your financial information with sellers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Multiple Payment Options</p>
              <p className="text-sm text-gray-600">
                Pay with PayPal balance, bank account, or credit card
              </p>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {DemoService.isDemoMode() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> Click the PayPal button to simulate a payment.
            </AlertDescription>
          </Alert>
        )}

        {/* PayPal Button Container */}
        <div id="paypal-button-container">
          <Button
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
            onClick={handlePayPalClick}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay with PayPal
                <ExternalLink className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Alternative Payment */}
        <div className="text-center">
          <Button
            variant="link"
            onClick={onCancel}
            disabled={loading}
            className="text-sm"
          >
            Choose a different payment method
          </Button>
        </div>

        {/* Trust Signals */}
        <div className="text-center text-xs text-gray-500">
          <p>Powered by PayPal secure payment technology</p>
        </div>
      </CardContent>
    </Card>
  )
}