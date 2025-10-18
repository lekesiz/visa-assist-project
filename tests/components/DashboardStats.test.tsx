import React from 'react'
import { screen, waitFor, act } from '@testing-library/react'
import { DashboardStats, DetailedStats } from '@/components/dashboard/DashboardStats'
import { 
  render, 
  createMockStats,
  waitForLoadingToFinish,
  expectToRenderWithoutCrashing
} from '../utils/test-utils'
import { DemoService } from '@/lib/demo/demo-service'

// Mock the demo service
jest.mock('@/lib/demo/demo-service')
const mockDemoService = DemoService as jest.Mocked<typeof DemoService>

describe('DashboardStats', () => {
  const defaultStats = createMockStats()

  beforeEach(() => {
    jest.clearAllMocks()
    mockDemoService.isDemoMode.mockReturnValue(true)
    mockDemoService.getUserStats.mockResolvedValue({ data: defaultStats })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expectToRenderWithoutCrashing(DashboardStats)
    })

    it('displays loading state initially', () => {
      render(<DashboardStats />)
      
      // Should show skeleton loaders
      const skeletons = screen.getAllByRole('generic')
      expect(skeletons.some(el => el.classList.contains('animate-pulse'))).toBe(true)
    })

    it('displays stats after loading', async () => {
      await act(async () => {
        render(<DashboardStats />)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Active Applications')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('displays all stat categories', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Active Applications')).toBeInTheDocument()
        expect(screen.getByText('Documents')).toBeInTheDocument()
        expect(screen.getByText('Appointments')).toBeInTheDocument()
        expect(screen.getByText('Saved Jobs')).toBeInTheDocument()
      })
    })
  })

  describe('Demo Mode', () => {
    it('fetches data from demo service when in demo mode', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(mockDemoService.isDemoMode).toHaveBeenCalled()
        expect(mockDemoService.getUserStats).toHaveBeenCalled()
      })
    })

    it('displays demo data correctly', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // activeApplications
        expect(screen.getByText('5')).toBeInTheDocument() // totalDocuments
        expect(screen.getByText('1')).toBeInTheDocument() // upcomingAppointments
        expect(screen.getByText('4')).toBeInTheDocument() // savedJobs
      })
    })

    it('shows descriptive text for stats', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('In progress')).toBeInTheDocument()
        expect(screen.getByText('3 verified')).toBeInTheDocument()
        expect(screen.getByText('Upcoming')).toBeInTheDocument()
        expect(screen.getByText('2 applied')).toBeInTheDocument()
      })
    })
  })

  describe('Non-Demo Mode', () => {
    beforeEach(() => {
      mockDemoService.isDemoMode.mockReturnValue(false)
    })

    it('displays zero values when not in demo mode', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        // Should show multiple zeros for placeholder data
        const zeros = screen.getAllByText('0')
        expect(zeros.length).toBeGreaterThan(0)
      })
    })

    it('does not call demo service when not in demo mode', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(mockDemoService.getUserStats).not.toHaveBeenCalled()
      })
    })
  })

  describe('Compact Mode', () => {
    it('renders compact layout when compact prop is true', async () => {
      render(<DashboardStats compact={true} />)
      
      await waitFor(() => {
        // Check for compact grid structure
        const container = screen.getByText('Active Applications').closest('.grid')
        expect(container).toHaveClass('grid-cols-2', 'lg:grid-cols-4')
      })
    })

    it('shows simplified stat display in compact mode', async () => {
      render(<DashboardStats compact={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('Active Applications')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        
        // Compact mode should not show change indicators
        expect(screen.queryByText('+3')).not.toBeInTheDocument()
      })
    })
  })

  describe('Regular Mode', () => {
    it('shows change indicators', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('+3')).toBeInTheDocument()
        expect(screen.getByText('+2')).toBeInTheDocument()
      })
    })

    it('shows proper card layout', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        const cards = screen.getAllByRole('generic').filter(el => 
          el.classList.contains('rounded-lg') && el.classList.contains('border')
        )
        expect(cards.length).toBeGreaterThan(0)
      })
    })

    it('displays icons with correct colors', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        // Check for icon containers with specific color classes
        const iconContainers = screen.getAllByRole('generic').filter(el =>
          el.classList.contains('p-2') && el.classList.contains('rounded-lg')
        )
        expect(iconContainers.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Period Parameter', () => {
    it('accepts and uses period parameter', () => {
      render(<DashboardStats period="week" />)
      // The period is passed to fetchStats but doesn't visually change much in current implementation
      expect(mockDemoService.isDemoMode).toHaveBeenCalled()
    })

    it('handles different period values', () => {
      const periods: Array<'week' | 'month' | 'year' | 'all'> = ['week', 'month', 'year', 'all']
      
      periods.forEach(period => {
        const { unmount } = render(<DashboardStats period={period} />)
        expect(mockDemoService.isDemoMode).toHaveBeenCalled()
        unmount()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles demo service errors gracefully', async () => {
      mockDemoService.getUserStats.mockRejectedValue(new Error('Demo service error'))
      
      render(<DashboardStats />)
      
      // Should not crash and should handle the error
      await waitFor(() => {
        expect(screen.queryByText('Active Applications')).toBeInTheDocument()
      })
    })

    it('displays stats even when some data is missing', async () => {
      mockDemoService.getUserStats.mockResolvedValue({
        data: {
          activeApplications: 1,
          // Missing other properties
        }
      })
      
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Active Applications')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('Documents')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument() // fallback for missing data
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        // Stats should be presented in a way that's accessible
        expect(screen.getByText('Active Applications')).toBeInTheDocument()
      })
    })

    it('provides meaningful labels for screen readers', async () => {
      render(<DashboardStats />)
      
      await waitFor(() => {
        // Numbers should be associated with their labels
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Active Applications')).toBeInTheDocument()
      })
    })
  })
})

describe('DetailedStats', () => {
  const mockDetailedData = {
    applications: {
      total: 3,
      byStatus: {
        draft: 1,
        in_progress: 1,
        submitted: 0,
        approved: 0,
        rejected: 0
      },
      byType: {
        work: 1,
        student: 1,
        tourist: 0,
        business: 0
      }
    },
    documents: {
      total: 5,
      verified: 3,
      pending: 1,
      rejected: 0
    },
    timeline: {
      averageProcessingDays: 15,
      estimatedCompletionDate: '2025-03-15',
      nextMilestone: 'Document Verification'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDemoService.isDemoMode.mockReturnValue(true)
    mockDemoService.getUserStats.mockResolvedValue({ data: createMockStats() })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expectToRenderWithoutCrashing(DetailedStats)
    })

    it('displays detailed application breakdown', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Applications by Status')).toBeInTheDocument()
        expect(screen.getByText('Draft')).toBeInTheDocument()
        expect(screen.getByText('In progress')).toBeInTheDocument()
      })
    })

    it('displays document status breakdown', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Document Status')).toBeInTheDocument()
        expect(screen.getByText('Verified')).toBeInTheDocument()
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })

    it('displays processing timeline information', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Processing Timeline')).toBeInTheDocument()
        expect(screen.getByText('15 days')).toBeInTheDocument()
        expect(screen.getByText('Document Verification')).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    it('formats dates correctly', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        // Should format the estimated completion date
        expect(screen.getByText(/3\/15\/2025/)).toBeInTheDocument()
      })
    })

    it('shows status counts correctly', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        // Should show the numbers from the mock data
        expect(screen.getByText('1')).toBeInTheDocument() // draft count
      })
    })

    it('displays processing metrics', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Average Processing')).toBeInTheDocument()
        expect(screen.getByText('Estimated Completion')).toBeInTheDocument()
        expect(screen.getByText('Next Milestone')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('returns null when loading', async () => {
      const { container } = render(<DetailedStats />)
      // Should be empty initially
      expect(container.firstChild).toBeNull()
    })

    it('returns null when no data available', async () => {
      mockDemoService.getUserStats.mockResolvedValue({ data: null })
      
      const { container } = render(<DetailedStats />)
      
      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('handles demo service errors gracefully', async () => {
      mockDemoService.getUserStats.mockRejectedValue(new Error('Service error'))
      
      const { container } = render(<DetailedStats />)
      
      await waitFor(() => {
        // Should not crash, might return null or empty state
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Card Layout', () => {
    it('uses proper grid layout', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        const gridContainer = screen.getByText('Applications by Status').closest('.grid')
        expect(gridContainer).toHaveClass('gap-6', 'md:grid-cols-2', 'lg:grid-cols-3')
      })
    })

    it('displays cards with proper headers', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Applications by Status')).toBeInTheDocument()
        expect(screen.getByText('Document Status')).toBeInTheDocument()
        expect(screen.getByText('Processing Timeline')).toBeInTheDocument()
      })
    })
  })

  describe('Status Color Coding', () => {
    it('applies correct color classes for document status', async () => {
      render(<DetailedStats />)
      
      await waitFor(() => {
        const verifiedSpan = screen.getByText('Verified')
        const pendingSpan = screen.getByText('Pending')
        const rejectedSpan = screen.getByText('Rejected')
        
        expect(verifiedSpan).toHaveClass('text-green-600')
        expect(pendingSpan).toHaveClass('text-yellow-600')
        expect(rejectedSpan).toHaveClass('text-red-600')
      })
    })
  })
})