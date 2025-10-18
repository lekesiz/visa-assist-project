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

    // Get user profile
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

    // Get additional data from request if provided
    const requestData = await request.json()
    
    // Prepare user profile for AI analysis
    const userProfile = {
      education: profile.highest_degree || requestData.education || 'Unknown',
      profession: profile.current_occupation || requestData.profession || 'Unknown',
      experience: profile.work_experience_years || requestData.experience || 0,
      hasJobOffer: profile.has_job_offer || requestData.hasJobOffer || false,
      germanLevel: profile.german_level || requestData.germanLevel || 'A1',
      age: profile.birth_date ? calculateAge(profile.birth_date) : requestData.age || 25,
      nationality: requestData.nationality || 'TUR'
    }

    // Get visa recommendations from AI
    const recommendations = await aiService.getVisaRecommendations(userProfile)

    // Store the recommendations in the database
    if (requestData.applicationId) {
      await supabase
        .from('applications')
        .update({
          ai_analysis_completed: true,
          ai_recommendations: recommendations
        })
        .eq('id', requestData.applicationId)
        .eq('user_id', user.id)
    }

    // Log AI analysis
    await supabase
      .from('ai_analyses')
      .insert({
        entity_type: 'profile',
        entity_id: user.id,
        ai_provider: 'openai',
        analysis_type: 'visa-recommendations',
        input_data: userProfile,
        result: recommendations,
        confidence_score: 0.85, // Average confidence
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0
      })

    // Sort recommendations by eligibility
    const sortedRecommendations = recommendations.sort((a, b) => b.eligibility - a.eligibility)

    return NextResponse.json({
      success: true,
      recommendations: sortedRecommendations,
      userProfile,
      topRecommendation: sortedRecommendations[0] || null
    })

  } catch (error) {
    console.error('Visa recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate visa recommendations' },
      { status: 500 }
    )
  }
}

// Helper function to calculate age from birth date
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}