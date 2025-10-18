import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any provider props here if needed
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    // Add providers here if needed (e.g., QueryClient, Theme, etc.)
    return <>{children}</>
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom one
export { renderWithProviders as render }

// Test data factories
export const createMockApplication = (overrides = {}) => ({
  id: 'test-app-1',
  visa_type: 'work',
  status: 'in_progress',
  progress_percentage: 75,
  purpose_of_travel: 'Employment',
  planned_travel_date: '2024-06-15',
  target_country: 'DE',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z',
  ...overrides,
})

export const createMockStats = (overrides = {}) => ({
  activeApplications: 2,
  totalApplications: 3,
  totalDocuments: 5,
  verifiedDocuments: 3,
  upcomingAppointments: 1,
  savedJobs: 4,
  appliedJobs: 2,
  ...overrides,
})

// Common test utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Accessibility testing helpers
export const testAccessibility = {
  expectToHaveAccessibleName: (element: HTMLElement, name: string) => {
    const accessibleName = element.getAttribute('aria-label') || 
                          element.getAttribute('aria-labelledby') ||
                          element.textContent?.trim()
    expect(accessibleName).toBe(name)
  },
  
  expectToHaveRole: (element: HTMLElement, role: string) => {
    expect(element).toHaveAttribute('role', role)
  },
  
  expectToBeFocusable: (element: HTMLElement) => {
    expect(element).toHaveAttribute('tabindex')
    // Should be able to receive focus
    element.focus()
    expect(element).toHaveFocus()
  },
}

// Mock date utilities
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString)
  jest.useFakeTimers()
  jest.setSystemTime(mockDate)
  return () => jest.useRealTimers()
}

// Component testing patterns
export const expectToRenderWithoutCrashing = (Component: React.ComponentType<any>, props = {}) => {
  expect(() => render(<Component {...props} />)).not.toThrow()
}

export const expectToMatchSnapshot = (Component: React.ComponentType<any>, props = {}) => {
  const { container } = render(<Component {...props} />)
  expect(container.firstChild).toMatchSnapshot()
}

// API testing utilities for components that fetch data
export const mockSuccessfulApiResponse = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock
}

export const mockFailedApiResponse = (error = 'API Error') => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error(error))
  ) as jest.Mock
}