import { testHelper } from '../../utils/integration-helpers';
import { POST as CreateApplication } from '../../../app/api/applications/route';
import { GET as GetApplication, PUT as UpdateApplication } from '../../../app/api/applications/[id]/route';
import { POST as SubmitApplication } from '../../../app/api/applications/[id]/submit/route';

describe('Visa Application Integration Tests', () => {
  let testUser: any;
  let authSession: any;

  beforeEach(async () => {
    testUser = await testHelper.createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
    authSession = loginResult.session;
  });

  afterEach(async () => {
    await testHelper.cleanupTestData();
    if (testUser) {
      await testHelper.deleteTestUser(testUser.id);
    }
  });

  describe('POST /api/applications', () => {
    it('should create a new visa application with valid data', async () => {
      const applicationData = {
        type: 'tourist',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          passportNumber: 'AB123456789',
          passportExpiry: '2030-01-01',
        },
        travelDetails: {
          purposeOfVisit: 'Tourism',
          plannedArrival: '2024-06-01',
          plannedDeparture: '2024-06-15',
          accommodation: 'Hotel Royal',
          accommodationAddress: '123 Main St, Paris, France',
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        applicationData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreateApplication(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.application).toBeDefined();
      expect(responseData.application.id).toBeDefined();
      expect(responseData.application.type).toBe('tourist');
      expect(responseData.application.status).toBe('draft');
      expect(responseData.application.user_id).toBe(testUser.id);
      expect(responseData.application.personal_info).toEqual(applicationData.personalInfo);
      expect(responseData.application.travel_details).toEqual(applicationData.travelDetails);
    });

    it('should reject application creation without authentication', async () => {
      const applicationData = {
        type: 'tourist',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        applicationData
      );

      const response = await CreateApplication(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Authentication required');
    });

    it('should validate required fields for application creation', async () => {
      const applicationData = {
        // Missing type and personalInfo
        travelDetails: {
          purposeOfVisit: 'Tourism',
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        applicationData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreateApplication(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });

    it('should validate visa type', async () => {
      const applicationData = {
        type: 'invalid-visa-type',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        applicationData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreateApplication(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid visa type');
    });

    it('should save application with incomplete data as draft', async () => {
      const incompleteData = {
        type: 'business',
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          // Missing other required fields
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        incompleteData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreateApplication(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.application.status).toBe('draft');
      expect(responseData.application.completion_percentage).toBeLessThan(100);
    });

    it('should trigger AI visa recommendation for new application', async () => {
      const applicationData = {
        type: 'business',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          passportNumber: 'AB123456789',
        },
        travelDetails: {
          purposeOfVisit: 'Business meetings',
          plannedArrival: '2024-06-01',
          plannedDeparture: '2024-06-15',
        },
        employment: {
          position: 'Software Engineer',
          company: 'Tech Corp',
          annualSalary: 80000,
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        applicationData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreateApplication(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.application).toBeDefined();
      expect(responseData.aiRecommendation).toBeDefined();
      expect(responseData.aiRecommendation.recommendedVisaType).toBe('business');
      expect(responseData.aiRecommendation.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('GET /api/applications/[id]', () => {
    let testApplication: any;

    beforeEach(async () => {
      testApplication = await testHelper.createTestApplication(testUser.id, {
        type: 'tourist',
        status: 'draft',
      });
    });

    it('should retrieve application by ID for authenticated user', async () => {
      const request = testHelper.createMockRequest(
        'GET',
        `/api/applications/${testApplication.id}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await GetApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.application).toBeDefined();
      expect(responseData.application.id).toBe(testApplication.id);
      expect(responseData.application.user_id).toBe(testUser.id);
    });

    it('should reject access to application by different user', async () => {
      // Create another user
      const otherUser = await testHelper.createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      });
      const otherSession = await testHelper.loginTestUser(otherUser.email, otherUser.password);

      const request = testHelper.createMockRequest(
        'GET',
        `/api/applications/${testApplication.id}`,
        undefined,
        {
          Authorization: `Bearer ${otherSession.session.access_token}`,
        }
      );

      const response = await GetApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Access denied');
    });

    it('should return 404 for non-existent application', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const request = testHelper.createMockRequest(
        'GET',
        `/api/applications/${nonExistentId}`,
        undefined,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await GetApplication(request, { params: { id: nonExistentId } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Application not found');
    });
  });

  describe('PUT /api/applications/[id]', () => {
    let testApplication: any;

    beforeEach(async () => {
      testApplication = await testHelper.createTestApplication(testUser.id, {
        type: 'tourist',
        status: 'draft',
      });
    });

    it('should update application with valid data', async () => {
      const updateData = {
        personalInfo: {
          ...testApplication.personalInfo,
          phoneNumber: '+1234567890',
          address: '123 Test St, Test City, Test Country',
        },
        employment: {
          position: 'Software Engineer',
          company: 'Tech Corp',
          workAddress: '456 Work St, Work City, Work Country',
        },
      };

      const request = testHelper.createMockRequest(
        'PUT',
        `/api/applications/${testApplication.id}`,
        updateData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await UpdateApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.application.personal_info.phoneNumber).toBe(updateData.personalInfo.phoneNumber);
      expect(responseData.application.employment).toEqual(updateData.employment);
      expect(responseData.application.updated_at).toBeDefined();
    });

    it('should calculate completion percentage after update', async () => {
      const completeData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          passportNumber: 'AB123456789',
          passportExpiry: '2030-01-01',
          phoneNumber: '+1234567890',
          address: '123 Test St',
        },
        travelDetails: {
          purposeOfVisit: 'Tourism',
          plannedArrival: '2024-06-01',
          plannedDeparture: '2024-06-15',
          accommodation: 'Hotel Royal',
          accommodationAddress: '123 Main St',
        },
        employment: {
          position: 'Engineer',
          company: 'Tech Corp',
          workAddress: '456 Work St',
        },
      };

      const request = testHelper.createMockRequest(
        'PUT',
        `/api/applications/${testApplication.id}`,
        completeData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await UpdateApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.application.completion_percentage).toBeGreaterThan(80);
    });

    it('should reject update on submitted application', async () => {
      // First submit the application
      await global.testUtils.supabase
        .from('applications')
        .update({ status: 'submitted' })
        .eq('id', testApplication.id);

      const updateData = {
        personalInfo: {
          firstName: 'Updated Name',
        },
      };

      const request = testHelper.createMockRequest(
        'PUT',
        `/api/applications/${testApplication.id}`,
        updateData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await UpdateApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Cannot update submitted application');
    });
  });

  describe('POST /api/applications/[id]/submit', () => {
    let testApplication: any;

    beforeEach(async () => {
      testApplication = await testHelper.createTestApplication(testUser.id, {
        type: 'tourist',
        status: 'draft',
        personal_info: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          passportNumber: 'AB123456789',
          passportExpiry: '2030-01-01',
        },
        travel_details: {
          purposeOfVisit: 'Tourism',
          plannedArrival: '2024-06-01',
          plannedDeparture: '2024-06-15',
          accommodation: 'Hotel Royal',
        },
      });
    });

    it('should submit complete application successfully', async () => {
      // First, add required documents
      await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'passport',
        status: 'verified',
      });
      await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'photo',
        status: 'verified',
      });

      const request = testHelper.createMockRequest(
        'POST',
        `/api/applications/${testApplication.id}/submit`,
        {},
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await SubmitApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.application.status).toBe('submitted');
      expect(responseData.application.submitted_at).toBeDefined();
      expect(responseData.submissionId).toBeDefined();
    });

    it('should reject submission of incomplete application', async () => {
      // Application without required documents
      const request = testHelper.createMockRequest(
        'POST',
        `/api/applications/${testApplication.id}/submit`,
        {},
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await SubmitApplication(request, { params: { id: testApplication.id } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Application is incomplete');
      expect(responseData.missingRequirements).toBeDefined();
    });

    it('should send confirmation email after successful submission', async () => {
      // Add required documents
      await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'passport',
        status: 'verified',
      });
      await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'photo',
        status: 'verified',
      });

      const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
      jest.doMock('../../../lib/email/sendgrid', () => ({
        sendEmail: sendEmailMock,
      }));

      const request = testHelper.createMockRequest(
        'POST',
        `/api/applications/${testApplication.id}/submit`,
        {},
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await SubmitApplication(request, { params: { id: testApplication.id } });
      expect(response.status).toBe(200);

      // Verify confirmation email was sent
      expect(sendEmailMock).toHaveBeenCalledWith({
        to: testUser.email,
        subject: 'Application Submitted Successfully',
        templateId: 'application_submitted',
        templateData: {
          firstName: testUser.firstName,
          applicationId: testApplication.id,
          submissionId: expect.any(String),
        },
      });
    });

    it('should prevent double submission', async () => {
      // Add required documents
      await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'passport',
        status: 'verified',
      });
      await testHelper.createTestDocument(testUser.id, testApplication.id, {
        type: 'photo',
        status: 'verified',
      });

      // First submission
      const request1 = testHelper.createMockRequest(
        'POST',
        `/api/applications/${testApplication.id}/submit`,
        {},
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );
      
      const response1 = await SubmitApplication(request1, { params: { id: testApplication.id } });
      expect(response1.status).toBe(200);

      // Second submission attempt
      const request2 = testHelper.createMockRequest(
        'POST',
        `/api/applications/${testApplication.id}/submit`,
        {},
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response2 = await SubmitApplication(request2, { params: { id: testApplication.id } });
      const responseData2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(responseData2.success).toBe(false);
      expect(responseData2.error).toContain('Application already submitted');
    });
  });

  describe('Application Workflow', () => {
    it('should maintain proper status transitions', async () => {
      // Create application (draft)
      const application = await testHelper.createTestApplication(testUser.id);
      expect(application.status).toBe('draft');

      // Add documents and submit (submitted)
      await testHelper.createTestDocument(testUser.id, application.id, {
        type: 'passport',
        status: 'verified',
      });

      const submitRequest = testHelper.createMockRequest(
        'POST',
        `/api/applications/${application.id}/submit`,
        {},
        { Authorization: `Bearer ${authSession.access_token}` }
      );

      const submitResponse = await SubmitApplication(submitRequest, { params: { id: application.id } });
      expect(submitResponse.status).toBe(200);

      // Verify status in database
      const { data: updatedApp } = await global.testUtils.supabase
        .from('applications')
        .select('status')
        .eq('id', application.id)
        .single();

      expect(updatedApp.status).toBe('submitted');
    });

    it('should track application timeline events', async () => {
      const application = await testHelper.createTestApplication(testUser.id);

      // Submit application
      await testHelper.createTestDocument(testUser.id, application.id, {
        type: 'passport',
        status: 'verified',
      });

      const submitRequest = testHelper.createMockRequest(
        'POST',
        `/api/applications/${application.id}/submit`,
        {},
        { Authorization: `Bearer ${authSession.access_token}` }
      );

      await SubmitApplication(submitRequest, { params: { id: application.id } });

      // Check timeline events
      const { data: timeline } = await global.testUtils.supabase
        .from('application_timeline')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: true });

      expect(timeline).toHaveLength(2); // Created and Submitted events
      expect(timeline[0].event_type).toBe('created');
      expect(timeline[1].event_type).toBe('submitted');
    });
  });
});