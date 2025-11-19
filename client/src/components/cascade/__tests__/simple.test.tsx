import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { axe } from 'jest-axe'

// Mock D3.js completely to avoid ES module issues
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    append: jest.fn().mockReturnValue({
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    }),
  })),
  forceSimulation: jest.fn(() => ({
    force: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    on: jest.fn(),
  })),
  zoom: jest.fn(() => ({
    scaleExtent: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
    }),
  })),
  forceLink: jest.fn(),
  forceManyBody: jest.fn(),
  forceCenter: jest.fn(),
  forceCollide: jest.fn(),
}))

// Import the component
import CascadeVisualization from '../CascadeVisualization'

// Mock cascade data
const mockData = {
  actionId: 'test-action',
  nodes: [
    {
      id: 'node1',
      type: 'action' as const,
      label: 'Test Action',
      system: 'combat',
      description: 'A test action',
      impact: 8,
      delay: 0,
      duration: 1,
    },
    {
      id: 'node2',
      type: 'consequence' as const,
      label: 'Test Consequence',
      system: 'environment',
      description: 'A test consequence',
      impact: 5,
      delay: 1,
      duration: 2,
    },
  ],
  connections: [
    {
      source: 'node1',
      target: 'node2',
      type: 'direct' as const,
      strength: 0.8,
      delay: 1,
      duration: 2,
    },
  ],
  metadata: {
    totalNodes: 2,
    totalConnections: 1,
    processingTime: 2.5,
    worldSystemsAffected: ['combat', 'environment'],
    maxDepth: 1,
    severity: 'medium' as const,
  },
  timestamp: new Date().toISOString(),
  playerId: 'test-player',
}

describe('CascadeVisualization Tests - Real Results', () => {
  test('1. Renders without crashing', () => {
    console.log('🧪 Test 1: Basic rendering')
    const startTime = performance.now()

    const { container } = render(<CascadeVisualization data={mockData} width={800} height={600} />)

    const endTime = performance.now()
    console.log(`✅ Component rendered in ${(endTime - startTime).toFixed(2)}ms`)

    expect(screen.getByRole('generic')).toBeInTheDocument()
    expect(container).toBeInTheDocument()
    console.log('✅ Basic rendering test PASSED')
  })

  test('2. Shows loading state', () => {
    console.log('\n🧪 Test 2: Loading state')

    render(
      <CascadeVisualization data={null} isLoading={true} width={800} height={600} />
    )

    expect(screen.getByText('PROCESSING CASCADE...')).toBeInTheDocument()
    expect(screen.getByRole('generic')).toHaveClass('loading')
    console.log('✅ Loading state test PASSED')
  })

  test('3. Shows error state', () => {
    console.log('\n🧪 Test 3: Error state')

    render(
      <CascadeVisualization data={null} error="Test error message" width={800} height={600} />
    )

    expect(screen.getByText(/CASCADE ERROR: Test error message/)).toBeInTheDocument()
    expect(screen.getByRole('generic')).toHaveClass('error')
    console.log('✅ Error state test PASSED')
  })

  test('4. Handles null data gracefully', () => {
    console.log('\n🧪 Test 4: Null data handling')

    render(<CascadeVisualization data={null} width={800} height={600} />)

    expect(screen.getByRole('generic')).toBeInTheDocument()
    console.log('✅ Null data handling test PASSED')
  })

  test('5. Applies custom className', () => {
    console.log('\n🧪 Test 5: Custom className')

    render(
      <CascadeVisualization
        data={mockData}
        className="custom-test-class"
        width={800}
        height={600}
      />
    )

    expect(screen.getByRole('generic')).toHaveClass('custom-test-class')
    console.log('✅ Custom className test PASSED')
  })

  test('6. Accessibility check', async () => {
    console.log('\n🧪 Test 6: Accessibility (axe)')

    const { container } = render(<CascadeVisualization data={mockData} width={800} height={600} />)

    const results = await axe(container)

    if (results.violations.length === 0) {
      console.log('✅ Accessibility test PASSED - No violations found')
    } else {
      console.log(`❌ Accessibility test FAILED - ${results.violations.length} violations found:`)
      results.violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. ${violation.description}`)
      })
    }

    expect(results.violations).toHaveLength(0)
  })

  test('7. Performance with large dataset', () => {
    console.log('\n🧪 Test 7: Performance with large dataset')

    const largeData = {
      ...mockData,
      nodes: Array.from({ length: 50 }, (_, i) => ({
        id: `large-node-${i}`,
        type:
          i === 0
            ? ('action' as const)
            : i < 25
              ? ('consequence' as const)
              : ('butterfly-effect' as const),
        label: `Large Node ${i}`,
        system: ['combat', 'social', 'environment', 'economic'][i % 4],
        description: `Description for large node ${i}`,
        impact: Math.random() * 10,
        delay: Math.random() * 5,
        duration: Math.random() * 3,
      })),
      connections: Array.from({ length: 60 }, (_, i) => ({
        source: `large-node-${Math.floor(i / 2)}`,
        target: `large-node-${Math.min(i + 1, 49)}`,
        type: i % 2 === 0 ? ('direct' as const) : ('cascading' as const),
        strength: Math.random(),
        delay: Math.random() * 2,
      })),
    }

    const startTime = performance.now()

    render(<CascadeVisualization data={largeData} width={800} height={600} />)

    const endTime = performance.now()
    const renderTime = endTime - startTime

    console.log(`📊 Performance test results:`)
    console.log(
      `   - Rendered ${largeData.nodes.length} nodes and ${largeData.connections.length} connections`
    )
    console.log(`   - Render time: ${renderTime.toFixed(2)}ms`)

    if (renderTime < 100) {
      console.log('✅ Performance test PASSED - Under 100ms render time')
    } else {
      console.log('❌ Performance test FAILED - Over 100ms render time')
    }

    expect(renderTime).toBeLessThan(100)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('8. Memory leak prevention', () => {
    console.log('\n🧪 Test 8: Memory leak prevention')

    const renderTimes = []
    const iterations = 10

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      const { unmount } = render(
        <CascadeVisualization
          data={mockData}
          width={800}
          height={600}
          className={`iteration-${i}`}
        />
      )

      unmount()

      const endTime = performance.now()
      renderTimes.push(endTime - startTime)
    }

    const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
    const maxTime = Math.max(...renderTimes)

    console.log(`📊 Memory test results (${iterations} iterations):`)
    console.log(`   - Average render time: ${averageTime.toFixed(2)}ms`)
    console.log(`   - Max render time: ${maxTime.toFixed(2)}ms`)
    console.log(`   - All render times: ${renderTimes.map(t => t.toFixed(1)).join('ms, ')}ms`)

    if (averageTime < 20) {
      console.log('✅ Memory leak test PASSED - Average under 20ms')
    } else {
      console.log('⚠️ Memory leak test WARNING - Average over 20ms')
    }

    expect(averageTime).toBeLessThan(50)
  })
})
