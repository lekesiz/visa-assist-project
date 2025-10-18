'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: any
  iconColor: string
  description?: string
}

interface DashboardStatsProps {
  userId?: string
  period?: 'week' | 'month' | 'year' | 'all'
  compact?: boolean
}

export function DashboardStats({ 
  userId, 
  period = 'month',
  compact = false 
}: DashboardStatsProps) {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [userId, period])

  async function fetchStats() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        const { data } = await DemoService.getUserStats()
        
        const formattedStats: Stat[] = [
          {
            label: 'Active Applications',
            value: data.activeApplications || 0,
            icon: FileText,
            iconColor: 'text-blue-600',
            description: 'In progress'
          },
          {
            label: 'Documents',
            value: data.totalDocuments || 0,
            change: '+3',
            changeType: 'positive',
            icon: Upload,
            iconColor: 'text-green-600',
            description: `${data.verifiedDocuments || 0} verified`
          },
          {
            label: 'Appointments',
            value: data.upcomingAppointments || 0,
            icon: Calendar,
            iconColor: 'text-purple-600',
            description: 'Upcoming'
          },
          {
            label: 'Saved Jobs',
            value: data.savedJobs || 0,
            change: '+2',
            changeType: 'positive',
            icon: Briefcase,
            iconColor: 'text-orange-600',
            description: `${data.appliedJobs || 0} applied`
          }
        ]

        setStats(formattedStats)
      } else {
        // Real Supabase data fetching
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // You would implement real queries here
        // For now, using placeholder data
        setStats([
          {
            label: 'Active Applications',
            value: 0,
            icon: FileText,
            iconColor: 'text-blue-600'
          },
          {
            label: 'Documents',
            value: 0,
            icon: Upload,
            iconColor: 'text-green-600'
          },
          {
            label: 'Appointments',
            value: 0,
            icon: Calendar,
            iconColor: 'text-purple-600'
          },
          {
            label: 'Saved Jobs',
            value: 0,
            icon: Briefcase,
            iconColor: 'text-orange-600'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className={cn('p-2 rounded-lg bg-gray-50', stat.iconColor)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <div className={cn('p-2 rounded-lg bg-gray-50', stat.iconColor)}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className={cn(
                  'text-xs flex items-center mt-1',
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 
                  'text-gray-600'
                )}>
                  {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {stat.change} from last {period}
                </p>
              )}
              {stat.description && (
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Extended stats for detailed dashboard
export function DetailedStats({ userId }: { userId?: string }) {
  const [detailedStats, setDetailedStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDetailedStats()
  }, [userId])

  async function fetchDetailedStats() {
    try {
      setLoading(true)
      
      if (DemoService.isDemoMode()) {
        const { data } = await DemoService.getUserStats()
        setDetailedStats({
          applications: {
            total: data.totalApplications || 0,
            byStatus: {
              draft: 1,
              in_progress: 1,
              submitted: 0,
              approved: 0,
              rejected: 0
            },
            byType: {
              work: 1,
              student: 1,
              tourist: 0,
              business: 0
            }
          },
          documents: {
            total: data.totalDocuments || 0,
            verified: data.verifiedDocuments || 0,
            pending: 1,
            rejected: 0
          },
          timeline: {
            averageProcessingDays: 15,
            estimatedCompletionDate: '2025-03-15',
            nextMilestone: 'Document Verification'
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch detailed stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !detailedStats) return null

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Application Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications by Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(detailedStats.applications.byStatus).map(([status, count]: any) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Document Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-green-600">Verified</span>
              <span className="font-medium">{detailedStats.documents.verified}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-yellow-600">Pending</span>
              <span className="font-medium">{detailedStats.documents.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-red-600">Rejected</span>
              <span className="font-medium">{detailedStats.documents.rejected}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="font-bold">{detailedStats.documents.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processing Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Average Processing</p>
              <p className="text-xl font-bold">{detailedStats.timeline.averageProcessingDays} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estimated Completion</p>
              <p className="font-medium">{new Date(detailedStats.timeline.estimatedCompletionDate).toLocaleDateString()}</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">Next Milestone</p>
              <p className="font-medium flex items-center gap-1 text-blue-600">
                <Clock className="h-4 w-4" />
                {detailedStats.timeline.nextMilestone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}