# AI Document Analysis API Test Documentation

## Overview

This document outlines the comprehensive test suite for the AI document analysis API endpoint (`/api/ai/analyze-document/route.ts`) and its dependencies.

## Test Structure

### 1. Main API Route Tests (`route.test.ts`)

**Location**: `__tests__/api/ai/analyze-document/route.test.ts`

**Coverage Areas**:
- Authentication and authorization
- Input validation
- Document retrieval and ownership verification
- AI service integration
- Database operations
- Response formatting
- Error handling
- Edge cases

**Key Test Categories**:

#### Authentication Tests
- ✅ Returns 401 for unauthenticated users
- ✅ Proceeds with authenticated users
- ✅ Handles authentication errors gracefully

#### Input Validation Tests
- ✅ Requires `documentId` parameter
- ✅ Requires `documentType` parameter
- ✅ Accepts optional `content` parameter
- ✅ Validates parameter types and formats

#### Document Retrieval Tests
- ✅ Verifies document exists
- ✅ Confirms document ownership (user_id matching)
- ✅ Returns 404 for non-existent documents
- ✅ Returns 404 for documents owned by other users

#### AI Integration Tests
- ✅ Calls AI service with correct parameters
- ✅ Uses provided content or default fallback
- ✅ Handles AI service errors properly
- ✅ Updates document status during processing

#### Database Operation Tests
- ✅ Updates document status to 'processing' before analysis
- ✅ Updates document with analysis results
- ✅ Sets verification status based on analysis validity
- ✅ Logs analysis to ai_analyses table
- ✅ Handles database update errors

#### Response Format Tests
- ✅ Returns properly structured success responses
- ✅ Includes all required analysis fields
- ✅ Excludes internal/private data from responses
- ✅ Maintains consistent JSON structure

#### Error Handling Tests
- ✅ Handles malformed JSON requests
- ✅ Manages Supabase connection errors
- ✅ Recovers from authentication check failures
- ✅ Updates document status to 'failed' on errors

### 2. AI Service Integration Tests (`ai-integration.test.ts`)

**Location**: `__tests__/api/ai/analyze-document/ai-integration.test.ts`

**Coverage Areas**:
- AI service method calls
- Provider selection and fallback
- Error handling and recovery
- Performance characteristics
- Content validation

**Key Test Categories**:

#### Service Method Tests
- ✅ Calls OpenAI analyze function correctly
- ✅ Preserves analysis result structure
- ✅ Handles different document types
- ✅ Manages provider-specific parameters

#### Error Scenario Tests
- ✅ Network timeout handling
- ✅ Rate limiting error management
- ✅ Invalid API response handling
- ✅ Malformed data processing

#### Performance Tests
- ✅ Large document content handling
- ✅ Concurrent request processing
- ✅ Response time validation

#### Provider Selection Tests
- ✅ Default provider usage (OpenAI)
- ✅ Explicit provider specification
- ✅ Fallback provider behavior
- ✅ Unsupported provider error handling

### 3. OpenAI Integration Tests (`openai.test.ts`)

**Location**: `__tests__/lib/ai/openai.test.ts`

**Coverage Areas**:
- OpenAI API integration
- Request/response formatting
- Error handling
- Response validation

**Key Test Categories**:

#### API Integration Tests
- ✅ Correct API parameter passing
- ✅ Model and temperature settings
- ✅ System prompt validation
- ✅ Response format specification (JSON)

#### Response Processing Tests
- ✅ JSON parsing and validation
- ✅ Default value assignment for missing fields
- ✅ Complex data structure handling
- ✅ Error response management

#### Error Handling Tests
- ✅ Network error recovery
- ✅ Authentication error handling
- ✅ Timeout error management
- ✅ API rate limit handling

#### Response Validation Tests
- ✅ Confidence score validation
- ✅ Array data handling in extractedData
- ✅ Nested object processing
- ✅ Edge case response formats

## Test Data and Mocks

### Mock Objects

#### Mock User
```typescript
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z'
}
```

#### Mock Document
```typescript
const mockDocument = {
  id: 'doc-123',
  user_id: 'test-user-123',
  filename: 'passport.pdf',
  document_type: 'passport'
}
```

#### Mock AI Analysis Result
```typescript
const mockAnalysis = {
  isValid: true,
  confidence: 95,
  issues: ['Minor formatting issue'],
  suggestions: ['Consider higher resolution scan'],
  extractedData: {
    passportNumber: '123456789',
    fullName: 'John Doe',
    expiryDate: '2030-12-31'
  }
}
```

### Test Helpers Used

- `createMockSupabaseClient()` - Creates chainable Supabase mock
- `createRequestWithBody()` - Creates Next.js request with JSON body
- `expectErrorResponse()` - Validates error response format
- `expectSuccessResponse()` - Validates success response format
- `mockUser` - Standard test user object

## Test Coverage Metrics

### Expected Coverage
- **Statements**: >95%
- **Branches**: >90%
- **Functions**: 100%
- **Lines**: >95%

### Critical Paths Covered
1. ✅ Happy path: Successful document analysis
2. ✅ Authentication failure path
3. ✅ Document not found path
4. ✅ AI service failure path
5. ✅ Database error path
6. ✅ Invalid input path

## Running the Tests

### All AI Analysis Tests
```bash
npm test -- __tests__/api/ai/analyze-document/
```

### Specific Test Files
```bash
# Main route tests
npm test -- __tests__/api/ai/analyze-document/route.test.ts

# AI integration tests
npm test -- __tests__/api/ai/analyze-document/ai-integration.test.ts

# OpenAI specific tests
npm test -- __tests__/lib/ai/openai.test.ts
```

### With Coverage
```bash
npm test -- --coverage __tests__/api/ai/analyze-document/
```

### Watch Mode
```bash
npm test -- --watch __tests__/api/ai/analyze-document/
```

## Environment Requirements

### Test Environment Variables
```bash
NODE_ENV=test
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

### Mock Modules
- `@/lib/supabase/server` - Mocked Supabase client
- `@/lib/ai/provider` - Mocked AI service
- `openai` - Mocked OpenAI SDK
- `next/headers` - Mocked Next.js headers

## Error Scenarios Tested

### 1. Authentication Errors
- No user token
- Invalid token
- Expired token
- Auth service unavailable

### 2. Validation Errors
- Missing required fields
- Invalid data types
- Malformed JSON
- Empty request body

### 3. Database Errors
- Document not found
- Access denied
- Connection failures
- Update failures

### 4. AI Service Errors
- API rate limits
- Network timeouts
- Invalid responses
- Service unavailable

### 5. System Errors
- Memory exhaustion
- Disk space issues
- Process crashes
- Network partitions

## Integration Points Tested

### 1. Supabase Integration
- Authentication flow
- Database queries
- Row level security
- Error handling

### 2. AI Service Integration
- Provider selection
- Fallback mechanisms
- Response processing
- Error recovery

### 3. Next.js Integration
- Request/response handling
- Middleware behavior
- Environment variables
- Route parameters

## Security Test Coverage

### 1. Authentication Tests
- ✅ Unauthenticated access prevention
- ✅ Token validation
- ✅ Session management

### 2. Authorization Tests
- ✅ Document ownership verification
- ✅ User context isolation
- ✅ Permission checking

### 3. Input Sanitization Tests
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ Input validation
- ✅ Data type checking

### 4. Data Privacy Tests
- ✅ Response data filtering
- ✅ Internal field exclusion
- ✅ Sensitive data masking

## Performance Test Coverage

### 1. Load Tests
- ✅ Large document handling
- ✅ Concurrent request processing
- ✅ Memory usage validation

### 2. Latency Tests
- ✅ Response time measurement
- ✅ Database query optimization
- ✅ AI service call timing

### 3. Scalability Tests
- ✅ Multiple user simulation
- ✅ Resource utilization
- ✅ Error rate under load

## Maintenance Guidelines

### 1. Test Updates Required When:
- API endpoint changes
- Database schema modifications
- AI service integration changes
- Authentication flow updates

### 2. Test Review Schedule:
- Weekly: Test execution results
- Monthly: Coverage analysis
- Quarterly: Test strategy review
- Annually: Framework updates

### 3. Performance Benchmarks:
- Test execution: <30 seconds total
- Individual test: <5 seconds max
- Coverage generation: <10 seconds
- Memory usage: <500MB peak

## Conclusion

This comprehensive test suite ensures the AI document analysis API endpoint is robust, secure, and performs well under various conditions. The tests cover all critical paths, error scenarios, and integration points while maintaining high code coverage and fast execution times.