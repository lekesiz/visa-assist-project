# API Tests

This directory contains tests for all API endpoints in the visa assist project.

## Structure

```
__tests__/
├── api/
│   ├── health/              # Health check endpoint tests
│   ├── applications/        # Application management tests
│   ├── appointments/        # Appointment booking tests
│   ├── documents/           # Document upload tests
│   ├── payments/            # Payment processing tests
│   ├── ai/                  # AI service tests
│   └── test-helpers.ts      # Common test utilities
├── integration/             # Integration tests
└── e2e/                     # End-to-end tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test __tests__/api/health/route.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="health check"
```

## Writing Tests

### Basic API Test Structure

```typescript
import { GET, POST } from '@/app/api/your-endpoint/route'
import { createMockSupabaseClient, createAuthenticatedRequest } from '@/tests/api/test-helpers'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('/api/your-endpoint', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should handle GET request', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-endpoint')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    // Add more assertions
  })
})
```

### Testing Authenticated Endpoints

```typescript
import { createAuthenticatedRequest, mockUser } from '@/tests/api/test-helpers'

it('should require authentication', async () => {
  // Test without auth
  const request = new NextRequest('http://localhost:3000/api/protected')
  const response = await GET(request)
  expect(response.status).toBe(401)

  // Test with auth
  const authRequest = createAuthenticatedRequest('http://localhost:3000/api/protected')
  const authResponse = await GET(authRequest)
  expect(authResponse.status).toBe(200)
})
```

### Testing POST Requests with Body

```typescript
import { createRequestWithBody } from '@/tests/api/test-helpers'

it('should handle POST with JSON body', async () => {
  const requestData = { name: 'Test', email: 'test@example.com' }
  const request = createRequestWithBody(
    'http://localhost:3000/api/endpoint',
    requestData
  )
  
  const response = await POST(request)
  expect(response.status).toBe(201)
})
```

## Test Helpers

The `test-helpers.ts` file provides common utilities:

- `createMockSupabaseClient()`: Creates a mock Supabase client
- `createAuthenticatedRequest()`: Creates a request with auth headers
- `createRequestWithBody()`: Creates a request with JSON body
- `mockEnvironment()`: Mocks environment variables
- `expectErrorResponse()`: Helper for testing error responses
- `expectSuccessResponse()`: Helper for testing success responses
- `createMockFile()`: Creates mock file for upload tests
- `createMockFormData()`: Creates FormData for file upload tests

## Coverage Goals

- Minimum 80% code coverage for all API routes
- 100% coverage for critical paths (auth, payments, data operations)
- All error cases should be tested
- All edge cases should be covered

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Mock External Services**: Always mock Supabase, payment providers, etc.
3. **Test Error Cases**: Test both success and failure scenarios
4. **Use Descriptive Names**: Test names should clearly describe what they test
5. **Clean Up**: Always clean up mocks and restore environment after tests
6. **Test Real Scenarios**: Write tests that reflect actual usage patterns

## Common Testing Patterns

### Testing Database Operations

```typescript
// Success case
mockSupabase.from().select().single.mockResolvedValue({
  data: { id: 1, name: 'Test' },
  error: null
})

// Error case
mockSupabase.from().select().single.mockResolvedValue({
  data: null,
  error: new Error('Database error')
})
```

### Testing Authentication

```typescript
// Authenticated user
mockSupabase.auth.getUser.mockResolvedValue({
  data: { user: mockUser },
  error: null
})

// Unauthenticated
mockSupabase.auth.getUser.mockResolvedValue({
  data: { user: null },
  error: null
})
```

### Testing File Uploads

```typescript
const file = createMockFile('content', 'document.pdf')
const formData = createMockFormData({ file, type: 'passport' })
const request = new NextRequest('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
})
```