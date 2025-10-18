import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/provider'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request data
    const { jobId, userProfile: providedProfile, jobRequirements } = await request.json()

    // Get user profile if not provided
    let userProfile = providedProfile
    if (!userProfile) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'User profile not found. Please complete your profile first.' },
          { status: 400 }
        )
      }

      // Transform profile data for AI
      userProfile = {
        skills: profile.skills || [],
        experience: profile.work_experience || [],
        education: profile.highest_degree || 'Unknown',
        languages: [
          { language: 'Turkish', level: 'Native' },
          { language: 'German', level: profile.german_level || 'A1' },
          { language: 'English', level: profile.english_level || 'A1' }
        ],
        targetPosition: profile.desired_position || 'Not specified'
      }
    }

    // Get job details if jobId provided
    let jobDetails = jobRequirements
    if (jobId && !jobRequirements) {
      const { data: job, error: jobError } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      // Transform job data for AI
      jobDetails = {
        requiredSkills: job.required_skills || [],
        requiredExperience: job.experience_required || '0 years',
        requiredEducation: job.education_requirements || 'Any',
        languageRequirements: job.language_requirements || [
          { language: 'German', level: 'B2' }
        ]
      }
    }

    if (!jobDetails) {
      return NextResponse.json(
        { error: 'Job requirements must be provided' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    try {
      // Perform job matching analysis
      const matchResult = await aiService.matchJobs(userProfile, jobDetails)

      const processingTime = Date.now() - startTime

      // Store analysis in database
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('ai_analyses')
        .insert({
          entity_type: 'job_match',
          entity_id: jobId || user.id,
          ai_provider: 'claude',
          analysis_type: 'job-matching',
          input_data: {
            userProfile,
            jobRequirements: jobDetails
          },
          result: matchResult,
          confidence_score: matchResult.matchScore / 100,
          processing_time_ms: processingTime,
          tokens_used: 0, // TODO: Get actual token count
          cost: 0 // TODO: Calculate actual cost
        })
        .select()
        .single()

      if (analysisError) {
        console.error('Failed to store analysis:', analysisError)
      }

      // If this is for a specific job, create a job match record
      if (jobId) {
        const { error: matchError } = await supabase
          .from('job_matches')
          .insert({
            user_id: user.id,
            job_id: jobId,
            match_score: matchResult.matchScore,
            strengths: matchResult.strengths,
            gaps: matchResult.gaps,
            ai_analysis_id: analysisRecord?.id,
            status: matchResult.matchScore >= 70 ? 'high_match' : 
                   matchResult.matchScore >= 50 ? 'medium_match' : 'low_match'
          })

        if (matchError) {
          console.error('Failed to store job match:', matchError)
        }
      }

      // Determine action items based on match score
      let actionItems: string[] = []
      if (matchResult.matchScore < 50) {
        actionItems = [
          'Consider gaining more relevant experience',
          'Improve German language skills',
          'Acquire missing technical skills'
        ]
      } else if (matchResult.matchScore < 70) {
        actionItems = [
          'Focus on addressing the identified gaps',
          'Highlight your strengths in application',
          'Prepare for skill-based interview questions'
        ]
      } else {
        actionItems = [
          'Apply with confidence',
          'Prepare strong examples of your experience',
          'Research the company culture'
        ]
      }

      // Prepare response
      const response = {
        success: true,
        match: {
          score: matchResult.matchScore,
          strengths: matchResult.strengths,
          gaps: matchResult.gaps,
          recommendations: matchResult.improvementSuggestions,
          applicationTips: matchResult.applicationTips,
          overallAssessment: getMatchAssessment(matchResult.matchScore),
          analysisId: analysisRecord?.id,
          actionItems
        }
      }

      return NextResponse.json(response)

    } catch (analysisError) {
      console.error('Job matching error:', analysisError)
      
      return NextResponse.json(
        { 
          error: 'Failed to analyze job match',
          details: 'The AI service encountered an error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Job match request error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}

// GET endpoint to retrieve job matches
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('job_matches')
      .select(`
        *,
        job:job_id (
          id,
          title,
          company,
          location,
          salary_range,
          employment_type
        ),
        analysis:ai_analysis_id (
          result,
          created_at
        )
      `)
      .eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('match_score', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      matches: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Failed to retrieve job matches:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve matches' },
      { status: 500 }
    )
  }
}

// Helper function to get match assessment
function getMatchAssessment(score: number): string {
  if (score >= 80) return 'Excellent match! You meet or exceed most requirements.'
  if (score >= 70) return 'Good match! You meet the core requirements.'
  if (score >= 60) return 'Fair match. Some skill development needed.'
  if (score >= 50) return 'Moderate match. Consider upskilling in key areas.'
  return 'Low match. Significant preparation needed.'
}