import { testHelper } from '../../utils/integration-helpers';
import { POST } from '../../../app/api/auth/register/route';

describe('User Registration Integration Tests', () => {
  afterEach(async () => {
    await testHelper.cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid data', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.user).toBeDefined();
      expect(responseData.user.email).toBe(userData.email);
      expect(responseData.user.firstName).toBe(userData.firstName);
      expect(responseData.user.lastName).toBe(userData.lastName);
      expect(responseData.user.id).toBeDefined();
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Password must be at least 8 characters');
    });

    it('should reject registration with missing required fields', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        // Missing password, firstName, lastName
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const email = `test-${Date.now()}@example.com`;
      
      // First registration
      await testHelper.createTestUser({ email });

      // Attempt duplicate registration
      const userData = {
        email,
        password: 'TestPassword123!',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('User already exists');
    });

    it('should create user profile data in database after successful registration', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);

      // Wait for database operations to complete
      await testHelper.waitFor(async () => {
        const { data: profile } = await global.testUtils.supabase
          .from('profiles')
          .select('*')
          .eq('email', userData.email)
          .single();
        
        return !!profile;
      });

      // Verify profile was created in database
      const { data: profile, error } = await global.testUtils.supabase
        .from('profiles')
        .select('*')
        .eq('email', userData.email)
        .single();

      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile.first_name).toBe(userData.firstName);
      expect(profile.last_name).toBe(userData.lastName);
      expect(profile.phone_number).toBe(userData.phoneNumber);
      expect(profile.date_of_birth).toBe(userData.dateOfBirth);
      expect(profile.nationality).toBe(userData.nationality);
    });

    it('should send welcome email after successful registration', async () => {
      const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
      
      // Mock the email service
      jest.doMock('../../../lib/email/sendgrid', () => ({
        sendEmail: sendEmailMock,
      }));

      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);

      // Verify welcome email was sent
      expect(sendEmailMock).toHaveBeenCalledWith({
        to: userData.email,
        subject: 'Welcome to Visa Assist',
        templateId: 'welcome',
        templateData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    });

    it('should handle partial success scenarios gracefully', async () => {
      // Mock Supabase to succeed but email to fail
      const sendEmailMock = jest.fn().mockRejectedValue(new Error('Email service unavailable'));
      
      jest.doMock('../../../lib/email/sendgrid', () => ({
        sendEmail: sendEmailMock,
      }));

      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      // Should still succeed even if email fails
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.user).toBeDefined();
      
      // But should include warning about email
      expect(responseData.warnings).toBeDefined();
      expect(responseData.warnings).toContain('Email notification failed');
    });
  });

  describe('User Registration Validation', () => {
    it('should validate phone number format', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: 'invalid-phone',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid phone number format');
    });

    it('should validate date of birth format', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: 'invalid-date',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid date of birth format');
    });

    it('should validate minimum age requirement', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date().toISOString().split('T')[0], // Today
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Must be at least 18 years old');
    });

    it('should validate nationality code', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        nationality: 'INVALID',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/auth/register',
        userData
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid nationality code');
    });
  });
});