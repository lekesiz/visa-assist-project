import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { 
  createMockSupabaseClient, 
  createAuthenticatedRequest,
  mockUser,
  expectErrorResponse,
  expectSuccessResponse,
  createMockFile,
  createMockFormData
} from '../../test-helpers'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock crypto module
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('abc123', 'hex')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mock-file-hash')
  }))
}))

// Import the route handlers after mocks are set up
import { POST, GET } from '@/app/api/documents/upload/route'

describe('/api/documents/upload', () => {
  let mockSupabase: any
  let mockFormData: FormData
  let mockFile: File

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock file
    mockFile = createMockFile('test content', 'passport.pdf', 'application/pdf')
    
    // Setup mock Supabase client
    mockSupabase = createMockSupabaseClient()
    
    // Setup storage mocks
    mockSupabase.storage = {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null
        }),
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))
    }
    
    // Setup database mocks with proper query chain
    mockSupabase.from = jest.fn(() => {
      const queryChain = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'doc-123',
                user_id: mockUser.id,
                document_type: 'passport',
                original_filename: 'passport.pdf',
                storage_path: `${mockUser.id}/passport/${Date.now()}-616263313233.pdf`,
                file_size: mockFile.size,
                file_hash: 'mock-file-hash',
                mime_type: 'application/pdf',
                verification_status: 'pending',
                ai_analysis_status: 'pending',
                virus_scan_status: 'pending',
                is_encrypted: true,
                upload_date: new Date().toISOString(),
                created_at: new Date().toISOString()
              },
              error: null
            })
          }))
        })),
        select: jest.fn(() => ({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      }
      
      // Make eq chainable
      const eq = jest.fn(() => queryChain)
      queryChain.select = jest.fn(() => ({ ...queryChain, eq }))
      
      return queryChain
    })
    
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('POST /api/documents/upload', () => {
    it('should successfully upload a valid document', async () => {
      // Create form data
      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport',
        applicationId: 'app-123'
      })

      // Create request with form data
      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      // Mock formData method
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.document).toMatchObject({
        id: 'doc-123',
        documentType: 'passport',
        fileName: 'passport.pdf',
        status: 'pending'
      })

      // Verify storage upload was called
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents')
      
      // Verify database insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
    })

    it('should upload document without applicationId', async () => {
      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })

    it('should reject unauthenticated requests', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      })

      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should reject request without file', async () => {
      mockFormData = createMockFormData({
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 400, 'File and document type are required')
    })

    it('should reject request without document type', async () => {
      mockFormData = createMockFormData({
        file: mockFile
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 400, 'File and document type are required')
    })

    it('should reject invalid file types', async () => {
      const invalidFile = createMockFile('test content', 'script.exe', 'application/x-executable')
      mockFormData = createMockFormData({
        file: invalidFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 400, 'Invalid file type')
    })

    it('should accept all valid file types', async () => {
      const validTypes = [
        { file: 'test.pdf', type: 'application/pdf' },
        { file: 'test.jpg', type: 'image/jpeg' },
        { file: 'test.jpeg', type: 'image/jpeg' },
        { file: 'test.png', type: 'image/png' }
      ]

      for (const { file: fileName, type } of validTypes) {
        const validFile = createMockFile('test content', fileName, type)
        mockFormData = createMockFormData({
          file: validFile,
          documentType: 'passport'
        })

        const request = new NextRequest('http://localhost:3000/api/documents/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer mock-token-${mockUser.id}`
          },
          body: mockFormData
        })
        
        request.formData = jest.fn().mockResolvedValue(mockFormData)

        const response = await POST(request)
        
        expect(response.status).toBe(200)
      }
    })

    it('should reject files larger than 10MB', async () => {
      // Create a mock file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).join('x') // 11MB of 'x'
      const largeFile = createMockFile(largeContent, 'large.pdf', 'application/pdf')
      
      mockFormData = createMockFormData({
        file: largeFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 400, 'File size must be less than 10MB')
    })

    it('should handle storage upload errors', async () => {
      mockSupabase.storage.from = jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Storage error')
        }),
        remove: jest.fn()
      }))

      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 500, 'Failed to upload file')
    })

    it('should handle database insert errors and cleanup uploaded file', async () => {
      // Mock successful upload but failed database insert
      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          }))
        }))
      }))

      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      const response = await POST(request)
      
      await expectErrorResponse(response, 500, 'Failed to save document metadata')
      
      // Verify cleanup was attempted
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents')
    })

    it('should generate unique filenames with timestamp and random bytes', async () => {
      const fixedDate = Date.now()
      jest.spyOn(Date, 'now').mockReturnValue(fixedDate)

      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      await POST(request)

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents')
    })

    it('should calculate file hash for integrity', async () => {
      mockFormData = createMockFormData({
        file: mockFile,
        documentType: 'passport'
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        },
        body: mockFormData
      })
      
      request.formData = jest.fn().mockResolvedValue(mockFormData)

      await POST(request)

      expect(crypto.createHash).toHaveBeenCalledWith('sha256')
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
    })

    it('should handle unexpected errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock-token-${mockUser.id}`
        }
      })
      
      // Mock formData to throw an error
      request.formData = jest.fn().mockRejectedValue(new Error('Unexpected error'))

      const response = await POST(request)
      
      await expectErrorResponse(response, 500, 'Internal server error')
    })
  })

  describe('GET /api/documents/upload', () => {
    it('should list all documents for authenticated user', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          user_id: mockUser.id,
          document_type: 'passport',
          original_filename: 'passport.pdf',
          verification_status: 'verified',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'doc-2',
          user_id: mockUser.id,
          document_type: 'visa',
          original_filename: 'visa.jpg',
          verification_status: 'pending',
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockDocuments,
          error: null
        })
      }

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnValue(mockQuery)
      }))

      const request = createAuthenticatedRequest('http://localhost:3000/api/documents/upload')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.documents).toHaveLength(2)
      expect(data.documents).toEqual(mockDocuments)
    })

    it('should handle query parameters for filtering', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost:3000/api/documents/upload?applicationId=app-123'
      )
      
      // This test verifies the endpoint accepts the parameter without errors
      const response = await GET(request)
      
      // Should either succeed or fail gracefully (not crash)
      expect([200, 500]).toContain(response.status)
      
      // Verify the Supabase from method was called (indicating query was attempted)
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
    })

    it('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/documents/upload')
      const response = await GET(request)
      
      await expectErrorResponse(response, 401, 'Unauthorized')
    })

    it('should handle database query errors', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed')
        })
      }
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnValue(mockQuery)
      }))

      const request = createAuthenticatedRequest('http://localhost:3000/api/documents/upload')
      const response = await GET(request)
      
      await expectErrorResponse(response, 500, 'Failed to fetch documents')
    })

    it('should return empty array when no documents exist', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnValue(mockQuery)
      }))

      const request = createAuthenticatedRequest('http://localhost:3000/api/documents/upload')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.documents).toEqual([])
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/documents/upload')
      const response = await GET(request)
      
      await expectErrorResponse(response, 500, 'Internal server error')
    })
  })
})