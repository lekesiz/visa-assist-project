import { testHelper } from '../../utils/integration-helpers';
import { POST as UploadDocument } from '../../../app/api/documents/upload/route';
import { GET as GetDocument, DELETE as DeleteDocument } from '../../../app/api/documents/[id]/route';

describe('Document Upload Integration Tests', () => {
  let testUser: any;
  let authSession: any;
  let testApplication: any;

  beforeEach(async () => {
    testUser = await testHelper.createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
    authSession = loginResult.session;

    testApplication = await testHelper.createTestApplication(testUser.id, {
      type: 'tourist',
      status: 'draft',
    });
  });

  afterEach(async () => {
    await testHelper.cleanupTestData();
    if (testUser) {
      await testHelper.deleteTestUser(testUser.id);
    }
  });

  describe('POST /api/documents/upload', () => {
    it('should successfully upload a valid document', async () => {
      const file = testHelper.generateTestFile('passport.pdf', 'application/pdf', 1024);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');
      formData.append('description', 'Main passport document');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.document).toBeDefined();
      expect(responseData.document.id).toBeDefined();
      expect(responseData.document.name).toBe('passport.pdf');
      expect(responseData.document.type).toBe('passport');
      expect(responseData.document.size).toBe(1024);
      expect(responseData.document.status).toBe('uploaded');
      expect(responseData.document.file_path).toBeDefined();
    });

    it('should reject upload without authentication', async () => {
      const file = testHelper.generateTestFile('passport.pdf', 'application/pdf', 1024);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Authentication required');
    });

    it('should validate file type and size', async () => {
      // Test with invalid file type
      const invalidFile = testHelper.generateTestFile('document.exe', 'application/x-executable', 1024);
      
      const formData = new FormData();
      formData.append('file', invalidFile);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid file type');
    });

    it('should reject files that are too large', async () => {
      // Test with file that exceeds size limit (10MB)
      const largeFile = testHelper.generateTestFile('large-document.pdf', 'application/pdf', 11 * 1024 * 1024);
      
      const formData = new FormData();
      formData.append('file', largeFile);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('File size exceeds limit');
    });

    it('should validate document type for application type', async () => {
      const file = testHelper.generateTestFile('document.pdf', 'application/pdf', 1024);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'work_permit'); // Invalid for tourist visa

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Document type not required for this visa type');
    });

    it('should trigger AI document analysis after successful upload', async () => {
      const file = testHelper.generateTestFile('passport.pdf', 'application/pdf', 1024);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.document.analysis_result).toBeDefined();
      expect(responseData.document.analysis_result.isValid).toBe(true);
      expect(responseData.document.analysis_result.confidence).toBeGreaterThan(0.8);
      expect(responseData.document.analysis_result.extractedData).toBeDefined();
    });

    it('should handle duplicate document uploads', async () => {
      const file1 = testHelper.generateTestFile('passport.pdf', 'application/pdf', 1024);
      
      // First upload
      const formData1 = new FormData();
      formData1.append('file', file1);
      formData1.append('applicationId', testApplication.id);
      formData1.append('documentType', 'passport');

      const request1 = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData1,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response1 = await UploadDocument(request1);
      expect(response1.status).toBe(201);

      // Second upload of same document type
      const file2 = testHelper.generateTestFile('passport-copy.pdf', 'application/pdf', 1024);
      const formData2 = new FormData();
      formData2.append('file', file2);
      formData2.append('applicationId', testApplication.id);
      formData2.append('documentType', 'passport');
      formData2.append('replaceExisting', 'true');

      const request2 = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData2,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response2 = await UploadDocument(request2);
      const responseData2 = await response2.json();

      expect(response2.status).toBe(201);
      expect(responseData2.success).toBe(true);
      expect(responseData2.document.name).toBe('passport-copy.pdf');
    });

    it('should validate application ownership before upload', async () => {
      // Create another user and their application
      const otherUser = await testHelper.createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      });
      const otherApplication = await testHelper.createTestApplication(otherUser.id);

      const file = testHelper.generateTestFile('passport.pdf', 'application/pdf', 1024);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', otherApplication.id); // Different user's application
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Access denied');
    });

    it('should handle virus scanning for uploaded files', async () => {
      // Mock a file that would fail virus scanning
      const suspiciousFile = testHelper.generateTestFile('malware.pdf', 'application/pdf', 1024);
      
      // Mock virus scanner to return positive detection
      jest.doMock('../../../lib/security/virus-scanner', () => ({
        scanFile: jest.fn().mockResolvedValue({
          clean: false,
          threatFound: 'EICAR-Test-File',
        }),
      }));

      const formData = new FormData();
      formData.append('file', suspiciousFile);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Security threat detected');
    });
  });

  describe('GET /api/documents/[id]', () => {
    let testDocument: any;

    beforeEach(async () => {
      testDocument = await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'passport',
        status: 'uploaded',
      });
    });

    it('should retrieve document metadata for authenticated user', async () => {
      const request = testHelper.createMockRequest(
        'GET',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await GetDocument(request, { params: { id: testDocument.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.document).toBeDefined();
      expect(responseData.document.id).toBe(testDocument.id);
      expect(responseData.document.user_id).toBe(testUser.id);
      expect(responseData.document.application_id).toBe(testApplication.id);
    });

    it('should reject access to document by different user', async () => {
      const otherUser = await testHelper.createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      });
      const otherSession = await testHelper.loginTestUser(otherUser.email, otherUser.password);

      const request = testHelper.createMockRequest(
        'GET',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${otherSession.session.access_token}`,
        }
      );

      const response = await GetDocument(request, { params: { id: testDocument.id } });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Access denied');
    });

    it('should include download URL for verified documents', async () => {
      // Update document to verified status
      await global.testUtils.supabase
        .from('documents')
        .update({ status: 'verified' })
        .eq('id', testDocument.id);

      const request = testHelper.createMockRequest(
        'GET',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await GetDocument(request, { params: { id: testDocument.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.document.download_url).toBeDefined();
      expect(responseData.document.download_url).toMatch(/^https?:\/\//);
    });
  });

  describe('DELETE /api/documents/[id]', () => {
    let testDocument: any;

    beforeEach(async () => {
      testDocument = await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'passport',
        status: 'uploaded',
      });
    });

    it('should successfully delete document', async () => {
      const request = testHelper.createMockRequest(
        'DELETE',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await DeleteDocument(request, { params: { id: testDocument.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('Document deleted successfully');

      // Verify document is actually deleted
      const { data: deletedDoc } = await global.testUtils.supabase
        .from('documents')
        .select('*')
        .eq('id', testDocument.id)
        .single();

      expect(deletedDoc).toBeNull();
    });

    it('should reject deletion by different user', async () => {
      const otherUser = await testHelper.createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      });
      const otherSession = await testHelper.loginTestUser(otherUser.email, otherUser.password);

      const request = testHelper.createMockRequest(
        'DELETE',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${otherSession.session.access_token}`,
        }
      );

      const response = await DeleteDocument(request, { params: { id: testDocument.id } });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Access denied');
    });

    it('should prevent deletion of documents in submitted applications', async () => {
      // Submit the application first
      await global.testUtils.supabase
        .from('applications')
        .update({ status: 'submitted' })
        .eq('id', testApplication.id);

      const request = testHelper.createMockRequest(
        'DELETE',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await DeleteDocument(request, { params: { id: testDocument.id } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Cannot delete documents from submitted application');
    });

    it('should clean up file storage after document deletion', async () => {
      const mockStorageDelete = jest.fn().mockResolvedValue({ success: true });
      
      jest.doMock('../../../lib/storage/file-manager', () => ({
        deleteFile: mockStorageDelete,
      }));

      const request = testHelper.createMockRequest(
        'DELETE',
        `/api/documents/${testDocument.id}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await DeleteDocument(request, { params: { id: testDocument.id } });
      expect(response.status).toBe(200);

      // Verify file was deleted from storage
      expect(mockStorageDelete).toHaveBeenCalledWith(testDocument.file_path);
    });
  });

  describe('Document Analysis Integration', () => {
    it('should extract data from passport documents', async () => {
      const passportFile = testHelper.generateTestFile('passport.pdf', 'application/pdf', 2048);
      
      const formData = new FormData();
      formData.append('file', passportFile);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.document.analysis_result.extractedData).toBeDefined();
      expect(responseData.document.analysis_result.extractedData.documentType).toBe('passport');
      expect(responseData.document.analysis_result.extractedData.expiryDate).toBeDefined();
    });

    it('should validate document expiry dates', async () => {
      // Mock analysis to return expired passport
      jest.doMock('../../../lib/ai/openai', () => ({
        analyzeDocument: jest.fn().mockResolvedValue({
          analysis: 'Expired passport detected',
          recommendations: ['Renew passport before travel'],
          confidence: 0.95,
          extractedData: {
            documentType: 'passport',
            expiryDate: '2020-01-01', // Expired
            isExpired: true,
          },
        }),
      }));

      const passportFile = testHelper.generateTestFile('expired-passport.pdf', 'application/pdf', 2048);
      
      const formData = new FormData();
      formData.append('file', passportFile);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.document.status).toBe('requires_attention');
      expect(responseData.document.analysis_result.extractedData.isExpired).toBe(true);
      expect(responseData.warnings).toContain('Document appears to be expired');
    });

    it('should flag suspicious or tampered documents', async () => {
      // Mock analysis to detect suspicious document
      jest.doMock('../../../lib/ai/openai', () => ({
        analyzeDocument: jest.fn().mockResolvedValue({
          analysis: 'Potential tampering detected',
          recommendations: ['Document requires manual review'],
          confidence: 0.3, // Low confidence indicates suspicious
          flags: ['potential_tampering', 'inconsistent_metadata'],
        }),
      }));

      const suspiciousFile = testHelper.generateTestFile('suspicious.pdf', 'application/pdf', 2048);
      
      const formData = new FormData();
      formData.append('file', suspiciousFile);
      formData.append('applicationId', testApplication.id);
      formData.append('documentType', 'passport');

      const request = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const response = await UploadDocument(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.document.status).toBe('flagged');
      expect(responseData.document.analysis_result.flags).toContain('potential_tampering');
      expect(responseData.warnings).toContain('Document flagged for manual review');
    });
  });
});