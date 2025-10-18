'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Clock,
  Users,
  FileText,
  Bot,
  CreditCard,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PricingPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  currency: string
  features: {
    text: string
    included: boolean
    highlight?: boolean
  }[]
  popular?: boolean
  buttonText: string
  icon: any
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with your visa journey',
    price: {
      monthly: 0,
      yearly: 0
    },
    currency: 'EUR',
    icon: FileText,
    features: [
      { text: '1 visa application', included: true },
      { text: 'Basic document checklist', included: true },
      { text: 'Email support', included: true },
      { text: 'Community forum access', included: true },
      { text: 'AI-powered assistance', included: false },
      { text: 'Priority processing', included: false },
      { text: 'Expert consultation', included: false },
      { text: 'Job matching service', included: false }
    ],
    buttonText: 'Get Started'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Everything you need for a successful visa application',
    price: {
      monthly: 29,
      yearly: 290
    },
    currency: 'EUR',
    icon: Zap,
    popular: true,
    features: [
      { text: '5 visa applications', included: true, highlight: true },
      { text: 'Advanced document analysis', included: true, highlight: true },
      { text: 'AI-powered assistance 24/7', included: true, highlight: true },
      { text: 'Priority email & chat support', included: true },
      { text: 'Appointment scheduling help', included: true },
      { text: 'Document translation credits (10)', included: true },
      { text: 'Job matching service', included: true },
      { text: 'Expert consultation (30 min)', included: false }
    ],
    buttonText: 'Start Free Trial'
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For professionals and families with complex needs',
    price: {
      monthly: 79,
      yearly: 790
    },
    currency: 'EUR',
    icon: Award,
    features: [
      { text: 'Unlimited visa applications', included: true, highlight: true },
      { text: 'White-glove support', included: true, highlight: true },
      { text: 'Dedicated account manager', included: true, highlight: true },
      { text: 'Expert consultation (2 hours/month)', included: true, highlight: true },
      { text: 'Express document processing', included: true },
      { text: 'Unlimited translations', included: true },
      { text: 'Priority job matching', included: true },
      { text: 'Family member accounts (up to 4)', included: true }
    ],
    buttonText: 'Contact Sales'
  }
]

const additionalFeatures = [
  {
    icon: Shield,
    title: 'Bank-level Security',
    description: 'Your data is encrypted and stored securely with GDPR compliance'
  },
  {
    icon: Globe,
    title: 'Multi-country Support',
    description: 'Expert guidance for visa applications to 50+ countries'
  },
  {
    icon: Clock,
    title: '24/7 AI Assistance',
    description: 'Get instant answers to your visa questions anytime'
  },
  {
    icon: Users,
    title: 'Expert Network',
    description: 'Access to immigration lawyers and visa consultants'
  }
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()

  const handleSelectPlan = (planId: string) => {
    if (planId === 'business') {
      router.push('/contact')
    } else {
      router.push(`/register?plan=${planId}`)
    }
  }

  const calculatePrice = (plan: PricingPlan) => {
    return billingPeriod === 'yearly' 
      ? Math.round(plan.price.yearly / 12)
      : plan.price.monthly
  }

  const calculateSavings = (plan: PricingPlan) => {
    const monthlyCost = plan.price.monthly * 12
    const yearlyCost = plan.price.yearly
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your visa journey. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'font-semibold' : ''}`}>
              Monthly
            </span>
            <Switch
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm ${billingPeriod === 'yearly' ? 'font-semibold' : ''}`}>
              Yearly
              <Badge className="ml-2" variant="secondary">Save up to 20%</Badge>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map(plan => {
            const Icon = plan.icon
            const savings = calculateSavings(plan)
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-blue-600 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        €{calculatePrice(plan)}
                      </span>
                      <span className="text-gray-500 ml-1">/{billingPeriod === 'yearly' ? 'mo' : 'month'}</span>
                    </div>
                    {billingPeriod === 'yearly' && plan.price.monthly > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {savings}% with yearly billing
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.buttonText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <div className="space-y-3 pt-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={`h-5 w-5 ${feature.highlight ? 'text-green-600' : 'text-gray-400'} mt-0.5`} />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mt-0.5" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? feature.highlight ? 'font-medium' : 'text-gray-700'
                            : 'text-gray-400'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Additional Features */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600">
              All plans include these essential features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((feature, idx) => {
              const Icon = feature.icon
              
              return (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
              and we'll prorate any payments.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.
              For business plans, we also accept bank transfers.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-gray-600">
              Yes! Premium plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">What if I need more applications?</h3>
            <p className="text-gray-600">
              You can purchase additional applications as needed, or upgrade to a higher plan.
              Business plans include unlimited applications.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Visa Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who have successfully obtained their visas with our help
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => router.push('/register')}
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}