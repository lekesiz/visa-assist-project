import { IndeedScraper } from './providers/indeed'
import { StepStoneScraper } from './providers/stepstone'
import { LinkedInScraper } from './providers/linkedin'
import { JobListing, JobSearchParams, JobProvider } from './types'

export class JobScraperService {
  private providers: Record<string, JobProvider>

  constructor() {
    this.providers = {
      indeed: new IndeedScraper(),
      stepstone: new StepStoneScraper(),
      linkedin: new LinkedInScraper()
    }
  }

  /**
   * Search for jobs across all providers
   */
  async searchAllProviders(params: JobSearchParams): Promise<JobListing[]> {
    const allJobs: JobListing[] = []
    const errors: Array<{ provider: string; error: string }> = []

    // Search in parallel across all providers
    const searchPromises = Object.entries(this.providers).map(async ([providerName, provider]) => {
      try {
        console.log(`Searching jobs on ${providerName}...`)
        const jobs = await provider.searchJobs(params)
        return { provider: providerName, jobs, error: null }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error searching ${providerName}:`, errorMessage)
        return { provider: providerName, jobs: [], error: errorMessage }
      }
    })

    const results = await Promise.all(searchPromises)

    // Collect jobs and errors
    results.forEach(result => {
      if (result.error) {
        errors.push({ provider: result.provider, error: result.error })
      } else {
        allJobs.push(...result.jobs)
      }
    })

    // Remove duplicates based on title and company
    const uniqueJobs = this.deduplicateJobs(allJobs)

    // Sort by posted date (most recent first)
    uniqueJobs.sort((a, b) => {
      const dateA = new Date(a.postedDate).getTime()
      const dateB = new Date(b.postedDate).getTime()
      return dateB - dateA
    })

    console.log(`Found ${uniqueJobs.length} unique jobs from ${Object.keys(this.providers).length} providers`)
    
    if (errors.length > 0) {
      console.warn('Some providers had errors:', errors)
    }

    return uniqueJobs
  }

  /**
   * Search jobs from specific providers
   */
  async searchProviders(
    providers: string[], 
    params: JobSearchParams
  ): Promise<JobListing[]> {
    const allJobs: JobListing[] = []

    const searchPromises = providers
      .filter(p => this.providers[p])
      .map(async providerName => {
        try {
          const jobs = await this.providers[providerName].searchJobs(params)
          return jobs
        } catch (error) {
          console.error(`Error searching ${providerName}:`, error)
          return []
        }
      })

    const results = await Promise.all(searchPromises)
    results.forEach(jobs => allJobs.push(...jobs))

    return this.deduplicateJobs(allJobs)
  }

  /**
   * Get job details from a specific provider
   */
  async getJobDetails(provider: string, jobId: string): Promise<JobListing | null> {
    if (!this.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`)
    }

    return this.providers[provider].getJobDetails(jobId)
  }

  /**
   * Parse job URL and extract provider and job ID
   */
  async parseJobUrl(url: string): Promise<{ provider: string; jobId: string } | null> {
    // Determine provider from URL
    let provider: string | null = null
    
    if (url.includes('indeed.com')) {
      provider = 'indeed'
    } else if (url.includes('stepstone.de')) {
      provider = 'stepstone'
    } else if (url.includes('linkedin.com')) {
      provider = 'linkedin'
    }

    if (!provider || !this.providers[provider]) {
      return null
    }

    const jobId = await this.providers[provider].parseJobUrl(url)
    
    return jobId ? { provider, jobId } : null
  }

  /**
   * Remove duplicate jobs based on title and company
   */
  private deduplicateJobs(jobs: JobListing[]): JobListing[] {
    const seen = new Set<string>()
    const unique: JobListing[] = []

    jobs.forEach(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}-${job.location.toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(job)
      }
    })

    return unique
  }

  /**
   * Filter jobs by visa sponsorship
   */
  filterByVisaSponsorship(jobs: JobListing[]): JobListing[] {
    return jobs.filter(job => job.visaSponsorship === true)
  }

  /**
   * Filter jobs by language requirements
   */
  filterByLanguage(
    jobs: JobListing[], 
    language: string, 
    minLevel: string
  ): JobListing[] {
    const levelHierarchy = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']
    const minLevelIndex = levelHierarchy.indexOf(minLevel)

    return jobs.filter(job => {
      if (!job.languages) return true // No language requirement specified

      const langRequirement = job.languages.find(
        l => l.language.toLowerCase() === language.toLowerCase()
      )
      
      if (!langRequirement) return true // Language not required

      const requiredLevelIndex = levelHierarchy.indexOf(langRequirement.level)
      return requiredLevelIndex <= minLevelIndex
    })
  }

  /**
   * Get available job providers
   */
  getAvailableProviders(): string[] {
    return Object.keys(this.providers)
  }

  /**
   * Add a custom job provider
   */
  addProvider(name: string, provider: JobProvider): void {
    this.providers[name] = provider
  }
}

// Export singleton instance
export const jobScraper = new JobScraperService()