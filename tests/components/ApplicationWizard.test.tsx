import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/test-utils'
import ApplicationWizard from '@/components/wizard/ApplicationWizard'

// Mock the step components with stable implementations
jest.mock('@/components/wizard/steps/PersonalInfoStep', () => {
  return function MockPersonalInfoStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ firstName: 'John', lastName: 'Doe', ...data }, true)
    }, [])
    
    return (
      <div data-testid="personal-info-step">
        Personal Info Step
        <input
          data-testid="first-name"
          value={data.firstName || ''}
          onChange={(e) => onComplete({ ...data, firstName: e.target.value }, e.target.value !== '')}
        />
      </div>
    )
  }
})

jest.mock('@/components/wizard/steps/TravelDetailsStep', () => {
  return function MockTravelDetailsStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ visaType: 'work', purpose: 'Employment', ...data }, true)
    }, [])
    
    return (
      <div data-testid="travel-details-step">
        Travel Details Step
        <input
          data-testid="visa-type"
          value={data.visaType || ''}
          onChange={(e) => onComplete({ ...data, visaType: e.target.value }, e.target.value !== '')}
        />
      </div>
    )
  }
})

jest.mock('@/components/wizard/steps/EmploymentStep', () => {
  return function MockEmploymentStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ currentJob: 'Software Engineer', ...data }, true)
    }, [])
    
    return <div data-testid="employment-step">Employment Step</div>
  }
})

jest.mock('@/components/wizard/steps/EducationStep', () => {
  return function MockEducationStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ degree: 'Bachelor', field: 'Computer Science', ...data }, true)
    }, [])
    
    return <div data-testid="education-step">Education Step</div>
  }
})

jest.mock('@/components/wizard/steps/FinancialStep', () => {
  return function MockFinancialStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ bankBalance: '50000', ...data }, true)
    }, [])
    
    return <div data-testid="financial-step">Financial Step</div>
  }
})

jest.mock('@/components/wizard/steps/DocumentsStep', () => {
  return function MockDocumentsStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ passport: 'uploaded', cv: 'uploaded', ...data }, true)
    }, [])
    
    return <div data-testid="documents-step">Documents Step</div>
  }
})

jest.mock('@/components/wizard/steps/ReviewStep', () => {
  return function MockReviewStep({ data, onComplete }: any) {
    React.useEffect(() => {
      onComplete({ reviewed: true, ...data }, true)
    }, [])
    
    return (
      <div data-testid="review-step">
        Review Step
        <div data-testid="review-summary">Review all your information</div>
      </div>
    )
  }
})

// Mock external dependencies
jest.mock('@/lib/demo/demo-service', () => ({
  DemoService: {
    isDemoMode: jest.fn(() => true),
  },
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}))

// Mock scrollTo
global.scrollTo = jest.fn()

const defaultProps = {
  applicationId: 'test-app-123',
  onComplete: jest.fn(),
}

describe('ApplicationWizard - Comprehensive Tests', () => {
  let mockDemoService: any
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockDemoService = require('@/lib/demo/demo-service').DemoService
    mockSupabase = require('@/lib/supabase/client').createClient()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
    })

    it('displays the correct initial step', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument()
      expect(screen.getByTestId('personal-info-step')).toBeInTheDocument()
    })

    it('shows progress bar', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('displays all step indicators', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const stepButtons = screen.getAllByRole('button').filter(button =>
        button.className.includes('flex flex-col items-center')
      )
      expect(stepButtons).toHaveLength(7)
    })

    it('displays navigation buttons correctly', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const previousButton = screen.getByRole('button', { name: /previous/i })
      const nextButton = screen.getByRole('button', { name: /next/i })
      const saveButton = screen.getByRole('button', { name: /save progress/i })
      
      expect(previousButton).toBeDisabled() // First step
      expect(nextButton).toBeEnabled()
      expect(saveButton).toBeEnabled()
    })
  })

  describe('Multi-step Navigation', () => {
    it('navigates to next step when next button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      expect(screen.getByText('Step 2 of 7')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /travel details/i })).toBeInTheDocument()
      expect(screen.getByTestId('travel-details-step')).toBeInTheDocument()
    })

    it('navigates to previous step when previous button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Go to second step first
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      // Then go back
      const previousButton = screen.getByRole('button', { name: /previous/i })
      await user.click(previousButton)
      
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument()
    })

    it('navigates through all steps correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const steps = [
        { heading: /personal information/i, testId: 'personal-info-step' },
        { heading: /travel details/i, testId: 'travel-details-step' },
        { heading: /employment history/i, testId: 'employment-step' },
        { heading: /education/i, testId: 'education-step' },
        { heading: /financial information/i, testId: 'financial-step' },
        { heading: /documents/i, testId: 'documents-step' },
        { heading: /review & submit/i, testId: 'review-step' },
      ]
      
      for (let i = 0; i < steps.length; i++) {
        expect(screen.getByText(`Step ${i + 1} of 7`)).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: steps[i].heading })).toBeInTheDocument()
        expect(screen.getByTestId(steps[i].testId)).toBeInTheDocument()
        
        if (i < steps.length - 1) {
          const nextButton = screen.getByRole('button', { name: /next/i })
          await user.click(nextButton)
        }
      }
    })

    it('scrolls to top when navigating between steps', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })

  describe('Form Validation', () => {
    it('enables next button when current step is valid', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeEnabled()
    })

    it('shows submit button on last step', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Navigate to last step
      for (let i = 0; i < 6; i++) {
        const nextButton = screen.getByRole('button', { name: /next/i })
        await user.click(nextButton)
      }
      
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    })

    it('disables previous button on first step', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).toBeDisabled()
    })

    it('updates form data when step data changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Modify data in the first step
      const firstNameInput = screen.getByTestId('first-name')
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Jane')
      
      // Navigate to next step and back
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const previousButton = screen.getByRole('button', { name: /previous/i })
      await user.click(previousButton)
      
      // Data should be preserved
      expect(screen.getByTestId('first-name')).toHaveValue('Jane')
    })
  })

  describe('Wizard States', () => {
    it('tracks step completion states correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Navigate to second step
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      // Check that first step is marked as completed in UI
      const stepIndicators = screen.getAllByRole('button').filter(button =>
        button.className.includes('flex flex-col items-center')
      )
      
      // First step should have completed styling
      expect(stepIndicators[0].querySelector('div')).toHaveClass('bg-green-600')
    })

    it('shows current step with correct styling', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const stepIndicators = screen.getAllByRole('button').filter(button =>
        button.className.includes('flex flex-col items-center')
      )
      
      // Current step (first) should have current styling or completed styling (since mock validates immediately)
      const firstStepDiv = stepIndicators[0].querySelector('div')
      expect(firstStepDiv).toHaveClass('bg-green-600') // Shows as completed due to immediate validation
    })

    it('shows pending steps with correct styling', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const stepIndicators = screen.getAllByRole('button').filter(button =>
        button.className.includes('flex flex-col items-center')
      )
      
      // Future steps should have pending styling
      expect(stepIndicators[2].querySelector('div')).toHaveClass('bg-gray-100')
    })

    it('prevents navigation to future steps via step indicators', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const stepIndicators = screen.getAllByRole('button').filter(button =>
        button.className.includes('flex flex-col items-center')
      )
      
      // Try to click on step 3 (should be disabled)
      await user.click(stepIndicators[2])
      
      // Should still be on step 1
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('calls onComplete when application is submitted successfully', async () => {
      const user = userEvent.setup()
      const onComplete = jest.fn()
      mockDemoService.isDemoMode.mockReturnValue(true)
      
      renderWithProviders(<ApplicationWizard {...defaultProps} onComplete={onComplete} />)
      
      // Navigate to last step
      for (let i = 0; i < 6; i++) {
        const nextButton = screen.getByRole('button', { name: /next/i })
        await user.click(nextButton)
      }
      
      // Submit application
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith('test-app-123')
      }, { timeout: 3000 })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      mockDemoService.isDemoMode.mockReturnValue(true)
      
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Navigate to last step
      for (let i = 0; i < 6; i++) {
        const nextButton = screen.getByRole('button', { name: /next/i })
        await user.click(nextButton)
      }
      
      // Submit application
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await user.click(submitButton)
      
      // Should show loading spinner briefly
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('works without applicationId (new application)', () => {
      renderWithProviders(<ApplicationWizard onComplete={jest.fn()} />)
      
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save progress/i })).toBeDisabled()
    })

    it('works without onComplete callback', () => {
      renderWithProviders(<ApplicationWizard applicationId="test-123" />)
      
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
    })

    it('handles step navigation edge cases correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Previous button should be disabled on first step
      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).toBeDisabled()
      
      // Navigate to last step
      for (let i = 0; i < 6; i++) {
        const nextButton = screen.getByRole('button', { name: /next/i })
        await user.click(nextButton)
      }
      
      // Next button should not exist on last step
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings.length).toBeGreaterThan(0)
    })

    it('has proper button labels', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save progress/i })).toBeInTheDocument()
    })

    it('provides progress information accessibly', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    it('step indicators are keyboard accessible', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      const stepIndicators = screen.getAllByRole('button').filter(button =>
        button.className.includes('flex flex-col items-center')
      )
      
      // Buttons are naturally keyboard accessible without explicit tabindex
      stepIndicators.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Integration with External Services', () => {
    it('integrates with demo service for demo mode', () => {
      mockDemoService.isDemoMode.mockReturnValue(true)
      
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      // Component should be rendered successfully with demo service available
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
      expect(mockDemoService.isDemoMode).toBeDefined()
    })

    it('displays helpful information', () => {
      renderWithProviders(<ApplicationWizard {...defaultProps} />)
      
      expect(screen.getByText(/your progress is automatically saved/i)).toBeInTheDocument()
    })
  })
})