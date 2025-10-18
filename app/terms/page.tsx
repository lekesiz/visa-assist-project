'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ScrollText,
  Scale,
  FileText,
  AlertTriangle,
  Ban,
  CreditCard,
  Shield,
  Globe,
  UserX,
  MessageSquare,
  Download,
  ExternalLink,
  CheckCircle2,
  Info,
  Lock
} from 'lucide-react'
import Link from 'next/link'

interface Section {
  id: string
  title: string
  icon: any
  content: string[]
}

const sections: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    icon: FileText,
    content: [
      'By accessing and using VisaAssist services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms").',
      'These Terms constitute a legally binding agreement between you and VisaAssist GmbH ("Company", "we", "us", or "our").',
      'If you are using our services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.',
      'We reserve the right to update these Terms at any time. We will notify you of significant changes via email or platform notification.',
      'Effective Date: January 1, 2024'
    ]
  },
  {
    id: 'services',
    title: '2. Description of Services',
    icon: Globe,
    content: [
      'VisaAssist provides an online platform for visa application assistance, including:',
      '• Document preparation guidance and checklists',
      '• AI-powered application review and error detection',
      '• Appointment scheduling assistance',
      '• Progress tracking and deadline reminders',
      '• Expert consultation services (premium plans)',
      '• Document translation services',
      '• Job search and matching services for work visa applicants',
      '',
      'Important Disclaimers:',
      '• We are NOT a law firm or government agency',
      '• We do NOT guarantee visa approval',
      '• Final visa decisions are made solely by embassies/consulates',
      '• We provide assistance and guidance, not legal advice',
      '• Users remain responsible for the accuracy of their applications'
    ]
  },
  {
    id: 'eligibility',
    title: '3. Eligibility and Account Registration',
    icon: UserX,
    content: [
      'To use our services, you must:',
      '• Be at least 18 years old (or have parental consent)',
      '• Provide accurate and complete registration information',
      '• Maintain the security of your account credentials',
      '• Notify us immediately of any unauthorized account use',
      '• Have the legal right to travel and apply for visas',
      '',
      'You may not:',
      '• Create multiple accounts',
      '• Share your account with others',
      '• Use false or misleading information',
      '• Impersonate another person or entity',
      '• Use our services for illegal purposes',
      '',
      'We reserve the right to suspend or terminate accounts that violate these requirements.'
    ]
  },
  {
    id: 'payment',
    title: '4. Payment Terms',
    icon: CreditCard,
    content: [
      'Subscription Plans:',
      '• Free Plan: Limited features, no payment required',
      '• Premium Plans: Monthly or annual subscriptions',
      '• Business Plans: Custom pricing for organizations',
      '',
      'Payment Policies:',
      '• All fees are in Euros (EUR) unless otherwise stated',
      '• Payments are processed securely through Stripe or PayPal',
      '• Subscriptions auto-renew unless cancelled',
      '• Prices may change with 30 days notice',
      '',
      'Refund Policy:',
      '• 14-day money-back guarantee for first-time subscribers',
      '• No refunds for partially used periods',
      '• Embassy/consulate fees are non-refundable',
      '• Refunds processed within 5-10 business days',
      '',
      'Additional Services:',
      '• Translation services: Charged per document',
      '• Expert consultations: Hourly rates apply',
      '• Express processing: Additional fees may apply'
    ]
  },
  {
    id: 'user-obligations',
    title: '5. User Obligations and Conduct',
    icon: Scale,
    content: [
      'You agree to:',
      '• Provide truthful and accurate information in all applications',
      '• Comply with all applicable laws and regulations',
      '• Respect intellectual property rights',
      '• Maintain confidentiality of other users\' information',
      '• Use our services only for lawful visa applications',
      '',
      'You agree NOT to:',
      '• Submit false or forged documents',
      '• Engage in visa fraud or misrepresentation',
      '• Hack, reverse engineer, or disrupt our services',
      '• Scrape or copy our content without permission',
      '• Harass or abuse our staff or other users',
      '• Use our platform for spam or commercial solicitation',
      '',
      'Violations may result in immediate account termination and legal action.'
    ]
  },
  {
    id: 'intellectual-property',
    title: '6. Intellectual Property',
    icon: Shield,
    content: [
      'VisaAssist Property:',
      '• All platform content, features, and functionality are owned by VisaAssist',
      '• This includes our logo, design, text, graphics, and software',
      '• You may not copy, modify, or distribute our property without permission',
      '',
      'Your Content:',
      '• You retain ownership of documents and information you upload',
      '• You grant us a license to use your content to provide our services',
      '• This includes storing, processing, and sharing with relevant authorities',
      '• You warrant that you have rights to all content you submit',
      '',
      'Feedback:',
      '• Any suggestions or feedback you provide becomes our property',
      '• We may use feedback to improve our services without compensation'
    ]
  },
  {
    id: 'privacy',
    title: '7. Privacy and Data Protection',
    icon: Lock,
    content: [
      'Your privacy is important to us. Our data practices include:',
      '• Collection and use of data as described in our Privacy Policy',
      '• GDPR-compliant data handling and storage',
      '• Encryption of sensitive information',
      '• Limited access to personal data',
      '• Right to data portability and deletion',
      '',
      'By using our services, you consent to:',
      '• Our Privacy Policy and data practices',
      '• Transfer of data to countries where we operate',
      '• Communication about your applications and our services',
      '',
      'Please review our Privacy Policy for detailed information.'
    ]
  },
  {
    id: 'disclaimer',
    title: '8. Disclaimers and Limitations',
    icon: AlertTriangle,
    content: [
      'Service Disclaimers:',
      '• Services provided "AS IS" without warranties',
      '• No guarantee of visa approval or specific outcomes',
      '• No warranty of uninterrupted or error-free service',
      '• Information provided is for guidance only, not legal advice',
      '',
      'Limitation of Liability:',
      '• Our liability is limited to the amount you paid for services',
      '• We are not liable for visa rejections or delays',
      '• No liability for indirect, consequential, or punitive damages',
      '• Not responsible for third-party services or embassy decisions',
      '',
      'Force Majeure:',
      '• Not liable for delays due to circumstances beyond our control',
      '• This includes natural disasters, wars, pandemics, or government actions'
    ]
  },
  {
    id: 'indemnification',
    title: '9. Indemnification',
    icon: Shield,
    content: [
      'You agree to indemnify and hold VisaAssist harmless from any claims arising from:',
      '• Your use of our services',
      '• Violation of these Terms',
      '• Violation of any laws or regulations',
      '• Infringement of third-party rights',
      '• False or misleading information in applications',
      '• Disputes with embassies, employers, or other parties',
      '',
      'This includes reasonable attorney fees and costs incurred in defense.'
    ]
  },
  {
    id: 'termination',
    title: '10. Termination',
    icon: Ban,
    content: [
      'Account Termination:',
      '• You may cancel your account at any time',
      '• We may terminate accounts for Terms violations',
      '• Termination does not affect prior obligations',
      '',
      'Effects of Termination:',
      '• Access to services will cease immediately',
      '• Pending applications should be completed elsewhere',
      '• Data retention subject to our Privacy Policy',
      '• No refunds for unused subscription periods',
      '',
      'Survival:',
      '• Certain provisions survive termination',
      '• Including intellectual property, indemnification, and limitations'
    ]
  },
  {
    id: 'governing-law',
    title: '11. Governing Law and Disputes',
    icon: Scale,
    content: [
      'Legal Framework:',
      '• These Terms are governed by German law',
      '• Exclusive jurisdiction of Berlin courts',
      '• UN Convention on Contracts excluded',
      '',
      'Dispute Resolution:',
      '• First attempt: Direct negotiation',
      '• Second step: Mediation in Berlin',
      '• Final resort: Litigation in Berlin courts',
      '• Each party bears own legal costs unless otherwise ordered',
      '',
      'Class Action Waiver:',
      '• Disputes must be brought individually',
      '• No class or representative actions permitted'
    ]
  },
  {
    id: 'contact',
    title: '12. Contact Information',
    icon: MessageSquare,
    content: [
      'For questions about these Terms, contact us at:',
      '',
      'VisaAssist GmbH',
      'Legal Department',
      'Friedrichstraße 123',
      '10117 Berlin, Germany',
      '',
      'Email: legal@visa-assist.com',
      'Phone: +49 30 123 456 789',
      '',
      'For general support: support@visa-assist.com',
      'For privacy concerns: privacy@visa-assist.com'
    ]
  }
]

export default function TermsOfServicePage() {
  const handleDownloadTerms = () => {
    // In production, this would download a PDF version
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Please read these terms carefully before using VisaAssist services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleDownloadTerms} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Legal Team
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Points Summary */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Alert className="mb-8">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Key Points Summary:</strong> VisaAssist provides visa application assistance but is not a law firm. 
              We do not guarantee visa approval. By using our services, you agree to provide accurate information and 
              comply with all applicable laws. Please read the full terms below.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <ScrollText className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Service Agreement</h3>
                <p className="text-sm text-gray-600">
                  Legally binding terms for using our platform
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Ban className="h-8 w-8 text-red-600 mb-3" />
                <h3 className="font-semibold mb-2">Not Legal Advice</h3>
                <p className="text-sm text-gray-600">
                  We provide guidance, not legal representation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CreditCard className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">Clear Pricing</h3>
                <p className="text-sm text-gray-600">
                  Transparent fees with 14-day guarantee
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Your Rights</h3>
                <p className="text-sm text-gray-600">
                  Data protection and privacy guaranteed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Table of Contents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <Card key={section.id} id={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-gray max-w-none">
                    {section.content.map((paragraph, idx) => (
                      <p key={idx} className="text-gray-600 mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Agreement Section */}
          <Card className="mt-12 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center">Your Agreement</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-700 mb-6">
                By creating an account or using VisaAssist services, you acknowledge that you have 
                read, understood, and agree to be bound by these Terms of Service.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link href="/register">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    I Agree - Create Account
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    Return to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Last updated: January 1, 2024</p>
            <p>Version 2.0</p>
          </div>
        </div>
      </section>
    </div>
  )
}