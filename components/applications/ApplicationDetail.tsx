'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText,
  Upload,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Eye,
  ChevronRight,
  MapPin,
  Briefcase,
  DollarSign,
  MessageSquare
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { ApplicationProgress } from './ApplicationProgress'
import { ChecklistItem } from './ChecklistItem'

interface ApplicationDetailProps {
  applicationId: string
}

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
  in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
  submitted: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Submitted' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [application, setApplication] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchApplicationDetails()
  }, [applicationId])

  async function fetchApplicationDetails() {
    try {
      setLoading(true)
      
      if (DemoService.isDemoMode()) {
        // Use demo data
        const [appResult, docsResult, aptsResult] = await Promise.all([
          DemoService.getApplication(applicationId),
          DemoService.getDocuments(applicationId),
          DemoService.getAppointments()
        ])
        
        if (appResult.error) throw appResult.error
        setApplication(appResult.data)
        setDocuments(docsResult.data || [])
        setAppointments(aptsResult.data?.filter(a => a.application_id === applicationId) || [])
      } else {
        // Use real Supabase data
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const [appResult, docsResult, aptsResult] = await Promise.all([
          supabase.from('applications').select('*').eq('id', applicationId).single(),
          supabase.from('documents').select('*').eq('application_id', applicationId),
          supabase.from('appointments').select('*').eq('application_id', applicationId)
        ])

        if (appResult.error) throw appResult.error
        setApplication(appResult.data)
        setDocuments(docsResult.data || [])
        setAppointments(aptsResult.data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateApplicationStatus(status: string) {
    try {
      if (DemoService.isDemoMode()) {
        const { data, error } = await DemoService.updateApplication(applicationId, { status })
        if (error) throw error
        setApplication(data)
      } else {
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
        
        if (!response.ok) throw new Error('Failed to update application')
        const { data } = await response.json()
        setApplication(data)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || 'Application not found'}
        </AlertDescription>
      </Alert>
    )
  }

  const statusInfo = statusConfig[application.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo?.icon || FileText
  const completedItems = application.checklist_items?.filter(item => item.completed).length || 0
  const totalItems = application.checklist_items?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{application.visa_type} Visa Application</h1>
          <p className="text-gray-600">{application.purpose_of_travel}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color}`}>
            <StatusIcon className="h-4 w-4" />
            {statusInfo?.label}
          </span>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <ApplicationProgress 
        currentStep={application.current_step}
        totalSteps={application.total_steps}
        progressPercentage={application.progress_percentage}
      />

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {['overview', 'documents', 'appointments', 'timeline'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {application.target_country === 'DE' ? 'Germany' : application.target_country}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Travel Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {application.planned_travel_date 
                          ? new Date(application.planned_travel_date).toLocaleDateString()
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">{application.duration_of_stay || 'N/A'} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {application.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-2">Notes</p>
                      <p className="text-sm">{application.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements Checklist</CardTitle>
                  <CardDescription>
                    {completedItems} of {totalItems} completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.checklist_items?.map((item: any) => (
                      <ChecklistItem
                        key={item.id}
                        item={item}
                        onToggle={(id) => {
                          // Update checklist item
                          const updatedItems = application.checklist_items.map(i => 
                            i.id === id ? { ...i, completed: !i.completed } : i
                          )
                          setApplication({ ...application, checklist_items: updatedItems })
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'documents' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      {documents.length} document(s) uploaded
                    </CardDescription>
                  </div>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.document_type} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'appointments' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>
                      Manage your visa appointments
                    </CardDescription>
                  </div>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map(apt => (
                      <div 
                        key={apt.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{apt.appointment_type}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(apt.appointment_date).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">{apt.location}</p>
                            {apt.confirmation_code && (
                              <p className="text-sm font-mono mt-2">
                                Code: {apt.confirmation_code}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No appointments scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {application.status === 'draft' && (
                <Button 
                  className="w-full justify-start" 
                  onClick={() => updateApplicationStatus('in_progress')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Start Application
                </Button>
              )}
              {application.status === 'in_progress' && (
                <Button 
                  className="w-full justify-start"
                  onClick={() => updateApplicationStatus('submitted')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Get AI Assistance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Upload your passport to verify its validity
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Financial proof documents are required for this visa type
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}