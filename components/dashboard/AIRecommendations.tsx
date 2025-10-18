'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  DollarSign,
  Globe,
  Briefcase,
  UserCheck,
  Shield,
  ArrowRight,
  Lightbulb,
  Target,
  Award,
  Brain
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Recommendation {
  id: string
  type: 'action' | 'insight' | 'warning' | 'opportunity'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'document' | 'application' | 'timeline' | 'financial' | 'job' | 'general'
  actionLabel?: string
  actionUrl?: string
  icon?: any
  metrics?: {
    label: string
    value: string | number
  }[]
  estimatedImpact?: string
}

interface AIRecommendationsProps {
  userId?: string
  applicationId?: string
  showHeader?: boolean
  variant?: 'full' | 'compact' | 'inline'
  limit?: number
}

const categoryIcons = {
  document: FileText,
  application: Target,
  timeline: Calendar,
  financial: DollarSign,
  job: Briefcase,
  general: Lightbulb
}

const typeColors = {
  action: 'bg-blue-100 text-blue-800 border-blue-200',
  insight: 'bg-purple-100 text-purple-800 border-purple-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  opportunity: 'bg-green-100 text-green-800 border-green-200'
}

export function AIRecommendations({ 
  userId,
  applicationId,
  showHeader = true,
  variant = 'full',
  limit = 5
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRecommendations()
  }, [userId, applicationId])

  async function fetchRecommendations() {
    try {
      setLoading(true)
      setAnalyzing(true)

      if (DemoService.isDemoMode()) {
        // Simulate AI analysis delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const demoRecommendations: Recommendation[] = [
          {
            id: '1',
            type: 'warning',
            title: 'Missing Critical Documents',
            description: 'Your biometric photo is required for visa processing. Upload it within 3 days to avoid delays.',
            priority: 'high',
            category: 'document',
            actionLabel: 'Upload Photo',
            actionUrl: '/dashboard/documents',
            icon: AlertCircle,
            estimatedImpact: 'Prevents 2-week delay'
          },
          {
            id: '2',
            type: 'opportunity',
            title: 'Fast-Track Processing Available',
            description: 'Based on your profile, you qualify for expedited processing. This can reduce wait time by 50%.',
            priority: 'high',
            category: 'timeline',
            actionLabel: 'Learn More',
            icon: TrendingUp,
            metrics: [
              { label: 'Normal Processing', value: '8 weeks' },
              { label: 'Fast-Track', value: '4 weeks' }
            ],
            estimatedImpact: 'Save 4 weeks'
          },
          {
            id: '3',
            type: 'action',
            title: 'Complete Financial Documentation',
            description: 'Add 3 months of bank statements to strengthen your application. This improves approval chances by 25%.',
            priority: 'high',
            category: 'financial',
            actionLabel: 'Add Documents',
            actionUrl: '/dashboard/documents',
            metrics: [
              { label: 'Current Score', value: '65%' },
              { label: 'With Documents', value: '90%' }
            ]
          },
          {
            id: '4',
            type: 'insight',
            title: 'Similar Applications Approved',
            description: '87% of applications similar to yours were approved in the last 3 months. Your profile looks strong.',
            priority: 'medium',
            category: 'application',
            icon: Award,
            metrics: [
              { label: 'Success Rate', value: '87%' },
              { label: 'Avg. Processing', value: '6 weeks' }
            ]
          },
          {
            id: '5',
            type: 'opportunity',
            title: 'Job Market Insights',
            description: 'Tech professionals in your field have 3x higher visa approval rates. Consider highlighting your tech skills.',
            priority: 'medium',
            category: 'job',
            actionLabel: 'Update Profile',
            icon: Briefcase,
            estimatedImpact: '3x approval rate'
          },
          {
            id: '6',
            type: 'action',
            title: 'Book Appointment Soon',
            description: 'Appointment slots for next month are filling fast. Book within 48 hours for preferred dates.',
            priority: 'medium',
            category: 'timeline',
            actionLabel: 'Check Availability',
            actionUrl: '/dashboard/appointments',
            icon: Calendar
          }
        ]
        
        setRecommendations(demoRecommendations.slice(0, limit))
      } else {
        // Call real AI recommendation API
        const response = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, applicationId })
        })

        const data = await response.json()
        if (data.success) {
          setRecommendations(data.recommendations.slice(0, limit))
        }
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  const handleAction = (recommendation: Recommendation) => {
    if (recommendation.actionUrl) {
      router.push(recommendation.actionUrl)
    }
  }

  const getIcon = (recommendation: Recommendation) => {
    return recommendation.icon || categoryIcons[recommendation.category] || Sparkles
  }

  if (loading && variant === 'full') {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Analyzing your application...</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <div className="h-2 bg-blue-600 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30 animate-pulse" style={{ 
                    animation: 'shimmer 1.5s infinite',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
                  }} />
                </div>
                <p className="text-sm text-gray-500 mt-2">AI analyzing your profile...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">You're all set!</p>
            <p className="text-sm text-gray-500 mt-2">
              No immediate actions needed. Keep up the good work!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        {recommendations.slice(0, 3).map(rec => {
          const Icon = getIcon(rec)
          return (
            <Alert key={rec.id} className={`border ${typeColors[rec.type].split(' ')[2]}`}>
              <Icon className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{rec.title}</span>
                {rec.actionLabel && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0"
                    onClick={() => handleAction(rec)}
                  >
                    {rec.actionLabel}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )
        })}
      </div>
    )
  }

  if (variant === 'inline') {
    const topRecommendation = recommendations[0]
    const Icon = getIcon(topRecommendation)
    
    return (
      <Alert className={`border ${typeColors[topRecommendation.type].split(' ')[2]}`}>
        <Icon className="h-4 w-4" />
        <AlertDescription>
          <strong>{topRecommendation.title}:</strong> {topRecommendation.description}
          {topRecommendation.actionLabel && (
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 ml-2"
              onClick={() => handleAction(topRecommendation)}
            >
              {topRecommendation.actionLabel} →
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Personalized insights based on your profile
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchRecommendations()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {recommendations.map(rec => {
          const Icon = getIcon(rec)
          
          return (
            <div 
              key={rec.id} 
              className={`p-4 rounded-lg border-2 ${typeColors[rec.type]} ${
                rec.priority === 'high' ? 'border-opacity-100' : 'border-opacity-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  rec.type === 'warning' ? 'bg-yellow-200' :
                  rec.type === 'action' ? 'bg-blue-200' :
                  rec.type === 'opportunity' ? 'bg-green-200' :
                  'bg-purple-200'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {rec.priority}
                    </Badge>
                  </div>
                  
                  {rec.metrics && (
                    <div className="flex gap-4 mt-3">
                      {rec.metrics.map((metric, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-gray-500">{metric.label}:</span>
                          <span className="font-medium ml-1">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {rec.estimatedImpact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>Impact: {rec.estimatedImpact}</span>
                    </div>
                  )}
                  
                  {rec.actionLabel && (
                    <Button 
                      size="sm"
                      className="mt-3"
                      onClick={() => handleAction(rec)}
                    >
                      {rec.actionLabel}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {/* AI Confidence Score */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">AI Confidence Score</span>
            <span className="text-sm font-bold text-blue-600">92%</span>
          </div>
          <Progress value={92} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            Based on analysis of 10,000+ similar applications
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Insights Dashboard Component
export function AIInsightsDashboard() {
  const insights = [
    {
      title: 'Application Strength',
      value: 85,
      change: '+12%',
      description: 'Above average for your category'
    },
    {
      title: 'Document Completeness',
      value: 70,
      change: '+5%',
      description: '3 documents pending'
    },
    {
      title: 'Timeline Optimization',
      value: 95,
      change: '+8%',
      description: 'On track for early submission'
    },
    {
      title: 'Success Probability',
      value: 78,
      change: '+15%',
      description: 'Higher than similar profiles'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map((insight, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{insight.value}%</span>
              <span className="text-sm text-green-600">{insight.change}</span>
            </div>
            <Progress value={insight.value} className="h-1 mt-2" />
            <p className="text-xs text-gray-500 mt-2">{insight.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}