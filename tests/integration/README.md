# Integration Testing Documentation

This directory contains comprehensive integration tests for the Visa Assist application. These tests verify the complete functionality of API endpoints, database interactions, and cross-component integrations.

## Test Structure

```
tests/integration/
├── auth/                     # Authentication flow tests
│   ├── registration.test.ts  # User registration integration
│   └── authentication.test.ts # Login/logout/session management
├── applications/             # Visa application flow tests
│   └── visa-application.test.ts # Complete application lifecycle
├── documents/                # Document management tests
│   └── document-upload.test.ts # File upload and AI analysis
├── payments/                 # Payment processing tests
│   └── payment-flow.test.ts  # Stripe/PayPal integration
├── e2e/                      # End-to-end integration tests
│   └── complete-application-flow.test.ts # Full user journey
└── README.md                 # This file
```

## Running Integration Tests

### Prerequisites

1. **Environment Setup**: Ensure your `.env.test.local` file contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_key
   STRIPE_SECRET_KEY=sk_test_...
   OPENAI_API_KEY=your_openai_key
   SENDGRID_API_KEY=your_sendgrid_key
   ```

2. **Test Database**: Use a separate Supabase project/database for testing to avoid affecting production data.

### Commands

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Run integration tests with coverage
npm run test:integration:coverage

# Run specific test suite
npm run test:integration -- auth/registration.test.ts

# Run with verbose output
npm run test:integration -- --verbose
```

## Test Categories

### 1. Authentication Tests (`auth/`)

**Registration Tests** (`registration.test.ts`):
- User registration with valid data
- Email format validation
- Password strength validation
- Duplicate email handling
- Profile data creation
- Welcome email sending

**Authentication Tests** (`authentication.test.ts`):
- Login with valid credentials
- Invalid credential handling
- Rate limiting for failed attempts
- Session management
- Token refresh
- Logout functionality

### 2. Application Tests (`applications/`)

**Visa Application Tests** (`visa-application.test.ts`):
- Application creation and validation
- Application updates and status tracking
- Application submission workflow
- Completion percentage calculation
- AI visa recommendations
- Timeline event tracking

### 3. Document Tests (`documents/`)

**Document Upload Tests** (`document-upload.test.ts`):
- File upload validation (type, size)
- AI document analysis integration
- Document status management
- Security scanning (virus detection)
- Document metadata extraction
- Access control validation

### 4. Payment Tests (`payments/`)

**Payment Flow Tests** (`payment-flow.test.ts`):
- Stripe payment intent creation
- PayPal order processing
- Payment confirmation workflows
- Refund processing
- Webhook handling
- Payment security validation

### 5. End-to-End Tests (`e2e/`)

**Complete Application Flow** (`complete-application-flow.test.ts`):
- Full tourist visa application journey
- Business visa application with work permits
- Error handling and edge cases
- Performance and load testing
- Data consistency validation

## Test Utilities

### Integration Test Helper (`../utils/integration-helpers.ts`)

The `IntegrationTestHelper` class provides utilities for:

- **User Management**: Create, login, and cleanup test users
- **Application Management**: Create and manage test applications
- **Document Management**: Upload and manage test documents
- **Payment Management**: Create and process test payments
- **Database Cleanup**: Automated test data cleanup
- **Mock Request Creation**: Generate properly formatted HTTP requests

### Example Usage

```typescript
import { testHelper } from '../../utils/integration-helpers';

describe('My Integration Test', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await testHelper.createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
  });

  afterEach(async () => {
    await testHelper.cleanupTestData();
  });

  it('should do something', async () => {
    // Your test logic here
  });
});
```

## Configuration

### Jest Configuration (`jest.config.integration.js`)

Key settings for integration tests:
- **Test Environment**: Node.js (for API testing)
- **Setup Files**: Custom integration test setup
- **Test Timeout**: 30 seconds for complex operations
- **Max Workers**: 1 (sequential execution to avoid database conflicts)
- **Coverage**: Focused on API routes and lib functions

### Setup Files

**Main Setup** (`../setup/jest.setup.integration.ts`):
- Environment variable configuration
- Supabase client initialization
- Global test utilities
- Mock configurations for external services

## Best Practices

### 1. Test Isolation
- Each test should be completely independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Never rely on test execution order

### 2. Data Management
- Always clean up test data after each test
- Use unique identifiers (timestamps) for test data
- Never use production data in tests

### 3. Mock Strategy
- Mock external services (AI, payments, email)
- Use real database interactions for integration testing
- Mock only at the service boundaries

### 4. Error Testing
- Test both success and failure scenarios
- Verify proper error messages and status codes
- Test edge cases and boundary conditions

### 5. Performance Considerations
- Set appropriate timeouts for long-running operations
- Test with realistic data volumes
- Monitor test execution time

## Common Patterns

### 1. User Authentication Flow
```typescript
const testUser = await testHelper.createTestUser();
const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
const authToken = loginResult.session.access_token;
```

### 2. API Request Testing
```typescript
const request = testHelper.createMockRequest(
  'POST',
  '/api/endpoint',
  requestData,
  { Authorization: `Bearer ${authToken}` }
);

const response = await apiHandler(request);
const responseData = await response.json();

expect(response.status).toBe(200);
expect(responseData.success).toBe(true);
```

### 3. Database Verification
```typescript
const { data: dbRecord } = await global.testUtils.supabase
  .from('table_name')
  .select('*')
  .eq('id', recordId)
  .single();

expect(dbRecord).toBeDefined();
expect(dbRecord.field).toBe(expectedValue);
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase credentials in `.env.test.local`
   - Ensure test database is accessible
   - Check network connectivity

2. **Test Timeouts**
   - Increase timeout for specific tests
   - Check for unresolved promises
   - Verify cleanup operations complete

3. **Mock Issues**
   - Ensure mocks are properly reset between tests
   - Verify mock return values match expected format
   - Check mock function call counts

4. **Authentication Errors**
   - Verify test user creation succeeds
   - Check token format and expiration
   - Ensure proper headers are set

### Debug Mode

Run tests with additional debugging:
```bash
# Enable debug logging
DEBUG=test:* npm run test:integration

# Run single test with verbose output
npm run test:integration -- --testNamePattern="specific test name" --verbose
```

## Coverage Goals

Integration tests aim for:
- **API Routes**: 100% coverage of all endpoints
- **Database Operations**: 100% coverage of CRUD operations
- **Authentication**: 100% coverage of auth flows
- **Business Logic**: 90%+ coverage of core application logic
- **Error Handling**: 100% coverage of error scenarios

## Continuous Integration

Integration tests are designed to run in CI/CD pipelines:
- Tests use environment variables for configuration
- Database cleanup ensures no state pollution
- Tests are deterministic and repeatable
- Performance tests validate response times

For CI setup, ensure:
1. Test database is provisioned
2. Environment variables are configured
3. External service mocks are properly set up
4. Test timeout limits are appropriate for CI environment