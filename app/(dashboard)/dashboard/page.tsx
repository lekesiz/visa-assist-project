'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { ApplicationList } from '@/components/applications/ApplicationList'
import { ApplicationCard } from '@/components/applications/ApplicationCard'
import { DocumentList } from '@/components/documents/DocumentList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Upload, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Briefcase,
  Plus,
  ArrowRight
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { mockApplications, mockDocuments, mockUser } from '@/lib/demo/mock-data'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeDashboard()
  }, [])

  async function initializeDashboard() {
    try {
      if (DemoService.isDemoMode()) {
        // Use mock data in demo mode
        setUser(mockUser)
        setApplications(mockApplications.slice(0, 3))
        setDocuments(mockDocuments.slice(0, 5))
      } else {
        // Check real user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)
        
        // Fetch real data
        const [appsResult, docsResult] = await Promise.all([
          supabase
            .from('applications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('documents')
            .select('*')
            .order('uploaded_at', { ascending: false })
            .limit(5)
        ])
        
        if (!appsResult.error) setApplications(appsResult.data || [])
        if (!docsResult.error) setDocuments(docsResult.data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-application':
        router.push('/dashboard/applications/new')
        break
      case 'upload-documents':
        router.push('/dashboard/documents')
        break
      case 'book-appointment':
        router.push('/dashboard/appointments')
        break
      case 'job-search':
        router.push('/dashboard/jobs')
        break
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Alert */}
        <Alert className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Welcome back, {user?.user_metadata?.first_name || 'User'}!</AlertTitle>
          <AlertDescription>
            Your AI-powered visa application assistant. Start by creating a new application or uploading your documents.
          </AlertDescription>
        </Alert>

        {/* Stats Grid */}
        <DashboardStats userId={user?.id} />

        {/* Quick Actions */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => handleQuickAction('new-application')}
            >
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-base">New Application</CardTitle>
                <CardDescription className="text-sm">
                  Start a new visa application
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleQuickAction('upload-documents')}
            >
              <CardHeader>
                <Upload className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-base">Upload Documents</CardTitle>
                <CardDescription className="text-sm">
                  Upload required documents
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleQuickAction('book-appointment')}
            >
              <CardHeader>
                <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-base">Book Appointment</CardTitle>
                <CardDescription className="text-sm">
                  Schedule consulate appointment
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleQuickAction('job-search')}
            >
              <CardHeader>
                <Briefcase className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle className="text-base">Job Search</CardTitle>
                <CardDescription className="text-sm">
                  Find visa-sponsoring jobs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/dashboard/applications')}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.slice(0, 3).map((app) => (
                <ApplicationCard 
                  key={app.id}
                  application={app}
                  onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                  compact
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No applications yet</p>
                <p className="text-sm text-gray-400 mt-2">Start your visa journey today</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/dashboard/applications/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Application
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Documents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/dashboard/documents')}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          {documents.length > 0 ? (
            <DocumentList 
              documents={documents} 
              onUpload={() => router.push('/dashboard/documents')}
              compact
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No documents uploaded</p>
                <p className="text-sm text-gray-400 mt-2">Upload your visa documents</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/dashboard/documents')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              Important deadlines and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DemoService.isDemoMode() ? (
                <>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Upload biometric photo</p>
                      <p className="text-xs text-gray-500">Due in 3 days • Work Visa Application</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Consulate appointment</p>
                      <p className="text-xs text-gray-500">March 15, 2025 at 10:00 AM</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No upcoming tasks</p>
                  <p className="text-sm mt-2">Tasks will appear as you progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Notice */}
        {DemoService.isDemoMode() && (
          <Alert className="mt-8" variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              This is a demo version. To use all features, please set up your Supabase database and API keys.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  )
}