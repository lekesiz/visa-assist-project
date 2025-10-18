'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import StripeCheckout from './StripeCheckout'
import PayPalCheckout from './PayPalCheckout'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  amount: number
  currency: string
  description: string
  onSuccess: (paymentId: string, method: string) => void
}

type PaymentMethod = 'stripe' | 'paypal'

export default function PaymentModal({
  open,
  onClose,
  amount,
  currency,
  description,
  onSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = (paymentId: string) => {
    setSuccess(true)
    setProcessing(false)
    
    // Show success for 2 seconds then close
    setTimeout(() => {
      onSuccess(paymentId, paymentMethod)
      onClose()
      // Reset state
      setSuccess(false)
      setError(null)
    }, 2000)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setProcessing(false)
  }

  const handleCancel = () => {
    if (!processing) {
      onClose()
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600">
              Your payment of {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}
              {amount.toFixed(2)} has been processed successfully.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Complete Payment</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={processing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Choose your preferred payment method
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Method Selection */}
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Credit / Debit Card</span>
                  </div>
                  <div className="flex gap-2">
                    <img src="/visa.svg" alt="Visa" className="h-6" />
                    <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                    <img src="/amex.svg" alt="Amex" className="h-6" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pay securely with your credit or debit card
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/paypal-icon.svg" alt="PayPal" className="h-5 w-5" />
                    <span className="font-medium">PayPal</span>
                  </div>
                  <img src="/paypal-logo.svg" alt="PayPal" className="h-6" />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pay with your PayPal account or PayPal guest checkout
                </p>
              </Label>
            </div>
          </RadioGroup>

          {/* Payment Form */}
          <div className="mt-6">
            {paymentMethod === 'stripe' ? (
              <StripeCheckout
                amount={amount}
                currency={currency}
                description={description}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleCancel}
              />
            ) : (
              <PayPalCheckout
                amount={amount}
                currency={currency}
                description={description}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}