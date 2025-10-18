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
    const { documentId, documentType, content } = await request.json()

    if (!documentId || !documentType) {
      return NextResponse.json(
        { error: 'Document ID and type are required' },
        { status: 400 }
      )
    }

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update analysis status
    await supabase
      .from('documents')
      .update({ ai_analysis_status: 'processing' })
      .eq('id', documentId)

    try {
      // Analyze document with AI
      const analysis = await aiService.analyzeDocument(
        content || 'Document content analysis',
        documentType
      )

      // Update document with analysis results
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          ai_analysis_status: 'completed',
          ai_analysis_result: analysis,
          verification_status: analysis.isValid ? 'verified' : 'rejected'
        })
        .eq('id', documentId)

      if (updateError) {
        throw updateError
      }

      // Log AI analysis
      await supabase
        .from('ai_analyses')
        .insert({
          entity_type: 'document',
          entity_id: documentId,
          ai_provider: 'openai',
          analysis_type: 'document-analysis',
          input_data: { documentType },
          result: analysis,
          confidence_score: analysis.confidence / 100,
          processing_time_ms: 0, // TODO: Track actual time
          tokens_used: 0, // TODO: Track token usage
          cost: 0 // TODO: Calculate cost
        })

      return NextResponse.json({
        success: true,
        analysis: {
          documentId,
          isValid: analysis.isValid,
          confidence: analysis.confidence,
          issues: analysis.issues,
          suggestions: analysis.suggestions,
          extractedData: analysis.extractedData
        }
      })

    } catch (analysisError) {
      // Update status to failed
      await supabase
        .from('documents')
        .update({ ai_analysis_status: 'failed' })
        .eq('id', documentId)

      throw analysisError
    }

  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    )
  }
}