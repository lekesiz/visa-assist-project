export interface JobListing {
  id: string
  provider: 'indeed' | 'stepstone' | 'linkedin' | 'custom'
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  salary?: {
    min?: number
    max?: number
    currency: string
    period: 'hour' | 'day' | 'month' | 'year'
  }
  employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
  experienceLevel?: 'entry' | 'mid-level' | 'senior' | 'lead' | 'executive'
  postedDate: string
  applicationDeadline?: string
  applicationUrl: string
  applicationEmail?: string
  benefits?: string[]
  languages?: Array<{
    language: string
    level: string
  }>
  skills?: string[]
  visaSponsorship: boolean
  remoteOption?: 'no' | 'occasional' | 'hybrid' | 'flexible' | 'full'
  industry?: string
  companySize?: string
  companyDescription?: string
  applicantCount?: number
  easyApply?: boolean
  hiringManagerInfo?: {
    name: string
    title: string
    linkedinUrl?: string
  }
  similarJobs?: string[]
}

export interface JobSearchParams {
  keywords: string[]
  location: string
  radius?: number // in km
  jobType?: string[]
  experienceLevel?: string
  salary?: {
    min?: number
    max?: number
    currency?: string
  }
  datePosted?: 'today' | 'week' | 'month' | 'any'
  visaSponsorship?: boolean
  remoteOnly?: boolean
  languages?: Array<{
    language: string
    minLevel: string
  }>
  industries?: string[]
  companies?: string[]
  excludeCompanies?: string[]
  limit?: number
  offset?: number
}

export interface JobProvider {
  searchJobs(params: JobSearchParams): Promise<JobListing[]>
  getJobDetails(jobId: string): Promise<JobListing | null>
  parseJobUrl(url: string): Promise<string | null>
}

export interface JobMatch {
  job: JobListing
  matchScore: number
  matchReasons: {
    skills: number
    experience: number
    language: number
    location: number
    salary: number
    visa: number
  }
  missingRequirements: string[]
  recommendations: string[]
}

export interface JobApplication {
  id: string
  userId: string
  jobId: string
  job: JobListing
  appliedDate: string
  status: 'draft' | 'applied' | 'in_review' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  notes?: string
  coverLetter?: string
  resume?: string
  followUpDates?: string[]
  interviewDates?: Array<{
    date: string
    type: string
    notes?: string
  }>
  offerDetails?: {
    salary: number
    startDate: string
    benefits: string[]
  }
}

export interface JobAlert {
  id: string
  userId: string
  name: string
  searchParams: JobSearchParams
  frequency: 'instant' | 'daily' | 'weekly'
  isActive: boolean
  lastRun?: string
  lastMatchCount?: number
  createdAt: string
}