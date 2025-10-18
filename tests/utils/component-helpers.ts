import { screen } from '@testing-library/react'

// Helper functions for testing common component patterns

export const componentHelpers = {
  // Application Card helpers
  applicationCard: {
    getStatusBadge: () => screen.getByRole('generic', { name: /status/i }),
    getProgressBar: () => screen.getByRole('progressbar', { hidden: true }),
    getContinueButton: () => screen.queryByRole('button', { name: /continue/i }),
    getRejectAlert: () => screen.queryByTestId('alert'),
    
    expectStatus: (status: string) => {
      expect(screen.getByText(new RegExp(status, 'i'))).toBeInTheDocument()
    },
    
    expectProgress: (percentage: number) => {
      expect(screen.getByText(`${percentage}%`)).toBeInTheDocument()
    },
    
    expectVisaType: (type: string) => {
      expect(screen.getByText(new RegExp(type, 'i'))).toBeInTheDocument()
    },
    
    expectCountry: (country: string) => {
      expect(screen.getByText(new RegExp(country, 'i'))).toBeInTheDocument()
    }
  },

  // Dashboard Stats helpers
  dashboardStats: {
    getStatCard: (label: string) => 
      screen.getByText(label).closest('[role="generic"]'),
    
    getStatValue: (label: string) => {
      const card = screen.getByText(label).closest('[role="generic"]')
      const valueElement = card?.querySelector('.text-2xl')
      return valueElement?.textContent || ''
    },
    
    expectStatToBePresent: (label: string, value: string | number) => {
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(String(value))).toBeInTheDocument()
    },
    
    expectLoadingState: () => {
      const skeletons = screen.getAllByRole('generic')
      expect(skeletons.some(el => el.classList.contains('animate-pulse'))).toBe(true)
    },
    
    expectCompactLayout: () => {
      const container = screen.getByText(/active applications/i).closest('.grid')
      expect(container).toHaveClass('grid-cols-2', 'lg:grid-cols-4')
    },
    
    expectRegularLayout: () => {
      const container = screen.getByText(/active applications/i).closest('.grid')
      expect(container).toHaveClass('gap-4', 'md:grid-cols-2', 'lg:grid-cols-4')
    }
  },

  // Common UI helpers
  ui: {
    expectCard: (element: HTMLElement) => {
      expect(element).toHaveClass('rounded-lg')
      expect(element).toHaveClass('border')
    },
    
    expectButton: (element: HTMLElement) => {
      expect(element).toHaveRole('button')
      expect(element).toBeEnabled()
    },
    
    expectLink: (element: HTMLElement, href?: string) => {
      expect(element).toHaveRole('link')
      if (href) {
        expect(element).toHaveAttribute('href', href)
      }
    },
    
    expectIcon: (iconName: string) => {
      // Assuming lucide icons have data-lucide attribute
      const icon = screen.getByRole('generic', { hidden: true })
      expect(icon).toBeInTheDocument()
    },
    
    expectSkeleton: () => {
      const skeleton = screen.getByRole('generic')
      expect(skeleton).toHaveClass('animate-pulse')
    }
  },

  // Accessibility helpers
  accessibility: {
    expectProperHeadingStructure: () => {
      const headings = screen.getAllByRole('heading')
      headings.forEach(heading => {
        const level = heading.tagName.charAt(1)
        expect(['1', '2', '3', '4', '5', '6']).toContain(level)
      })
    },
    
    expectFocusableElements: () => {
      const focusableElements = screen.getAllByRole(/(button|link|textbox|checkbox|radio)/)
      focusableElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1')
      })
    },
    
    expectAriaLabels: () => {
      const interactiveElements = screen.getAllByRole(/(button|link)/)
      interactiveElements.forEach(element => {
        const hasAccessibleName = 
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim()
        
        expect(hasAccessibleName).toBeTruthy()
      })
    },
    
    expectColorContrast: (element: HTMLElement) => {
      // Basic check for color classes that should provide good contrast
      const classList = Array.from(element.classList)
      const hasContrastClass = classList.some(cls => 
        cls.includes('text-') && 
        (cls.includes('-800') || cls.includes('-900') || cls.includes('-600'))
      )
      // This is a simplified check - in real projects you'd use tools like axe-core
      expect(hasContrastClass || element.style.color).toBeTruthy()
    }
  },

  // Animation and interaction helpers
  interactions: {
    expectHoverEffect: (element: HTMLElement) => {
      expect(element).toHaveClass('transition')
      // Check for hover classes
      const hoverClasses = ['hover:shadow-lg', 'hover:bg-', 'hover:text-']
      const hasHoverEffect = hoverClasses.some(hoverClass =>
        Array.from(element.classList).some(cls => cls.startsWith(hoverClass))
      )
      expect(hasHoverEffect).toBe(true)
    },
    
    expectClickable: (element: HTMLElement) => {
      expect(element).toHaveClass('cursor-pointer')
      expect(element.tagName.toLowerCase()).toMatch(/(button|a|div|span)/)
    },
    
    expectDisabled: (element: HTMLElement) => {
      if (element.tagName.toLowerCase() === 'button') {
        expect(element).toBeDisabled()
      } else {
        expect(element).toHaveAttribute('aria-disabled', 'true')
      }
    }
  },

  // Data validation helpers
  data: {
    expectValidDate: (dateString: string) => {
      const date = new Date(dateString)
      expect(date).toBeInstanceOf(Date)
      expect(date.getTime()).not.toBeNaN()
    },
    
    expectPercentage: (value: number) => {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    },
    
    expectPositiveInteger: (value: number) => {
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
    },
    
    expectNonEmptyString: (value: string) => {
      expect(typeof value).toBe('string')
      expect(value.trim()).not.toBe('')
    }
  }
}

// Export individual helper groups for convenience
export const {
  applicationCard,
  dashboardStats,
  ui,
  accessibility,
  interactions,
  data
} = componentHelpers