import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobScraper } from '@/lib/jobs/scraper'

// GET - Get all saved jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'saved_at'

    // Get saved jobs
    const { data: savedJobs, error, count } = await supabase
      .from('saved_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Fetch job details for each saved job
    const jobDetailsPromises = savedJobs?.map(async (savedJob) => {
      try {
        const [provider, ...jobIdParts] = savedJob.job_id.split('-')
        const jobId = jobIdParts.join('-')
        
        const jobDetails = await jobScraper.getJobDetails(provider, jobId)
        
        return {
          ...savedJob,
          job: jobDetails,
          isExpired: jobDetails ? false : true
        }
      } catch (error) {
        console.error(`Failed to fetch job ${savedJob.job_id}:`, error)
        return {
          ...savedJob,
          job: null,
          isExpired: true
        }
      }
    }) || []

    const jobsWithDetails = await Promise.all(jobDetailsPromises)

    // Filter out expired jobs if requested
    const activeJobs = jobsWithDetails.filter(item => !item.isExpired)

    return NextResponse.json({
      success: true,
      savedJobs: jobsWithDetails,
      activeCount: activeJobs.length,
      expiredCount: jobsWithDetails.length - activeJobs.length,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Failed to fetch saved jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    )
  }
}

// POST - Bulk operations on saved jobs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, jobIds } = await request.json()

    if (!action || !jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json(
        { error: 'Action and job IDs are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'remove':
        // Remove multiple saved jobs
        const { error: deleteError } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .in('job_id', jobIds)

        if (deleteError) {
          throw deleteError
        }

        return NextResponse.json({
          success: true,
          message: `Removed ${jobIds.length} jobs from saved list`
        })

      case 'apply':
        // Track applications for multiple jobs
        const applications = jobIds.map(jobId => ({
          user_id: user.id,
          job_id: jobId,
          status: 'applied',
          applied_date: new Date().toISOString()
        }))

        const { data, error: applyError } = await supabase
          .from('job_applications')
          .upsert(applications, {
            onConflict: 'user_id,job_id'
          })
          .select()

        if (applyError) {
          throw applyError
        }

        return NextResponse.json({
          success: true,
          message: `Applied to ${data?.length || 0} jobs`,
          applications: data
        })

      case 'export':
        // Export saved jobs data
        const { data: exportJobs } = await supabase
          .from('saved_jobs')
          .select('*')
          .eq('user_id', user.id)
          .in('job_id', jobIds)

        // Fetch full job details
        const exportData = await Promise.all(
          exportJobs?.map(async (savedJob) => {
            const [provider, ...jobIdParts] = savedJob.job_id.split('-')
            const jobId = jobIdParts.join('-')
            const job = await jobScraper.getJobDetails(provider, jobId)
            return {
              title: job?.title || 'Unknown',
              company: job?.company || 'Unknown',
              location: job?.location || 'Unknown',
              url: job?.applicationUrl || '',
              savedDate: savedJob.created_at,
              notes: savedJob.notes
            }
          }) || []
        )

        return NextResponse.json({
          success: true,
          data: exportData
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Failed to process bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}