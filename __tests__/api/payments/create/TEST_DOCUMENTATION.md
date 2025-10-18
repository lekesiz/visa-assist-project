# Payment Creation API Tests Documentation

## Overview
This file contains comprehensive unit tests for the payment creation API endpoint at `/api/payments/create/route.ts`. The tests cover both POST (payment creation) and GET (payment status retrieval) operations.

## Test Coverage

### POST /api/payments/create

#### Success Cases
- ✅ **Valid Payment Creation**: Tests successful payment creation with all required fields
- ✅ **Custom Amount Payments**: Tests payments with custom amounts instead of predefined service types
- ✅ **Multiple Payment Providers**: Tests both Stripe and PayPal payment creation
- ✅ **All Service Types**: Tests all predefined service types with correct pricing:
  - basic_consultation: €49
  - visa_application: €199
  - premium_support: €399
  - denklik_service: €149
  - job_match_service: €99
  - document_review: €29
  - appointment_booking: €39
  - express_service: €99

#### Database Operations
- ✅ **Payment Record Creation**: Verifies payment record is inserted into database
- ✅ **Provider Details Update**: Tests updating payment record with provider-specific data
- ✅ **Activity Logging**: Verifies activity logs are created for payment initiation
- ✅ **User Profile Integration**: Tests fetching user profile data for payment metadata

#### Error Handling
- ✅ **Authentication Errors**: Tests 401 responses for unauthenticated users
- ✅ **Validation Errors**: Tests 400 responses for:
  - Missing service type and custom amount
  - Missing return URL
  - Missing cancel URL
  - Invalid service type
- ✅ **Database Errors**: Tests handling of database insertion failures
- ✅ **Payment Provider Errors**: Tests handling of payment provider failures
- ✅ **Missing User Profile**: Tests graceful handling when user profile is not found
- ✅ **Malformed Requests**: Tests handling of invalid JSON requests

### GET /api/payments/create

#### Success Cases
- ✅ **Payment Status by ID**: Tests retrieving payment status by internal payment ID
- ✅ **Payment Status by Provider ID**: Tests retrieving payment status by provider payment ID

#### Error Handling
- ✅ **Authentication Errors**: Tests 401 responses for unauthenticated users
- ✅ **Missing Parameters**: Tests 400 responses when no payment ID is provided
- ✅ **Payment Not Found**: Tests 404 responses for non-existent payments
- ✅ **Unauthorized Access**: Tests 404 responses when payment belongs to different user
- ✅ **Database Errors**: Tests handling of database query failures

## Test Data Structure

### Mock User
```typescript
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  // ... other user properties
}
```

### Mock Payment Data
```typescript
const validPaymentData = {
  provider: 'stripe',
  serviceType: 'visa_application',
  applicationId: 'app-123',
  currency: 'EUR',
  returnUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel'
}
```

### Mock Database Records
- User profiles with personal information
- Payment records with all required fields
- Activity logs for audit trail

## Mocking Strategy

### Supabase Client
- Uses comprehensive mock that supports all query builder methods
- Configurable responses for different tables (user_profiles, payments, activity_logs)
- Supports error simulation for testing failure scenarios

### Payment Provider
- Mocks the `createPayment` function from payment provider library
- Returns appropriate response structure for different providers (Stripe/PayPal)
- Supports error simulation for provider failures

## Key Test Features

### Comprehensive Validation
- Tests all required field validations
- Tests business logic (service type pricing, amount calculations)
- Tests database constraints and relationships

### Error Boundary Testing
- Tests every possible error scenario
- Ensures proper HTTP status codes
- Verifies error message content

### Provider-Specific Testing
- Stripe: Tests client secret generation and payment intent creation
- PayPal: Tests approval URL generation and order creation
- Tests provider-specific metadata handling

### Security Testing
- Authentication requirement enforcement
- User isolation (users can only access their own payments)
- Data validation and sanitization

## Integration Points Tested

1. **Authentication**: Supabase auth integration
2. **Database**: User profiles, payments, and activity logs tables
3. **Payment Providers**: Stripe and PayPal integration
4. **URL Handling**: Return and cancel URL processing
5. **Metadata Management**: User and payment metadata handling

## Run Tests

```bash
# Run all payment tests
npm test __tests__/api/payments/create/route.test.ts

# Run with coverage
npm run test:coverage -- __tests__/api/payments/create/route.test.ts

# Run in watch mode
npm test -- --watch __tests__/api/payments/create/route.test.ts
```

## Test Assertions

Each test includes comprehensive assertions for:
- HTTP status codes
- Response structure and content
- Database operation calls
- Mock function invocations
- Error message accuracy
- Data integrity and validation