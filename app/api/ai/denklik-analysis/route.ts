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
    const { profession, education, targetState } = await request.json()

    if (!profession || !education || !targetState) {
      return NextResponse.json(
        { error: 'Profession, education, and target state are required' },
        { status: 400 }
      )
    }

    // Validate education object
    if (!education.degree || !education.field || !education.country || education.duration === undefined) {
      return NextResponse.json(
        { error: 'Education must include degree, field, country, and duration' },
        { status: 400 }
      )
    }

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const startTime = Date.now()

    try {
      // Analyze denklik with AI
      const analysis = await aiService.analyzeDenklik(
        profession,
        education,
        targetState
      )

      const processingTime = Date.now() - startTime

      // Store analysis in database
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('ai_analyses')
        .insert({
          entity_type: 'denklik',
          entity_id: user.id,
          ai_provider: 'claude',
          analysis_type: 'denklik-analysis',
          input_data: {
            profession,
            education,
            targetState
          },
          result: analysis,
          confidence_score: (analysis.professionMatch + analysis.recognitionProbability) / 200,
          processing_time_ms: processingTime,
          tokens_used: 0, // TODO: Get actual token count from Claude
          cost: 0 // TODO: Calculate actual cost
        })
        .select()
        .single()

      if (analysisError) {
        console.error('Failed to store analysis:', analysisError)
      }

      // If user has active application, update it
      const { data: activeApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (activeApplication) {
        await supabase
          .from('applications')
          .update({
            denklik_analysis: analysis,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeApplication.id)
      }

      // Create or update denklik record
      const { error: denklikError } = await supabase
        .from('denklik_processes')
        .upsert({
          user_id: user.id,
          profession,
          education_level: education.degree,
          target_state: targetState,
          recognition_probability: analysis.recognitionProbability,
          required_steps: analysis.requiredSteps,
          estimated_duration: analysis.estimatedDuration,
          status: 'pending',
          ai_analysis_id: analysisRecord?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,profession'
        })

      if (denklikError) {
        console.error('Failed to store denklik process:', denklikError)
      }

      return NextResponse.json({
        success: true,
        analysis: {
          professionMatch: analysis.professionMatch,
          recognitionProbability: analysis.recognitionProbability,
          requiredSteps: analysis.requiredSteps,
          estimatedDuration: analysis.estimatedDuration,
          additionalQualifications: analysis.additionalQualifications,
          recommendations: analysis.recommendations,
          analysisId: analysisRecord?.id
        },
        message: 'Denklik analysis completed successfully'
      })

    } catch (analysisError) {
      console.error('Denklik analysis error:', analysisError)
      
      // Try to provide a meaningful error message
      const errorMessage = analysisError instanceof Error ? 
        analysisError.message : 'Failed to analyze denklik requirements'
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: 'The AI service encountered an error while analyzing your credentials'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Denklik analysis request error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}

// GET endpoint to retrieve previous analyses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profession from query params
    const { searchParams } = new URL(request.url)
    const profession = searchParams.get('profession')

    let query = supabase
      .from('denklik_processes')
      .select(`
        *,
        ai_analysis:ai_analysis_id (
          result,
          confidence_score,
          created_at
        )
      `)
      .eq('user_id', user.id)

    if (profession) {
      query = query.eq('profession', profession)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      analyses: data || []
    })

  } catch (error) {
    console.error('Failed to retrieve denklik analyses:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analyses' },
      { status: 500 }
    )
  }
}