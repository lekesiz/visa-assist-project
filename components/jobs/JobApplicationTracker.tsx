'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Edit,
  Trash2,
  ExternalLink,
  Archive,
  ChevronRight
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface JobApplication {
  id: string
  job_id: string
  job_title: string
  company: string
  location: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  applied_at: string
  last_updated: string
  next_step?: string
  next_step_date?: string
  notes?: string
  contacts?: Contact[]
  interviews?: Interview[]
  documents?: ApplicationDocument[]
  salary_offered?: number
  response_deadline?: string
}

interface Contact {
  id: string
  name: string
  role: string
  email?: string
  phone?: string
  linkedin?: string
}

interface Interview {
  id: string
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral'
  date: string
  time: string
  duration?: number
  interviewers?: string[]
  location?: string
  notes?: string
  feedback?: string
  result?: 'passed' | 'failed' | 'pending'
}

interface ApplicationDocument {
  id: string
  type: string
  name: string
  url: string
  uploaded_at: string
}

interface JobApplicationTrackerProps {
  userId?: string
  onApplicationClick?: (application: JobApplication) => void
  showStats?: boolean
  compact?: boolean
}

const statusConfig = {
  applied: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800',
    icon: Send
  },
  screening: {
    label: 'Screening',
    color: 'bg-purple-100 text-purple-800',
    icon: FileText
  },
  interview: {
    label: 'Interview',
    color: 'bg-yellow-100 text-yellow-800',
    icon: User
  },
  offer: {
    label: 'Offer',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800',
    icon: Archive
  }
}

const mockApplications: JobApplication[] = [
  {
    id: '1',
    job_id: '1',
    job_title: 'Senior Software Engineer',
    company: 'TechCorp GmbH',
    location: 'Berlin, Germany',
    status: 'interview',
    applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    next_step: 'Technical Interview',
    next_step_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    contacts: [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'HR Manager',
        email: 'sarah.j@techcorp.de'
      }
    ],
    interviews: [
      {
        id: '1',
        type: 'phone',
        date: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        time: '14:00',
        duration: 30,
        result: 'passed',
        feedback: 'Strong technical background, good communication'
      }
    ]
  },
  {
    id: '2',
    job_id: '2',
    job_title: 'Product Manager',
    company: 'FinTech Solutions',
    location: 'Frankfurt, Germany',
    status: 'offer',
    applied_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    salary_offered: 95000,
    response_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    job_id: '3',
    job_title: 'Data Analyst',
    company: 'Analytics Pro',
    location: 'Munich, Germany',
    status: 'screening',
    applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    job_id: '4',
    job_title: 'Frontend Developer',
    company: 'StartupXYZ',
    location: 'Berlin, Germany',
    status: 'rejected',
    applied_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Looking for more senior candidates'
  }
]

export function JobApplicationTracker({
  userId,
  onApplicationClick,
  showStats = true,
  compact = false
}: JobApplicationTrackerProps) {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchApplications()
  }, [userId])

  async function fetchApplications() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setApplications(mockApplications)
      } else {
        // Fetch real applications
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            *,
            contacts:job_application_contacts(*),
            interviews:job_interviews(*),
            documents:job_application_documents(*)
          `)
          .eq('user_id', userId)
          .order('applied_at', { ascending: false })

        if (!error && data) {
          setApplications(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: JobApplication['status']) => {
    try {
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, last_updated: new Date().toISOString() }
          : app
      ))

      if (!DemoService.isDemoMode()) {
        await supabase
          .from('job_applications')
          .update({ 
            status: newStatus,
            last_updated: new Date().toISOString()
          })
          .eq('id', applicationId)
      }
    } catch (error) {
      console.error('Failed to update application status:', error)
    }
  }

  const getApplicationsByStatus = (status: JobApplication['status']) => {
    return applications.filter(app => app.status === status)
  }

  const stats = {
    total: applications.length,
    active: applications.filter(a => ['applied', 'screening', 'interview'].includes(a.status)).length,
    interviews: applications.filter(a => a.status === 'interview').length,
    offers: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    responseRate: applications.length > 0 
      ? Math.round((applications.filter(a => a.status !== 'applied').length / applications.length) * 100)
      : 0
  }

  const filteredApplications = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeTab)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Application Tracker</CardTitle>
          <CardDescription>Loading your applications...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Applied</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.interviews}</p>
                <p className="text-xs text-gray-500">Interviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.offers}</p>
                <p className="text-xs text-gray-500">Offers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.responseRate}%</p>
                <p className="text-xs text-gray-500">Response Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
          <CardDescription>
            Track and manage your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
              <TabsTrigger value="applied">Applied ({getApplicationsByStatus('applied').length})</TabsTrigger>
              <TabsTrigger value="screening">Screening ({getApplicationsByStatus('screening').length})</TabsTrigger>
              <TabsTrigger value="interview">Interview ({getApplicationsByStatus('interview').length})</TabsTrigger>
              <TabsTrigger value="offer">Offers ({getApplicationsByStatus('offer').length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({getApplicationsByStatus('rejected').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredApplications.length > 0 ? (
                <div className="space-y-4">
                  {filteredApplications.map(application => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      onStatusUpdate={(status) => handleUpdateStatus(application.id, status)}
                      onClick={() => onApplicationClick?.(application)}
                      compact={compact}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No applications in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upcoming Actions */}
      {applications.some(app => app.next_step) && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications
                .filter(app => app.next_step && app.next_step_date)
                .sort((a, b) => new Date(a.next_step_date!).getTime() - new Date(b.next_step_date!).getTime())
                .slice(0, 5)
                .map(app => (
                  <Alert key={app.id}>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{app.next_step}</strong> with {app.company}
                      <br />
                      <span className="text-sm text-gray-500">
                        {format(new Date(app.next_step_date!), 'EEEE, MMMM d at HH:mm')}
                      </span>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Application Card Component
interface ApplicationCardProps {
  application: JobApplication
  onStatusUpdate: (status: JobApplication['status']) => void
  onClick?: () => void
  compact?: boolean
}

function ApplicationCard({ 
  application, 
  onStatusUpdate, 
  onClick,
  compact = false 
}: ApplicationCardProps) {
  const config = statusConfig[application.status]
  const Icon = config.icon

  if (compact) {
    return (
      <div 
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{application.job_title}</p>
            <p className="text-xs text-gray-500">{application.company}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className={`p-3 rounded-lg ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{application.job_title}</h4>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Building className="h-3 w-3" />
                {application.company} • {application.location}
              </p>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}</span>
                <span>Updated {formatDistanceToNow(new Date(application.last_updated), { addSuffix: true })}</span>
              </div>

              {application.next_step && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Next:</strong> {application.next_step}
                    {application.next_step_date && (
                      <> on {format(new Date(application.next_step_date), 'MMM d at HH:mm')}</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {application.response_deadline && application.status === 'offer' && (
                <Alert className="mt-3 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    <strong>Offer received!</strong> Response needed by{' '}
                    {format(new Date(application.response_deadline), 'MMM d, yyyy')}
                    {application.salary_offered && (
                      <> • €{application.salary_offered.toLocaleString()}/year</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4">
                {application.contacts && application.contacts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <User className="h-4 w-4 mr-1" />
                    Contacts ({application.contacts.length})
                  </Button>
                )}
                {application.interviews && application.interviews.length > 0 && (
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Calendar className="h-4 w-4 mr-1" />
                    Interviews ({application.interviews.length})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Notes
                </Button>
              </div>
            </div>
          </div>
          
          <Badge className={config.color}>
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}