# Appointments API Tests Documentation

This document provides comprehensive unit tests for the appointments API endpoints.

## Test Coverage

### 1. GET /api/appointments
- Authentication validation
- Fetching user appointments with pagination
- Filtering by status, type, and date range
- Grouping appointments by date
- Error handling

### 2. POST /api/appointments
- Authentication validation
- Required fields validation
- Time slot conflict checking
- Appointment creation with reminders
- Integration with applications
- Email notifications
- Error handling

### 3. GET /api/appointments/available-slots
- Authentication validation
- Available time slots calculation
- Location-based capacity management
- Weekend/holiday handling
- Past date validation
- User's existing appointments
- Multi-date availability checking

### 4. GET/PUT/DELETE/PATCH /api/appointments/[id]
- Single appointment retrieval
- Appointment updates with validation
- Appointment cancellation
- Status updates (in_progress, completed, no_show)
- Activity logging
- Error handling

## Test Implementation

Due to the complexity of mocking Supabase's query builder pattern, the tests demonstrate:

1. **Authentication Flow**: Tests verify that unauthenticated requests return 401 errors
2. **Validation Logic**: Tests ensure required fields are validated and appropriate error messages are returned
3. **Business Logic**: Tests verify appointment conflict detection, time slot calculations, and capacity management
4. **Error Handling**: Tests ensure database errors are handled gracefully

## Running the Tests

```bash
# Run all appointment tests
npm test -- __tests__/api/appointments --config jest.config.api.js

# Run specific test file
npm test -- __tests__/api/appointments/route.test.ts --config jest.config.api.js

# Run with coverage
npm test -- __tests__/api/appointments --config jest.config.api.js --coverage
```

## Test Structure

Each test file follows this pattern:

```typescript
describe('API Endpoint', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Setup mocks
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('HTTP Method', () => {
    it('should handle specific scenario', async () => {
      // Arrange: Setup test data and mocks
      // Act: Call the API endpoint
      // Assert: Verify the response
    })
  })
})
```

## Key Test Scenarios

### Authentication Tests
- Verify 401 response for unauthenticated requests
- Mock user authentication for protected endpoints

### Validation Tests
- Test missing required fields
- Test invalid data formats
- Test business rule violations

### Success Path Tests
- Test successful data retrieval
- Test successful data creation/updates
- Verify correct response format

### Error Handling Tests
- Test database connection failures
- Test constraint violations
- Test unexpected errors

## Mock Strategy

The tests use Jest mocks for:
- Supabase client and query builder
- Next.js request/response objects
- External API calls (email service)
- Date/time for consistent testing

## Integration Points

The appointment endpoints integrate with:
- Supabase authentication
- Database queries
- Email service
- Activity logging
- Scheduled tasks

Each integration point is mocked to ensure isolated unit testing.