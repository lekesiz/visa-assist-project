'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { ApplicationProgress } from '@/components/applications/ApplicationProgress'
import { ChecklistItem } from '@/components/applications/ChecklistItem'
import { DocumentList } from '@/components/documents/DocumentList'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Edit, 
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { mockApplications, mockDocuments } from '@/lib/demo/mock-data'

interface PageProps {
  params: { id: string }
}

export default function ApplicationDetailPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [application, setApplication] = useState<Record<string, any> | null>(null)
  const [documents, setDocuments] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [showUploader, setShowUploader] = useState(false)

  useEffect(() => {
    fetchApplicationData()
  }, [params.id])

  async function fetchApplicationData() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Use mock data in demo mode
        const mockApp = mockApplications.find(app => app.id === params.id)
        if (mockApp) {
          setApplication(mockApp)
          setDocuments(mockDocuments.filter(doc => doc.application_id === params.id))
        } else {
          router.push('/dashboard/applications')
        }
      } else {
        // Fetch real data from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Fetch application
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (appError || !appData) {
          router.push('/dashboard/applications')
          return
        }

        setApplication(appData)

        // Fetch documents
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('application_id', params.id)
          .order('created_at', { ascending: false })

        if (!docsError) {
          setDocuments(docsData || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch application data:', error)
      router.push('/dashboard/applications')
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (file: File, documentType: string) => {
    try {
      setUploadingDocument(true)

      if (DemoService.isDemoMode()) {
        // Simulate upload in demo mode
        await new Promise(resolve => setTimeout(resolve, 2000))
        const newDoc = {
          id: `doc-${Date.now()}`,
          application_id: params.id,
          document_type: documentType,
          file_name: file.name,
          file_url: URL.createObjectURL(file),
          file_size: file.size,
          mime_type: file.type,
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        }
        setDocuments(prev => [newDoc, ...prev])
        setShowUploader(false)
      } else {
        // Real upload logic would go here
        // This would involve uploading to Supabase Storage
        // and creating a document record in the database
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    try {
      if (DemoService.isDemoMode()) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      } else {
        // Real delete logic
        await supabase
          .from('documents')
          .delete()
          .eq('id', documentId)
        
        await fetchApplicationData()
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleSubmitApplication = async () => {
    try {
      if (DemoService.isDemoMode()) {
        setApplication((prev: any) => ({ ...prev, status: 'submitted', submitted_at: new Date().toISOString() }))
      } else {
        await (supabase as any)
          .from('applications')
          .update({ 
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', params.id)
        
        await fetchApplicationData()
      }
    } catch (error) {
      console.error('Failed to submit application:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Application not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <Button
          variant="default"
          onClick={() => router.push('/dashboard/applications')}
          className="mt-4"
        >
          Back to Applications
        </Button>
      </div>
    )
  }

  const checklist = [
    {
      id: 'passport',
      label: 'Valid Passport',
      description: 'Passport with at least 6 months validity',
      required: true,
      completed: documents.some(d => d.document_type === 'passport' && d.status === 'verified')
    },
    {
      id: 'photo',
      label: 'Biometric Photo',
      description: 'Recent passport-style photograph',
      required: true,
      completed: documents.some(d => d.document_type === 'photo' && d.status === 'verified')
    },
    {
      id: 'financial',
      label: 'Financial Documents',
      description: 'Bank statements, proof of income',
      required: true,
      completed: documents.some(d => d.document_type === 'financial' && d.status === 'verified')
    },
    {
      id: 'accommodation',
      label: 'Accommodation Proof',
      description: 'Hotel booking or invitation letter',
      required: true,
      completed: documents.some(d => d.document_type === 'accommodation')
    },
    {
      id: 'insurance',
      label: 'Travel Insurance',
      description: 'Valid travel insurance coverage',
      required: false,
      completed: documents.some(d => d.document_type === 'insurance')
    }
  ]

  const canSubmit = checklist.filter(item => item.required).every(item => item.completed) && 
                    application.status === 'in_progress'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/applications')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {application.type.charAt(0).toUpperCase() + application.type.slice(1)} Visa Application
            </h1>
            <p className="text-gray-600">
              {application.destination_country} • Created {new Date(application.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {application.status === 'in_progress' && (
            <>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                onClick={handleSubmitApplication}
                disabled={!canSubmit}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Application
              </Button>
            </>
          )}
          {application.status === 'submitted' && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <ApplicationProgress 
        currentStep={application?.current_step || 1}
        totalSteps={8}
        progressPercentage={application?.progress_percentage || 0}
      />

      {/* Status Alert */}
      {application.status === 'submitted' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Your application has been submitted successfully. You will receive updates via email.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ApplicationDetail
            applicationId={params.id}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentList
            documents={documents}
            onUpload={() => setShowUploader(true)}
            onDelete={handleDocumentDelete}
            showFilters={documents.length > 5}
          />
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklist.map(item => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={() => !item.completed && setShowUploader(true)}
                />
              ))}
            </CardContent>
          </Card>

          {!canSubmit && application.status === 'in_progress' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete all required items before submitting your application.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Application Created</p>
                    <p className="text-sm text-gray-500">
                      {new Date(application.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {application.submitted_at && (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Send className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Application Submitted</p>
                      <p className="text-sm text-gray-500">
                        {new Date(application.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 opacity-50">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Under Review</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-50">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Appointment Scheduled</p>
                    <p className="text-sm text-gray-500">Not yet scheduled</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Uploader Dialog */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <DocumentUploader
              applicationId={params.id}
              onUploadComplete={(doc) => {
                setShowUploader(false)
                fetchApplicationDetails()
              }}
              acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
              maxFileSize={10}
            />
            <Button 
              onClick={() => setShowUploader(false)}
              className="mt-4"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}