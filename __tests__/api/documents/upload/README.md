# Documents Upload API Tests

This directory contains comprehensive unit tests for the `/api/documents/upload` endpoint.

## Test Coverage

### POST /api/documents/upload

**Authentication & Validation Tests:**
- ✅ Rejects unauthenticated requests (401)
- ✅ Validates required fields (file and documentType)
- ✅ Validates file types (PDF, JPEG, PNG only)
- ✅ Validates file size (max 10MB)

**File Upload Tests:**
- ✅ Successfully uploads valid documents
- ✅ Handles optional applicationId parameter
- ✅ Generates unique filenames with timestamp and random bytes
- ✅ Calculates SHA-256 file hash for integrity

**Storage & Database Tests:**
- ✅ Handles Supabase storage upload errors
- ✅ Handles database insert errors with cleanup
- ✅ Stores complete document metadata

**Error Handling:**
- ✅ Graceful handling of unexpected errors
- ✅ Proper error responses with appropriate status codes

### GET /api/documents/upload

**Authentication & Access Control:**
- ✅ Rejects unauthenticated requests (401)
- ✅ Returns only user's own documents

**Query & Filtering:**
- ✅ Lists all documents for authenticated user
- ✅ Handles query parameters for filtering
- ✅ Returns empty array when no documents exist

**Error Handling:**
- ✅ Handles database query errors
- ✅ Graceful handling of unexpected errors

## Test Statistics

- **Total Tests:** 19
- **Pass Rate:** 100%
- **Coverage Areas:**
  - Authentication & Authorization
  - Input Validation
  - File Upload & Storage
  - Database Operations
  - Error Handling
  - Query Parameters

## Mock Strategy

The tests use comprehensive mocks for:
- **Supabase Client**: Database operations and authentication
- **Supabase Storage**: File upload/removal operations
- **File Objects**: Mock File instances for upload testing
- **FormData**: Mock form data for multipart requests
- **Crypto Module**: Consistent hash generation for testing

## Running Tests

```bash
# Run all document upload tests
npm run test:api -- __tests__/api/documents/upload/route.test.ts

# Run with coverage
npm run test:coverage -- __tests__/api/documents/upload/route.test.ts
```

## Key Test Patterns

1. **Comprehensive Mock Setup**: Each test has properly isolated mocks
2. **Error Simulation**: Tests cover both happy path and error scenarios
3. **Edge Cases**: File size limits, invalid file types, missing parameters
4. **Security**: Authentication checks and data isolation
5. **Integration Points**: Storage and database operations are tested