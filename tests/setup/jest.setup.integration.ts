import { TextEncoder, TextDecoder } from 'util';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.test.local' });

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Setup test database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for integration tests');
}

// Create Supabase client for tests
export const testSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Global test utilities
global.testUtils = {
  supabase: testSupabaseClient,
  cleanup: async () => {
    // Cleanup test data after each test
    try {
      await testSupabaseClient.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await testSupabaseClient.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await testSupabaseClient.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await testSupabaseClient.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  },
};

// Setup and teardown for each test
beforeEach(async () => {
  // Reset any mocks
  jest.clearAllMocks();
});

afterEach(async () => {
  // Cleanup test data
  if (global.testUtils?.cleanup) {
    await global.testUtils.cleanup();
  }
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock external services for integration tests
jest.mock('@/lib/ai/openai', () => ({
  analyzeDocument: jest.fn().mockResolvedValue({
    analysis: 'Test analysis',
    recommendations: ['Test recommendation'],
    confidence: 0.95,
  }),
  generateVisaRecommendation: jest.fn().mockResolvedValue({
    recommendedVisaType: 'test-visa',
    reasoning: 'Test reasoning',
    requirements: ['Test requirement'],
    confidence: 0.9,
  }),
}));

jest.mock('@/lib/payments/stripe', () => ({
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret',
    amount: 10000,
    currency: 'eur',
  }),
}));

jest.mock('@/lib/email/sendgrid', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

console.log('Integration test setup complete');