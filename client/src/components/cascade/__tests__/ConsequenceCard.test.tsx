import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import ConsequenceCard from '../ConsequenceCard'
import { DEFAULT_WORLD_SYSTEM_COLORS } from '../types/cascade'
import type { CascadeNode } from '../types/cascade'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('ConsequenceCard Component', () => {
  const mockConsequence: CascadeNode = {
    id: 'test-consequence-1',
    type: 'consequence',
    label: 'Test Consequence',
    system: 'environment',
    description: 'Test description',
    impact: 7,
    familiarity: 'known',
    severity: 'major',
    personalRelevance: 75,
    narrative: 'This is a test narrative about the consequence',
    delay: 1
  }

  const defaultProps = {
    consequence: mockConsequence,
    worldSystemColors: DEFAULT_WORLD_SYSTEM_COLORS
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ConsequenceCard {...defaultProps} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes on toggle button', () => {
      render(<ConsequenceCard {...defaultProps} />)

      const toggle = screen.getByRole('button')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(toggle).toHaveAttribute('aria-label', 'Expand consequence details')
    })

    it('should update ARIA expanded state when toggled', () => {
      render(<ConsequenceCard {...defaultProps} />)

      const toggle = screen.getByRole('button')
      fireEvent.click(toggle)

      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(toggle).toHaveAttribute('aria-label', 'Collapse consequence details')
    })
  })

  describe('Basic Rendering', () => {
    it('should render consequence information correctly', () => {
      render(<ConsequenceCard {...defaultProps} />)

      expect(screen.getByText('Test Consequence')).toBeInTheDocument()
      expect(screen.getByText('ENVIRONMENT')).toBeInTheDocument()
      expect(screen.getByText('MAJOR')).toBeInTheDocument()
      expect(screen.getByText('7/10')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should render unknown consequences with different styling', () => {
      const unknownConsequence = {
        ...mockConsequence,
        familiarity: 'unknown' as const,
        severity: 'critical' as const,
        personalRelevance: 45
      }

      render(<ConsequenceCard consequence={unknownConsequence} worldSystemColors={DEFAULT_WORLD_SYSTEM_COLORS} />)

      expect(screen.getByText('CRITICAL')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
    })

    it('should apply correct styling classes', () => {
      const { container } = render(<ConsequenceCard {...defaultProps} />)

      const card = container.querySelector('.consequence-card')
      expect(card).toHaveClass('known', 'major')

      const systemBadge = screen.getByText('ENVIRONMENT')
      expect(systemBadge).toBeInTheDocument()

      const severityBadge = screen.getByText('MAJOR')
      expect(severityBadge).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should start collapsed', () => {
      render(<ConsequenceCard {...defaultProps} />)

      expect(screen.queryByText('Impact Narrative')).not.toBeInTheDocument()
      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    })

    it('should expand when toggle is clicked', () => {
      render(<ConsequenceCard {...defaultProps} />)

      const toggle = screen.getByRole('button')
      fireEvent.click(toggle)

      expect(screen.getByText('Impact Narrative')).toBeInTheDocument()
      expect(screen.getByText('Technical Details')).toBeInTheDocument()
      expect(screen.getByText('Familiarity Status')).toBeInTheDocument()
    })

    it('should collapse when toggle is clicked again', () => {
      render(<ConsequenceCard {...defaultProps} onToggle={jest.fn()} />)

      const toggle = screen.getByRole('button')

      // Expand
      fireEvent.click(toggle)
      expect(screen.getByText('Impact Narrative')).toBeInTheDocument()

      // Collapse
      fireEvent.click(toggle)
      expect(screen.queryByText('Impact Narrative')).not.toBeInTheDocument()
    })

    it('should call onToggle when toggle is clicked', () => {
      const mockOnToggle = jest.fn()
      render(<ConsequenceCard {...defaultProps} onToggle={mockOnToggle} />)

      const toggle = screen.getByRole('button')
      fireEvent.click(toggle)

      expect(mockOnToggle).toHaveBeenCalledTimes(1)
    })

    it('should start expanded if isExpanded is true', () => {
      render(<ConsequenceCard {...defaultProps} isExpanded={true} />)

      expect(screen.getByText('Impact Narrative')).toBeInTheDocument()
      expect(screen.getByText('This is a test narrative about the consequence')).toBeInTheDocument()
    })
  })

  describe('Expanded Content', () => {
    it('should display detailed technical information when expanded', () => {
      render(<ConsequenceCard {...defaultProps} isExpanded={true} />)

      expect(screen.getByText('Type:')).toBeInTheDocument()
      expect(screen.getByText('consequence')).toBeInTheDocument()
      expect(screen.getByText('System:')).toBeInTheDocument()
      expect(screen.getByText('environment')).toBeInTheDocument()
      expect(screen.getByText('Impact:')).toBeInTheDocument()
      expect(screen.getByText('7/10')).toBeInTheDocument()
    })

    it('should display familiarity information when expanded', () => {
      render(<ConsequenceCard {...defaultProps} isExpanded={true} />)

      expect(screen.getByText('🎯')).toBeInTheDocument()
      expect(screen.getByText('Known Effect')).toBeInTheDocument()
    })

    it('should show discovery moment for unknown consequences', () => {
      const unknownConsequence = {
        ...mockConsequence,
        familiarity: 'unknown' as const
      }

      render(<ConsequenceCard consequence={unknownConsequence} isExpanded={true} worldSystemColors={DEFAULT_WORLD_SYSTEM_COLORS} />)

      expect(screen.getByText('✨')).toBeInTheDocument()
      expect(screen.getByText('Discovery Moment')).toBeInTheDocument()
    })
  })

  describe('Visual Design', () => {
    it('should use CSS custom properties for dynamic styling', () => {
      const { container } = render(<ConsequenceCard {...defaultProps} />)

      const card = container.querySelector('.consequence-card')
      const styles = window.getComputedStyle(card!)

      expect(styles.getPropertyValue('--card-primary-color')).toBe('#00ff41')
      expect(styles.getPropertyValue('--card-secondary-color')).toBe('#00cc33')
      expect(styles.getPropertyValue('--card-severity-color')).toBe('#ffaa00')
      expect(styles.getPropertyValue('--card-relevance-opacity')).toBe('0.75')
    })

    it('should apply different colors for different world systems', () => {
      const combatConsequence = {
        ...mockConsequence,
        system: 'combat'
      }

      const { container } = render(<ConsequenceCard consequence={combatConsequence} worldSystemColors={DEFAULT_WORLD_SYSTEM_COLORS} />)

      const card = container.querySelector('.consequence-card')
      const styles = window.getComputedStyle(card!)

      expect(styles.getPropertyValue('--card-primary-color')).toBe('#ff4444')
    })
  })

  describe('Interactivity', () => {
    it('should have hover effects on buttons', () => {
      render(<ConsequenceCard {...defaultProps} />)

      const toggle = screen.getByRole('button')

      // Test that button has hover capability
      fireEvent.mouseEnter(toggle)
      fireEvent.mouseLeave(toggle)
      expect(toggle).toBeInTheDocument()
    })

    it('should have hover effects on card', () => {
      const { container } = render(<ConsequenceCard {...defaultProps} />)

      const card = container.querySelector('.consequence-card')

      // Test that card has hover capability
      fireEvent.mouseEnter(card!)
      fireEvent.mouseLeave(card!)
      expect(card).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing optional properties', () => {
      const minimalConsequence = {
        id: 'minimal',
        type: 'consequence' as const,
        label: 'Minimal Consequence',
        system: 'environment',
        impact: 5
      }

      render(<ConsequenceCard consequence={minimalConsequence} worldSystemColors={DEFAULT_WORLD_SYSTEM_COLORS} />)

      expect(screen.getByText('Minimal Consequence')).toBeInTheDocument()
      expect(screen.getByText('5/10')).toBeInTheDocument()
    })

    it('should handle default severity and familiarity', () => {
      const consequenceWithoutDefaults = {
        ...mockConsequence,
        severity: undefined,
        familiarity: undefined
      }

      render(<ConsequenceCard consequence={consequenceWithoutDefaults} worldSystemColors={DEFAULT_WORLD_SYSTEM_COLORS} />)

      expect(screen.getByText('5/10')).toBeInTheDocument()
      // Should not crash and apply defaults
    })
  })

  describe('Performance', () => {
    it('should render quickly', () => {
      const startTime = performance.now()
      render(<ConsequenceCard {...defaultProps} />)
      const endTime = performance.now()

      // Should render within 10ms
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should handle rapid toggle clicks', () => {
      render(<ConsequenceCard {...defaultProps} />)

      const toggle = screen.getByRole('button')

      // Rapid clicks
      fireEvent.click(toggle)
      fireEvent.click(toggle)
      fireEvent.click(toggle)
      fireEvent.click(toggle)

      // Should still work correctly
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })
  })
})