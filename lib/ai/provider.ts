import { analyzeDocument as analyzeWithOpenAI, getVisaRecommendations, generateCV } from './openai'
import { analyzeDenklik, matchJobOpportunities, generateImmigrationRoadmap } from './claude'

export type AIProvider = 'openai' | 'claude' | 'gemini'

export interface AIServiceConfig {
  defaultProvider: AIProvider
  fallbackProvider: AIProvider
  maxRetries: number
  timeout: number
}

// Default configuration
const defaultConfig: AIServiceConfig = {
  defaultProvider: 'openai',
  fallbackProvider: 'claude',
  maxRetries: 3,
  timeout: 30000 // 30 seconds
}

/**
 * AI Service Manager - Handles provider selection and fallback
 */
export class AIService {
  private config: AIServiceConfig

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Document Analysis - Uses OpenAI by default
   */
  async analyzeDocument(
    documentContent: string,
    documentType: string,
    options?: { provider?: AIProvider }
  ) {
    const provider = options?.provider || this.config.defaultProvider

    try {
      switch (provider) {
        case 'openai':
          return await analyzeWithOpenAI(documentContent, documentType)
        case 'claude':
          // Implement Claude document analysis if needed
          throw new Error('Claude document analysis not yet implemented')
        case 'gemini':
          // Implement Gemini document analysis if needed
          throw new Error('Gemini document analysis not yet implemented')
        default:
          throw new Error(`Unknown provider: ${provider}`)
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error)
      
      // Try fallback provider
      if (provider !== this.config.fallbackProvider) {
        console.log(`Trying fallback provider: ${this.config.fallbackProvider}`)
        return this.analyzeDocument(documentContent, documentType, {
          provider: this.config.fallbackProvider
        })
      }
      
      throw error
    }
  }

  /**
   * Visa Recommendations - Uses OpenAI
   */
  async getVisaRecommendations(userProfile: Record<string, any>) {
    return getVisaRecommendations(userProfile)
  }

  /**
   * Denklik Analysis - Uses Claude
   */
  async analyzeDenklik(profession: string, education: Record<string, any>, targetState: string) {
    return analyzeDenklik(profession, education, targetState)
  }

  /**
   * Job Matching - Uses Claude
   */
  async matchJobs(userProfile: Record<string, any>, jobRequirements: Record<string, any>) {
    return matchJobOpportunities(userProfile, jobRequirements)
  }

  /**
   * CV Generation - Uses OpenAI
   */
  async generateCV(userData: Record<string, any>, targetJob?: string) {
    return generateCV(userData, targetJob)
  }

  /**
   * Immigration Roadmap - Uses Claude
   */
  async generateRoadmap(userProfile: Record<string, any>) {
    return generateImmigrationRoadmap(userProfile)
  }

  /**
   * Generic AI request with automatic provider selection
   */
  async request(
    task: string,
    data: Record<string, any>,
    options?: {
      provider?: AIProvider
      preferredModel?: string
    }
  ) {
    // Intelligent provider selection based on task
    const provider = options?.provider || this.selectBestProvider(task)

    console.log(`Processing ${task} with ${provider}`)

    // Route to appropriate method based on task
    switch (task) {
      case 'document-analysis':
        return this.analyzeDocument(data.content, data.type, { provider })
      case 'visa-recommendations':
        return this.getVisaRecommendations(data)
      case 'denklik-analysis':
        return this.analyzeDenklik(data.profession, data.education, data.targetState)
      case 'job-matching':
        return this.matchJobs(data.userProfile, data.jobRequirements)
      case 'cv-generation':
        return this.generateCV(data.userData, data.targetJob)
      case 'immigration-roadmap':
        return this.generateRoadmap(data)
      default:
        throw new Error(`Unknown task: ${task}`)
    }
  }

  /**
   * Select best provider based on task type
   */
  private selectBestProvider(task: string): AIProvider {
    // Task-specific provider selection logic
    const taskProviderMap: Record<string, AIProvider> = {
      'document-analysis': 'openai',      // GPT-4 Vision for documents
      'visa-recommendations': 'openai',    // GPT-4 for general recommendations
      'denklik-analysis': 'claude',       // Claude for detailed analysis
      'job-matching': 'claude',           // Claude for nuanced matching
      'cv-generation': 'openai',          // GPT-4 for document generation
      'immigration-roadmap': 'claude',    // Claude for complex planning
      'chat': 'openai',                   // GPT-4 for general chat
    }

    return taskProviderMap[task] || this.config.defaultProvider
  }

  /**
   * Get provider status and availability
   */
  async getProviderStatus(): Promise<Record<AIProvider, boolean>> {
    const status: Record<AIProvider, boolean> = {
      openai: false,
      claude: false,
      gemini: false
    }

    // Check OpenAI
    try {
      if (process.env.OPENAI_API_KEY) {
        // Simple health check
        status.openai = true
      }
    } catch (error) {
      console.error('OpenAI check failed:', error)
    }

    // Check Claude
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        status.claude = true
      }
    } catch (error) {
      console.error('Claude check failed:', error)
    }

    // Check Gemini
    try {
      if (process.env.GOOGLE_AI_KEY) {
        status.gemini = true
      }
    } catch (error) {
      console.error('Gemini check failed:', error)
    }

    return status
  }
}

// Export singleton instance
export const aiService = new AIService()

// Export types
export * from './openai'
export * from './claude'