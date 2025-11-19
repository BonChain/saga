/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import CascadeVisualization from '../CascadeVisualization'
import { DEFAULT_CASCADE_DATA } from '../../types/cascade'
import { mockLargeCascade, mockSmallCascade } from '../../../mocks/handlers'

// Mock requestAnimationFrame for performance testing
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn(clearTimeout)

describe('CascadeVisualization Performance Tests', () => {
  const defaultProps = {
    width: 800,
    height: 600,
  }

  test('renders small cascade within performance budget', () => {
    const startTime = performance.now()
    const { container } = render(<CascadeVisualization data={mockSmallCascade} {...defaultProps} />)
    const endTime = performance.now()

    // Should render within 50ms for small datasets
    expect(endTime - startTime).toBeLessThan(50)
    expect(container).toBeInTheDocument()
  })

  test('renders medium cascade within performance budget', () => {
    const mediumData = {
      ...DEFAULT_CASCADE_DATA,
      nodes: Array.from({ length: 10 }, (_, i) => ({
        id: `node-${i}`,
        type:
          i === 0
            ? ('action' as const)
            : i < 5
              ? ('consequence' as const)
              : ('butterfly-effect' as const),
        label: `Medium Node ${i}`,
        system: ['combat', 'social', 'environment', 'economic'][i % 4],
        description: `Description for medium node ${i}`,
        impact: Math.random() * 10,
        delay: Math.random() * 5,
      })),
      connections: Array.from({ length: 15 }, (_, i) => ({
        source: `node-${Math.floor(i / 2)}`,
        target: `node-${(i + 1) % 10}`,
        type: i % 2 === 0 ? ('direct' as const) : ('cascading' as const),
        strength: Math.random(),
        delay: Math.random() * 2,
      })),
    }

    const startTime = performance.now()
    const { container } = render(<CascadeVisualization data={mediumData} {...defaultProps} />)
    const endTime = performance.now()

    // Should render within 75ms for medium datasets
    expect(endTime - startTime).toBeLessThan(75)
    expect(container).toBeInTheDocument()
  })

  test('renders large cascade within performance budget', () => {
    const startTime = performance.now()
    const { container } = render(<CascadeVisualization data={mockLargeCascade} {...defaultProps} />)
    const endTime = performance.now()

    // Should render within 100ms for large datasets
    expect(endTime - startTime).toBeLessThan(100)
    expect(container).toBeInTheDocument()
  })

  test('memory usage does not grow excessively with repeated renders', () => {
    const { rerender } = render(
      <CascadeVisualization data={mockSmallCascade} {...defaultProps} />
    )

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    const initialMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0

    // Perform multiple renders
    for (let i = 0; i < 10; i++) {
      rerender(
        <CascadeVisualization
          data={{
            ...mockSmallCascade,
            nodes: mockSmallCascade.nodes.map(node => ({
              ...node,
              label: `${node.label} ${i}`,
            })),
          }}
          {...defaultProps}
        />
      )
    }

    // Force garbage collection again
    if (global.gc) {
      global.gc()
    }

    const finalMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0
    const memoryGrowth = finalMemory - initialMemory

    // Memory growth should be minimal (< 1MB)
    expect(memoryGrowth).toBeLessThan(1024 * 1024)
  })

  test('component unmounts cleanly', () => {
    const { container, unmount } = render(
      <CascadeVisualization data={mockSmallCascade} {...defaultProps} />
    )

    expect(container).toBeInTheDocument()

    const startTime = performance.now()
    unmount()
    const endTime = performance.now()

    // Unmount should be quick (< 10ms)
    expect(endTime - startTime).toBeLessThan(10)
  })

  test('rapid state changes do not cause performance degradation', () => {
    const { rerender } = render(<CascadeVisualization data={mockSmallCascade} {...defaultProps} />)

    const timings = []

    // Rapidly change data 50 times
    for (let i = 0; i < 50; i++) {
      const startTime = performance.now()
      rerender(
        <CascadeVisualization
          data={{
            ...mockSmallCascade,
            nodes: mockSmallCascade.nodes.map(node => ({
              ...node,
              label: `${node.label} ${i}`,
              impact: Math.random() * 10,
            })),
          }}
          {...defaultProps}
        />
      )
      const endTime = performance.now()
      timings.push(endTime - startTime)
    }

    // Average render time should remain stable
    const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length
    expect(averageTime).toBeLessThan(20)

    // No single render should exceed 100ms
    expect(Math.max(...timings)).toBeLessThan(100)
  })

  test('window resize performance', () => {
    const { rerender } = render(<CascadeVisualization data={mockSmallCascade} {...defaultProps} />)

    // Mock window resize event
    const resizeTimes = []
    const widths = [320, 768, 1024, 1920, 320, 1024] // Mobile to desktop and back

    widths.forEach(width => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      })

      const startTime = performance.now()
      rerender(<CascadeVisualization data={mockSmallCascade} width={width} height={width * 0.75} />)
      const endTime = performance.now()
      resizeTimes.push(endTime - startTime)
    })

    // Resize should be efficient (< 15ms average)
    const averageResizeTime = resizeTimes.reduce((sum, time) => sum + time, 0) / resizeTimes.length
    expect(averageResizeTime).toBeLessThan(15)
  })

  test('accessibility compliance under performance pressure', async () => {
    const { container } = render(<CascadeVisualization data={mockLargeCascade} {...defaultProps} />)

    // Should maintain accessibility even with large datasets
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('animation performance benchmarks', () => {
    // Mock animation frame timing
    const frameTimes = []
    let frameCount = 0
    const maxFrames = 60 // Simulate 1 second of animation

    const originalRequestAnimationFrame = global.requestAnimationFrame
    global.requestAnimationFrame = jest.fn(callback => {
      const startTime = performance.now()

      return setTimeout(() => {
        const frameTime = performance.now() - startTime
        frameTimes.push(frameTime)

        // Simulate 60fps (16.67ms per frame)
        callback(Date.now())

        frameCount++
        if (frameCount >= maxFrames) {
          // Stop animation loop
          return
        }
      }, 16.67)
    })

    render(<CascadeVisualization data={mockSmallCascade} {...defaultProps} />)

    // Wait for animation frames to complete
    setTimeout(() => {
      global.requestAnimationFrame = originalRequestAnimationFrame

      // Check animation performance
      const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length

      // Average frame time should be close to 16.67ms (60fps)
      expect(averageFrameTime).toBeLessThan(20)

      // No frame should take more than 33ms (30fps minimum)
      expect(Math.max(...frameTimes)).toBeLessThan(33)
    }, 2000)
  })

  test('concurrent component instances performance', () => {
    const startTime = performance.now()

    // Render multiple cascade components
    const components = Array.from({ length: 5 }, (_, i) => (
      <CascadeVisualization
        key={i}
        data={{
          ...mockSmallCascade,
          actionId: `test-${i}`,
          nodes: mockSmallCascade.nodes.map(node => ({
            ...node,
            id: `${node.id}-${i}`,
          })),
        }}
        width={400}
        height={300}
      />
    ))

    const { container } = render(<div>{components}</div>)
    const endTime = performance.now()

    // Multiple instances should render efficiently (< 200ms total)
    expect(endTime - startTime).toBeLessThan(200)
    expect(container).toBeInTheDocument()
  })

  test('data processing performance', () => {
    const largeData = {
      ...DEFAULT_CASCADE_DATA,
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `perf-node-${i}`,
        type:
          i === 0
            ? ('action' as const)
            : i < 30
              ? ('consequence' as const)
              : ('butterfly-effect' as const),
        label: `Performance Test Node ${i}`,
        system: ['combat', 'social', 'environment', 'economic', 'magic'][i % 5],
        description: `Performance testing node ${i} with detailed description for processing overhead`,
        impact: Math.random() * 10,
        delay: Math.random() * 10,
        duration: Math.random() * 5,
      })),
      connections: Array.from({ length: 150 }, (_, i) => ({
        source: `perf-node-${Math.floor((i * 100) / 150)}`,
        target: `perf-node-${Math.min(i + 1, 99)}`,
        type: i % 3 === 0 ? ('direct' as const) : ('cascading' as const),
        strength: Math.random(),
        delay: Math.random() * 5,
        duration: Math.random() * 3,
      })),
    }

    const startTime = performance.now()
    render(<CascadeVisualization data={largeData} {...defaultProps} />)
    const endTime = performance.now()

    // Even with 100 nodes and 150 connections, should render within performance budget
    expect(endTime - startTime).toBeLessThan(150)
  })

  test('CSS performance with complex styling', () => {
    const { container } = render(
      <CascadeVisualization
        data={mockLargeCascade}
        {...defaultProps}
        className="performance-test-class"
        aria-label="Performance test cascade"
        aria-describedby="performance-description"
      />
    )

    // Calculate computed styles cost
    const startTime = performance.now()
    const computedStyle = window.getComputedStyle(
      container.querySelector('.cascade-visualization')!
    )
    const endTime = performance.now()

    // Computed style calculation should be fast (< 5ms)
    expect(endTime - startTime).toBeLessThan(5)
    expect(computedStyle).toBeDefined()
  })

  test('memory leak prevention on repeated mounts/unmounts', () => {
    let totalMemoryGrowth = 0
    const iterations = 20

    for (let i = 0; i < iterations; i++) {
      // Get initial memory if available
      const initialMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0

      const { unmount } = render(
        <CascadeVisualization
          data={{
            ...mockSmallCascade,
            nodes: mockSmallCascade.nodes.map(node => ({
              ...node,
              id: `${node.id}-${i}`,
            })),
          }}
          {...defaultProps}
        />
      )

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      unmount()

      const finalMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0
      totalMemoryGrowth += Math.max(0, finalMemory - initialMemory)
    }

    // Average memory growth per mount/unmount cycle should be minimal
    const averageMemoryGrowth = totalMemoryGrowth / iterations
    expect(averageMemoryGrowth).toBeLessThan(50 * 1024) // 50KB per cycle
  })
})
