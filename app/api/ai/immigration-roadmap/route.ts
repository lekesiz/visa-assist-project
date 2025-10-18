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
    const requestData = await request.json()

    // Get user profile for context
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

    // Get user's current application status
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Prepare user profile for AI
    const userProfile = {
      currentSituation: requestData.currentSituation || profile.current_situation || 'Planning to immigrate',
      goals: requestData.goals || [
        profile.immigration_goal || 'Work and settle in Germany',
        'Obtain permanent residence',
        'Family reunification'
      ],
      timeline: requestData.timeline || profile.target_timeline || '6-12 months',
      constraints: requestData.constraints || [
        `Language level: ${profile.german_level || 'A1'}`,
        `Budget: ${profile.budget_range || 'Medium'}`,
        `Family: ${profile.marital_status || 'Single'}`
      ],
      resources: requestData.resources || [
        profile.highest_degree || 'Bachelor degree',
        `${profile.work_experience_years || 0} years of experience`,
        profile.has_job_offer ? 'Job offer in Germany' : 'No job offer yet'
      ]
    }

    const startTime = Date.now()

    try {
      // Generate immigration roadmap
      const roadmap = await aiService.generateRoadmap(userProfile)

      const processingTime = Date.now() - startTime

      // Store analysis in database
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('ai_analyses')
        .insert({
          entity_type: 'roadmap',
          entity_id: user.id,
          ai_provider: 'claude',
          analysis_type: 'immigration-roadmap',
          input_data: userProfile,
          result: roadmap,
          confidence_score: 0.85, // High confidence for planning
          processing_time_ms: processingTime,
          tokens_used: 0, // TODO: Get actual token count
          cost: 0 // TODO: Calculate actual cost
        })
        .select()
        .single()

      if (analysisError) {
        console.error('Failed to store analysis:', analysisError)
      }

      // Create or update roadmap record
      const { data: roadmapRecord, error: roadmapError } = await supabase
        .from('immigration_roadmaps')
        .upsert({
          user_id: user.id,
          current_phase: roadmap.phases[0]?.phase || 'Preparation',
          total_duration: roadmap.totalDuration,
          phases: roadmap.phases,
          critical_path: roadmap.criticalPath,
          alternative_routes: roadmap.alternativeRoutes,
          ai_analysis_id: analysisRecord?.id,
          status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (roadmapError) {
        console.error('Failed to store roadmap:', roadmapError)
      }

      // Update application with roadmap
      if (application) {
        await supabase
          .from('applications')
          .update({
            immigration_roadmap_id: roadmapRecord?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id)
      }

      // Calculate progress metrics
      const totalTasks = roadmap.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
      const estimatedCost = roadmap.phases.reduce((sum, phase) => {
        const cost = phase.estimatedCost.match(/€([\d,]+)/)?.[1] || '0'
        return sum + parseInt(cost.replace(/,/g, ''))
      }, 0)

      return NextResponse.json({
        success: true,
        roadmap: {
          id: roadmapRecord?.id,
          phases: roadmap.phases,
          totalDuration: roadmap.totalDuration,
          criticalPath: roadmap.criticalPath,
          alternativeRoutes: roadmap.alternativeRoutes,
          currentPhase: roadmap.phases[0],
          metrics: {
            totalPhases: roadmap.phases.length,
            totalTasks,
            estimatedCostRange: `€${estimatedCost.toLocaleString()} - €${(estimatedCost * 1.5).toLocaleString()}`,
            completionProbability: calculateCompletionProbability(userProfile)
          },
          nextSteps: roadmap.phases[0]?.tasks.slice(0, 3) || [],
          analysisId: analysisRecord?.id
        },
        message: 'Immigration roadmap generated successfully'
      })

    } catch (analysisError) {
      console.error('Roadmap generation error:', analysisError)
      
      return NextResponse.json(
        { 
          error: 'Failed to generate immigration roadmap',
          details: 'The AI service encountered an error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Roadmap request error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}

// GET endpoint to retrieve roadmaps
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active roadmap
    const { data: roadmap, error } = await supabase
      .from('immigration_roadmaps')
      .select(`
        *,
        ai_analysis:ai_analysis_id (
          result,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error
    }

    if (!roadmap) {
      return NextResponse.json({
        success: true,
        roadmap: null,
        message: 'No active roadmap found'
      })
    }

    // Calculate progress
    const completedTasks = await getCompletedTasks(supabase, user.id)
    const totalTasks = roadmap.phases.reduce((sum: number, phase: any) => sum + phase.tasks.length, 0)
    const progress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

    return NextResponse.json({
      success: true,
      roadmap: {
        ...roadmap,
        progress: Math.round(progress),
        completedTasks: completedTasks.length,
        totalTasks
      }
    })

  } catch (error) {
    console.error('Failed to retrieve roadmap:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve roadmap' },
      { status: 500 }
    )
  }
}

// PUT endpoint to update roadmap progress
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roadmapId, currentPhase, completedPhases } = await request.json()

    if (!roadmapId) {
      return NextResponse.json(
        { error: 'Roadmap ID is required' },
        { status: 400 }
      )
    }

    // Update roadmap
    const { data, error } = await supabase
      .from('immigration_roadmaps')
      .update({
        current_phase: currentPhase,
        completed_phases: completedPhases,
        updated_at: new Date().toISOString()
      })
      .eq('id', roadmapId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      roadmap: data,
      message: 'Roadmap updated successfully'
    })

  } catch (error) {
    console.error('Failed to update roadmap:', error)
    return NextResponse.json(
      { error: 'Failed to update roadmap' },
      { status: 500 }
    )
  }
}

// Helper function to calculate completion probability
function calculateCompletionProbability(userProfile: any): number {
  let probability = 50 // Base probability

  // Adjust based on timeline
  if (userProfile.timeline.includes('3-6 months')) probability += 10
  if (userProfile.timeline.includes('12+')) probability += 20

  // Adjust based on resources
  if (userProfile.resources.some((r: string) => r.includes('Job offer'))) probability += 15
  if (userProfile.resources.some((r: string) => r.includes('Master'))) probability += 10
  if (userProfile.resources.some((r: string) => r.includes('5+ years'))) probability += 10

  // Adjust based on constraints
  if (userProfile.constraints.some((c: string) => c.includes('B2') || c.includes('C1'))) probability += 10

  return Math.min(probability, 95) // Cap at 95%
}

// Helper function to get completed tasks
async function getCompletedTasks(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')

  return data || []
}