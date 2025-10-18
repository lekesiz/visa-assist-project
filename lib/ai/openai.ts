import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Document analysis types
interface DocumentAnalysisResult {
  documentType: string
  isValid: boolean
  extractedData: Record<string, any>
  issues: string[]
  suggestions: string[]
  confidence: number
}

// Visa recommendation types
interface VisaRecommendation {
  visaType: string
  eligibility: number // 0-100
  requirements: string[]
  missingDocuments: string[]
  estimatedProcessingTime: string
  successProbability: number
}

/**
 * Analyze document using GPT-4 Vision
 */
export async function analyzeDocument(
  documentContent: string,
  documentType: string
): Promise<DocumentAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert document analyzer for German visa applications. 
          Analyze the provided document and extract relevant information.
          Focus on validity, completeness, and compliance with German immigration requirements.`
        },
        {
          role: 'user',
          content: `Analyze this ${documentType} document: ${documentContent}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      documentType,
      isValid: result.isValid || false,
      extractedData: result.extractedData || {},
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      confidence: result.confidence || 0
    }
  } catch (error) {
    console.error('Document analysis error:', error)
    throw new Error('Failed to analyze document')
  }
}

/**
 * Get visa recommendations based on user profile
 */
export async function getVisaRecommendations(
  userProfile: {
    education: string
    profession: string
    experience: number
    hasJobOffer: boolean
    germanLevel: string
    age: number
    nationality: string
  }
): Promise<VisaRecommendation[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a German immigration law expert. 
          Based on the user profile, recommend suitable visa types and assess eligibility.
          Consider all relevant factors including Blue Card, Job Seeker Visa, Student Visa, etc.`
        },
        {
          role: 'user',
          content: JSON.stringify(userProfile)
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.recommendations || []
  } catch (error) {
    console.error('Visa recommendation error:', error)
    throw new Error('Failed to get visa recommendations')
  }
}

/**
 * Generate CV based on user information
 */
export async function generateCV(
  userData: {
    personalInfo: Record<string, any>
    education: Record<string, any>[]
    experience: Record<string, any>[]
    skills: string[]
    languages: Record<string, any>[]
  },
  targetJob?: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert CV writer specialized in German job market.
          Create a professional CV that follows German standards (Lebenslauf).
          Format: Clean, structured, chronological order.`
        },
        {
          role: 'user',
          content: `Create a German CV (Lebenslauf) for: ${JSON.stringify(userData)}
          ${targetJob ? `Target position: ${targetJob}` : ''}`
        }
      ],
      temperature: 0.7
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('CV generation error:', error)
    throw new Error('Failed to generate CV')
  }
}

/**
 * Chat with AI assistant
 */
export async function chatWithAssistant(
  message: string,
  context: {
    userId: string
    applicationId?: string
    history?: Array<{ role: string; content: string }>
  }
): Promise<string> {
  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful visa consultation assistant for German immigration.
        Provide accurate, helpful information about visa processes, requirements, and procedures.
        Be concise but thorough. If unsure, recommend consulting with a human expert.`
      },
      ...(context.history || []),
      {
        role: 'user' as const,
        content: message
      }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0].message.content || 'I apologize, but I could not generate a response.'
  } catch (error) {
    console.error('Chat error:', error)
    throw new Error('Failed to process chat message')
  }
}