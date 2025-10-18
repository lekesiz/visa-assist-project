import axios from 'axios'
import { JobListing, JobProvider } from '../types'

export class IndeedScraper implements JobProvider {
  private baseUrl = 'https://de.indeed.com'
  private apiKey = process.env.INDEED_API_KEY

  async searchJobs(params: {
    keywords: string[]
    location: string
    radius?: number
    jobType?: string[]
    experience?: string
    salary?: { min?: number; max?: number }
    limit?: number
  }): Promise<JobListing[]> {
    try {
      // Indeed doesn't have a public API anymore, so we'll simulate the structure
      // In production, you would need to use web scraping with proper rate limiting
      // or partner with Indeed for API access

      const mockJobs: JobListing[] = [
        {
          id: `indeed-${Date.now()}-1`,
          provider: 'indeed',
          title: 'Software Developer',
          company: 'Tech GmbH',
          location: params.location || 'Berlin, Germany',
          description: 'We are looking for a talented software developer...',
          requirements: [
            'Bachelor degree in Computer Science or related field',
            'German language skills (B2)',
            'Experience with JavaScript/TypeScript'
          ],
          salary: {
            min: 50000,
            max: 70000,
            currency: 'EUR',
            period: 'year'
          },
          employmentType: 'full-time',
          experienceLevel: 'mid-level',
          postedDate: new Date().toISOString(),
          applicationUrl: `${this.baseUrl}/viewjob?jk=mock123`,
          benefits: [
            '30 days vacation',
            'Home office possibility',
            'Public transport ticket'
          ],
          languages: [
            { language: 'German', level: 'B2' },
            { language: 'English', level: 'B1' }
          ],
          visaSponsorship: true,
          remoteOption: 'hybrid'
        }
      ]

      // Filter based on parameters
      return this.filterJobs(mockJobs, params)
    } catch (error) {
      console.error('Indeed scraping error:', error)
      throw new Error('Failed to fetch jobs from Indeed')
    }
  }

  async getJobDetails(jobId: string): Promise<JobListing | null> {
    try {
      // In production, this would fetch detailed job information
      return {
        id: jobId,
        provider: 'indeed',
        title: 'Software Developer',
        company: 'Tech GmbH',
        location: 'Berlin, Germany',
        description: 'Detailed job description...',
        requirements: ['Requirement 1', 'Requirement 2'],
        employmentType: 'full-time',
        postedDate: new Date().toISOString(),
        applicationUrl: `${this.baseUrl}/viewjob?jk=${jobId}`,
        visaSponsorship: true
      }
    } catch (error) {
      console.error('Indeed job details error:', error)
      return null
    }
  }

  private filterJobs(jobs: JobListing[], params: any): JobListing[] {
    return jobs.filter(job => {
      // Filter by keywords
      if (params.keywords && params.keywords.length > 0) {
        const jobText = `${job.title} ${job.description} ${job.company}`.toLowerCase()
        const hasKeyword = params.keywords.some((keyword: string) => 
          jobText.includes(keyword.toLowerCase())
        )
        if (!hasKeyword) return false
      }

      // Filter by job type
      if (params.jobType && params.jobType.length > 0) {
        if (!params.jobType.includes(job.employmentType)) return false
      }

      // Filter by salary
      if (params.salary) {
        if (params.salary.min && job.salary?.min && job.salary.min < params.salary.min) {
          return false
        }
        if (params.salary.max && job.salary?.max && job.salary.max > params.salary.max) {
          return false
        }
      }

      return true
    })
  }

  async parseJobUrl(url: string): Promise<string | null> {
    // Extract job ID from Indeed URL
    const match = url.match(/jk=([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }
}