# E2E Testing Infrastructure

This directory contains a comprehensive End-to-End (E2E) testing infrastructure using Playwright for the Visa Assist application.

## Overview

The E2E testing infrastructure provides:
- Complete user journey testing from registration to application submission
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Document upload and payment flow testing
- Error handling and edge case validation
- Performance and accessibility testing

## Directory Structure

```
e2e/
├── fixtures/           # Test data and mock files
│   ├── test-data.ts   # Test data constants
│   └── uploads/       # Sample files for upload testing
├── pages/             # Page Object Models
│   ├── base-page.ts   # Base page class
│   ├── home-page.ts   # Homepage interactions
│   ├── login-page.ts  # Login page interactions
│   ├── registration-page.ts
│   ├── dashboard-page.ts
│   └── application-page.ts
├── tests/             # Test specifications
│   ├── auth.spec.ts   # Authentication tests
│   ├── dashboard.spec.ts
│   ├── application-flow.spec.ts
│   ├── payment-flow.spec.ts
│   ├── user-journey.spec.ts
│   └── error-handling.spec.ts
├── utils/             # Test utilities
│   └── test-helpers.ts
├── storage-states/    # Saved authentication states
├── global-setup.ts   # Global test setup
└── global-teardown.ts # Global test cleanup
```

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Application running locally or test environment URL
3. Playwright installed as dependency

### Installation

Playwright is already included in the project dependencies. To install browsers:

```bash
npx playwright install
```

### Configuration

1. Copy environment variables:
```bash
cp .env.e2e .env.local
```

2. Update the environment variables in `.env.local`:
```bash
E2E_BASE_URL=http://localhost:3000
E2E_DEMO_MODE=true
```

### Running Tests

#### All Tests
```bash
npm run test:e2e
```

#### Specific Test File
```bash
npx playwright test auth.spec.ts
```

#### Specific Browser
```bash
npx playwright test --project=chromium
```

#### Mobile Testing
```bash
npx playwright test --project="Mobile Chrome"
```

#### Debug Mode
```bash
npx playwright test --debug
```

#### UI Mode
```bash
npm run test:e2e:ui
```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- User registration flow
- Login/logout functionality
- Form validation
- Security features
- Session management

### 2. Dashboard Tests (`dashboard.spec.ts`)
- Dashboard navigation
- User interface elements
- Quick actions
- Statistics display
- Responsive design

### 3. Application Flow Tests (`application-flow.spec.ts`)
- Application creation and editing
- Multi-step form navigation
- Document upload
- Form validation
- Application submission

### 4. Payment Flow Tests (`payment-flow.spec.ts`)
- Payment method selection
- Stripe/PayPal integration testing
- Payment validation
- Fee calculation
- Payment history

### 5. User Journey Tests (`user-journey.spec.ts`)
- Complete end-to-end workflows
- Different visa types (tourist, business, student, work)
- Multi-page navigation
- State persistence
- Performance testing

### 6. Error Handling Tests (`error-handling.spec.ts`)
- Network error scenarios
- Server error responses
- Form validation errors
- File upload errors
- Edge cases and boundary testing

## Page Object Model

The tests use the Page Object Model pattern for maintainable and reusable code:

### Base Page (`base-page.ts`)
- Common functionality across all pages
- Navigation helpers
- Error handling
- Screenshot utilities

### Specific Pages
Each page class encapsulates:
- Page-specific locators
- Action methods (click, fill, submit)
- Verification methods
- Page navigation

Example usage:
```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('user@example.com', 'password');
expect(await loginPage.verifySuccessfulLogin()).toBe(true);
```

## Test Data and Fixtures

### Test Data (`fixtures/test-data.ts`)
- User profiles for different scenarios
- Application data for various visa types
- Document requirements
- Payment information
- Error message constants

### Mock Files (`fixtures/uploads/`)
- Sample PDF documents
- Test images
- Various file types for upload testing

## Environment Configuration

### Local Development
```bash
E2E_BASE_URL=http://localhost:3000
E2E_DEMO_MODE=true
E2E_HEADLESS=false
```

### CI/CD
```bash
E2E_BASE_URL=https://staging.visa-assist.com
E2E_DEMO_MODE=false
E2E_HEADLESS=true
```

## Browser Configuration

### Supported Browsers
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

### Mobile Devices
- Mobile Chrome (Android)
- Mobile Safari (iOS)
- Tablet viewports

## CI/CD Integration

### GitHub Actions
The project includes a comprehensive GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) that:

- Runs tests on multiple browsers in parallel
- Executes mobile device testing
- Performs Lighthouse audits
- Uploads test artifacts (screenshots, videos, reports)
- Comments on PRs with test results

### Running in CI
Tests automatically run on:
- Push to main/develop branches
- Pull requests
- Nightly schedules

## Debugging and Troubleshooting

### Debug Mode
```bash
npx playwright test --debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure
Screenshots are automatically captured on test failures and saved to `e2e-results/screenshots/`

### Video Recording
Videos are recorded for failed tests and saved to `e2e-results/videos/`

### Common Issues

1. **Test Timeouts**
   - Increase timeout in playwright.config.ts
   - Check network latency
   - Verify application startup time

2. **Element Not Found**
   - Update selectors in page objects
   - Check for dynamic content loading
   - Verify page load completion

3. **Authentication Issues**
   - Check test user credentials
   - Verify demo mode configuration
   - Clear browser storage between tests

## Best Practices

### Writing Tests
1. Use descriptive test names
2. Follow the AAA pattern (Arrange, Act, Assert)
3. Keep tests independent and atomic
4. Use page object methods instead of direct selectors
5. Add appropriate wait conditions

### Maintaining Tests
1. Update page objects when UI changes
2. Keep test data current and realistic
3. Regular review of flaky tests
4. Monitor test execution times

### Performance
1. Use parallel execution when possible
2. Optimize wait conditions
3. Minimize test data setup/teardown
4. Cache authentication states

## Reporting

### HTML Report
```bash
npx playwright show-report
```

### JSON Report
Test results are saved as JSON in `e2e-results/results.json`

### JUnit Report
XML format available for CI integration in `e2e-results/results.xml`

## Contributing

When adding new tests:

1. Follow existing patterns and naming conventions
2. Add appropriate page object methods
3. Include error scenarios
4. Update documentation
5. Ensure tests pass in all browsers

## Security Considerations

- Never commit real credentials
- Use test-specific API keys only
- Implement proper data cleanup
- Avoid testing with production data
- Use demo/sandbox environments

## Performance Monitoring

The E2E tests include performance monitoring:
- Page load times
- API response times
- Resource usage
- Lighthouse audits (optional)

## Accessibility Testing

Basic accessibility checks are included:
- Proper heading structure
- Alt text for images
- Form labels
- Keyboard navigation
- ARIA attributes

## Support

For issues with E2E tests:
1. Check test logs and screenshots
2. Review configuration settings
3. Verify application state
4. Consult Playwright documentation
5. Contact the development team

## Useful Commands

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium

# Debug tests
npx playwright test --debug

# Generate new test
npx playwright codegen

# Show test report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots
```