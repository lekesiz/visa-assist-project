'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Headphones,
  Calendar,
  Globe,
  Users,
  Sparkles
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'

interface ContactInfo {
  icon: any
  title: string
  content: string
  action?: {
    label: string
    href: string
  }
}

interface ContactReason {
  id: string
  label: string
  description: string
}

const contactInfo: ContactInfo[] = [
  {
    icon: Mail,
    title: 'Email Support',
    content: 'support@visa-assist.com',
    action: {
      label: 'Send Email',
      href: 'mailto:support@visa-assist.com'
    }
  },
  {
    icon: Phone,
    title: 'Phone Support',
    content: '+49 30 123 456 789',
    action: {
      label: 'Call Now',
      href: 'tel:+493012345789'
    }
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    content: 'Available 24/7',
    action: {
      label: 'Start Chat',
      href: '#'
    }
  },
  {
    icon: MapPin,
    title: 'Office Location',
    content: 'Friedrichstraße 123, 10117 Berlin, Germany',
    action: {
      label: 'Get Directions',
      href: 'https://maps.google.com'
    }
  }
]

const contactReasons: ContactReason[] = [
  {
    id: 'general',
    label: 'General Inquiry',
    description: 'Questions about our services'
  },
  {
    id: 'technical',
    label: 'Technical Support',
    description: 'Platform or account issues'
  },
  {
    id: 'visa',
    label: 'Visa Consultation',
    description: 'Specific visa application questions'
  },
  {
    id: 'billing',
    label: 'Billing & Payments',
    description: 'Payment or subscription issues'
  },
  {
    id: 'partnership',
    label: 'Partnership',
    description: 'Business collaboration inquiries'
  },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Share your experience or suggestions'
  }
]

const supportHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM CET' },
  { day: 'Saturday', hours: '10:00 AM - 4:00 PM CET' },
  { day: 'Sunday', hours: 'Emergency support only' }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: 'general',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (DemoService.isDemoMode()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          reason: 'general',
          subject: '',
          message: ''
        })
      } else {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          reason: 'general',
          subject: '',
          message: ''
        })
      }
    } catch (err) {
      setError('Failed to send your message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4">Get in Touch</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            We're Here to Help
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about your visa application? Our expert team is ready to assist you.
            Choose your preferred way to connect with us.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{info.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{info.content}</p>
                    {info.action && (
                      <a
                        href={info.action.href}
                        className="text-blue-600 text-sm font-medium hover:underline"
                        target={info.action.href.startsWith('http') ? '_blank' : undefined}
                        rel={info.action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {info.action.label} →
                      </a>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {success && (
                    <Alert className="mb-6 bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your message has been sent successfully! We'll respond within 24 hours.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert className="mb-6 bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+49 123 456 7890"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reason">Contact Reason *</Label>
                        <select
                          id="reason"
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          {contactReasons.map(reason => (
                            <option key={reason.id} value={reason.id}>
                              {reason.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        placeholder="Please provide details about your inquiry..."
                        rows={6}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Support Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Support Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {supportHours.map((schedule, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{schedule.day}</span>
                      <span className="font-medium">{schedule.hours}</span>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Live Chat:</strong> Available 24/7 for urgent matters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Quick Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href="/faq" className="flex items-center gap-2 text-sm hover:text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                    Frequently Asked Questions
                  </a>
                  <a href="/pricing" className="flex items-center gap-2 text-sm hover:text-blue-600">
                    <Users className="h-4 w-4" />
                    Pricing & Plans
                  </a>
                  <a href="/about" className="flex items-center gap-2 text-sm hover:text-blue-600">
                    <Globe className="h-4 w-4" />
                    About VisaAssist
                  </a>
                  <a href="#" className="flex items-center gap-2 text-sm hover:text-blue-600">
                    <Calendar className="h-4 w-4" />
                    Schedule Consultation
                  </a>
                </CardContent>
              </Card>

              {/* Emergency Support */}
              <Alert className="border-orange-200 bg-orange-50">
                <Headphones className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong className="text-orange-800">Need Urgent Help?</strong>
                  <p className="text-sm mt-1 text-orange-700">
                    For emergency visa matters, call our 24/7 hotline:
                    <br />
                    <a href="tel:+498001234567" className="font-medium">
                      +49 800 123 4567
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Visit Our Office</h2>
            <p className="text-lg text-gray-600">
              Prefer a face-to-face consultation? Visit us at our Berlin headquarters
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4" />
                <p>Interactive map will be displayed here</p>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Berlin Headquarters</h3>
                  <div className="space-y-3 text-sm">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      Friedrichstraße 123, 10117 Berlin, Germany
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      +49 30 123 456 789
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      office@visa-assist.com
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Public Transport:</strong> U-Bahn U6 Friedrichstraße, 
                      S-Bahn S1/S2/S25/S26 Friedrichstraße
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>COVID-19 Notice:</strong> In-person consultations require 
                  advance booking. Please call ahead to schedule your visit.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}