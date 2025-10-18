'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Send,
  Clock,
  User,
  FileCheck,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'application' | 'document' | 'appointment' | 'payment' | 'system'
  action: string
  title: string
  description?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  metadata?: any
  created_at: string
}

interface ActivityFeedProps {
  userId?: string
  limit?: number
  showHeader?: boolean
  compact?: boolean
}

const activityIcons = {
  application_created: FileText,
  application_submitted: Send,
  application_approved: CheckCircle2,
  application_rejected: XCircle,
  application_updated: Edit,
  document_uploaded: Upload,
  document_verified: FileCheck,
  document_rejected: XCircle,
  appointment_scheduled: Calendar,
  appointment_cancelled: XCircle,
  appointment_reminder: Clock,
  payment_completed: CheckCircle2,
  system_notification: AlertCircle
}

const activityColors = {
  success: 'text-green-600 bg-green-100',
  warning: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
  info: 'text-blue-600 bg-blue-100'
}

export function ActivityFeed({ 
  userId, 
  limit = 10,
  showHeader = true,
  compact = false 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
  }, [userId, limit])

  async function fetchActivities() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Demo activities
        const demoActivities: Activity[] = [
          {
            id: '1',
            type: 'application',
            action: 'application_created',
            title: 'New Application Created',
            description: 'Work visa application for Germany',
            status: 'info',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'document',
            action: 'document_uploaded',
            title: 'Document Uploaded',
            description: 'Passport scan uploaded successfully',
            status: 'success',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'document',
            action: 'document_verified',
            title: 'Document Verified',
            description: 'Your passport has been verified',
            status: 'success',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            type: 'appointment',
            action: 'appointment_scheduled',
            title: 'Appointment Scheduled',
            description: 'Consulate appointment on March 15, 2025',
            status: 'info',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '5',
            type: 'system',
            action: 'system_notification',
            title: 'Profile Updated',
            description: 'Your profile information has been updated',
            status: 'info',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
        setActivities(demoActivities.slice(0, limit))
      } else {
        // Fetch real activities from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // In a real app, you'd have an activities table
        // For now, we'll return empty array
        setActivities([])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    const Icon = activityIcons[action as keyof typeof activityIcons] || AlertCircle
    return Icon
  }

  const getActivityColor = (status?: string) => {
    return activityColors[status as keyof typeof activityColors] || activityColors.info
  }

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions and updates</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions and updates</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-2">Your activities will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {activities.slice(0, 5).map(activity => {
          const Icon = getActivityIcon(activity.action)
          return (
            <div key={activity.id} className="flex items-center gap-3 p-2">
              <div className={`p-1.5 rounded-full ${getActivityColor(activity.status)}`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions and updates</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map(activity => {
              const Icon = getActivityIcon(activity.action)
              const colorClass = getActivityColor(activity.status)
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.status && (
                        <Badge 
                          variant={
                            activity.status === 'success' ? 'default' :
                            activity.status === 'error' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Activity Timeline Component
interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No activities to display</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      <div className="space-y-8">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.action)
          const colorClass = getActivityColor(activity.status)
          const isLast = index === activities.length - 1
          
          return (
            <div key={activity.id} className="relative flex items-start">
              <div className={`absolute left-0 w-9 h-9 rounded-full border-4 border-white ${colorClass} flex items-center justify-center`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="ml-12 flex-1">
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{activity.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  )}
                  {activity.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}