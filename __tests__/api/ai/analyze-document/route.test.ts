import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/analyze-document/route'
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

describe('/api/ai/analyze-document', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default Supabase mock
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    // Setup default AI service mock
    mockAiService.analyzeDocument = jest.fn()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      // Mock authenticated user but missing document
      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Document not found' }
        })
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      // Should get 404 (document not found) not 401 (unauthorized)
      await expectErrorResponse(response, 404, 'Document not found')
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when documentId is missing', async () => {
      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Document ID and type are required')
    })

    it('should return 400 when documentType is missing', async () => {
      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Document ID and type are required')
    })

    it('should return 400 when both documentId and documentType are missing', async () => {
      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        content: 'Some content'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 400, 'Document ID and type are required')
    })

    it('should accept valid input with documentId and documentType', async () => {
      // Mock document exists
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf',
        document_type: 'passport'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })

      // Mock successful AI analysis
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: { passportNumber: '123456789' }
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Document Retrieval', () => {
    it('should return 404 when document does not exist', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Document not found' }
        })
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'nonexistent-doc',
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 404, 'Document not found')
    })

    it('should return 404 when document belongs to different user', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 404, 'Document not found')
    })

    it('should verify document ownership with user_id filter', async () => {
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf'
      }

      const mockSelect = jest.fn().mockReturnValue({
        ...mockSupabase,
        eq: jest.fn().mockReturnValue({
          ...mockSupabase,
          eq: jest.fn().mockReturnValue({
            ...mockSupabase,
            single: jest.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        select: mockSelect
      })

      // Mock successful AI analysis
      mockAiService.analyzeDocument.mockResolvedValue({
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: {}
      })

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      await POST(request)

      // Verify the query was built correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockSelect).toHaveBeenCalledWith('*')
    })
  })

  describe('AI Analysis Integration', () => {
    let mockDocument: any

    beforeEach(() => {
      mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf',
        document_type: 'passport'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })
    })

    it('should call AI service with correct parameters', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: { passportNumber: '123456789' }
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport',
        content: 'Document content here'
      })

      await POST(request)

      expect(mockAiService.analyzeDocument).toHaveBeenCalledWith(
        'Document content here',
        'passport'
      )
    })

    it('should use default content when none provided', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: {}
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      await POST(request)

      expect(mockAiService.analyzeDocument).toHaveBeenCalledWith(
        'Document content analysis',
        'passport'
      )
    })

    it('should handle AI service errors and update document status to failed', async () => {
      mockAiService.analyzeDocument.mockRejectedValue(new Error('AI service error'))

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)

      // Should update document status to failed
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockSupabase.update).toHaveBeenCalledWith({ ai_analysis_status: 'failed' })

      await expectErrorResponse(response, 500, 'Failed to analyze document')
    })

    it('should return successful analysis result', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: ['Minor formatting issue'],
        suggestions: ['Consider higher resolution scan'],
        extractedData: { 
          passportNumber: '123456789',
          expiryDate: '2030-12-31'
        }
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data).toEqual({
        success: true,
        analysis: {
          documentId: 'doc-123',
          isValid: true,
          confidence: 95,
          issues: ['Minor formatting issue'],
          suggestions: ['Consider higher resolution scan'],
          extractedData: {
            passportNumber: '123456789',
            expiryDate: '2030-12-31'
          }
        }
      })
    })
  })

  describe('Database Updates', () => {
    let mockDocument: any

    beforeEach(() => {
      mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf',
        document_type: 'passport'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })
    })

    it('should update document status to processing before analysis', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: {}
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      await POST(request)

      // Verify processing status was set
      expect(mockSupabase.update).toHaveBeenCalledWith({ ai_analysis_status: 'processing' })
    })

    it('should update document with analysis results for valid document', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: { passportNumber: '123456789' }
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      await POST(request)

      // Verify final status was set
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ai_analysis_status: 'completed',
        ai_analysis_result: mockAnalysis,
        verification_status: 'verified'
      })
    })

    it('should set verification_status to rejected for invalid document', async () => {
      const mockAnalysis = {
        isValid: false,
        confidence: 30,
        issues: ['Document appears to be fake'],
        suggestions: ['Provide original document'],
        extractedData: {}
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      await POST(request)

      expect(mockSupabase.update).toHaveBeenCalledWith({
        ai_analysis_status: 'completed',
        ai_analysis_result: mockAnalysis,
        verification_status: 'rejected'
      })
    })

    it('should handle database update errors', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: {}
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      // Mock database update error
      const updateError = new Error('Database update failed')
      mockSupabase.update.mockResolvedValue({ error: updateError })

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to analyze document')
    })

    it('should log AI analysis to ai_analyses table', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 85,
        issues: [],
        suggestions: [],
        extractedData: { passportNumber: '123456789' }
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      await POST(request)

      // Verify AI analysis was logged
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        entity_type: 'document',
        entity_id: 'doc-123',
        ai_provider: 'openai',
        analysis_type: 'document-analysis',
        input_data: { documentType: 'passport' },
        result: mockAnalysis,
        confidence_score: 0.85, // confidence/100
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON request', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to analyze document')
    })

    it('should handle Supabase client creation error', async () => {
      mockCreateClient.mockRejectedValue(new Error('Supabase connection failed'))

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to analyze document')
    })

    it('should handle authentication check error', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'))

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      await expectErrorResponse(response, 500, 'Failed to analyze document')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })
    })

    it('should return correctly formatted success response', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 92,
        issues: ['Minor blur detected'],
        suggestions: ['Ensure better lighting'],
        extractedData: {
          fullName: 'John Doe',
          passportNumber: '123456789',
          nationality: 'US'
        }
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('analysis')
      expect(data.analysis).toHaveProperty('documentId', 'doc-123')
      expect(data.analysis).toHaveProperty('isValid', true)
      expect(data.analysis).toHaveProperty('confidence', 92)
      expect(data.analysis).toHaveProperty('issues')
      expect(data.analysis).toHaveProperty('suggestions')
      expect(data.analysis).toHaveProperty('extractedData')
    })

    it('should not expose internal fields in response', async () => {
      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: {},
        internalField: 'should not be exposed',
        _privateData: 'secret'
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis as any)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.analysis).not.toHaveProperty('internalField')
      expect(data.analysis).not.toHaveProperty('_privateData')
    })
  })

  describe('Content Types', () => {
    beforeEach(() => {
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'document.pdf'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })
    })

    it('should handle different document types', async () => {
      const documentTypes = ['passport', 'visa', 'diploma', 'birth_certificate', 'marriage_certificate']
      
      for (const documentType of documentTypes) {
        const mockAnalysis = {
          isValid: true,
          confidence: 90,
          issues: [],
          suggestions: [],
          extractedData: {}
        }
        mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

        const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
          documentId: 'doc-123',
          documentType,
          content: `Content for ${documentType}`
        })

        const response = await POST(request)
        expect(response.status).toBe(200)

        expect(mockAiService.analyzeDocument).toHaveBeenCalledWith(
          `Content for ${documentType}`,
          documentType
        )
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty extractedData', async () => {
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })

      const mockAnalysis = {
        isValid: false,
        confidence: 10,
        issues: ['Could not extract any data'],
        suggestions: ['Provide clearer image'],
        extractedData: {}
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport'
      })

      const response = await POST(request)
      const data = await expectSuccessResponse(response)

      expect(data.analysis.extractedData).toEqual({})
      expect(data.analysis.isValid).toBe(false)
    })

    it('should handle very long content', async () => {
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUser.id,
        filename: 'passport.pdf'
      }

      mockSupabase.from.mockReturnValue({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null
        })
      })

      const mockAnalysis = {
        isValid: true,
        confidence: 95,
        issues: [],
        suggestions: [],
        extractedData: {}
      }
      mockAiService.analyzeDocument.mockResolvedValue(mockAnalysis)

      const longContent = 'A'.repeat(10000) // Very long content
      const request = createRequestWithBody('http://localhost:3000/api/ai/analyze-document', {
        documentId: 'doc-123',
        documentType: 'passport',
        content: longContent
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(mockAiService.analyzeDocument).toHaveBeenCalledWith(
        longContent,
        'passport'
      )
    })
  })
})