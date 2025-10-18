'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Plus,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface Application {
  id: string
  visa_type: string
  status: string
  progress_percentage: number
  purpose_of_travel: string
  planned_travel_date: string
  created_at: string
  updated_at: string
}

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
  in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
  submitted: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Submitted' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
}

const visaTypeLabels: Record<string, string> = {
  tourist: 'Tourist Visa',
  business: 'Business Visa',
  student: 'Student Visa',
  work: 'Work Visa',
  family_reunion: 'Family Reunion Visa',
  other: 'Other'
}

export function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchApplications()
  }, [])

  async function fetchApplications() {
    try {
      setLoading(true)
      
      if (DemoService.isDemoMode()) {
        // Use demo data
        const { data, error } = await DemoService.getApplications('demo-user')
        if (error) throw error
        setApplications(data || [])
      } else {
        // Use real Supabase data
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setApplications(data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading applications: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No applications yet
          </h3>
          <p className="text-gray-500 mb-6 text-center max-w-sm">
            Start your visa journey by creating your first application.
          </p>
          <Link href="/dashboard/applications/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Application
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Applications</h2>
        <Link href="/dashboard/applications/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      {applications.map((app) => {
        const statusInfo = statusConfig[app.status as keyof typeof statusConfig]
        const StatusIcon = statusInfo?.icon || FileText
        const visaTypeLabel = visaTypeLabels[app.visa_type] || app.visa_type

        return (
          <Card key={app.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">
                      {visaTypeLabel}
                    </CardTitle>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo?.label}
                    </span>
                  </div>
                  <CardDescription>
                    {app.purpose_of_travel}
                  </CardDescription>
                </div>
                <Link href={`/dashboard/applications/${app.id}`}>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{app.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${app.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Travel Date</p>
                      <p className="font-medium">
                        {app.planned_travel_date 
                          ? new Date(app.planned_travel_date).toLocaleDateString()
                          : 'Not set'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium">
                        {new Date(app.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}