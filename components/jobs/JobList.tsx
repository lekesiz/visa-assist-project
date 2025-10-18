'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Globe,
  Heart,
  HeartOff,
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { JobCard } from './JobCard'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  country: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  salary?: {
    min: number
    max: number
    currency: string
    period?: 'yearly' | 'monthly' | 'hourly'
  }
  description: string
  requirements: string[]
  benefits?: string[]
  visaSponsorship: boolean
  remote: boolean
  industry: string
  companySize?: string
  posted_at: string
  deadline?: string
  applicants?: number
  url?: string
  saved?: boolean
  applied?: boolean
  matchScore?: number
  languages?: string[]
  skills?: string[]
}

interface JobListProps {
  filters?: any
  userId?: string
  showFilters?: boolean
  viewMode?: 'grid' | 'list'
  onJobClick?: (job: Job) => void
  onSaveJob?: (jobId: string) => void
  onApplyJob?: (jobId: string) => void
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'TechCorp GmbH',
    location: 'Berlin',
    country: 'Germany',
    type: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 70000,
      max: 90000,
      currency: 'EUR',
      period: 'yearly'
    },
    description: 'We are looking for a Senior Software Engineer to join our growing team in Berlin.',
    requirements: [
      '5+ years of experience in software development',
      'Strong knowledge of React and Node.js',
      'Experience with cloud platforms (AWS/GCP)',
      'Fluent in English'
    ],
    benefits: [
      'Visa sponsorship',
      '30 days vacation',
      'Health insurance',
      'Flexible working hours',
      'Home office option'
    ],
    visaSponsorship: true,
    remote: true,
    industry: 'Technology',
    companySize: 'medium',
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 45,
    matchScore: 92,
    languages: ['english', 'german'],
    skills: ['React', 'Node.js', 'AWS', 'TypeScript']
  },
  {
    id: '2',
    title: 'Data Scientist',
    company: 'DataTech Solutions',
    location: 'Munich',
    country: 'Germany',
    type: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 60000,
      max: 80000,
      currency: 'EUR',
      period: 'yearly'
    },
    description: 'Join our data science team to work on cutting-edge ML projects.',
    requirements: [
      '3+ years in data science',
      'Python and R proficiency',
      'Machine learning experience',
      'Good communication skills'
    ],
    visaSponsorship: true,
    remote: false,
    industry: 'Technology',
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 67,
    matchScore: 85,
    skills: ['Python', 'R', 'TensorFlow', 'SQL']
  },
  {
    id: '3',
    title: 'Product Manager',
    company: 'FinTech Innovations',
    location: 'Frankfurt',
    country: 'Germany',
    type: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 85000,
      max: 110000,
      currency: 'EUR',
      period: 'yearly'
    },
    description: 'Lead product development for our innovative fintech platform.',
    requirements: [
      '5+ years in product management',
      'Experience in fintech',
      'Strong analytical skills',
      'MBA preferred'
    ],
    visaSponsorship: true,
    remote: true,
    industry: 'Finance',
    posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 23,
    saved: true,
    matchScore: 78
  }
]

export function JobList({
  filters,
  userId,
  showFilters = false,
  viewMode: initialViewMode = 'list',
  onJobClick,
  onSaveJob,
  onApplyJob
}: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const jobsPerPage = 10
  const supabase = createClient()

  useEffect(() => {
    fetchJobs()
  }, [filters, currentPage])

  async function fetchJobs() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Use mock data in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        setJobs(mockJobs)
        setTotalJobs(mockJobs.length)
      } else {
        // Fetch real jobs from API
        const response = await fetch('/api/jobs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters,
            page: currentPage,
            limit: jobsPerPage
          })
        })

        const data = await response.json()
        if (data.success) {
          setJobs(data.jobs)
          setTotalJobs(data.total)
        }
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    try {
      // Update local state optimistically
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, saved: !job.saved } : job
      ))

      if (!DemoService.isDemoMode()) {
        // Save to database
        const job = jobs.find(j => j.id === jobId)
        if (job?.saved) {
          await supabase
            .from('saved_jobs')
            .delete()
            .eq('job_id', jobId)
            .eq('user_id', userId)
        } else {
          await supabase
            .from('saved_jobs')
            .insert({
              job_id: jobId,
              user_id: userId
            })
        }
      }

      onSaveJob?.(jobId)
    } catch (error) {
      console.error('Failed to save job:', error)
      // Revert optimistic update
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, saved: !job.saved } : job
      ))
    }
  }

  const totalPages = Math.ceil(totalJobs / jobsPerPage)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search filters to find more opportunities
          </p>
          <Button onClick={() => window.location.reload()}>
            Reset Filters
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {totalJobs} visa-sponsoring jobs found
          </h3>
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * jobsPerPage + 1}-{Math.min(currentPage * jobsPerPage, totalJobs)} results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </Button>
        </div>
      </div>

      {/* AI Match Score Alert */}
      {jobs.some(job => job.matchScore && job.matchScore > 80) && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Great matches found!</strong> We've identified jobs that match your profile above 80%.
          </AlertDescription>
        </Alert>
      )}

      {/* Job List/Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
        {jobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            variant={viewMode}
            onSave={() => handleSaveJob(job.id)}
            onApply={() => onApplyJob?.(job.id)}
            onClick={() => onJobClick?.(job)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1
              if (pageNum > totalPages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Job Statistics Component
interface JobStatsProps {
  jobs: Job[]
}

export function JobStats({ jobs }: JobStatsProps) {
  const stats = {
    total: jobs.length,
    withVisa: jobs.filter(j => j.visaSponsorship).length,
    remote: jobs.filter(j => j.remote).length,
    saved: jobs.filter(j => j.saved).length,
    applied: jobs.filter(j => j.applied).length,
    avgSalary: jobs.reduce((sum, job) => {
      if (job.salary) {
        return sum + (job.salary.min + job.salary.max) / 2
      }
      return sum
    }, 0) / jobs.filter(j => j.salary).length
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Jobs</p>
            </div>
            <Briefcase className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.withVisa}</p>
              <p className="text-xs text-gray-500">Visa Sponsorship</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.remote}</p>
              <p className="text-xs text-gray-500">Remote</p>
            </div>
            <Globe className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">€{Math.round(stats.avgSalary / 1000)}k</p>
              <p className="text-xs text-gray-500">Avg. Salary</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.saved}</p>
              <p className="text-xs text-gray-500">Saved</p>
            </div>
            <Heart className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.applied}</p>
              <p className="text-xs text-gray-500">Applied</p>
            </div>
            <Send className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}