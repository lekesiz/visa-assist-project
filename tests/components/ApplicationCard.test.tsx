import React from 'react'
import { screen } from '@testing-library/react'
import { ApplicationCard } from '@/components/applications/ApplicationCard'
import { 
  render, 
  createMockApplication, 
  expectToRenderWithoutCrashing,
  testAccessibility
} from '../utils/test-utils'

// Mock the Alert components to avoid styling dependencies in tests
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'alert', ...props }, children),
  AlertDescription: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'alert-description', ...props }, children),
}))

describe('ApplicationCard', () => {
  const defaultApplication = createMockApplication()

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expectToRenderWithoutCrashing(ApplicationCard, { application: defaultApplication })
    })

    it('displays application visa type', () => {
      render(<ApplicationCard application={defaultApplication} />)
      expect(screen.getByText('Work Visa')).toBeInTheDocument()
    })

    it('displays application status with correct styling', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      const statusBadge = screen.getByText('In Progress')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge.closest('span')).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('displays target country', () => {
      render(<ApplicationCard application={defaultApplication} />)
      expect(screen.getByText('Germany')).toBeInTheDocument()
    })

    it('displays purpose of travel when provided', () => {
      render(<ApplicationCard application={defaultApplication} />)
      expect(screen.getByText('• Employment')).toBeInTheDocument()
    })

    it('does not display purpose of travel when not provided', () => {
      const appWithoutPurpose = createMockApplication({ purpose_of_travel: null })
      render(<ApplicationCard application={appWithoutPurpose} />)
      expect(screen.queryByText(/•/)).not.toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('displays progress percentage', () => {
      render(<ApplicationCard application={defaultApplication} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('Progress')).toBeInTheDocument()
    })

    it('renders progress bar with correct width', () => {
      render(<ApplicationCard application={defaultApplication} />)
      const progressBar = document.querySelector('[style*="width: 75%"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle('width: 75%')
    })

    it('handles 0% progress', () => {
      const appWithZeroProgress = createMockApplication({ progress_percentage: 0 })
      render(<ApplicationCard application={appWithZeroProgress} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('handles 100% progress', () => {
      const appWithFullProgress = createMockApplication({ progress_percentage: 100 })
      render(<ApplicationCard application={appWithFullProgress} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Date Display', () => {
    it('displays formatted travel date when provided', () => {
      render(<ApplicationCard application={defaultApplication} />)
      expect(screen.getByText('6/15/2024')).toBeInTheDocument()
    })

    it('displays "Not set" when travel date is not provided', () => {
      const appWithoutDate = createMockApplication({ planned_travel_date: null })
      render(<ApplicationCard application={appWithoutDate} />)
      expect(screen.getByText('Not set')).toBeInTheDocument()
    })

    it('displays last updated date', () => {
      render(<ApplicationCard application={defaultApplication} />)
      expect(screen.getByText('1/20/2024')).toBeInTheDocument()
    })
  })

  describe('Status-specific Behavior', () => {
    it('shows continue button for draft status', () => {
      const draftApp = createMockApplication({ status: 'draft' })
      render(<ApplicationCard application={draftApp} />)
      
      expect(screen.getByText('Continue where you left off')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue application/i })).toBeInTheDocument()
    })

    it('shows rejection alert for rejected status', () => {
      const rejectedApp = createMockApplication({ status: 'rejected' })
      render(<ApplicationCard application={rejectedApp} />)
      
      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByText(/Your application was rejected/)).toBeInTheDocument()
    })

    it('does not show special content for other statuses', () => {
      const approvedApp = createMockApplication({ status: 'approved' })
      render(<ApplicationCard application={approvedApp} />)
      
      expect(screen.queryByText('Continue where you left off')).not.toBeInTheDocument()
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
    })
  })

  describe('Compact Mode', () => {
    it('hides detailed content in compact mode', () => {
      render(<ApplicationCard application={defaultApplication} compact={true} />)
      
      // Should still show basic info
      expect(screen.getByText('Work Visa')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      
      // Should not show detailed content
      expect(screen.queryByText('Progress')).not.toBeInTheDocument()
      expect(screen.queryByText('75%')).not.toBeInTheDocument()
    })

    it('uses smaller title in compact mode', () => {
      render(<ApplicationCard application={defaultApplication} compact={true} />)
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveClass('text-lg')
    })
  })

  describe('Interaction', () => {
    it('calls onClick when provided and card is clicked', async () => {
      const handleClick = jest.fn()
      const { user } = render(
        <ApplicationCard application={defaultApplication} onClick={handleClick} />
      )
      
      const card = document.querySelector('.cursor-pointer')
      await user.click(card as HTMLElement)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders as link when no onClick provided', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', `/dashboard/applications/${defaultApplication.id}`)
    })

    it('applies hover styles', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      const card = document.querySelector('.hover\\:shadow-lg')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow', 'cursor-pointer')
    })
  })

  describe('Status Configuration', () => {
    const statusTests = [
      { status: 'draft', label: 'Draft', colorClass: 'bg-gray-100 text-gray-800' },
      { status: 'submitted', label: 'Submitted', colorClass: 'bg-yellow-100 text-yellow-800' },
      { status: 'approved', label: 'Approved', colorClass: 'bg-green-100 text-green-800' },
      { status: 'rejected', label: 'Rejected', colorClass: 'bg-red-100 text-red-800' },
      { status: 'cancelled', label: 'Cancelled', colorClass: 'bg-gray-100 text-gray-800' },
    ]

    statusTests.forEach(({ status, label, colorClass }) => {
      it(`displays correct styling for ${status} status`, () => {
        const app = createMockApplication({ status })
        render(<ApplicationCard application={app} />)
        
        const statusBadge = screen.getByText(label)
        expect(statusBadge).toBeInTheDocument()
        
        const colorClasses = colorClass.split(' ')
        colorClasses.forEach(cls => {
          expect(statusBadge.closest('span')).toHaveClass(cls)
        })
      })
    })
  })

  describe('Visa Type Labels', () => {
    const visaTypeTests = [
      { type: 'tourist', label: 'Tourist Visa' },
      { type: 'business', label: 'Business Visa' },
      { type: 'student', label: 'Student Visa' },
      { type: 'family_reunion', label: 'Family Reunion Visa' },
      { type: 'other', label: 'Other' },
      { type: 'unknown_type', label: 'unknown_type' }, // fallback
    ]

    visaTypeTests.forEach(({ type, label }) => {
      it(`displays correct label for ${type} visa type`, () => {
        const app = createMockApplication({ visa_type: type })
        render(<ApplicationCard application={app} />)
        
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })
  })

  describe('Country Labels', () => {
    const countryTests = [
      { code: 'FR', label: 'France' },
      { code: 'ES', label: 'Spain' },
      { code: 'IT', label: 'Italy' },
      { code: 'NL', label: 'Netherlands' },
      { code: 'XX', label: 'XX' }, // fallback
    ]

    countryTests.forEach(({ code, label }) => {
      it(`displays correct label for ${code} country code`, () => {
        const app = createMockApplication({ target_country: code })
        render(<ApplicationCard application={app} />)
        
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper navigation when used as link', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', `/dashboard/applications/${defaultApplication.id}`)
    })

    it('has appropriate heading structure', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('Work Visa')
    })

    it('includes meaningful text for screen readers', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      // Status should be readable
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      
      // Progress should be clear
      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('provides semantic structure', () => {
      render(<ApplicationCard application={defaultApplication} />)
      
      // Should have proper card structure
      expect(screen.getByRole('link')).toBeInTheDocument()
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing status gracefully', () => {
      const appWithInvalidStatus = createMockApplication({ status: 'invalid_status' })
      
      expect(() => {
        render(<ApplicationCard application={appWithInvalidStatus} />)
      }).not.toThrow()
    })

    it('handles invalid dates gracefully', () => {
      const appWithInvalidDate = createMockApplication({ 
        planned_travel_date: 'invalid-date',
        updated_at: 'invalid-date'
      })
      
      expect(() => {
        render(<ApplicationCard application={appWithInvalidDate} />)
      }).not.toThrow()
    })
  })
})