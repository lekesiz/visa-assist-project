import { testHelper } from '../../utils/integration-helpers';
import { POST as RegisterUser } from '../../../app/api/auth/register/route';
import { POST as LoginUser } from '../../../app/api/auth/login/route';
import { POST as CreateApplication } from '../../../app/api/applications/route';
import { PUT as UpdateApplication } from '../../../app/api/applications/[id]/route';
import { POST as UploadDocument } from '../../../app/api/documents/upload/route';
import { POST as CreatePayment } from '../../../app/api/payments/create/route';
import { POST as ConfirmPayment } from '../../../app/api/payments/confirm/route';
import { POST as SubmitApplication } from '../../../app/api/applications/[id]/submit/route';
import { POST as BookAppointment } from '../../../app/api/appointments/route';

describe('Complete Visa Application Flow E2E Tests', () => {
  afterEach(async () => {
    await testHelper.cleanupTestData();
  });

  describe('Tourist Visa Application - Complete Flow', () => {
    it('should complete full tourist visa application from registration to appointment booking', async () => {
      const userEmail = `e2e-test-${Date.now()}@example.com`;
      const userPassword = 'E2ETestPassword123!';

      // Step 1: User Registration
      const registrationData = {
        email: userEmail,
        password: userPassword,
        firstName: 'Alice',
        lastName: 'Johnson',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-05-15',
        nationality: 'US',
      };

      const registerRequest = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        registrationData
      );

      const registerResponse = await RegisterUser(registerRequest);
      const registrationResult = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registrationResult.success).toBe(true);
      expect(registrationResult.user.email).toBe(userEmail);

      const userId = registrationResult.user.id;

      // Step 2: User Login
      const loginRequest = testHelper.createMockRequest(
        'POST',
        '/api/auth/login',
        {
          email: userEmail,
          password: userPassword,
        }
      );

      const loginResponse = await LoginUser(loginRequest);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginResult.success).toBe(true);
      expect(loginResult.session.access_token).toBeDefined();

      const authToken = loginResult.session.access_token;

      // Step 3: Create Visa Application
      const applicationData = {
        type: 'tourist',
        personalInfo: {
          firstName: 'Alice',
          lastName: 'Johnson',
          dateOfBirth: '1990-05-15',
          nationality: 'US',
          passportNumber: 'US123456789',
          passportExpiry: '2030-05-15',
          phoneNumber: '+1234567890',
          address: '123 Main St, New York, NY 10001, USA',
        },
        travelDetails: {
          purposeOfVisit: 'Tourism and leisure',
          plannedArrival: '2024-07-01',
          plannedDeparture: '2024-07-14',
          accommodation: 'Hotel Continental Paris',
          accommodationAddress: '3 Rue de Castiglione, 75001 Paris, France',
          itinerary: 'Visit Eiffel Tower, Louvre Museum, and Versailles',
        },
      };

      const createAppRequest = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        applicationData,
        {
          Authorization: `Bearer ${authToken}`,
        }
      );

      const createAppResponse = await CreateApplication(createAppRequest);
      const createAppResult = await createAppResponse.json();

      expect(createAppResponse.status).toBe(201);
      expect(createAppResult.success).toBe(true);
      expect(createAppResult.application.type).toBe('tourist');
      expect(createAppResult.application.status).toBe('draft');

      const applicationId = createAppResult.application.id;

      // Step 4: Update Application with Additional Information
      const updateData = {
        employment: {
          position: 'Software Engineer',
          company: 'Tech Solutions Inc.',
          workAddress: '456 Business Ave, New York, NY 10002, USA',
          annualSalary: 85000,
          employmentLetter: true,
        },
        financial: {
          bankBalance: 15000,
          monthlyIncome: 7000,
          sponsors: [],
          financialDocuments: ['bank_statement', 'salary_slip'],
        },
        travel: {
          previousVisits: [
            {
              country: 'Canada',
              date: '2022-08-15',
              duration: '7 days',
            },
          ],
          travelInsurance: {
            provider: 'Global Travel Insurance',
            coverage: 50000,
            validFrom: '2024-06-25',
            validTo: '2024-07-20',
          },
        },
      };

      const updateAppRequest = testHelper.createMockRequest(
        'PUT',
        `/api/applications/${applicationId}`,
        updateData,
        {
          Authorization: `Bearer ${authToken}`,
        }
      );

      const updateAppResponse = await UpdateApplication(updateAppRequest, {
        params: { id: applicationId },
      });
      const updateAppResult = await updateAppResponse.json();

      expect(updateAppResponse.status).toBe(200);
      expect(updateAppResult.success).toBe(true);
      expect(updateAppResult.application.employment).toEqual(updateData.employment);
      expect(updateAppResult.application.completion_percentage).toBeGreaterThan(70);

      // Step 5: Upload Required Documents
      const documentTypes = [
        { type: 'passport', filename: 'passport.pdf' },
        { type: 'photo', filename: 'passport-photo.jpg' },
        { type: 'bank_statement', filename: 'bank-statement.pdf' },
        { type: 'travel_insurance', filename: 'travel-insurance.pdf' },
        { type: 'employment_letter', filename: 'employment-letter.pdf' },
      ];

      const uploadedDocuments = [];

      for (const docType of documentTypes) {
        const file = testHelper.generateTestFile(
          docType.filename,
          docType.type === 'photo' ? 'image/jpeg' : 'application/pdf',
          2048
        );

        const formData = new FormData();
        formData.append('file', file);
        formData.append('applicationId', applicationId);
        formData.append('documentType', docType.type);
        formData.append('description', `${docType.type} document for visa application`);

        const uploadRequest = testHelper.createMockRequest(
          'POST',
          '/api/documents/upload',
          formData,
          {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          }
        );

        const uploadResponse = await UploadDocument(uploadRequest);
        const uploadResult = await uploadResponse.json();

        expect(uploadResponse.status).toBe(201);
        expect(uploadResult.success).toBe(true);
        expect(uploadResult.document.type).toBe(docType.type);
        expect(uploadResult.document.analysis_result).toBeDefined();

        uploadedDocuments.push(uploadResult.document);
      }

      expect(uploadedDocuments).toHaveLength(5);

      // Step 6: Create Payment
      const paymentData = {
        applicationId: applicationId,
        amount: 10000, // €100.00 in cents
        currency: 'EUR',
        paymentMethod: 'stripe',
        description: 'Tourist visa application fee',
      };

      const createPaymentRequest = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authToken}`,
        }
      );

      const createPaymentResponse = await CreatePayment(createPaymentRequest);
      const createPaymentResult = await createPaymentResponse.json();

      expect(createPaymentResponse.status).toBe(201);
      expect(createPaymentResult.success).toBe(true);
      expect(createPaymentResult.payment.amount).toBe(10000);
      expect(createPaymentResult.clientSecret).toBeDefined();

      const paymentId = createPaymentResult.payment.id;
      const paymentIntentId = createPaymentResult.payment.provider_payment_id;

      // Step 7: Confirm Payment
      const confirmPaymentData = {
        paymentId: paymentId,
        paymentIntentId: paymentIntentId,
        provider: 'stripe',
      };

      const confirmPaymentRequest = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmPaymentData,
        {
          Authorization: `Bearer ${authToken}`,
        }
      );

      const confirmPaymentResponse = await ConfirmPayment(confirmPaymentRequest);
      const confirmPaymentResult = await confirmPaymentResponse.json();

      expect(confirmPaymentResponse.status).toBe(200);
      expect(confirmPaymentResult.success).toBe(true);
      expect(confirmPaymentResult.payment.status).toBe('completed');

      // Step 8: Submit Application
      const submitRequest = testHelper.createMockRequest(
        'POST',
        `/api/applications/${applicationId}/submit`,
        {},
        {
          Authorization: `Bearer ${authToken}`,
        }
      );

      const submitResponse = await SubmitApplication(submitRequest, {
        params: { id: applicationId },
      });
      const submitResult = await submitResponse.json();

      expect(submitResponse.status).toBe(200);
      expect(submitResult.success).toBe(true);
      expect(submitResult.application.status).toBe('submitted');
      expect(submitResult.submissionId).toBeDefined();

      // Step 9: Book Appointment
      const appointmentData = {
        applicationId: applicationId,
        appointmentDate: '2024-06-15T10:00:00Z',
        appointmentType: 'visa_interview',
        location: 'French Consulate New York',
        notes: 'Tourist visa interview appointment',
      };

      const bookAppointmentRequest = testHelper.createMockRequest(
        'POST',
        '/api/appointments',
        appointmentData,
        {
          Authorization: `Bearer ${authToken}`,
        }
      );

      const bookAppointmentResponse = await BookAppointment(bookAppointmentRequest);
      const bookAppointmentResult = await bookAppointmentResponse.json();

      expect(bookAppointmentResponse.status).toBe(201);
      expect(bookAppointmentResult.success).toBe(true);
      expect(bookAppointmentResult.appointment.appointment_date).toBe(
        appointmentData.appointmentDate
      );
      expect(bookAppointmentResult.appointment.status).toBe('scheduled');

      // Step 10: Verify Final Application State
      const { data: finalApplication } = await global.testUtils.supabase
        .from('applications')
        .select('*, documents(*), payments(*), appointments(*)')
        .eq('id', applicationId)
        .single();

      expect(finalApplication.status).toBe('submitted');
      expect(finalApplication.payment_status).toBe('paid');
      expect(finalApplication.documents).toHaveLength(5);
      expect(finalApplication.payments).toHaveLength(1);
      expect(finalApplication.appointments).toHaveLength(1);
      expect(finalApplication.completion_percentage).toBe(100);

      // Verify all documents are uploaded and analyzed
      finalApplication.documents.forEach((doc: any) => {
        expect(doc.status).toBeIn(['uploaded', 'verified']);
        expect(doc.analysis_result).toBeDefined();
      });

      // Verify payment is completed
      expect(finalApplication.payments[0].status).toBe('completed');

      // Verify appointment is scheduled
      expect(finalApplication.appointments[0].status).toBe('scheduled');

      console.log('✅ Complete tourist visa application flow test passed');
    }, 60000); // 60 second timeout for complete flow

    it('should handle business visa application with work permit documents', async () => {
      const userEmail = `business-e2e-${Date.now()}@example.com`;
      const userPassword = 'BusinessTest123!';

      // Register and login
      await testHelper.createTestUser({
        email: userEmail,
        password: userPassword,
        firstName: 'Robert',
        lastName: 'Business',
      });

      const loginResult = await testHelper.loginTestUser(userEmail, userPassword);
      const authToken = loginResult.session.access_token;

      // Create business visa application
      const businessAppData = {
        type: 'business',
        personalInfo: {
          firstName: 'Robert',
          lastName: 'Business',
          dateOfBirth: '1985-03-20',
          nationality: 'US',
          passportNumber: 'US987654321',
          passportExpiry: '2029-03-20',
        },
        travelDetails: {
          purposeOfVisit: 'Business meetings and conferences',
          plannedArrival: '2024-06-01',
          plannedDeparture: '2024-06-10',
          accommodation: 'Business Hotel Paris',
          businessContacts: [
            {
              company: 'French Tech Corp',
              contactPerson: 'Jean Dupont',
              email: 'jean.dupont@frenchtech.fr',
              phone: '+33123456789',
            },
          ],
        },
        employment: {
          position: 'Senior Manager',
          company: 'Global Corp USA',
          workAddress: '789 Corporate Blvd, New York, NY',
          annualSalary: 120000,
        },
      };

      const createAppRequest = testHelper.createMockRequest(
        'POST',
        '/api/applications',
        businessAppData,
        { Authorization: `Bearer ${authToken}` }
      );

      const createAppResponse = await CreateApplication(createAppRequest);
      const createAppResult = await createAppResponse.json();

      expect(createAppResponse.status).toBe(201);
      expect(createAppResult.application.type).toBe('business');

      const applicationId = createAppResult.application.id;

      // Upload business-specific documents
      const businessDocuments = [
        { type: 'passport', filename: 'passport.pdf' },
        { type: 'business_invitation', filename: 'invitation-letter.pdf' },
        { type: 'company_registration', filename: 'company-docs.pdf' },
        { type: 'employment_letter', filename: 'employment-letter.pdf' },
        { type: 'financial_proof', filename: 'financial-statement.pdf' },
      ];

      for (const docType of businessDocuments) {
        const file = testHelper.generateTestFile(docType.filename, 'application/pdf', 2048);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('applicationId', applicationId);
        formData.append('documentType', docType.type);

        const uploadRequest = testHelper.createMockRequest(
          'POST',
          '/api/documents/upload',
          formData,
          {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          }
        );

        const uploadResponse = await UploadDocument(uploadRequest);
        expect(uploadResponse.status).toBe(201);
      }

      // Process payment (higher fee for business visa)
      const paymentData = {
        applicationId: applicationId,
        amount: 15000, // €150.00 for business visa
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const createPaymentRequest = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        { Authorization: `Bearer ${authToken}` }
      );

      const createPaymentResponse = await CreatePayment(createPaymentRequest);
      expect(createPaymentResponse.status).toBe(201);

      const paymentResult = await createPaymentResponse.json();
      expect(paymentResult.payment.amount).toBe(15000);

      console.log('✅ Business visa application flow test passed');
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle application submission with missing documents', async () => {
      const testUser = await testHelper.createTestUser();
      const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
      const authToken = loginResult.session.access_token;

      // Create application
      const application = await testHelper.createTestApplication(testUser.id, {
        type: 'tourist',
        status: 'draft',
      });

      // Only upload passport (missing other required documents)
      const file = testHelper.generateTestFile('passport.pdf', 'application/pdf', 2048);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', application.id);
      formData.append('documentType', 'passport');

      const uploadRequest = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      await UploadDocument(uploadRequest);

      // Try to submit with missing documents
      const submitRequest = testHelper.createMockRequest(
        'POST',
        `/api/applications/${application.id}/submit`,
        {},
        { Authorization: `Bearer ${authToken}` }
      );

      const submitResponse = await SubmitApplication(submitRequest, {
        params: { id: application.id },
      });
      const submitResult = await submitResponse.json();

      expect(submitResponse.status).toBe(400);
      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toContain('Application is incomplete');
      expect(submitResult.missingRequirements).toBeDefined();
      expect(submitResult.missingRequirements.documents).toContain('photo');
    });

    it('should handle payment failure during application flow', async () => {
      const testUser = await testHelper.createTestUser();
      const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
      const authToken = loginResult.session.access_token;

      const application = await testHelper.createTestApplication(testUser.id);

      // Mock payment failure
      jest.doMock('../../../lib/payments/stripe', () => ({
        createPaymentIntent: jest.fn().mockRejectedValue(new Error('Payment processing failed')),
      }));

      const paymentData = {
        applicationId: application.id,
        amount: 10000,
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const createPaymentRequest = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        { Authorization: `Bearer ${authToken}` }
      );

      const createPaymentResponse = await CreatePayment(createPaymentRequest);
      const createPaymentResult = await createPaymentResponse.json();

      expect(createPaymentResponse.status).toBe(500);
      expect(createPaymentResult.success).toBe(false);
      expect(createPaymentResult.error).toContain('Payment processing failed');

      // Application should remain in previous state
      const { data: unchangedApp } = await global.testUtils.supabase
        .from('applications')
        .select('payment_status')
        .eq('id', application.id)
        .single();

      expect(unchangedApp.payment_status).toBeOneOf([null, 'pending']);
    });

    it('should handle concurrent document uploads gracefully', async () => {
      const testUser = await testHelper.createTestUser();
      const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
      const authToken = loginResult.session.access_token;

      const application = await testHelper.createTestApplication(testUser.id);

      // Attempt to upload multiple documents concurrently
      const uploadPromises = Array.from({ length: 3 }, (_, index) => {
        const file = testHelper.generateTestFile(`document-${index}.pdf`, 'application/pdf', 1024);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('applicationId', application.id);
        formData.append('documentType', 'passport');

        return testHelper.createMockRequest(
          'POST',
          '/api/documents/upload',
          formData,
          {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          }
        );
      });

      const uploadResponses = await Promise.all(
        uploadPromises.map(request => UploadDocument(request))
      );

      // First upload should succeed, others should handle duplication
      expect(uploadResponses[0].status).toBe(201);
      // Subsequent uploads should either succeed (if replacing) or be rejected
      uploadResponses.slice(1).forEach(response => {
        expect([201, 400, 409]).toContain(response.status);
      });
    });

    it('should maintain data consistency during partial failures', async () => {
      const testUser = await testHelper.createTestUser();
      const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
      const authToken = loginResult.session.access_token;

      const application = await testHelper.createTestApplication(testUser.id);

      // Upload documents successfully
      const file = testHelper.generateTestFile('passport.pdf', 'application/pdf', 2048);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', application.id);
      formData.append('documentType', 'passport');

      const uploadRequest = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      await UploadDocument(uploadRequest);

      // Mock database failure during payment creation
      const originalSupabase = global.testUtils.supabase;
      const mockSupabase = {
        ...originalSupabase,
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockRejectedValue(new Error('Database error')),
          select: originalSupabase.from('payments').select,
          update: originalSupabase.from('payments').update,
        }),
      };

      global.testUtils.supabase = mockSupabase as any;

      const paymentData = {
        applicationId: application.id,
        amount: 10000,
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const createPaymentRequest = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        { Authorization: `Bearer ${authToken}` }
      );

      const createPaymentResponse = await CreatePayment(createPaymentRequest);
      expect(createPaymentResponse.status).toBe(500);

      // Restore original Supabase
      global.testUtils.supabase = originalSupabase;

      // Verify application state is still consistent
      const { data: finalApp } = await global.testUtils.supabase
        .from('applications')
        .select('*, documents(*)')
        .eq('id', application.id)
        .single();

      expect(finalApp.documents).toHaveLength(1);
      expect(finalApp.payment_status).toBeOneOf([null, 'pending']);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent user registrations', async () => {
      const registrationPromises = Array.from({ length: 5 }, (_, index) => {
        const userData = {
          email: `load-test-${Date.now()}-${index}@example.com`,
          password: 'LoadTest123!',
          firstName: `User${index}`,
          lastName: 'Test',
        };

        return testHelper.createMockRequest('POST', '/api/auth/register', userData);
      });

      const registrationResponses = await Promise.all(
        registrationPromises.map(request => RegisterUser(request))
      );

      // All registrations should succeed
      registrationResponses.forEach(response => {
        expect(response.status).toBe(201);
      });
    }, 15000);

    it('should handle large document uploads efficiently', async () => {
      const testUser = await testHelper.createTestUser();
      const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
      const authToken = loginResult.session.access_token;

      const application = await testHelper.createTestApplication(testUser.id);

      // Upload a larger document (5MB)
      const largeFile = testHelper.generateTestFile(
        'large-document.pdf',
        'application/pdf',
        5 * 1024 * 1024
      );

      const formData = new FormData();
      formData.append('file', largeFile);
      formData.append('applicationId', application.id);
      formData.append('documentType', 'passport');

      const uploadRequest = testHelper.createMockRequest(
        'POST',
        '/api/documents/upload',
        formData,
        {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        }
      );

      const startTime = Date.now();
      const uploadResponse = await UploadDocument(uploadRequest);
      const uploadTime = Date.now() - startTime;

      expect(uploadResponse.status).toBe(201);
      expect(uploadTime).toBeLessThan(10000); // Should complete within 10 seconds
    }, 15000);
  });
});