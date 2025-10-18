'use client'

import { useEffect, useState } from 'react'
import { ApplicationList } from '@/components/applications/ApplicationList'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { mockApplications } from '@/lib/demo/mock-data'

interface Application {
  id: string
  user_id: string
  type: 'work' | 'student' | 'tourist' | 'business' | 'family'
  status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  destination_country: string
  created_at: string
  updated_at: string
  submitted_at?: string
  travel_date?: string
  return_date?: string
  purpose?: string
  notes?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchApplications()
  }, [])

  async function fetchApplications() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Use mock data in demo mode
        setApplications(mockApplications as Application[])
      } else {
        // Fetch real data from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setApplications(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewApplication = () => {
    router.push('/dashboard/applications/new')
  }

  const handleViewApplication = (id: string) => {
    router.push(`/dashboard/applications/${id}`)
  }

  const handleDeleteApplication = async (id: string) => {
    try {
      if (DemoService.isDemoMode()) {
        // In demo mode, just filter out the application
        setApplications(prev => prev.filter(app => app.id !== id))
        return
      }

      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Refresh the list
      await fetchApplications()
    } catch (error) {
      console.error('Failed to delete application:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visa Applications</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your visa applications
          </p>
        </div>
        <Button onClick={handleNewApplication} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          New Application
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: applications.length, color: 'bg-blue-100 text-blue-700' },
          { label: 'In Progress', value: applications.filter(a => a.status === 'in_progress').length, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Approved', value: applications.filter(a => a.status === 'approved').length, color: 'bg-green-100 text-green-700' },
          { label: 'Submitted', value: applications.filter(a => a.status === 'submitted').length, color: 'bg-purple-100 text-purple-700' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <ApplicationList />
    </div>
  )
}