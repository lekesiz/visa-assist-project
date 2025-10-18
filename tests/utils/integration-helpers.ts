import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TestApplication {
  id: string;
  userId: string;
  type: string;
  status: string;
  personalInfo: any;
  documents: any[];
}

export class IntegrationTestHelper {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // User management utilities
  async createTestUser(userData?: Partial<TestUser>): Promise<TestUser> {
    const testUser: TestUser = {
      id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      ...userData,
    };

    const { data, error } = await this.supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        },
      },
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    return { ...testUser, id: data.user?.id || testUser.id };
  }

  async loginTestUser(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Failed to login test user: ${error.message}`);
    }

    return data;
  }

  async deleteTestUser(userId: string) {
    try {
      // Clean up user-related data first
      await this.supabase.from('applications').delete().eq('user_id', userId);
      await this.supabase.from('documents').delete().eq('user_id', userId);
      await this.supabase.from('appointments').delete().eq('user_id', userId);
      await this.supabase.from('payments').delete().eq('user_id', userId);
      
      // Note: Supabase doesn't allow deleting users via client SDK
      // In production, this would be handled by admin API or database triggers
    } catch (error) {
      console.warn('Error cleaning up test user data:', error);
    }
  }

  // Application management utilities
  async createTestApplication(userId: string, applicationData?: Partial<any>): Promise<TestApplication> {
    const defaultApplication = {
      user_id: userId,
      type: 'tourist',
      status: 'draft',
      personal_info: {
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        passportNumber: 'TEST123456',
      },
      travel_details: {
        purposeOfVisit: 'Tourism',
        plannedArrival: '2024-06-01',
        plannedDeparture: '2024-06-15',
        accommodation: 'Hotel Test',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...applicationData,
    };

    const { data, error } = await this.supabase
      .from('applications')
      .insert(defaultApplication)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test application: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      status: data.status,
      personalInfo: data.personal_info,
      documents: [],
    };
  }

  // Document management utilities
  async createTestDocument(userId: string, applicationId: string, documentData?: Partial<any>) {
    const defaultDocument = {
      user_id: userId,
      application_id: applicationId,
      name: 'test-document.pdf',
      type: 'passport',
      size: 1024,
      file_path: '/test/documents/test-document.pdf',
      status: 'uploaded',
      analysis_result: {
        isValid: true,
        confidence: 0.95,
        extractedData: {
          documentType: 'passport',
          expiryDate: '2030-01-01',
        },
      },
      created_at: new Date().toISOString(),
      ...documentData,
    };

    const { data, error } = await this.supabase
      .from('documents')
      .insert(defaultDocument)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test document: ${error.message}`);
    }

    return data;
  }

  // Payment management utilities
  async createTestPayment(userId: string, applicationId: string, paymentData?: Partial<any>) {
    const defaultPayment = {
      user_id: userId,
      application_id: applicationId,
      amount: 10000, // €100.00 in cents
      currency: 'EUR',
      status: 'pending',
      provider: 'stripe',
      provider_payment_id: 'pi_test_123',
      metadata: {
        description: 'Visa application fee',
      },
      created_at: new Date().toISOString(),
      ...paymentData,
    };

    const { data, error } = await this.supabase
      .from('payments')
      .insert(defaultPayment)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test payment: ${error.message}`);
    }

    return data;
  }

  // Appointment management utilities
  async createTestAppointment(userId: string, applicationId: string, appointmentData?: Partial<any>) {
    const defaultAppointment = {
      user_id: userId,
      application_id: applicationId,
      appointment_date: '2024-06-01T10:00:00Z',
      appointment_type: 'visa_interview',
      status: 'scheduled',
      location: 'Test Consulate',
      notes: 'Test appointment',
      created_at: new Date().toISOString(),
      ...appointmentData,
    };

    const { data, error } = await this.supabase
      .from('appointments')
      .insert(defaultAppointment)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test appointment: ${error.message}`);
    }

    return data;
  }

  // API request utilities
  createMockRequest(method: string, url: string, body?: any, headers?: any): NextRequest {
    const mockHeaders = new Headers({
      'Content-Type': 'application/json',
      ...headers,
    });

    const mockUrl = new URL(url, 'http://localhost:3000');
    
    const mockRequest = new NextRequest(mockUrl, {
      method,
      headers: mockHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    return mockRequest;
  }

  // Database cleanup utilities
  async cleanupTestData() {
    try {
      // Clean up in reverse dependency order
      await this.supabase.from('payments').delete().like('provider_payment_id', 'pi_test_%');
      await this.supabase.from('appointments').delete().eq('location', 'Test Consulate');
      await this.supabase.from('documents').delete().like('file_path', '/test/%');
      await this.supabase.from('applications').delete().eq('type', 'tourist');
      
      console.log('Test data cleanup completed');
    } catch (error) {
      console.warn('Error during test data cleanup:', error);
    }
  }

  // Wait for async operations
  async waitFor(condition: () => Promise<boolean>, timeout = 5000, interval = 100): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // Generate test file data
  generateTestFile(name: string, type: string, size: number = 1024): File {
    const content = 'a'.repeat(size);
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  }
}

// Export singleton instance
export const testHelper = new IntegrationTestHelper();