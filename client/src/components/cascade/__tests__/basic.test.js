/**
 * Basic test without ES module issues
 */

require('@testing-library/jest-dom');
require('jest-axe/extend-expect');

const { render, screen } = require('@testing-library/react');
const { axe } = require('jest-axe');
const React = require('react');

// Mock the component
const CascadeVisualization = require('../CascadeVisualization').default;
const { DEFAULT_CASCADE_DATA } = require('../types/cascade');

// Mock D3.js
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    append: jest.fn().mockReturnValue({
      attr: jest.fn(),
      html: jest.fn(),
      style: jest.fn(),
      on: jest.fn()
    })
  })),
  forceSimulation: jest.fn(() => ({
    force: jest.fn(),
    stop: jest.fn(),
    on: jest.fn()
  })),
  zoom: jest.fn(() => ({
    scaleExtent: jest.fn().mockReturnValue({
      on: jest.fn()
    })
  })),
  forceLink: jest.fn(),
  forceManyBody: jest.fn(),
  forceCenter: jest.fn(),
  forceCollide: jest.fn()
}));

describe('CascadeVisualization Basic Tests', () => {
  test('renders without crashing', () => {
    const { container } = render(React.createElement(CascadeVisualization, { data: DEFAULT_CASCADE_DATA }));
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  test('has no accessibility violations', async () => {
    const { container } = render(React.createElement(CascadeVisualization, { data: DEFAULT_CASCADE_DATA }));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('shows loading state', () => {
    const { container } = render(React.createElement(CascadeVisualization, {
      data: null,
      isLoading: true
    }));
    expect(screen.getByText('PROCESSING CASCADE...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    const { container } = render(React.createElement(CascadeVisualization, {
      data: null,
      error: 'Test error'
    }));
    expect(screen.getByText(/CASCADE ERROR: Test error/)).toBeInTheDocument();
  });
});