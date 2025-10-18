'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'

interface StripeCheckoutProps {
  amount: number
  currency: string
  description: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

interface CardDetails {
  number: string
  expMonth: string
  expYear: string
  cvc: string
  name: string
  postalCode: string
}

export default function StripeCheckout({ 
  amount, 
  currency, 
  description, 
  onSuccess, 
  onError,
  onCancel
}: StripeCheckoutProps) {
  const [processing, setProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
    postalCode: ''
  })
  const [errors, setErrors] = useState<Partial<CardDetails>>({})

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '')
    if (cleaned.length <= 16) {
      setCardDetails({ ...cardDetails, number: cleaned })
    }
  }

  const validateForm = () => {
    const newErrors: Partial<CardDetails> = {}

    if (!cardDetails.number || cardDetails.number.length < 13) {
      newErrors.number = 'Invalid card number'
    }

    if (!cardDetails.expMonth || !cardDetails.expYear) {
      newErrors.expMonth = 'Required'
    } else {
      const month = parseInt(cardDetails.expMonth)
      const year = parseInt(cardDetails.expYear)
      const currentYear = new Date().getFullYear() % 100
      const currentMonth = new Date().getMonth() + 1

      if (month < 1 || month > 12) {
        newErrors.expMonth = 'Invalid month'
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expMonth = 'Card expired'
      }
    }

    if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
      newErrors.cvc = 'Required'
    }

    if (!cardDetails.name.trim()) {
      newErrors.name = 'Required'
    }

    if (!cardDetails.postalCode.trim()) {
      newErrors.postalCode = 'Required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setProcessing(true)

    try {
      if (DemoService.isDemoMode()) {
        // Demo mode - simulate payment
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate success for test card numbers
        if (cardDetails.number === '4242424242424242') {
          onSuccess('demo_payment_intent_success')
        } else if (cardDetails.number === '4000000000000002') {
          throw new Error('Your card was declined.')
        } else {
          onSuccess(`demo_payment_intent_${Date.now()}`)
        }
      } else {
        // Real Stripe integration would go here
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            description
          })
        })

        if (!response.ok) {
          throw new Error('Payment failed')
        }

        const { clientSecret } = await response.json()
        
        // In a real implementation, you would use Stripe Elements here
        // For now, we'll simulate the payment
        onSuccess('real_payment_intent_id')
      }
    } catch (error: any) {
      onError(error.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
        <CardDescription>
          Enter your card details to complete the payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Display */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount to pay:</span>
              <span className="text-2xl font-bold">
                {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}
                {amount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>

          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                value={formatCardNumber(cardDetails.number)}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={errors.number ? 'border-red-500' : ''}
              />
              <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.number && (
              <p className="text-sm text-red-600 mt-1">{errors.number}</p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expMonth">Exp. Month</Label>
              <Input
                id="expMonth"
                type="text"
                placeholder="MM"
                maxLength={2}
                value={cardDetails.expMonth}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 2) {
                    setCardDetails({ ...cardDetails, expMonth: value })
                  }
                }}
                className={errors.expMonth ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="expYear">Exp. Year</Label>
              <Input
                id="expYear"
                type="text"
                placeholder="YY"
                maxLength={2}
                value={cardDetails.expYear}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 2) {
                    setCardDetails({ ...cardDetails, expYear: value })
                  }
                }}
                className={errors.expMonth ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                maxLength={4}
                value={cardDetails.cvc}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 4) {
                    setCardDetails({ ...cardDetails, cvc: value })
                  }
                }}
                className={errors.cvc ? 'border-red-500' : ''}
              />
            </div>
          </div>
          {(errors.expMonth || errors.cvc) && (
            <p className="text-sm text-red-600 -mt-2">
              {errors.expMonth || errors.cvc}
            </p>
          )}

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              type="text"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
              placeholder="John Doe"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Postal Code */}
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              type="text"
              value={cardDetails.postalCode}
              onChange={(e) => setCardDetails({ ...cardDetails, postalCode: e.target.value })}
              placeholder="12345"
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && (
              <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>
            )}
          </div>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-4 py-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Encrypted</span>
            </div>
          </div>

          {/* Demo Mode Notice */}
          {DemoService.isDemoMode() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Mode:</strong> Use card number 4242 4242 4242 4242 with any future date and CVC.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay €{amount.toFixed(2)}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Your payment information is encrypted and secure.</p>
            <p>We never store your card details.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}