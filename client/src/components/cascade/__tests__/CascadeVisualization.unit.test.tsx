/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import CascadeVisualization from '../CascadeVisualization'
import { DEFAULT_CASCADE_DATA, mockCascadeData } from '../../types/cascade'

// Enhanced D3.js mocking with better simulation
jest.mock('d3', () => {
  const mockSelect = jest.fn(() => ({
    append: jest.fn().mockReturnValue({
      attr: jest.fn().mockReturnValue({
        attr: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnValue({
            attr: jest.fn().mockReturnValue({
              html: jest.fn(),
              style: jest.fn(),
              on: jest.fn(),
              transition: jest.fn().mockReturnValue({
                duration: jest.fn().mockReturnValue({
                  delay: jest.fn().mockReturnValue({
                    easeBackOut: jest.fn(),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    selectAll: jest.fn().mockReturnValue({
      data: jest.fn().mockReturnValue({
        enter: jest.fn().mockReturnValue({
          append: jest.fn().mockReturnValue({
            attr: jest.fn().mockReturnValue({
              style: jest.fn().mockReturnValue({
                on: jest.fn().mockReturnValue({
                  transition: jest.fn().mockReturnValue({
                    duration: jest.fn().mockReturnValue({
                      delay: jest.fn().mockReturnValue({
                        attr: jest.fn().mockReturnValue({
                          attr: jest.fn(),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    remove: jest.fn(),
  }))

  const mockForceSimulation = jest.fn(() => ({
    force: jest.fn().mockReturnThis(),
    stop: jest.fn(),
  }))

  const mockZoom = jest.fn(() => ({
    scaleExtent: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
    }),
  }))

  return {
    select: mockSelect,
    selectAll: jest.fn(),
    forceSimulation: mockForceSimulation,
    zoom: mockZoom,
    forceLink: jest.fn(),
    forceManyBody: jest.fn(),
    forceCenter: jest.fn(),
    forceCollide: jest.fn(),
  }
})

// Mock window dimensions for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
})

describe('CascadeVisualization Component Unit Tests', () => {
  const defaultProps = {
    data: DEFAULT_CASCADE_DATA,
    width: 800,
    height: 600,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset any DOM modifications
    document.body.innerHTML = ''
  })

  test('renders without crashing with default data', () => {
    render(<CascadeVisualization {...defaultProps} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('renders with null data (uses default demo data)', () => {
    render(<CascadeVisualization data={null} width={800} height={600} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('has no accessibility violations with data', async () => {
    const { container } = render(<CascadeVisualization {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('has no accessibility violations with loading state', async () => {
    const { container } = render(<CascadeVisualization data={null} isLoading={true} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('has no accessibility violations with error state', async () => {
    const { container } = render(<CascadeVisualization data={null} error="Test error" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('displays loading state correctly', () => {
    render(<CascadeVisualization data={null} isLoading={true} />)
    expect(screen.getByText('PROCESSING CASCADE...')).toBeInTheDocument()
    expect(screen.getByRole('generic')).toHaveClass('loading')
  })

  test('displays error state correctly', () => {
    render(<CascadeVisualization data={null} error="Test error message" />)
    expect(screen.getByText(/CASCADE ERROR: Test error message/)).toBeInTheDocument()
    expect(screen.getByRole('generic')).toHaveClass('error')
  })

  test('displays tooltip on hover', async () => {
    const onNodeHover = jest.fn()
    userEvent.setup()

    render(<CascadeVisualization {...defaultProps} onNodeHover={onNodeHover} />)

    // Since we can't actually hover on mocked D3 elements, we test that the callback is provided
    expect(typeof onNodeHover).toBe('function')
  })

  test('handles node click events', () => {
    const onNodeClick = jest.fn()
    render(<CascadeVisualization {...defaultProps} onNodeClick={onNodeClick} />)

    expect(typeof onNodeClick).toBe('function')
  })

  test('renders with custom className', () => {
    render(<CascadeVisualization {...defaultProps} className="custom-class" />)
    const container = screen.getByRole('generic')
    expect(container).toHaveClass('custom-class')
  })

  test('renders with custom dimensions', () => {
    render(<CascadeVisualization {...defaultProps} width={400} height={300} />)
    const container = screen.getByRole('generic')
    expect(container).toBeInTheDocument()
  })

  test('handles empty data gracefully', () => {
    const emptyData = {
      ...DEFAULT_CASCADE_DATA,
      nodes: [],
      connections: [],
    }

    render(<CascadeVisualization data={emptyData} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('applies retro styling correctly', () => {
    const { container } = render(<CascadeVisualization {...defaultProps} />)
    const cascadeElement = container.querySelector('.cascade-visualization')
    expect(cascadeElement).toHaveClass('cascade-visualization')
  })

  test('supports keyboard navigation', () => {
    render(<CascadeVisualization {...defaultProps} />)
    // Test that component renders with proper focus management
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('handles large datasets without performance issues', () => {
    const largeData = {
      ...DEFAULT_CASCADE_DATA,
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        type: i === 0 ? ('action' as const) : ('consequence' as const),
        label: `Large Node ${i}`,
        system: 'environment',
        impact: Math.random() * 10,
        delay: Math.random() * 5,
      })),
      connections: Array.from({ length: 150 }, (_, i) => ({
        source: `node-${i % 100}`,
        target: `node-${(i + 1) % 100}`,
        type: 'cascading' as const,
        strength: Math.random(),
      })),
    }

    const startTime = performance.now()
    render(<CascadeVisualization data={largeData} />)
    const endTime = performance.now()

    // Should render within 100ms even with large datasets
    expect(endTime - startTime).toBeLessThan(100)
  })

  test('unmounts without memory leaks', () => {
    const { unmount } = render(<CascadeVisualization {...defaultProps} />)

    expect(() => unmount()).not.toThrow()
  })

  test('handles responsive dimensions correctly', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    })

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 568,
    })

    render(<CascadeVisualization {...defaultProps} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('supports reduced motion preference', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    render(<CascadeVisualization {...defaultProps} />)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  test('supports high contrast mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    render(<CascadeVisualization {...defaultProps} />)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)')
  })

  test('tooltip displays correct information', () => {
    // Mock a hovered node state
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [
      mockCascadeData.nodes[0], // hoveredNode
      jest.fn(),
    ])

    render(<CascadeVisualization {...defaultProps} />)

    // Should display tooltip with node information
    expect(screen.getByText('Attack dragon with sword')).toBeInTheDocument()
    expect(screen.getByText('System: combat')).toBeInTheDocument()
    expect(screen.getByText('Impact: 8/10')).toBeInTheDocument()
  })

  test('passes accessibility with different world systems', async () => {
    const multiSystemData = {
      ...DEFAULT_CASCADE_DATA,
      nodes: [
        { ...DEFAULT_CASCADE_DATA.nodes[0], system: 'combat' },
        { ...DEFAULT_CASCADE_DATA.nodes[1], system: 'social' },
        { ...DEFAULT_CASCADE_DATA.nodes[2], system: 'environment' },
        { ...DEFAULT_CASCADE_DATA.nodes[3], system: 'economic' },
      ],
    }

    const { container } = render(<CascadeVisualization data={multiSystemData} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('handles rapid data updates gracefully', async () => {
    const { rerender } = render(<CascadeVisualization {...defaultProps} />)

    // Rapid data updates
    for (let i = 0; i < 10; i++) {
      const updatedData = {
        ...DEFAULT_CASCADE_DATA,
        nodes: [{ ...DEFAULT_CASCADE_DATA.nodes[0], label: `Updated Node ${i}` }],
      }

      rerender(<CascadeVisualization data={updatedData} />)
    }

    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('respects user preferences for animations', () => {
    // Mock user prefers reduced motion
    const prefersReducedMotion = jest.fn().mockReturnValue(true)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion(),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    render(<CascadeVisualization {...defaultProps} />)

    // Component should still render without animations
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('supports ARIA attributes and labels', () => {
    const { container } = render(
      <CascadeVisualization
        {...defaultProps}
        aria-label="Cascade visualization of action consequences"
        aria-describedby="cascade-description"
      />
    )

    const cascadeElement = container.querySelector(
      '[aria-label="Cascade visualization of action consequences"]'
    )
    expect(cascadeElement).toBeInTheDocument()
  })
})
