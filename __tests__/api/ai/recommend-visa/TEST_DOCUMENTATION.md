# AI Visa Recommendation API Tests

## Overview
This document describes the comprehensive test suite for the `/api/ai/recommend-visa` endpoint, which provides AI-powered visa recommendations based on user profiles and request data.

## Test Coverage

### 1. Authentication Tests
- **Unauthenticated Access**: Verifies 401 response when no user token
- **Authenticated Access**: Ensures proper authentication flow
- **Authentication Errors**: Handles auth service failures gracefully

### 2. User Profile Validation Tests
- **Missing Profile**: Returns 400 when user profile doesn't exist
- **Profile Query Errors**: Handles database errors during profile retrieval
- **Profile Ownership**: Verifies profile belongs to authenticated user
- **Query Structure**: Validates correct SQL query construction

### 3. User Profile Processing Tests
- **Database Profile Mapping**: Builds user profile from database fields
- **Request Data Override**: Allows request data to override profile data
- **Default Values**: Uses sensible defaults for missing data
- **Age Calculation**: Correctly calculates age from birth_date
- **Data Type Handling**: Processes different data types appropriately

### 4. AI Integration Tests
- **Service Call Parameters**: Verifies correct data passed to AI service
- **AI Service Errors**: Handles AI service failures with proper error response
- **Recommendation Sorting**: Sorts recommendations by eligibility score
- **Empty Recommendations**: Handles cases where AI returns no recommendations

### 5. Database Update Tests
- **Application Updates**: Updates application record when applicationId provided
- **Conditional Updates**: Only updates application when ID is provided
- **AI Analysis Logging**: Logs analysis details to ai_analyses table
- **Database Error Handling**: Gracefully handles database operation failures

### 6. Response Format Tests
- **Success Response Structure**: Validates complete response format
- **Field Presence**: Ensures all required fields are included
- **Data Integrity**: Verifies data consistency between input and output
- **Top Recommendation**: Correctly identifies highest-scoring recommendation

### 7. Error Handling Tests
- **Malformed JSON**: Handles invalid request bodies
- **Service Initialization**: Handles Supabase client creation errors
- **Authentication Failures**: Manages auth service exceptions
- **Database Connectivity**: Handles database connection issues

### 8. Edge Cases Tests
- **Future Birth Dates**: Handles invalid birth dates gracefully
- **Large Values**: Processes extreme values in experience and other fields
- **Special Characters**: Handles international characters in text fields
- **Null/Undefined Values**: Processes missing or undefined request data
- **Leap Year Handling**: Correctly processes leap year birth dates

## Test Data Patterns

### Mock User Profile
```typescript
{
  user_id: 'test-user-123',
  highest_degree: 'Master',
  current_occupation: 'Software Engineer',
  work_experience_years: 8,
  has_job_offer: true,
  german_level: 'B2',
  birth_date: '1985-06-15'
}
```

### Mock AI Recommendations
```typescript
[
  {
    visaType: 'EU Blue Card',
    eligibility: 95,
    requirements: ['University degree', 'Job offer'],
    missingDocuments: [],
    estimatedProcessingTime: '2-3 months',
    successProbability: 90
  }
]
```

### Expected User Profile Processing
```typescript
{
  education: 'Master',
  profession: 'Software Engineer',
  experience: 8,
  hasJobOffer: true,
  germanLevel: 'B2',
  age: 38, // calculated from birth_date
  nationality: 'TUR' // default or from request
}
```

## Key Test Scenarios

### 1. Complete Profile Flow
Tests the full happy path from authentication through AI analysis to response formatting.

### 2. Profile Data Override
Verifies that request data takes precedence over stored profile data, allowing for dynamic recommendations.

### 3. Missing Data Handling
Ensures the system gracefully handles incomplete profiles by using appropriate defaults.

### 4. Age Calculation Accuracy
Tests the internal age calculation logic with various birth date scenarios.

### 5. Recommendation Sorting
Validates that recommendations are properly sorted by eligibility score in descending order.

### 6. Database Integration
Comprehensive testing of all database operations including reads, updates, and logging.

## Mocking Strategy

### Supabase Client
- Uses `createMockSupabaseClient` helper for consistent mocking
- Supports chainable query building
- Handles both successful and error scenarios

### AI Service
- Mocks `aiService.getVisaRecommendations` method
- Allows controlled responses for different test scenarios
- Simulates service failures for error testing

### Environment
- Uses Jest environment for isolated testing
- Mocks external dependencies (OpenAI, Anthropic)
- Provides controlled test data

## Performance Considerations

### Test Execution Speed
- Tests run in parallel where possible
- Minimal external dependencies
- Efficient mock implementations

### Memory Usage
- Proper cleanup after each test
- No memory leaks from mock objects
- Lightweight test data structures

## Security Testing

### Authentication
- Verifies proper user authentication
- Tests unauthorized access scenarios
- Validates user data isolation

### Data Privacy
- Ensures user data is properly scoped
- Tests profile ownership verification
- Validates no cross-user data leakage

## Error Recovery

### Graceful Degradation
- Tests system behavior during service outages
- Validates error message quality
- Ensures proper HTTP status codes

### Data Consistency
- Tests partial failure scenarios
- Validates rollback behavior
- Ensures data integrity

## Integration Points

### External Services
- AI service integration testing
- Database connection testing
- Authentication service testing

### Internal Dependencies
- Profile service integration
- Application service integration
- Logging service integration

## Maintenance Guidelines

### Adding New Tests
1. Follow existing naming conventions
2. Use appropriate test helpers
3. Document test purpose clearly
4. Include edge cases

### Updating Existing Tests
1. Maintain backward compatibility
2. Update related test documentation
3. Verify test coverage remains complete
4. Test both positive and negative scenarios

### Test Data Management
1. Use realistic test data
2. Avoid hardcoded values where possible
3. Maintain data consistency across tests
4. Document test data sources

## Coverage Goals

- **Lines**: >95% coverage of route logic
- **Branches**: >90% coverage of conditional logic
- **Functions**: 100% coverage of exported functions
- **Statements**: >95% coverage of executable statements

## Continuous Integration

### Pre-commit Hooks
- Run tests before code commits
- Validate test coverage thresholds
- Check code quality standards

### CI Pipeline
- Run full test suite on pull requests
- Generate coverage reports
- Validate against regression tests

This comprehensive test suite ensures the AI visa recommendation endpoint is robust, reliable, and handles all expected use cases and edge scenarios appropriately.