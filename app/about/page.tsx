'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users,
  Target,
  Award,
  Shield,
  Globe,
  TrendingUp,
  Heart,
  Building,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Map,
  Clock,
  MessageSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TeamMember {
  name: string
  role: string
  bio: string
  expertise: string[]
  image?: string
}

interface Milestone {
  year: string
  title: string
  description: string
  icon: any
}

interface Value {
  title: string
  description: string
  icon: any
}

const teamMembers: TeamMember[] = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Founder & CEO',
    bio: 'Former immigration lawyer with 15+ years of experience helping individuals achieve their dreams',
    expertise: ['Immigration Law', 'Policy Expert', 'Strategic Vision'],
    image: '/team/sarah.jpg'
  },
  {
    name: 'Mehmet Yilmaz',
    role: 'Head of Operations',
    bio: 'Successfully migrated from Turkey to Germany, now helping others navigate the same journey',
    expertise: ['Visa Processing', 'Customer Success', 'Process Optimization'],
    image: '/team/mehmet.jpg'
  },
  {
    name: 'Anna Schmidt',
    role: 'Lead Immigration Consultant',
    bio: 'Certified immigration consultant specializing in European visa applications',
    expertise: ['EU Immigration', 'Document Preparation', 'Application Strategy'],
    image: '/team/anna.jpg'
  },
  {
    name: 'David Chen',
    role: 'Tech Lead',
    bio: 'Building innovative solutions to simplify complex immigration processes',
    expertise: ['AI Development', 'Platform Architecture', 'Security'],
    image: '/team/david.jpg'
  }
]

const milestones: Milestone[] = [
  {
    year: '2020',
    title: 'Company Founded',
    description: 'Started with a mission to democratize immigration assistance',
    icon: Sparkles
  },
  {
    year: '2021',
    title: 'AI Platform Launch',
    description: 'Launched our AI-powered visa assistance platform',
    icon: Award
  },
  {
    year: '2022',
    title: '10,000+ Success Stories',
    description: 'Helped over 10,000 individuals with their visa applications',
    icon: Users
  },
  {
    year: '2023',
    title: 'Global Expansion',
    description: 'Expanded support to 50+ destination countries',
    icon: Globe
  },
  {
    year: '2024',
    title: 'Industry Recognition',
    description: 'Awarded "Best Immigration Tech Platform" by ImmigrationTech Awards',
    icon: TrendingUp
  }
]

const values: Value[] = [
  {
    title: 'Transparency',
    description: 'Clear, honest guidance throughout your visa journey',
    icon: Shield
  },
  {
    title: 'Empathy',
    description: 'We understand the challenges of immigration firsthand',
    icon: Heart
  },
  {
    title: 'Innovation',
    description: 'Using technology to simplify complex processes',
    icon: Sparkles
  },
  {
    title: 'Excellence',
    description: 'Committed to the highest standards of service',
    icon: Award
  }
]

const stats = [
  { label: 'Success Rate', value: '95%', icon: TrendingUp },
  { label: 'Happy Customers', value: '25,000+', icon: Users },
  { label: 'Countries Supported', value: '50+', icon: Globe },
  { label: 'Average Response Time', value: '< 2 hours', icon: Clock }
]

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">About VisaAssist</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Your Trusted Partner in Immigration
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to make immigration accessible, transparent, and stress-free 
              for everyone. Our platform combines human expertise with cutting-edge technology 
              to guide you through every step of your visa journey.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card key={idx} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p>
              VisaAssist was born from personal experience. Our founder, Dr. Sarah Johnson, 
              spent years as an immigration lawyer witnessing the confusion, stress, and 
              overwhelming complexity that individuals face when trying to navigate visa applications.
            </p>
            <p className="mt-4">
              In 2020, she partnered with a team of technologists and fellow immigration experts 
              to create a platform that would democratize access to quality immigration assistance. 
              The goal was simple: make the visa application process as straightforward as booking 
              a flight online.
            </p>
            <p className="mt-4">
              Today, we've helped over 25,000 individuals from 100+ countries achieve their 
              immigration dreams. From students pursuing education abroad to professionals seeking 
              new opportunities, we're proud to be part of their journey.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => {
              const Icon = value.icon
              return (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((milestone, idx) => {
              const Icon = milestone.icon
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {idx < milestones.length - 1 && (
                      <div className="w-0.5 h-20 bg-gray-300 mx-6 mt-2" />
                    )}
                  </div>
                  <div className="flex-grow pb-8">
                    <Badge variant="secondary" className="mb-2">{milestone.year}</Badge>
                    <h3 className="font-semibold text-lg mb-1">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Meet Our Team</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            A diverse team of experts passionate about making immigration accessible to everyone
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, idx) => (
              <Card key={idx} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-blue-600 text-sm mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {member.expertise.map((skill, skillIdx) => (
                      <Badge key={skillIdx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why Choose VisaAssist?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Expert Guidance</h3>
              <p className="text-blue-100">
                Certified immigration consultants review every application
              </p>
            </div>
            <div>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">AI-Powered Accuracy</h3>
              <p className="text-blue-100">
                Smart technology catches errors before submission
              </p>
            </div>
            <div>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">End-to-End Support</h3>
              <p className="text-blue-100">
                From application to approval, we're with you every step
              </p>
            </div>
          </div>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => router.push('/register')}
          >
            Start Your Journey Today
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Have Questions?</CardTitle>
              <CardDescription className="text-lg">
                Our team is here to help you navigate your visa journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.push('/contact')}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact Us
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/faq')}>
                  Read FAQs
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}