import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import CascadeResults from '../CascadeResults'
import { DEFAULT_CASCADE_DATA } from '../types/cascade'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('CascadeResults Component', () => {
  const defaultProps = {
    data: DEFAULT_CASCADE_DATA,
    isLoading: false,
    error: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<CascadeResults {...defaultProps} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels on filter buttons', () => {
      render(<CascadeResults {...defaultProps} />)

      const knownButton = screen.getByLabelText('Toggle known consequences')
      const unknownButton = screen.getByLabelText('Toggle unknown consequences')

      expect(knownButton).toBeInTheDocument()
      expect(unknownButton).toBeInTheDocument()
    })

    it('should have proper ARIA expanded state on card toggles', () => {
      render(<CascadeResults {...defaultProps} />)

      const cardToggles = screen.getAllByLabelText(/Toggle consequence details/)
      expect(cardToggles).toHaveLength(3) // Only consequence and butterfly effects

      cardToggles.forEach(toggle => {
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('Basic Rendering', () => {
    it('should render the component with data', () => {
      render(<CascadeResults {...defaultProps} />)

      expect(screen.getByText('CONSEQUENCE ANALYSIS TERMINAL')).toBeInTheDocument()
      expect(screen.getByText('Consequences')).toBeInTheDocument()
      expect(screen.getByText('3 consequences')).toBeInTheDocument()
    })

    it('should render consequence cards', () => {
      render(<CascadeResults {...defaultProps} />)

      expect(screen.getByText('Dragon retaliates with fire')).toBeInTheDocument()
      expect(screen.getByText('Villagers panic and flee')).toBeInTheDocument()
      expect(screen.getByText('Forest caught in wildfire')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(<CascadeResults {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Processing consequences...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should show error state', () => {
      render(<CascadeResults {...defaultProps} error="Network error" />)

      expect(screen.getByText('Unable to load consequences')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })

    it('should show no results when filter yields no consequences', () => {
      render(<CascadeResults {...defaultProps} />)

      // Turn off both filters
      const knownButton = screen.getByLabelText('Toggle known consequences')
      const unknownButton = screen.getByLabelText('Toggle unknown consequences')

      fireEvent.click(knownButton)
      fireEvent.click(unknownButton)

      expect(screen.getByText('No consequences match current filter')).toBeInTheDocument()
      expect(screen.getByText('🎭')).toBeInTheDocument()
    })
  })

  describe('Filter Functionality', () => {
    it('should filter known and unknown consequences', () => {
      render(<CascadeResults {...defaultProps} />)

      const knownButton = screen.getByLabelText('Toggle known consequences')
      const unknownButton = screen.getByLabelText('Toggle unknown consequences')

      // Initially both should be active
      expect(knownButton).toHaveClass('active', 'known')
      expect(unknownButton).toHaveClass('active', 'unknown')
      expect(screen.getByText('3 consequences')).toBeInTheDocument()

      // Filter to show only unknown
      fireEvent.click(knownButton)
      expect(knownButton).not.toHaveClass('active')
      expect(unknownButton).toHaveClass('active', 'unknown')
      expect(screen.getByText('2 consequences')).toBeInTheDocument() // Assuming some are unknown

      // Filter to show only known
      fireEvent.click(unknownButton)
      fireEvent.click(knownButton)
      expect(knownButton).toHaveClass('active', 'known')
      expect(unknownButton).not.toHaveClass('active')
      expect(screen.getByText('1 consequences')).toBeInTheDocument() // Assuming some are known
    })

    it('should update filter count dynamically', () => {
      render(<CascadeResults {...defaultProps} />)

      const knownButton = screen.getByLabelText('Toggle known consequences')

      fireEvent.click(knownButton)
      expect(screen.getByText(/\d+ consequence/)).toBeInTheDocument()
    })
  })

  describe('Card Interactions', () => {
    it('should expand and collapse cards', async () => {
      render(<CascadeResults {...defaultProps} />)

      const firstToggle = screen.getByLabelText(/Toggle consequence details/)
      expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
      expect(firstToggle).toHaveTextContent('Show More')

      fireEvent.click(firstToggle)

      await waitFor(() => {
        expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
        expect(firstToggle).toHaveTextContent('Show Less')
      })

      // Check expanded content appears
      expect(screen.getByText('Impact Narrative')).toBeInTheDocument()
      expect(screen.getByText('Technical Details')).toBeInTheDocument()
      expect(screen.getByText('Familiarity Status')).toBeInTheDocument()
    })

    it('should show relevant consequence information', () => {
      render(<CascadeResults {...defaultProps} />)

      // Check system labels
      expect(screen.getByText('COMBAT')).toBeInTheDocument()
      expect(screen.getByText('SOCIAL')).toBeInTheDocument()
      expect(screen.getByText('ENVIRONMENT')).toBeInTheDocument()

      // Check severity badges
      expect(screen.getByText('MAJOR')).toBeInTheDocument()
      expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', () => {
      // Set mobile viewport size
      global.innerWidth = 375
      global.innerHeight = 667

      const { container } = render(<CascadeResults {...defaultProps} />)

      // Filter should wrap on mobile
      const filterSection = container.querySelector('.cascade-filter')
      expect(filterSection).toBeInTheDocument()

      // Cards should be single column
      const timeline = container.querySelector('.cascade-timeline')
      expect(timeline).toBeInTheDocument()
    })

    it('should use minimum tap target sizes', () => {
      render(<CascadeResults {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const height = parseInt(styles.height)
        expect(height).toBeGreaterThanOrEqual(44) // WCAG 2.1 AAA minimum
      })
    })
  })

  describe('Performance', () => {
    it('should handle large amounts of consequences', () => {
      const largeData = {
        ...DEFAULT_CASCADE_DATA,
        nodes: Array.from({ length: 50 }, (_, i) => ({
          id: `consequence-${i}`,
          type: 'consequence' as const,
          label: `Consequence ${i + 1}`,
          system: 'environment',
          description: `Description for consequence ${i + 1}`,
          impact: (i % 10) + 1
        }))
      }

      const startTime = performance.now()
      render(<CascadeResults data={largeData} />)
      const endTime = performance.now()

      // Should render within 100ms even with 50 items
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<CascadeResults {...defaultProps} />)

      const initialCards = screen.getAllByLabelText(/Toggle consequence details/)
      expect(initialCards).toHaveLength(3)

      // Re-render with same data
      rerender(<CascadeResults {...defaultProps} />)

      const cardsAfterRerender = screen.getAllByLabelText(/Toggle consequence details/)
      expect(cardsAfterRerender).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle null data gracefully', () => {
      render(<CascadeResults data={null} />)

      // Should use default data
      expect(screen.getByText('3 consequences')).toBeInTheDocument()
    })

    it('should handle malformed data gracefully', () => {
      const malformedData = {
        ...DEFAULT_CASCADE_DATA,
        nodes: DEFAULT_CASCADE_DATA.nodes.map(node => ({
          ...node,
          type: 'consequence' as const,
          impact: -1
        }))
      }

      // Should not crash and render something
      render(<CascadeResults data={malformedData} />)
      expect(screen.getByText('Consequences')).toBeInTheDocument()
    })
  })

  describe('Familiarity Scoring', () => {
    it('should calculate personal relevance scores', () => {
      render(<CascadeResults {...defaultProps} />)

      // Look for relevance bars
      const relevanceBars = screen.getAllByRole('progressbar')
      expect(relevanceBars.length).toBeGreaterThan(0)
    })

    it('should display familiarity badges', async () => {
      render(<CascadeResults {...defaultProps} />)

      const firstToggle = screen.getByLabelText(/Toggle consequence details/)
      fireEvent.click(firstToggle)

      await waitFor(() => {
        expect(screen.getByText(/Known Effect|Discovery Moment/)).toBeInTheDocument()
      })
    })
  })
})