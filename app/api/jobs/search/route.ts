import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobScraper } from '@/lib/jobs/scraper'
import { aiService } from '@/lib/ai/provider'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      keywords = [],
      location = 'Germany',
      radius,
      jobType,
      experienceLevel,
      salary,
      datePosted,
      visaSponsorship,
      remoteOnly,
      languages,
      industries,
      companies,
      excludeCompanies,
      providers = ['indeed', 'stepstone', 'linkedin'],
      limit = 20,
      offset = 0,
      saveSearch = false,
      searchName
    } = body

    // Get user profile for better matching
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Build search parameters
    const searchParams = {
      keywords,
      location,
      radius,
      jobType,
      experienceLevel,
      salary,
      datePosted,
      visaSponsorship,
      remoteOnly,
      languages,
      industries,
      companies,
      excludeCompanies,
      limit: limit + 10, // Get extra to account for filtering
      offset
    }

    // Log search
    await supabase
      .from('job_searches')
      .insert({
        user_id: user.id,
        search_params: searchParams,
        providers,
        result_count: 0 // Will update after search
      })

    // Search jobs from specified providers
    const jobs = await jobScraper.searchProviders(providers, searchParams)

    // Filter by visa sponsorship if specified
    let filteredJobs = visaSponsorship ? 
      jobScraper.filterByVisaSponsorship(jobs) : jobs

    // Filter by language requirements if user has language constraints
    if (profile && profile.german_level) {
      filteredJobs = jobScraper.filterByLanguage(
        filteredJobs, 
        'German', 
        profile.german_level
      )
    }

    // AI-powered job matching if profile is complete
    let matchedJobs = filteredJobs
    if (profile && profile.skills && profile.current_occupation) {
      const userProfileData = {
        skills: profile.skills,
        experience: profile.work_experience || [],
        education: profile.highest_degree,
        languages: [
          { language: 'German', level: profile.german_level || 'A1' },
          { language: 'English', level: profile.english_level || 'A1' }
        ],
        targetPosition: profile.desired_position || keywords.join(' ')
      }

      // Score each job
      const scoredJobs = await Promise.all(
        filteredJobs.slice(0, limit).map(async job => {
          try {
            const jobRequirements = {
              requiredSkills: job.skills || [],
              requiredExperience: job.experienceLevel || 'any',
              requiredEducation: 'any',
              languageRequirements: job.languages || []
            }

            const matchResult = await aiService.matchJobs(
              userProfileData, 
              jobRequirements
            )

            return {
              ...job,
              matchScore: matchResult.matchScore,
              matchDetails: {
                strengths: matchResult.strengths.slice(0, 3),
                gaps: matchResult.gaps.slice(0, 3)
              }
            }
          } catch (error) {
            console.error('Job matching error:', error)
            return { ...job, matchScore: 50 } // Default score on error
          }
        })
      )

      // Sort by match score
      matchedJobs = scoredJobs.sort((a, b) => 
        (b.matchScore || 0) - (a.matchScore || 0)
      )
    }

    // Save search if requested
    if (saveSearch && searchName) {
      await supabase
        .from('job_alerts')
        .insert({
          user_id: user.id,
          name: searchName,
          search_params: searchParams,
          frequency: 'weekly',
          is_active: true,
          providers
        })
    }

    // Update search log with results
    await supabase
      .from('job_searches')
      .update({ result_count: matchedJobs.length })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    // Store top jobs in cache for quick access
    if (matchedJobs.length > 0) {
      const topJobs = matchedJobs.slice(0, 5)
      await supabase
        .from('job_recommendations')
        .upsert({
          user_id: user.id,
          jobs: topJobs,
          search_params: searchParams,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    }

    return NextResponse.json({
      success: true,
      jobs: matchedJobs.slice(0, limit),
      totalFound: filteredJobs.length,
      hasMore: filteredJobs.length > limit + offset,
      providers,
      searchId: crypto.randomUUID()
    })

  } catch (error) {
    console.error('Job search error:', error)
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    )
  }
}

// GET - Get saved job searches/alerts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: alerts, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    })

  } catch (error) {
    console.error('Failed to fetch job alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job alerts' },
      { status: 500 }
    )
  }
}