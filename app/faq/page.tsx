'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  FileQuestion,
  CreditCard,
  Globe,
  Shield,
  Clock,
  MessageSquare,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Briefcase,
  TrendingUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FAQItem {
  question: string
  answer: string
  category: string
  helpful?: number
}

interface FAQCategory {
  id: string
  name: string
  icon: any
  description: string
}

const categories: FAQCategory[] = [
  {
    id: 'general',
    name: 'General Questions',
    icon: HelpCircle,
    description: 'Basic information about our services'
  },
  {
    id: 'visa',
    name: 'Visa Applications',
    icon: FileQuestion,
    description: 'Visa types, requirements, and processes'
  },
  {
    id: 'payment',
    name: 'Pricing & Payment',
    icon: CreditCard,
    description: 'Plans, fees, and payment methods'
  },
  {
    id: 'technical',
    name: 'Technical Support',
    icon: Globe,
    description: 'Platform usage and troubleshooting'
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    icon: Shield,
    description: 'Data protection and security measures'
  },
  {
    id: 'process',
    name: 'Process & Timeline',
    icon: Clock,
    description: 'Application timelines and procedures'
  }
]

const faqData: FAQItem[] = [
  // General Questions
  {
    question: 'What is VisaAssist and how does it work?',
    answer: 'VisaAssist is an AI-powered platform that simplifies visa applications for Turkish citizens. We guide you through the entire process, from document preparation to submission, using smart technology to ensure accuracy and increase your chances of approval. Simply create an account, choose your destination country, and follow our step-by-step guidance.',
    category: 'general',
    helpful: 145
  },
  {
    question: 'Which countries do you support?',
    answer: 'We currently support visa applications for over 50 countries including Germany, USA, Canada, UK, France, Netherlands, Australia, and many more. Our coverage includes tourist visas, work visas, student visas, and family reunification visas. Check our destination page for the full list of supported countries.',
    category: 'general',
    helpful: 89
  },
  {
    question: 'Is VisaAssist an official government service?',
    answer: 'No, VisaAssist is not a government service. We are a private company that helps simplify the visa application process. We provide guidance, document assistance, and application support, but the final visa decision is always made by the respective embassy or consulate.',
    category: 'general',
    helpful: 67
  },

  // Visa Applications
  {
    question: 'What documents do I need for a German work visa?',
    answer: 'For a German work visa, you typically need: 1) Valid passport, 2) Job contract or offer letter, 3) University diplomas and certificates, 4) CV/Resume, 5) Proof of accommodation in Germany, 6) Health insurance coverage, 7) Financial proof, 8) Completed visa application form. Our platform will provide a personalized checklist based on your specific situation.',
    category: 'visa',
    helpful: 234
  },
  {
    question: 'How long does the visa application process take?',
    answer: 'Processing times vary by country and visa type. Tourist visas typically take 2-4 weeks, work visas 4-8 weeks, and student visas 4-12 weeks. These are average times and can vary based on individual circumstances and embassy workload. We provide real-time updates on expected processing times for each destination.',
    category: 'visa',
    helpful: 178
  },
  {
    question: 'Can VisaAssist guarantee visa approval?',
    answer: 'No service can guarantee visa approval as the final decision rests with the embassy or consulate. However, our AI-powered system significantly increases your chances by ensuring your application is complete, accurate, and properly presented. We have a 95% success rate for applications that follow our complete guidance.',
    category: 'visa',
    helpful: 156
  },

  // Pricing & Payment
  {
    question: 'What are your pricing plans?',
    answer: 'We offer three plans: 1) Free Plan - 1 visa application with basic features, 2) Premium Plan (€29/month) - 5 applications with AI assistance and priority support, 3) Business Plan (€79/month) - Unlimited applications with dedicated support. All plans include document checklists and application tracking.',
    category: 'payment',
    helpful: 201
  },
  {
    question: 'Are embassy fees included in your pricing?',
    answer: 'No, embassy/consulate fees are separate from our service fees. Our pricing covers only the VisaAssist platform services. You will need to pay the official visa fees directly to the embassy or consulate. We clearly indicate all official fees during the application process.',
    category: 'payment',
    helpful: 145
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for business accounts. All payments are processed securely through Stripe or PayPal, ensuring your financial information is protected.',
    category: 'payment',
    helpful: 98
  },

  // Technical Support
  {
    question: 'How do I upload documents to the platform?',
    answer: 'Simply click the "Upload Document" button in your application dashboard. You can drag and drop files or browse to select them. We accept PDF, JPG, PNG formats up to 10MB per file. The platform will automatically check document quality and alert you if any issues are detected.',
    category: 'technical',
    helpful: 87
  },
  {
    question: 'Can I save my application and continue later?',
    answer: 'Yes, all your progress is automatically saved as you work. You can leave and return to your application at any time. For premium users, we also send reminders if you have incomplete applications to ensure you don\'t miss important deadlines.',
    category: 'technical',
    helpful: 76
  },
  {
    question: 'Is the platform available in Turkish?',
    answer: 'Yes, VisaAssist is fully available in Turkish, English, German, and French. You can change the language from the settings menu or the language selector at the top of the page. All our support is also available in these languages.',
    category: 'technical',
    helpful: 92
  },

  // Security & Privacy
  {
    question: 'How do you protect my personal data?',
    answer: 'We use bank-level encryption (AES-256) to protect all data. Your documents are stored in secure, encrypted servers in Germany. We are fully GDPR compliant and never share your information with third parties without your explicit consent. You can delete your data at any time from your account settings.',
    category: 'security',
    helpful: 167
  },
  {
    question: 'Who has access to my documents?',
    answer: 'Only you and our authorized support staff (when you request help) can access your documents. All staff members sign strict confidentiality agreements. Documents are automatically deleted 90 days after your visa decision unless you choose to keep them for future applications.',
    category: 'security',
    helpful: 134
  },

  // Process & Timeline
  {
    question: 'What happens after I submit my application?',
    answer: 'After submission: 1) You\'ll receive a confirmation email, 2) We\'ll review your application within 24 hours, 3) If everything is correct, we\'ll guide you on embassy submission, 4) You\'ll get appointment booking assistance, 5) We track your application and notify you of any updates until you receive your visa decision.',
    category: 'process',
    helpful: 189
  },
  {
    question: 'Can I track my application status?',
    answer: 'Yes, you can track your application in real-time from your dashboard. We provide updates at each stage: document collection, review, embassy submission, and decision. You\'ll also receive email and SMS notifications for important updates.',
    category: 'process',
    helpful: 156
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [helpfulVotes, setHelpfulVotes] = useState<{[key: string]: boolean}>({})
  const router = useRouter()

  const toggleExpanded = (question: string) => {
    setExpandedItems(prev => 
      prev.includes(question) 
        ? prev.filter(q => q !== question)
        : [...prev, question]
    )
  }

  const handleHelpfulVote = (question: string, isHelpful: boolean) => {
    setHelpfulVotes(prev => ({ ...prev, [question]: isHelpful }))
  }

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const popularQuestions = faqData
    .sort((a, b) => (b.helpful || 0) - (a.helpful || 0))
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4">Help Center</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about visa applications and our services
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {categories.map(category => {
              const Icon = category.icon
              const isActive = selectedCategory === category.id
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {category.name}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Show All Button */}
          {selectedCategory !== 'all' && (
            <div className="text-center mb-8">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory('all')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Show All Questions
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {filteredFAQs.map((faq, idx) => {
              const isExpanded = expandedItems.includes(faq.question)
              const categoryInfo = categories.find(c => c.id === faq.category)
              const hasVoted = helpfulVotes[faq.question] !== undefined
              
              return (
                <Card key={idx} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleExpanded(faq.question)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="font-semibold text-lg mb-1">
                            {faq.question}
                          </h3>
                          {categoryInfo && (
                            <Badge variant="secondary" className="text-xs">
                              {categoryInfo.name}
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-4 border-t">
                        <p className="text-gray-600 mt-4 leading-relaxed">
                          {faq.answer}
                        </p>
                        
                        <div className="mt-6 flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Was this helpful?
                            {!hasVoted ? (
                              <div className="inline-flex gap-2 ml-3">
                                <button
                                  onClick={() => handleHelpfulVote(faq.question, true)}
                                  className="text-gray-600 hover:text-green-600"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleHelpfulVote(faq.question, false)}
                                  className="text-gray-600 hover:text-red-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="ml-2 text-green-600">
                                Thanks for your feedback!
                              </span>
                            )}
                          </div>
                          {faq.helpful && (
                            <span className="text-sm text-gray-500">
                              {faq.helpful} people found this helpful
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredFAQs.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No questions found matching your search.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Popular Questions Sidebar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Most Helpful */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most Helpful
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularQuestions.slice(0, 3).map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setExpandedItems([faq.question])
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-left text-sm hover:text-blue-600"
                  >
                    {faq.question}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  New to VisaAssist?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="/about" className="flex items-center gap-2 text-sm hover:text-blue-600">
                  <ArrowRight className="h-4 w-4" />
                  Learn about our services
                </a>
                <a href="/pricing" className="flex items-center gap-2 text-sm hover:text-blue-600">
                  <ArrowRight className="h-4 w-4" />
                  View pricing plans
                </a>
                <a href="/register" className="flex items-center gap-2 text-sm hover:text-blue-600">
                  <ArrowRight className="h-4 w-4" />
                  Create an account
                </a>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Still Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push('/contact')}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}