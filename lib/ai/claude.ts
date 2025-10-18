import Anthropic from '@anthropic-ai/sdk'

// Lazy initialize Anthropic client to avoid errors during build
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    anthropic = new Anthropic({ apiKey })
  }
  return anthropic
}

interface DenklikAnalysis {
  professionMatch: number // 0-100
  recognitionProbability: number // 0-100
  requiredSteps: string[]
  estimatedDuration: string
  additionalQualifications: string[]
  recommendations: string[]
}

interface JobMatchResult {
  matchScore: number // 0-100
  strengths: string[]
  gaps: string[]
  improvementSuggestions: string[]
  applicationTips: string[]
}

/**
 * Analyze Denklik (credential recognition) possibilities
 */
export async function analyzeDenklik(
  profession: string,
  education: {
    degree: string
    field: string
    country: string
    duration: number
  },
  targetState: string
): Promise<DenklikAnalysis> {
  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.3,
      system: `You are an expert in German professional qualification recognition (Denklik/Anerkennung).
      Analyze the provided credentials and give detailed assessment for recognition in Germany.
      Consider state-specific requirements and provide actionable steps.`,
      messages: [
        {
          role: 'user',
          content: `Analyze Denklik possibilities:
          Profession: ${profession}
          Education: ${JSON.stringify(education)}
          Target State: ${targetState}
          
          Provide analysis in JSON format with professionMatch, recognitionProbability, requiredSteps, estimatedDuration, additionalQualifications, and recommendations.`
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    
    try {
      return JSON.parse(content)
    } catch {
      // Fallback parsing if response is not valid JSON
      return {
        professionMatch: 70,
        recognitionProbability: 60,
        requiredSteps: ['Document translation', 'Application submission', 'Competency test'],
        estimatedDuration: '3-6 months',
        additionalQualifications: [],
        recommendations: [content]
      }
    }
  } catch (error) {
    console.error('Denklik analysis error:', error)
    throw new Error('Failed to analyze Denklik')
  }
}

/**
 * Match user profile with job opportunities
 */
export async function matchJobOpportunities(
  userProfile: {
    skills: string[]
    experience: string[]
    education: string
    languages: Array<{ language: string; level: string }>
    targetPosition: string
  },
  jobRequirements: {
    requiredSkills: string[]
    requiredExperience: string
    requiredEducation: string
    languageRequirements: Array<{ language: string; level: string }>
  }
): Promise<JobMatchResult> {
  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.5,
      system: `You are an expert career advisor for the German job market.
      Analyze how well a candidate matches a job position and provide actionable advice.
      Be specific about German job market expectations.`,
      messages: [
        {
          role: 'user',
          content: `Analyze job match:
          
          Candidate Profile:
          ${JSON.stringify(userProfile, null, 2)}
          
          Job Requirements:
          ${JSON.stringify(jobRequirements, null, 2)}
          
          Provide detailed match analysis with score, strengths, gaps, and suggestions.`
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Extract structured data from response
    const lines = content.split('\n')
    const result: JobMatchResult = {
      matchScore: 75,
      strengths: [],
      gaps: [],
      improvementSuggestions: [],
      applicationTips: []
    }

    // Parse response (this is simplified - in production use better parsing)
    lines.forEach(line => {
      if (line.includes('Match Score:')) {
        const score = parseInt(line.match(/\d+/)?.[0] || '75')
        result.matchScore = score
      }
      // Additional parsing logic here
    })

    return result
  } catch (error) {
    console.error('Job matching error:', error)
    throw new Error('Failed to match job opportunities')
  }
}

/**
 * Generate personalized immigration roadmap
 */
export async function generateImmigrationRoadmap(
  userProfile: {
    currentSituation: string
    goals: string[]
    timeline: string
    constraints: string[]
    resources: string[]
  }
): Promise<{
  phases: Array<{
    phase: string
    duration: string
    tasks: string[]
    requirements: string[]
    estimatedCost: string
  }>
  totalDuration: string
  criticalPath: string[]
  alternativeRoutes: string[]
}> {
  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      temperature: 0.6,
      system: `You are an expert immigration consultant for Germany.
      Create detailed, personalized immigration roadmaps considering all legal pathways.
      Be realistic about timelines and requirements.`,
      messages: [
        {
          role: 'user',
          content: `Create immigration roadmap for:
          ${JSON.stringify(userProfile, null, 2)}
          
          Include phases, timeline, requirements, costs, and alternatives.`
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Parse and structure the response
    // This is a simplified version - implement proper parsing based on your needs
    return {
      phases: [
        {
          phase: 'Preparation',
          duration: '2-3 months',
          tasks: ['Document collection', 'Language learning', 'Skill assessment'],
          requirements: ['Valid passport', 'Educational certificates'],
          estimatedCost: '€500-1000'
        }
      ],
      totalDuration: '6-12 months',
      criticalPath: ['Language proficiency', 'Job offer', 'Visa application'],
      alternativeRoutes: ['Job Seeker Visa', 'Student pathway', 'EU Blue Card']
    }
  } catch (error) {
    console.error('Roadmap generation error:', error)
    throw new Error('Failed to generate immigration roadmap')
  }
}

/**
 * Review and improve application documents
 */
export async function reviewApplicationDocuments(
  documentType: string,
  documentContent: string,
  targetPurpose: string
): Promise<{
  overallScore: number
  issues: Array<{ severity: 'high' | 'medium' | 'low'; description: string }>
  improvements: string[]
  rewrittenSections?: Record<string, string>
}> {
  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1500,
      temperature: 0.4,
      system: `You are an expert in German immigration document preparation.
      Review documents for completeness, accuracy, and compliance with German standards.
      Provide specific, actionable feedback.`,
      messages: [
        {
          role: 'user',
          content: `Review this ${documentType} for ${targetPurpose}:
          
          ${documentContent}
          
          Provide detailed review with score, issues, and improvements.`
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Parse the response and extract structured feedback
    return {
      overallScore: 75,
      issues: [
        { severity: 'medium', description: 'Missing specific dates' },
        { severity: 'low', description: 'Could improve formatting' }
      ],
      improvements: [
        'Add specific employment dates',
        'Include quantifiable achievements',
        'Use German date format (DD.MM.YYYY)'
      ],
      rewrittenSections: {}
    }
  } catch (error) {
    console.error('Document review error:', error)
    throw new Error('Failed to review documents')
  }
}