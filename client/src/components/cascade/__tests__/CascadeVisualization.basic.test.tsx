/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'
import { axe } from 'jest-axe'
import CascadeVisualization from '../CascadeVisualization'
import { DEFAULT_CASCADE_DATA } from '../types/cascade'

// Mock D3.js
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    append: jest.fn().mockReturnValue({
      attr: jest.fn(),
      html: jest.fn(),
      style: jest.fn(),
      on: jest.fn(),
    }),
  })),
  forceSimulation: jest.fn(() => ({
    force: jest.fn(),
    stop: jest.fn(),
    on: jest.fn(),
  })),
  zoom: jest.fn(() => ({
    scaleExtent: jest.fn().mockReturnValue({
      on: jest.fn(),
    }),
  })),
  forceLink: jest.fn(),
  forceManyBody: jest.fn(),
  forceCenter: jest.fn(),
  forceCollide: jest.fn(),
}))

describe('CascadeVisualization Basic Tests', () => {
  test('renders without crashing', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('shows loading state', () => {
    render(<CascadeVisualization data={null} isLoading={true} />)
    expect(screen.getByText('PROCESSING CASCADE...')).toBeInTheDocument()
  })

  test('shows error state', () => {
    render(<CascadeVisualization data={null} error="Test error" />)
    expect(screen.getByText(/CASCADE ERROR: Test error/)).toBeInTheDocument()
  })

  test('handles null data gracefully', () => {
    render(<CascadeVisualization data={null} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} className="custom-class" />)
    expect(screen.getByRole('generic')).toHaveClass('custom-class')
  })

  test('handles custom dimensions', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} width={400} height={300} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })
})
