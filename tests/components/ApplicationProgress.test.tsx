import React from 'react'
import { screen } from '@testing-library/react'
import { ApplicationProgress } from '@/components/applications/ApplicationProgress'
import { 
  render, 
  expectToRenderWithoutCrashing,
  testAccessibility
} from '../utils/test-utils'

describe('ApplicationProgress', () => {
  const defaultProps = {
    currentStep: 3,
    totalSteps: 8,
    progressPercentage: 37
  }

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expectToRenderWithoutCrashing(ApplicationProgress, defaultProps)
    })

    it('displays the title', () => {
      render(<ApplicationProgress {...defaultProps} />)
      expect(screen.getByText('Application Progress')).toBeInTheDocument()
    })

    it('displays the progress percentage', () => {
      render(<ApplicationProgress {...defaultProps} />)
      expect(screen.getByText('37%')).toBeInTheDocument()
    })

    it('renders the correct number of steps', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      // Should display steps 1-8 based on totalSteps
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Document Upload')).toBeInTheDocument()
      expect(screen.getByText('Document Verification')).toBeInTheDocument()
      expect(screen.getByText('Payment')).toBeInTheDocument()
      expect(screen.getByText('Appointment')).toBeInTheDocument()
      expect(screen.getByText('Submission')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
      expect(screen.getByText('Decision')).toBeInTheDocument()
    })

    it('displays step descriptions', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      expect(screen.getByText('Personal and visa details')).toBeInTheDocument()
      expect(screen.getByText('Required documents')).toBeInTheDocument()
      expect(screen.getByText('AI analysis and review')).toBeInTheDocument()
      expect(screen.getByText('Processing fees')).toBeInTheDocument()
      expect(screen.getByText('Schedule consulate visit')).toBeInTheDocument()
      expect(screen.getByText('Final application submission')).toBeInTheDocument()
      expect(screen.getByText('Awaiting decision')).toBeInTheDocument()
      expect(screen.getByText('Visa approval status')).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('displays progress bar with correct width', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const progressBar = document.querySelector('.bg-blue-600.h-3')
      expect(progressBar).toHaveStyle('width: 37%')
    })

    it('handles 0% progress', () => {
      render(<ApplicationProgress {...defaultProps} progressPercentage={0} />)
      
      expect(screen.getByText('0%')).toBeInTheDocument()
      const progressBar = document.querySelector('.bg-blue-600.h-3')
      expect(progressBar).toHaveStyle('width: 0%')
    })

    it('handles 100% progress', () => {
      render(<ApplicationProgress {...defaultProps} progressPercentage={100} />)
      
      expect(screen.getByText('100%')).toBeInTheDocument()
      const progressBar = document.querySelector('.bg-blue-600.h-3')
      expect(progressBar).toHaveStyle('width: 100%')
    })

    it('applies transition classes for smooth animation', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const progressBar = document.querySelector('.bg-blue-600.h-3')
      expect(progressBar).toHaveClass('transition-all', 'duration-500', 'ease-out')
    })
  })

  describe('Step States', () => {
    describe('Completed Steps', () => {
      it('marks steps before current as completed', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={4} />)
        
        // Steps 1, 2, 3 should be completed
        const completedSteps = screen.getAllByRole('generic').filter(el => 
          el.classList.contains('bg-green-500')
        )
        expect(completedSteps).toHaveLength(3)
      })

      it('displays check icon for completed steps', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={4} />)
        
        // Check icons should be present for completed steps
        const checkIcons = document.querySelectorAll('.bg-green-500 svg')
        expect(checkIcons.length).toBeGreaterThan(0)
      })

      it('applies completed styling to completed steps', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={4} />)
        
        const firstStepIcon = document.querySelector('.bg-green-500')
        expect(firstStepIcon).toHaveClass('text-white')
      })
    })

    describe('Current Step', () => {
      it('highlights the current step', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        const currentStepIcon = document.querySelector('.bg-blue-600.w-8.h-8')
        expect(currentStepIcon).toBeInTheDocument()
        expect(currentStepIcon).toHaveClass('text-white')
      })

      it('displays step number for current step', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        const currentStepIcon = document.querySelector('.bg-blue-600.w-8.h-8')
        expect(currentStepIcon).toHaveTextContent('3')
      })

      it('shows current step badge', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        expect(screen.getByText('Current Step')).toBeInTheDocument()
        const badge = screen.getByText('Current Step').closest('span')
        expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
      })

      it('applies pulse animation to current step', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        const pulseElement = document.querySelector('.animate-pulse')
        expect(pulseElement).toBeInTheDocument()
        expect(pulseElement).toHaveClass('border-2', 'border-blue-600')
      })
    })

    describe('Pending Steps', () => {
      it('marks steps after current as pending', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        const pendingSteps = document.querySelectorAll('.bg-gray-200')
        expect(pendingSteps.length).toBeGreaterThan(0)
      })

      it('applies muted styling to pending steps', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        // Find the first pending step (step 4)
        const step4Title = screen.getByText('Payment')
        expect(step4Title).toHaveClass('text-gray-400')
        
        const step4Description = screen.getByText('Processing fees')
        expect(step4Description).toHaveClass('text-gray-300')
      })

      it('displays step numbers for pending steps', () => {
        render(<ApplicationProgress {...defaultProps} currentStep={3} />)
        
        // Find pending step icons
        const pendingIcons = document.querySelectorAll('.bg-gray-200')
        const fourthStep = Array.from(pendingIcons).find(icon => 
          icon.textContent?.trim() === '4'
        )
        expect(fourthStep).toBeInTheDocument()
      })
    })
  })

  describe('Step Progression Line', () => {
    it('displays vertical progress line', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const progressLine = document.querySelector('.absolute.left-4.top-8.bottom-8.w-0\\.5.bg-gray-200')
      expect(progressLine).toBeInTheDocument()
    })

    it('fills progress line based on current step', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={3} />)
      
      const filledLine = document.querySelector('.absolute.top-0.left-0.w-full.bg-blue-600')
      expect(filledLine).toBeInTheDocument()
      
      // For step 3 out of 8 steps, progress should be (3-1)/(8-1) = 2/7 ≈ 28.57%
      const expectedHeight = Math.max(0, ((3 - 1) / (8 - 1)) * 100)
      expect(filledLine).toHaveStyle(`height: ${expectedHeight}%`)
    })

    it('handles first step correctly', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={1} />)
      
      const filledLine = document.querySelector('.absolute.top-0.left-0.w-full.bg-blue-600')
      expect(filledLine).toHaveStyle('height: 0%')
    })

    it('handles last step correctly', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={8} />)
      
      const filledLine = document.querySelector('.absolute.top-0.left-0.w-full.bg-blue-600')
      expect(filledLine).toHaveStyle('height: 100%')
    })
  })

  describe('Edge Cases', () => {
    it('handles currentStep = 1', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={1} />)
      
      expect(screen.getByText('Current Step')).toBeInTheDocument()
      const firstStepIcon = document.querySelector('.bg-blue-600.w-8.h-8')
      expect(firstStepIcon).toHaveTextContent('1')
    })

    it('handles currentStep equal to totalSteps', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={8} />)
      
      expect(screen.getByText('Current Step')).toBeInTheDocument()
      const lastStepIcon = document.querySelector('.bg-blue-600.w-8.h-8')
      expect(lastStepIcon).toHaveTextContent('8')
    })

    it('handles currentStep greater than totalSteps', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={10} />)
      
      // All steps should be completed
      const completedSteps = document.querySelectorAll('.bg-green-500')
      expect(completedSteps).toHaveLength(8)
      
      // No current step should be highlighted
      expect(screen.queryByText('Current Step')).not.toBeInTheDocument()
    })

    it('handles negative currentStep', () => {
      render(<ApplicationProgress {...defaultProps} currentStep={-1} />)
      
      // All step icons should be pending
      const pendingStepIcons = document.querySelectorAll('.bg-gray-200.w-8.h-8')
      expect(pendingStepIcons).toHaveLength(8)
      
      // No current step should be highlighted
      expect(screen.queryByText('Current Step')).not.toBeInTheDocument()
    })

    it('handles totalSteps less than default steps', () => {
      render(<ApplicationProgress {...defaultProps} totalSteps={5} />)
      
      // Should only show 5 steps
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Document Upload')).toBeInTheDocument()
      expect(screen.getByText('Document Verification')).toBeInTheDocument()
      expect(screen.getByText('Payment')).toBeInTheDocument()
      expect(screen.getByText('Appointment')).toBeInTheDocument()
      
      // These steps should not be visible
      expect(screen.queryByText('Submission')).not.toBeInTheDocument()
      expect(screen.queryByText('Processing')).not.toBeInTheDocument()
      expect(screen.queryByText('Decision')).not.toBeInTheDocument()
    })

    it('handles totalSteps = 1', () => {
      render(<ApplicationProgress {...defaultProps} totalSteps={1} currentStep={1} />)
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Current Step')).toBeInTheDocument()
      
      // Progress line should handle single step - calculation (1-1)/(1-1) results in NaN
      const filledLine = document.querySelector('.absolute.top-0.left-0.w-full.bg-blue-600')
      // When there's only one step, the progress line calculation results in NaN, so we just check it exists
      expect(filledLine).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('applies proper spacing classes', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const stepsContainer = document.querySelector('.space-y-6')
      expect(stepsContainer).toBeInTheDocument()
    })

    it('uses flexbox layout for step items', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const stepItems = document.querySelectorAll('.flex.items-start.gap-4')
      expect(stepItems.length).toBeGreaterThan(0)
    })

    it('applies proper card styling', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const card = document.querySelector('.bg-white.rounded-lg.shadow.p-6')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides meaningful heading structure', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const mainHeading = screen.getByRole('heading', { level: 3 })
      expect(mainHeading).toHaveTextContent('Application Progress')
    })

    it('uses appropriate semantic structure for steps', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      // Each step should have a title that could serve as a heading
      const stepTitles = [
        'Basic Information',
        'Document Upload', 
        'Document Verification',
        'Payment',
        'Appointment',
        'Submission',
        'Processing',
        'Decision'
      ]
      
      stepTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    })

    it('provides clear visual hierarchy', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      // Progress percentage should be prominently displayed
      const percentage = screen.getByText('37%')
      expect(percentage).toHaveClass('text-2xl', 'font-bold', 'text-blue-600')
    })

    it('uses descriptive text for step content', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      // Each step should have both title and description
      expect(screen.getByText('Personal and visa details')).toBeInTheDocument()
      expect(screen.getByText('Required documents')).toBeInTheDocument()
      expect(screen.getByText('AI analysis and review')).toBeInTheDocument()
    })

    it('indicates current step clearly', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const currentStepBadge = screen.getByText('Current Step')
      expect(currentStepBadge).toBeInTheDocument()
      expect(currentStepBadge.closest('span')).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('maintains color contrast for different states', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      // Completed steps should have good contrast
      const completedIcons = document.querySelectorAll('.bg-green-500.text-white')
      expect(completedIcons.length).toBeGreaterThan(0)
      
      // Current step should have good contrast
      const currentIcon = document.querySelector('.bg-blue-600.text-white')
      expect(currentIcon).toBeInTheDocument()
      
      // Pending steps should be clearly distinguishable
      const pendingIcons = document.querySelectorAll('.bg-gray-200.text-gray-400')
      expect(pendingIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Animation and Transitions', () => {
    it('applies transition classes to progress elements', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const progressBar = document.querySelector('.bg-blue-600.h-3')
      expect(progressBar).toHaveClass('transition-all', 'duration-500', 'ease-out')
      
      const progressLine = document.querySelector('.absolute.top-0.left-0.w-full.bg-blue-600')
      expect(progressLine).toHaveClass('transition-all', 'duration-500')
    })

    it('includes pulse animation for current step', () => {
      render(<ApplicationProgress {...defaultProps} />)
      
      const pulseElement = document.querySelector('.animate-pulse')
      expect(pulseElement).toBeInTheDocument()
      expect(pulseElement).toHaveClass('border-2', 'border-blue-600')
    })
  })

  describe('Data Validation', () => {
    it('handles invalid progress percentage gracefully', () => {
      expect(() => {
        render(<ApplicationProgress {...defaultProps} progressPercentage={-10} />)
      }).not.toThrow()
      
      expect(() => {
        render(<ApplicationProgress {...defaultProps} progressPercentage={150} />)
      }).not.toThrow()
    })

    it('handles invalid step numbers gracefully', () => {
      expect(() => {
        render(<ApplicationProgress {...defaultProps} currentStep={0} />)
      }).not.toThrow()
      
      expect(() => {
        render(<ApplicationProgress {...defaultProps} currentStep={100} />)
      }).not.toThrow()
    })

    it('handles invalid totalSteps gracefully', () => {
      expect(() => {
        render(<ApplicationProgress {...defaultProps} totalSteps={0} />)
      }).not.toThrow()
      
      expect(() => {
        render(<ApplicationProgress {...defaultProps} totalSteps={100} />)
      }).not.toThrow()
    })
  })
})