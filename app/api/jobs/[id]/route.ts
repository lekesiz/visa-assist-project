import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobScraper } from '@/lib/jobs/scraper'

// GET - Get job details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the job ID (format: provider-jobId)
    const [provider, ...jobIdParts] = params.id.split('-')
    const jobId = jobIdParts.join('-')

    if (!provider || !jobId) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      )
    }

    // Get job details from provider
    const job = await jobScraper.getJobDetails(provider, jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if user has already applied
    const { data: application } = await supabase
      .from('job_applications')
      .select('id, status, applied_date')
      .eq('user_id', user.id)
      .eq('job_id', params.id)
      .single()

    // Get user's match score for this job
    let matchScore = null
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile && profile.skills) {
      // Calculate basic match score
      const userSkills = profile.skills || []
      const jobSkills = job.skills || []
      const matchingSkills = userSkills.filter(skill => 
        jobSkills.some(jSkill => 
          jSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(jSkill.toLowerCase())
        )
      )
      
      matchScore = jobSkills.length > 0 
        ? Math.round((matchingSkills.length / jobSkills.length) * 100)
        : 50
    }

    // Log job view
    await supabase
      .from('job_views')
      .insert({
        user_id: user.id,
        job_id: params.id,
        provider,
        job_title: job.title,
        company: job.company
      })

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        hasApplied: !!application,
        applicationStatus: application?.status,
        appliedDate: application?.applied_date,
        matchScore,
        viewCount: 1 // Would be aggregated from job_views table
      }
    })

  } catch (error) {
    console.error('Failed to fetch job details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job details' },
      { status: 500 }
    )
  }
}

// POST - Save/bookmark a job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notes } = body

    if (action === 'save') {
      // Save/bookmark the job
      const { data, error } = await supabase
        .from('saved_jobs')
        .upsert({
          user_id: user.id,
          job_id: params.id,
          notes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,job_id'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: 'Job saved successfully',
        savedJob: data
      })

    } else if (action === 'apply') {
      // Track job application
      const { data: existingApp } = await supabase
        .from('job_applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', params.id)
        .single()

      if (existingApp) {
        return NextResponse.json({
          success: false,
          message: 'You have already applied to this job'
        })
      }

      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          user_id: user.id,
          job_id: params.id,
          status: 'applied',
          applied_date: new Date().toISOString(),
          notes
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'job_application',
          title: 'Job Application Tracked',
          message: `Your application for ${params.id} has been recorded`,
          data: { job_id: params.id }
        })

      return NextResponse.json({
        success: true,
        message: 'Application tracked successfully',
        application: data
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Failed to save job:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// DELETE - Remove saved job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Job removed from saved list'
    })

  } catch (error) {
    console.error('Failed to remove saved job:', error)
    return NextResponse.json(
      { error: 'Failed to remove job' },
      { status: 500 }
    )
  }
}