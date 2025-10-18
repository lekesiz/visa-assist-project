# Testing Infrastructure Documentation

This document describes the comprehensive testing infrastructure for the Visa Assist Project, including component testing, utilities, and best practices.

## Test Structure

```
tests/
├── components/           # React component tests
├── setup/               # Jest configuration and setup files
├── utils/               # Testing utilities and helpers
└── README.md           # This documentation
```

## Test Configurations

### Component Testing (`jest.config.components.js`)
- **Environment**: jsdom (for DOM testing)
- **Test Pattern**: `tests/components/**/*.test.(ts|tsx)`
- **Setup**: `tests/setup/jest.setup.components.ts`
- **Coverage**: 80% threshold for components

### API Testing (`jest.config.api.js`)  
- **Environment**: node
- **Test Pattern**: `__tests__/api/**/*.test.(ts|tsx)`
- **Setup**: `tests/setup/jest.setup.api.ts`

## Running Tests

```bash
# All tests
npm test

# Component tests only
npm run test:components

# Component tests with watch mode
npm run test:components:watch

# Component tests with coverage
npm run test:components:coverage

# API tests only
npm run test:api
```

## Testing Utilities

### Test Utils (`tests/utils/test-utils.tsx`)

Core utilities for component testing:

```tsx
import { render, createMockApplication } from '../utils/test-utils'

// Render with providers
const { user } = render(<Component />)

// Create mock data
const mockApp = createMockApplication({ status: 'approved' })
```

### Custom Matchers (`tests/utils/component-matchers.ts`)

Additional Jest matchers for better assertions:

```tsx
// Check accessible names
expect(element).toHaveAccessibleName('Submit Button')

// Check progress values
expect(progressBar).toHaveProgressValue(75)

// Check if element is visually hidden
expect(element).toBeVisuallyHidden()

// Check date formats
expect(dateElement).toHaveValidDateFormat()
```

### Component Helpers (`tests/utils/component-helpers.ts`)

Specialized helpers for testing specific components:

```tsx
import { applicationCard, dashboardStats } from '../utils/component-helpers'

// Application Card helpers
applicationCard.expectStatus('approved')
applicationCard.expectProgress(75)

// Dashboard Stats helpers
dashboardStats.expectStatToBePresent('Active Applications', 2)
dashboardStats.expectLoadingState()
```

## Component Test Examples

### ApplicationCard Tests

Tests cover:
- ✅ Rendering all application states
- ✅ Progress bar functionality
- ✅ Date formatting
- ✅ Status-specific behavior (draft, rejected)
- ✅ Compact mode
- ✅ Click interactions
- ✅ Accessibility
- ✅ Error handling

```tsx
describe('ApplicationCard', () => {
  it('displays application status with correct styling', () => {
    render(<ApplicationCard application={mockApplication} />)
    
    const statusBadge = screen.getByText('In Progress')
    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge.closest('span')).toHaveClass('bg-blue-100', 'text-blue-800')
  })
})
```

### DashboardStats Tests

Tests cover:
- ✅ Loading states
- ✅ Demo mode vs real data
- ✅ Compact vs regular layout
- ✅ Error handling
- ✅ Async data fetching
- ✅ Stats display accuracy

```tsx
describe('DashboardStats', () => {
  it('displays demo data correctly', async () => {
    await act(async () => {
      render(<DashboardStats />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // activeApplications
      expect(screen.getByText('5')).toBeInTheDocument() // totalDocuments
    })
  })
})
```

## Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

### 2. Async Testing
```tsx
// ✅ Good - wrap async renders in act()
await act(async () => {
  render(<AsyncComponent />)
})

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// ❌ Avoid - direct async render without act()
render(<AsyncComponent />)
```

### 3. Mock Management
```tsx
beforeEach(() => {
  jest.clearAllMocks()
  mockDemoService.isDemoMode.mockReturnValue(true)
})
```

### 4. Accessibility Testing
```tsx
// Check for proper ARIA attributes
expect(button).toHaveAccessibleName('Submit Application')

// Verify heading structure
expect(screen.getByRole('heading')).toHaveTextContent('Work Visa')

// Test keyboard navigation
await user.tab()
expect(focusableElement).toHaveFocus()
```

### 5. Error Boundaries
```tsx
it('handles invalid data gracefully', () => {
  const invalidData = createMockApplication({ status: 'invalid' })
  
  expect(() => {
    render(<ApplicationCard application={invalidData} />)
  }).not.toThrow()
})
```

## Mock Configurations

### Next.js Mocks
- `next/link` → Simple anchor tag
- `next/navigation` → Mock router hooks
- `next/image` → Standard img element

### External Service Mocks
- Supabase client → Mock database operations
- Demo service → Predictable test data
- Lucide icons → Simplified SVG elements

### UI Component Mocks
```tsx
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'alert', ...props }, children),
  AlertDescription: ({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'alert-description', ...props }, children),
}))
```

## Coverage Requirements

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Coverage Reports
```bash
npm run test:components:coverage
```

Coverage reports are generated in:
- Text format (console)
- HTML format (`coverage/` directory)
- LCOV format (for CI tools)

## Troubleshooting

### Common Issues

1. **"Act" warnings**
   ```tsx
   // Wrap async operations
   await act(async () => {
     render(<Component />)
   })
   ```

2. **Nested anchor warnings**
   ```tsx
   // Mock Link component properly
   jest.mock('next/link', () => MockLink)
   ```

3. **Missing imports**
   ```tsx
   // Ensure React is imported for JSX
   import React from 'react'
   ```

4. **Role selector issues**
   ```tsx
   // Use more specific selectors
   const element = document.querySelector('.specific-class')
   ```

## Future Enhancements

- [ ] Add visual regression testing with Chromatic
- [ ] Implement accessibility testing with axe-core
- [ ] Add performance testing utilities
- [ ] Create component story tests with Storybook
- [ ] Add integration tests for user flows

## Contributing

When adding new component tests:

1. Create test file in `tests/components/`
2. Use existing utilities and helpers
3. Follow naming conventions
4. Include accessibility tests
5. Test error scenarios
6. Maintain coverage thresholds
7. Document complex test scenarios

---

*Last updated: 2025-01-18*