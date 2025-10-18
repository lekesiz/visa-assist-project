import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/recommend-visa/route'
import { aiService } from '@/lib/ai/provider'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  mockUser,
  createRequestWithBody,
  expectErrorResponse,
  expectSuccessResponse
} from '../../test-helpers'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/ai/provider')
jest.mock('@anthropic-ai/sdk')
jest.mock('openai')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockAiService = aiService as jest.Mocked<typeof aiService>

describe('/api/ai/recommend-visa', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default Supabase mock
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    // Setup default AI service mock
    mockAiService.getVisaRecommendations = jest.fn()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: 'Bachelor',
        profession: 'Software Engineer'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      // Mock authenticated user but no profile
      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: 'Bachelor',
        profession: 'Software Engineer'
      })

      const response = await POST(request)
      // Should get 400 (profile not found) not 401 (unauthorized)
      await expectErrorResponse(response, 400, 'User profile not found')
    })
  })

  describe('User Profile Validation', () => {
    it('should return 400 when user profile does not exist', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: 'Bachelor',
        profession: 'Software Engineer'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'User profile not found')
    })

    it('should return 400 when profile query fails', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: 'Bachelor',
        profession: 'Software Engineer'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'User profile not found')
    })

    it('should verify profile query uses correct user ID filter', async () => {
      const mockProfile = {
        user_id: mockUser.id,
        highest_degree: 'Bachelor',
        current_occupation: 'Software Engineer',
        work_experience_years: 5,
        has_job_offer: true,
        german_level: 'B2',
        birth_date: '1990-01-01'
      }

      // Create a proper chainable mock
      const mockEq = jest.fn().mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })

      const mockSelect = jest.fn().mockReturnValue({
        ...mockSupabase,
        eq: mockEq
      })

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        select: mockSelect
      })

      // Mock AI recommendations
      mockAiService.getVisaRecommendations.mockResolvedValue([
        {
          visaType: 'EU Blue Card',
          eligibility: 95,
          requirements: ['University degree', 'Job offer'],
          missingDocuments: [],
          estimatedProcessingTime: '2-3 months',
          successProbability: 90
        }
      ])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      await POST(request)

      // Verify the query was built correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id)
    })
  })

  describe('User Profile Processing', () => {
    let mockProfile: any

    beforeEach(() => {
      mockProfile = {
        user_id: mockUser.id,
        highest_degree: 'Master',
        current_occupation: 'Software Engineer',
        work_experience_years: 8,
        has_job_offer: true,
        german_level: 'B2',
        birth_date: '1985-06-15'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    })

    it('should build user profile from database data', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      await POST(request)

      expect(mockAiService.getVisaRecommendations).toHaveBeenCalledWith({
        education: 'Master',
        profession: 'Software Engineer',
        experience: 8,
        hasJobOffer: true,
        germanLevel: 'B2',
        age: expect.any(Number), // calculated from birth_date
        nationality: 'TUR'
      })
    })

    it('should use profile data when available, request data as fallback', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: 'PhD', // Will be ignored - profile has 'Master'
        profession: 'Data Scientist', // Will be ignored - profile has 'Software Engineer'
        experience: 10, // Will be ignored - profile has 8
        hasJobOffer: false, // Will be ignored - profile has true
        germanLevel: 'C1', // Will be ignored - profile has 'B2'
        age: 35, // Will be ignored - profile has calculated age
        nationality: 'USA' // Will be used - not in profile
      })

      await POST(request)

      expect(mockAiService.getVisaRecommendations).toHaveBeenCalledWith({
        education: 'Master', // From profile
        profession: 'Software Engineer', // From profile
        experience: 8, // From profile
        hasJobOffer: true, // From profile
        germanLevel: 'B2', // From profile
        age: expect.any(Number), // Calculated from profile birth_date
        nationality: 'USA' // From request
      })
    })

    it('should use request data when profile fields are missing', async () => {
      // Profile with missing fields
      const incompleteProfile = {
        user_id: mockUser.id,
        birth_date: null
        // All other fields missing/null
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: incompleteProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: 'PhD',
        profession: 'Data Scientist',
        experience: 10,
        hasJobOffer: false,
        germanLevel: 'C1',
        age: 35,
        nationality: 'USA'
      })

      await POST(request)

      expect(mockAiService.getVisaRecommendations).toHaveBeenCalledWith({
        education: 'PhD', // From request - profile missing
        profession: 'Data Scientist', // From request - profile missing
        experience: 10, // From request - profile missing
        hasJobOffer: false, // From request - profile missing
        germanLevel: 'C1', // From request - profile missing
        age: 35, // From request - profile birth_date is null
        nationality: 'USA' // From request
      })
    })

    it('should use default values when profile data is missing', async () => {
      // Profile with missing fields
      const incompleteProfile = {
        user_id: mockUser.id,
        birth_date: null
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: incompleteProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      await POST(request)

      expect(mockAiService.getVisaRecommendations).toHaveBeenCalledWith({
        education: 'Unknown',
        profession: 'Unknown',
        experience: 0,
        hasJobOffer: false,
        germanLevel: 'A1',
        age: 25, // default age
        nationality: 'TUR'
      })
    })

    it('should correctly calculate age from birth date', async () => {
      // Set a specific birth date to test age calculation
      const testProfile = {
        ...mockProfile,
        birth_date: '1990-01-01' // Should be around 34 years old
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: testProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      await POST(request)

      const expectedAge = new Date().getFullYear() - 1990
      expect(mockAiService.getVisaRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          age: expect.any(Number)
        })
      )

      // Get the actual call to verify age calculation
      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      expect(callArgs.age).toBeGreaterThanOrEqual(expectedAge - 1)
      expect(callArgs.age).toBeLessThanOrEqual(expectedAge + 1)
    })
  })

  describe('AI Recommendations Integration', () => {
    let mockProfile: any

    beforeEach(() => {
      mockProfile = {
        user_id: mockUser.id,
        highest_degree: 'Master',
        current_occupation: 'Software Engineer',
        work_experience_years: 5,
        has_job_offer: true,
        german_level: 'B2',
        birth_date: '1988-03-15'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    })

    it('should call AI service with correct user profile', async () => {
      const mockRecommendations = [
        {
          visaType: 'EU Blue Card',
          eligibility: 95,
          requirements: ['University degree', 'Job offer with salary above threshold'],
          missingDocuments: [],
          estimatedProcessingTime: '2-3 months',
          successProbability: 90
        }
      ]
      mockAiService.getVisaRecommendations.mockResolvedValue(mockRecommendations)

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        nationality: 'IND'
      })

      await POST(request)

      expect(mockAiService.getVisaRecommendations).toHaveBeenCalledWith({
        education: 'Master',
        profession: 'Software Engineer',
        experience: 5,
        hasJobOffer: true,
        germanLevel: 'B2',
        age: expect.any(Number),
        nationality: 'IND'
      })
    })

    it('should handle AI service errors', async () => {
      mockAiService.getVisaRecommendations.mockRejectedValue(new Error('AI service error'))

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to generate visa recommendations')
    })

    it('should return AI recommendations sorted by eligibility', async () => {
      const mockRecommendations = [
        {
          visaType: 'Job Seeker Visa',
          eligibility: 70,
          requirements: ['University degree', 'Sufficient funds'],
          missingDocuments: ['Bank statements'],
          estimatedProcessingTime: '3-4 weeks',
          successProbability: 65
        },
        {
          visaType: 'EU Blue Card',
          eligibility: 95,
          requirements: ['University degree', 'Job offer'],
          missingDocuments: [],
          estimatedProcessingTime: '2-3 months',
          successProbability: 90
        },
        {
          visaType: 'Skilled Worker Visa',
          eligibility: 80,
          requirements: ['Recognized qualification', 'German language skills'],
          missingDocuments: ['Language certificate'],
          estimatedProcessingTime: '4-6 weeks',
          successProbability: 75
        }
      ]
      mockAiService.getVisaRecommendations.mockResolvedValue(mockRecommendations)

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      // Should be sorted by eligibility (highest first)
      expect(data.recommendations).toHaveLength(3)
      expect(data.recommendations[0].visaType).toBe('EU Blue Card')
      expect(data.recommendations[0].eligibility).toBe(95)
      expect(data.recommendations[1].visaType).toBe('Skilled Worker Visa')
      expect(data.recommendations[1].eligibility).toBe(80)
      expect(data.recommendations[2].visaType).toBe('Job Seeker Visa')
      expect(data.recommendations[2].eligibility).toBe(70)
    })

    it('should handle empty recommendations from AI', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.recommendations).toEqual([])
      expect(data.topRecommendation).toBeNull()
    })
  })

  describe('Database Updates', () => {
    let mockProfile: any
    let mockRecommendations: any[]

    beforeEach(() => {
      mockProfile = {
        user_id: mockUser.id,
        highest_degree: 'Bachelor',
        current_occupation: 'Engineer',
        work_experience_years: 3,
        has_job_offer: false,
        german_level: 'A2',
        birth_date: '1992-08-20'
      }

      mockRecommendations = [
        {
          visaType: 'Job Seeker Visa',
          eligibility: 75,
          requirements: ['University degree'],
          missingDocuments: ['Language certificate'],
          estimatedProcessingTime: '3-4 weeks',
          successProbability: 70
        }
      ]

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue(mockRecommendations)
    })

    it('should update application when applicationId is provided', async () => {
      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        applicationId: 'app-123'
      })

      await POST(request)

      // Verify application was updated
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ai_analysis_completed: true,
        ai_recommendations: mockRecommendations
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'app-123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should not update application when applicationId is not provided', async () => {
      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      await POST(request)

      // Verify update was not called for applications table
      const updateCalls = mockSupabase.update.mock.calls
      const applicationUpdateCalls = updateCalls.filter(call => 
        call[0]?.ai_analysis_completed !== undefined
      )
      expect(applicationUpdateCalls).toHaveLength(0)
    })

    it('should log AI analysis to ai_analyses table', async () => {
      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        nationality: 'USA'
      })

      await POST(request)

      // Verify AI analysis was logged
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        entity_type: 'profile',
        entity_id: mockUser.id,
        ai_provider: 'openai',
        analysis_type: 'visa-recommendations',
        input_data: {
          education: 'Bachelor',
          profession: 'Engineer',
          experience: 3,
          hasJobOffer: false,
          germanLevel: 'A2',
          age: expect.any(Number),
          nationality: 'USA'
        },
        result: mockRecommendations,
        confidence_score: 0.85,
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0
      })
    })

    it('should handle database update errors gracefully', async () => {
      // Mock insert error for ai_analyses
      mockSupabase.insert.mockResolvedValue({
        error: new Error('Database insert failed')
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)

      // Should still return success even if logging fails
      expect(response.status).toBe(200)
    })
  })

  describe('Response Format', () => {
    let mockProfile: any

    beforeEach(() => {
      mockProfile = {
        user_id: mockUser.id,
        highest_degree: 'PhD',
        current_occupation: 'Research Scientist',
        work_experience_years: 10,
        has_job_offer: true,
        german_level: 'C1',
        birth_date: '1983-12-10'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    })

    it('should return correctly formatted success response', async () => {
      const mockRecommendations = [
        {
          visaType: 'EU Blue Card',
          eligibility: 98,
          requirements: ['University degree', 'High salary job offer'],
          missingDocuments: [],
          estimatedProcessingTime: '2-3 months',
          successProbability: 95
        },
        {
          visaType: 'Researcher Visa',
          eligibility: 90,
          requirements: ['PhD', 'Research position'],
          missingDocuments: ['Research agreement'],
          estimatedProcessingTime: '4-6 weeks',
          successProbability: 85
        }
      ]
      mockAiService.getVisaRecommendations.mockResolvedValue(mockRecommendations)

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        nationality: 'CAN'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('recommendations')
      expect(data).toHaveProperty('userProfile')
      expect(data).toHaveProperty('topRecommendation')

      // Verify recommendations are included
      expect(data.recommendations).toHaveLength(2)
      expect(data.recommendations[0]).toMatchObject({
        visaType: 'EU Blue Card',
        eligibility: 98,
        requirements: ['University degree', 'High salary job offer'],
        missingDocuments: [],
        estimatedProcessingTime: '2-3 months',
        successProbability: 95
      })

      // Verify user profile is included
      expect(data.userProfile).toMatchObject({
        education: 'PhD',
        profession: 'Research Scientist',
        experience: 10,
        hasJobOffer: true,
        germanLevel: 'C1',
        age: expect.any(Number),
        nationality: 'CAN'
      })

      // Verify top recommendation is the highest eligibility
      expect(data.topRecommendation).toMatchObject({
        visaType: 'EU Blue Card',
        eligibility: 98
      })
    })

    it('should handle null top recommendation when no recommendations', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      const data = await response.json()

      expect(data.recommendations).toEqual([])
      expect(data.topRecommendation).toBeNull()
    })

    it('should include all required response fields', async () => {
      const mockRecommendations = [
        {
          visaType: 'Job Seeker Visa',
          eligibility: 65,
          requirements: ['University degree'],
          missingDocuments: ['Language certificate', 'Bank statements'],
          estimatedProcessingTime: '3-4 weeks',
          successProbability: 60
        }
      ]
      mockAiService.getVisaRecommendations.mockResolvedValue(mockRecommendations)

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      const data = await response.json()

      // Check all required fields are present
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('recommendations')
      expect(data).toHaveProperty('userProfile')
      expect(data).toHaveProperty('topRecommendation')

      // Check recommendation structure
      const recommendation = data.recommendations[0]
      expect(recommendation).toHaveProperty('visaType')
      expect(recommendation).toHaveProperty('eligibility')
      expect(recommendation).toHaveProperty('requirements')
      expect(recommendation).toHaveProperty('missingDocuments')
      expect(recommendation).toHaveProperty('estimatedProcessingTime')
      expect(recommendation).toHaveProperty('successProbability')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON request', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/recommend-visa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      // NextJS returns 400 for malformed JSON, but our catch block returns 500
      // The actual behavior depends on when the JSON parsing fails
      expect([400, 500]).toContain(response.status)
    })

    it('should handle Supabase client creation error', async () => {
      mockCreateClient.mockRejectedValue(new Error('Supabase connection failed'))

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to generate visa recommendations')
    })

    it('should handle authentication check error', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'))

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to generate visa recommendations')
    })

    it('should handle profile query error', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database query failed')
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to generate visa recommendations')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      // Use a minimal profile to allow request data override
      const mockProfile = {
        user_id: mockUser.id,
        birth_date: '1995-04-25'
        // Other fields are null/undefined to allow request override
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    })

    it('should handle age calculation for future birth dates gracefully', async () => {
      const futureProfile = {
        user_id: mockUser.id,
        birth_date: '2030-01-01' // Future date
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: futureProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      expect(response.status).toBe(200)

      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      expect(callArgs.age).toBeLessThan(0) // Negative age for future dates
    })

    it('should handle very large experience values', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        experience: 999999
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      expect(callArgs.experience).toBe(999999)
    })

    it('should handle special characters in profession names', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        profession: 'Café Manager & Événement Coordinateur'
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      expect(callArgs.profession).toBe('Café Manager & Événement Coordinateur')
    })

    it('should handle null and undefined values in request data', async () => {
      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {
        education: null,
        profession: undefined,
        experience: null,
        hasJobOffer: undefined
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      // Should use defaults when both profile and request values are null/undefined
      expect(callArgs.education).toBe('Unknown')
      expect(callArgs.profession).toBe('Unknown')
      expect(callArgs.experience).toBe(0)
      expect(callArgs.hasJobOffer).toBe(false)
    })
  })

  describe('Age Calculation Function', () => {
    // Import the calculateAge function for direct testing
    // Note: This would require extracting the function or making it exportable

    it('should calculate correct age for birth date in the past', async () => {
      const testProfile = {
        user_id: mockUser.id,
        birth_date: '1990-06-15'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: testProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      await POST(request)

      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      const currentYear = new Date().getFullYear()
      const birthYear = 1990
      const expectedAge = currentYear - birthYear

      // Age should be within 1 year (accounting for month/day differences)
      expect(callArgs.age).toBeGreaterThanOrEqual(expectedAge - 1)
      expect(callArgs.age).toBeLessThanOrEqual(expectedAge)
    })

    it('should handle leap year birth dates correctly', async () => {
      const testProfile = {
        user_id: mockUser.id,
        birth_date: '1992-02-29' // Leap year
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: testProfile,
          error: null
        })
      })

      mockAiService.getVisaRecommendations.mockResolvedValue([])

      const request = createRequestWithBody('http://localhost:3000/api/ai/recommend-visa', {})

      const response = await POST(request)
      expect(response.status).toBe(200)

      const callArgs = mockAiService.getVisaRecommendations.mock.calls[0][0]
      expect(typeof callArgs.age).toBe('number')
      expect(callArgs.age).toBeGreaterThan(0)
    })
  })
})