'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCcw,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DemoService } from '@/lib/demo/demo-service'

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired' | 'already-verified'

function VerifyEmailContent() {
  const [status, setStatus] = useState<VerificationStatus>('verifying')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const type = searchParams.get('type') || 'signup'

  useEffect(() => {
    if (token && type) {
      verifyEmail()
    } else {
      setStatus('error')
      setMessage('Invalid verification link')
    }
  }, [token, type])

  async function verifyEmail() {
    try {
      if (DemoService.isDemoMode()) {
        // Simulate verification in demo mode
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate different outcomes
        if (token === 'expired') {
          setStatus('expired')
          setMessage('This verification link has expired. Please request a new one.')
        } else if (token === 'already-verified') {
          setStatus('already-verified')
          setMessage('Your email has already been verified.')
        } else {
          setStatus('success')
          setMessage('Your email has been successfully verified!')
        }
      } else {
        // Real Supabase verification
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        })

        if (error) {
          if (error.message.includes('expired')) {
            setStatus('expired')
            setMessage('This verification link has expired. Please request a new one.')
          } else if (error.message.includes('already verified')) {
            setStatus('already-verified')
            setMessage('Your email has already been verified.')
          } else {
            setStatus('error')
            setMessage(error.message || 'Failed to verify email')
          }
        } else {
          setStatus('success')
          setMessage('Your email has been successfully verified!')
        }
      }
    } catch (error) {
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
    }
  }

  async function resendVerification() {
    if (!email) return

    try {
      setResending(true)

      if (DemoService.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        setMessage('A new verification email has been sent. Please check your inbox.')
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email
        })

        if (error) {
          throw error
        }

        setMessage('A new verification email has been sent. Please check your inbox.')
      }
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Verifying your email...</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={() => router.push('/dashboard')}
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Link Expired</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {email && (
              <Button 
                onClick={resendVerification}
                disabled={resending}
                size="lg"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
          </div>
        )

      case 'already-verified':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Already Verified</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={() => router.push('/login')}
              size="lg"
            >
              Go to Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              {email && (
                <Button 
                  onClick={resendVerification}
                  disabled={resending}
                  variant="outline"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Resend Verification
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={() => router.push('/contact')}
                variant="outline"
              >
                Contact Support
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            Confirming your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}

          {(status === 'expired' || status === 'error') && (
            <Alert className="mt-6">
              <AlertDescription>
                <strong>Need help?</strong> If you're having trouble verifying your email, 
                please contact our support team at support@visa-assist.com
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}