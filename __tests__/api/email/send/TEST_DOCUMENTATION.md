# Email Send API Tests Documentation

## Overview
This document describes the comprehensive test suite for the `/api/email/send` endpoint, covering email template processing, validation, and email service integration.

## Test Structure

### 1. Authentication Tests
- **Unauthenticated requests**: Verifies 401 response for missing authentication
- **Authenticated requests**: Ensures authenticated users can send emails

### 2. Email Validation Tests
- **Invalid email format**: Tests email address validation using `validateEmail` function
- **Valid email format**: Confirms valid emails are processed correctly

### 3. Email Type-Specific Tests

#### Welcome Emails
- **Successful sending**: Tests welcome email with firstName and verificationUrl
- **Default values**: Handles missing firstName (defaults to "User")
- **Service integration**: Verifies `sendWelcomeEmail` is called with correct parameters

#### Application Status Emails
- **Complete data**: Tests with applicationId, status, and additionalInfo
- **Missing required fields**: Validates that applicationId and status are required
- **Service integration**: Verifies `sendApplicationStatusEmail` is called correctly

#### Payment Confirmation Emails
- **Complete payment details**: Tests with full payment information
- **Missing payment details**: Validates paymentDetails requirement
- **Service integration**: Verifies `sendPaymentConfirmationEmail` is called correctly

#### Appointment Reminder Emails
- **Complete appointment details**: Tests with full appointment information
- **Missing appointment details**: Validates appointmentDetails requirement
- **Service integration**: Verifies `sendAppointmentReminderEmail` is called correctly

#### Custom Emails (Admin Only)
- **Admin permissions**: Tests that only admin users can send custom emails
- **Non-admin rejection**: Verifies 403 response for non-admin users
- **Required fields**: Validates subject and content/templateId requirements
- **Service integration**: Tests custom email sending with dynamic content

#### Test Emails (Development Only)
- **Development environment**: Tests template processing in development
- **Default template**: Handles missing template parameter
- **Production restriction**: Rejects test emails in production environment
- **Template integration**: Verifies `getEmailTemplate` and `getEmailSubject` calls

### 4. Email Logging Tests
- **Database logging**: Verifies emails are logged to `email_logs` table
- **Activity logging**: Confirms activity logs are created
- **Metadata storage**: Tests that messageId and email data are stored
- **Failed email logging**: Ensures failed attempts are logged with error details

### 5. Email Log Retrieval Tests (GET endpoint)
- **User logs**: Tests fetching email logs for authenticated users
- **Admin access**: Verifies admins can view all email logs
- **Filtering**: Tests filtering by status and email type
- **Pagination**: Validates pagination parameters (limit, offset)
- **Authentication**: Ensures unauthenticated requests are rejected

### 6. Error Handling Tests
- **Email service failures**: Tests handling of SendGrid API errors
- **Template processing errors**: Validates template compilation error handling
- **Database errors**: Tests database connection and query failures
- **Invalid email types**: Verifies unknown email type rejection

### 7. Template Processing Tests
- **HTML templates**: Tests HTML template generation and processing
- **Text templates**: Tests plain text template generation
- **Template data**: Verifies data is passed correctly to templates
- **Template errors**: Tests graceful handling of template compilation errors

## Mock Strategy

### Supabase Client Mocking
```typescript
const mockSupabase = createMockSupabaseClient({
  // Custom mock implementations for specific tests
})
```

### Email Service Mocking
```typescript
jest.mock('@/lib/email/sendgrid', () => ({
  sendEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  // ... other email functions
}))
```

### Template Service Mocking
```typescript
jest.mock('@/lib/email/templates', () => ({
  getEmailTemplate: jest.fn(),
  getEmailSubject: jest.fn()
}))
```

## Test Data Examples

### Welcome Email Data
```typescript
{
  type: 'welcome',
  to: 'john@example.com',
  data: {
    firstName: 'John',
    verificationUrl: 'https://example.com/verify'
  }
}
```

### Application Status Email Data
```typescript
{
  type: 'application_status',
  to: 'user@example.com',
  data: {
    applicationId: 'app-123',
    status: 'approved',
    additionalInfo: { message: 'Congratulations!' }
  }
}
```

### Payment Confirmation Email Data
```typescript
{
  type: 'payment_confirmation',
  to: 'user@example.com',
  data: {
    paymentDetails: {
      amount: 5000,
      currency: 'EUR',
      paymentId: 'pay-123',
      serviceType: 'Visa Application Review'
    }
  }
}
```

## Coverage Areas

### ✅ Covered
1. **Authentication & Authorization**
   - User authentication validation
   - Admin-only features (custom emails)
   
2. **Input Validation**
   - Email address format validation
   - Required field validation for each email type
   - Email type validation

3. **Email Service Integration**
   - All email type handlers (`sendWelcomeEmail`, etc.)
   - Custom email sending with templates
   - Error handling from email service

4. **Template Processing**
   - HTML and text template generation
   - Template data passing
   - Template compilation error handling

5. **Database Operations**
   - Email logging to database
   - Activity log creation
   - Email log retrieval with filtering and pagination

6. **Error Scenarios**
   - Service failures
   - Database errors
   - Invalid inputs
   - Template processing errors

7. **Environment-Specific Features**
   - Test email restrictions in production
   - Development-only template processing

### ⚠️ Areas for Enhancement
1. **Rate Limiting**: Tests for email sending rate limits
2. **Email Queuing**: Tests for email queue processing
3. **Batch Email Sending**: Tests for bulk email operations
4. **Email Analytics**: Tests for open/click tracking

## Running the Tests

```bash
# Run email API tests specifically
npm test -- __tests__/api/email/send/route.test.ts

# Run with coverage
npm test -- --coverage __tests__/api/email/send/route.test.ts

# Run in watch mode
npm test -- --watch __tests__/api/email/send/route.test.ts
```

## Integration with CI/CD

These tests are designed to:
- Run in isolated environments with mocked external services
- Provide comprehensive coverage for critical email functionality
- Validate business logic without external dependencies
- Support both unit and integration testing approaches

## Security Considerations

The tests validate:
- User authentication and authorization
- Admin-only functionality restrictions
- Email address validation
- Input sanitization and validation
- Error message safety (no sensitive data exposure)