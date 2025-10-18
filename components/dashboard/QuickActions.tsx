'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Calendar, 
  Briefcase,
  MessageSquare,
  CreditCard,
  Search,
  UserCheck,
  Globe,
  HelpCircle,
  Settings,
  BarChart3,
  FileSearch,
  Send,
  Plus
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  color: string
  href?: string
  onClick?: () => void
  badge?: string
}

interface QuickActionsProps {
  showHeader?: boolean
  columns?: 2 | 3 | 4
  variant?: 'default' | 'compact' | 'list'
}

export function QuickActions({ 
  showHeader = true,
  columns = 4,
  variant = 'default'
}: QuickActionsProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      id: 'new-application',
      title: 'New Application',
      description: 'Start a visa application',
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
      href: '/dashboard/applications/new'
    },
    {
      id: 'upload-document',
      title: 'Upload Documents',
      description: 'Add required documents',
      icon: Upload,
      color: 'text-green-600 bg-green-100',
      href: '/dashboard/documents'
    },
    {
      id: 'book-appointment',
      title: 'Book Appointment',
      description: 'Schedule consulate visit',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100',
      href: '/dashboard/appointments'
    },
    {
      id: 'job-search',
      title: 'Job Search',
      description: 'Find visa-sponsoring jobs',
      icon: Briefcase,
      color: 'text-orange-600 bg-orange-100',
      href: '/dashboard/jobs'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get instant help',
      icon: MessageSquare,
      color: 'text-indigo-600 bg-indigo-100',
      onClick: () => {
        // Open AI chat modal
      }
    },
    {
      id: 'check-status',
      title: 'Check Status',
      description: 'View application status',
      icon: Search,
      color: 'text-teal-600 bg-teal-100',
      href: '/dashboard/applications'
    },
    {
      id: 'denklik',
      title: 'Denklik Process',
      description: 'Credential recognition',
      icon: UserCheck,
      color: 'text-pink-600 bg-pink-100',
      href: '/dashboard/denklik'
    },
    {
      id: 'visa-guide',
      title: 'Visa Guide',
      description: 'Country-specific info',
      icon: Globe,
      color: 'text-cyan-600 bg-cyan-100',
      href: '/dashboard/guides'
    }
  ]

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-${columns} gap-3`}>
        {actions.slice(0, columns).map(action => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto flex flex-col items-center gap-2 p-4"
              onClick={() => handleActionClick(action)}
            >
              <Icon className={`h-6 w-6 ${action.color.split(' ')[0]}`} />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          )
        })}
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => handleActionClick(action)}
            >
              <div className={`p-2 rounded-lg mr-3 ${action.color.split(' ')[1]}`}>
                <Icon className={`h-5 w-5 ${action.color.split(' ')[0]}`} />
              </div>
              <div className="text-left">
                <p className="font-medium">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className={`grid grid-cols-2 sm:grid-cols-${columns} gap-4`}>
          {actions.map(action => {
            const Icon = action.icon
            return (
              <Card
                key={action.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary/20"
                onClick={() => handleActionClick(action)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.color.split(' ')[1]}`}>
                    <Icon className={`h-6 w-6 ${action.color.split(' ')[0]}`} />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Floating Action Button Component
interface FloatingActionsProps {
  actions?: QuickAction[]
}

export function FloatingActions({ actions }: FloatingActionsProps) {
  const router = useRouter()
  const defaultActions: QuickAction[] = actions || [
    {
      id: 'new',
      title: 'New Application',
      description: '',
      icon: Plus,
      color: 'text-white',
      href: '/dashboard/applications/new'
    },
    {
      id: 'upload',
      title: 'Upload Document',
      description: '',
      icon: Upload,
      color: 'text-white',
      href: '/dashboard/documents'
    },
    {
      id: 'chat',
      title: 'AI Assistant',
      description: '',
      icon: MessageSquare,
      color: 'text-white',
      onClick: () => {
        // Open AI chat
      }
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 space-y-3">
      {defaultActions.map(action => {
        const Icon = action.icon
        return (
          <Button
            key={action.id}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
            onClick={() => {
              if (action.onClick) {
                action.onClick()
              } else if (action.href) {
                router.push(action.href)
              }
            }}
            title={action.title}
          >
            <Icon className="h-6 w-6" />
          </Button>
        )
      })}
    </div>
  )
}

// Action Cards for Home Page
export function ActionCards() {
  const router = useRouter()
  
  const mainActions = [
    {
      title: 'Start Your Visa Journey',
      description: 'Begin your application process with our AI-powered guidance',
      icon: Send,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/applications/new'
    },
    {
      title: 'Document Analysis',
      description: 'Upload and verify your documents with instant AI feedback',
      icon: FileSearch,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/documents'
    },
    {
      title: 'Track Applications',
      description: 'Monitor your visa applications in real-time',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/applications'
    },
    {
      title: 'Expert Support',
      description: '24/7 AI assistance and human expert consultations',
      icon: HelpCircle,
      color: 'from-orange-500 to-orange-600',
      onClick: () => {
        // Open support
      }
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {mainActions.map((action, index) => {
        const Icon = action.icon
        return (
          <Card
            key={index}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
            onClick={() => {
              if (action.onClick) {
                action.onClick()
              } else if (action.href) {
                router.push(action.href)
              }
            }}
          >
            <div className={`h-2 bg-gradient-to-r ${action.color}`} />
            <CardHeader>
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0 h-auto font-medium">
                Get Started →
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}