'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield,
  Lock,
  Eye,
  UserCheck,
  Globe,
  FileText,
  Mail,
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Clock
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
    id: 'overview',
    title: '1. Overview',
    icon: FileText,
    content: [
      'VisaAssist ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our visa assistance platform.',
      'By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.',
      'This policy applies to all information collected through our website, mobile applications, and any related services, sales, marketing, or events.',
      'Last updated: January 2024'
    ]
  },
  {
    id: 'information-collection',
    title: '2. Information We Collect',
    icon: Eye,
    content: [
      'We collect information you provide directly to us:',
      '• Personal Information: Name, email address, phone number, date of birth, nationality, passport information',
      '• Application Data: Visa type, destination country, travel dates, purpose of visit, employment history, education details',
      '• Documents: Passport copies, photographs, financial statements, employment letters, and other supporting documents',
      '• Payment Information: Credit card details, billing address (processed securely through our payment partners)',
      '• Communication Data: Messages, support tickets, and feedback you send to us',
      '',
      'We automatically collect certain information:',
      '• Device Information: IP address, browser type, operating system, device identifiers',
      '• Usage Data: Pages visited, features used, time spent on the platform, click data',
      '• Location Data: Approximate location based on IP address',
      '• Cookies and Similar Technologies: Session cookies, preference cookies, and analytics cookies'
    ]
  },
  {
    id: 'information-use',
    title: '3. How We Use Your Information',
    icon: UserCheck,
    content: [
      'We use the information we collect to:',
      '• Provide and maintain our visa assistance services',
      '• Process your visa applications and related documents',
      '• Communicate with you about your applications and our services',
      '• Send appointment reminders and important updates',
      '• Process payments and prevent fraudulent transactions',
      '• Improve and personalize your experience on our platform',
      '• Analyze usage patterns and optimize our services',
      '• Comply with legal obligations and enforce our terms of service',
      '• Protect against security threats and abuse',
      '',
      'With your consent, we may also:',
      '• Send promotional emails about new features, services, or offers',
      '• Share success stories (anonymized) for marketing purposes',
      '• Use your feedback for testimonials (with explicit permission)'
    ]
  },
  {
    id: 'information-sharing',
    title: '4. Information Sharing and Disclosure',
    icon: Globe,
    content: [
      'We do not sell, trade, or rent your personal information. We may share your information in the following situations:',
      '',
      'With Service Providers:',
      '• Cloud storage providers for secure data storage',
      '• Payment processors for transaction handling',
      '• Email service providers for communication',
      '• Analytics providers to improve our services',
      '• Customer support tools to assist you better',
      '',
      'For Legal Reasons:',
      '• To comply with legal obligations, court orders, or government requests',
      '• To protect our rights, property, and safety, or that of others',
      '• To investigate and prevent fraud or security issues',
      '',
      'With Your Consent:',
      '• When you explicitly authorize us to share information',
      '• With immigration consultants or lawyers you choose to work with',
      '• For visa application purposes with relevant embassies/consulates (only with your approval)',
      '',
      'Business Transfers:',
      '• In case of merger, acquisition, or sale of assets, your information may be transferred'
    ]
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    icon: Lock,
    content: [
      'We implement robust security measures to protect your information:',
      '• Encryption: All data is encrypted in transit (TLS/SSL) and at rest (AES-256)',
      '• Access Controls: Strict authentication and authorization for data access',
      '• Regular Security Audits: Periodic assessments and penetration testing',
      '• Secure Infrastructure: Cloud servers with industry-standard security certifications',
      '• Employee Training: Regular privacy and security training for all staff',
      '• Incident Response: Established procedures for security breach management',
      '',
      'Despite our efforts, no security system is impenetrable. We cannot guarantee absolute security but commit to promptly notifying you of any breaches affecting your personal data.'
    ]
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    icon: Clock,
    content: [
      'We retain your information for as long as necessary to provide our services and comply with legal obligations:',
      '• Active Account Data: Retained while your account is active',
      '• Application Records: Kept for 5 years after visa decision for reference',
      '• Financial Records: Retained for 7 years as required by law',
      '• Communication Logs: Kept for 2 years for quality and training purposes',
      '• Marketing Data: Until you unsubscribe or request deletion',
      '',
      'You can request deletion of your data at any time, subject to legal retention requirements. We will delete or anonymize your information within 30 days of a valid request.'
    ]
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    icon: Shield,
    content: [
      'Under GDPR and other privacy laws, you have the following rights:',
      '• Access: Request a copy of your personal data',
      '• Rectification: Correct inaccurate or incomplete data',
      '• Erasure: Request deletion of your data ("right to be forgotten")',
      '• Portability: Receive your data in a portable format',
      '• Restriction: Limit how we process your data',
      '• Objection: Object to certain processing activities',
      '• Withdraw Consent: Revoke previously given consent',
      '',
      'To exercise these rights, contact us at privacy@visa-assist.com. We will respond within 30 days.',
      '',
      'You also have the right to lodge a complaint with your local data protection authority if you believe we have violated your privacy rights.'
    ]
  },
  {
    id: 'cookies',
    title: '8. Cookies and Tracking',
    icon: Globe,
    content: [
      'We use cookies and similar technologies to:',
      '• Maintain your session and remember preferences',
      '• Analyze site traffic and usage patterns',
      '• Personalize content and advertisements',
      '• Detect and prevent fraud',
      '',
      'Types of cookies we use:',
      '• Essential Cookies: Required for basic site functionality',
      '• Analytics Cookies: Help us understand how users interact with our site',
      '• Preference Cookies: Remember your settings and choices',
      '• Marketing Cookies: Used to deliver relevant advertisements',
      '',
      'You can control cookies through your browser settings. Disabling certain cookies may limit functionality.'
    ]
  },
  {
    id: 'international',
    title: '9. International Data Transfers',
    icon: Globe,
    content: [
      'Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.',
      '',
      'We ensure appropriate safeguards are in place:',
      '• Standard Contractual Clauses approved by the European Commission',
      '• Adequacy decisions for transfers to certain countries',
      '• Your explicit consent for specific transfers',
      '',
      'Our primary data centers are located in Germany (EU) to ensure GDPR compliance.'
    ]
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    icon: UserCheck,
    content: [
      'Our services are not directed to children under 18. We do not knowingly collect personal information from children.',
      '',
      'If you are under 18, you may only use our services with parental consent and supervision. Parents/guardians are responsible for monitoring their children\'s use of our platform.',
      '',
      'If we discover we have collected information from a child without parental consent, we will delete it immediately.'
    ]
  },
  {
    id: 'contact',
    title: '11. Contact Information',
    icon: Mail,
    content: [
      'For privacy-related questions or to exercise your rights, contact us at:',
      '',
      'Email: privacy@visa-assist.com',
      'Phone: +49 30 123 456 789',
      'Address: VisaAssist GmbH, Friedrichstraße 123, 10117 Berlin, Germany',
      '',
      'Data Protection Officer:',
      'Dr. Anna Schmidt',
      'Email: dpo@visa-assist.com',
      '',
      'We aim to resolve all privacy concerns promptly and transparently.'
    ]
  }
]

export default function PrivacyPolicyPage() {
  const handleDownloadPolicy = () => {
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
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleDownloadPolicy} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                <Mail className="h-4 w-4 mr-2" />
                Contact Privacy Team
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">GDPR Compliant</h3>
                <p className="text-sm text-gray-600">
                  We fully comply with European data protection regulations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Lock className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Bank-Level Security</h3>
                <p className="text-sm text-gray-600">
                  Your data is encrypted with industry-standard AES-256 encryption
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <UserCheck className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Your Rights</h3>
                <p className="text-sm text-gray-600">
                  Access, correct, or delete your data at any time
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Policy Content */}
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

          {/* Policy Sections */}
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

          {/* Updates Notice */}
          <Alert className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Policy Updates:</strong> We may update this privacy policy from time to time. 
              We will notify you of any material changes by email or through a notice on our platform. 
              Your continued use of our services after changes indicates acceptance of the updated policy.
            </AlertDescription>
          </Alert>

          {/* Compliance Badges */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">Compliance & Certifications</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                GDPR Compliant
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                ISO 27001
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                SOC 2 Type II
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}