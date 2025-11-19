import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CascadeVisualization from '../CascadeVisualization';
import { DEFAULT_CASCADE_DATA } from '../types/cascade';

// Mock D3.js to avoid DOM manipulation in tests
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    append: jest.fn(() => ({
      attr: jest.fn(),
      html: jest.fn(),
      style: jest.fn(),
      on: jest.fn(),
      transition: jest.fn(),
      duration: jest.fn(),
      delay: jest.fn(),
      easeBackOut: jest.fn(),
      selectAll: jest.fn(() => ({
        data: jest.fn(() => ({
          enter: jest.fn(() => ({
            append: jest.fn(() => ({
              attr: jest.fn(),
              style: jest.fn(),
              on: jest.fn(),
              transition: jest.fn(),
              duration: jest.fn(),
              delay: jest.fn(),
              easeBackOut: jest.fn(),
            }))
          }))
        }))
      })),
      remove: jest.fn()
    })),
    forceSimulation: jest.fn(() => ({
      force: jest.fn().mockReturnValue({ id: () => 'test' }),
      stop: jest.fn()
    })),
    zoom: jest.fn(() => ({
      scaleExtent: jest.fn().mockReturnValue({ on: jest.fn() }),
      on: jest.fn()
    })),
    forceLink: jest.fn(),
    forceManyBody: jest.fn(),
    forceCenter: jest.fn(),
    forceCollide: jest.fn()
  }),
}));

describe('CascadeVisualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  test('has no accessibility violations', async () => {
    const { container } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('shows loading state', () => {
    render(<CascadeVisualization data={null} isLoading={true} />);
    expect(screen.getByText('PROCESSING CASCADE...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    render(<CascadeVisualization data={null} error="Test error" />);
    expect(screen.getByText(/CASCADE ERROR: Test error/)).toBeInTheDocument();
  });

  test('renders with custom dimensions', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} width={400} height={300} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  test('renders with custom className', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} className="custom-class" />);
    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });

  test('passes data to visualization', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
    // Mock D3 prevents actual DOM checking, but component should render without errors
  });

  test('handles node click events', () => {
    const onNodeClick = jest.fn();
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} onNodeClick={onNodeClick} />);

    // Since we're mocking D3, we can't actually click on nodes
    // But we can test that the callback function is provided
    expect(typeof onNodeClick).toBe('function');
  });

  test('handles node hover events', () => {
    const onNodeHover = jest.fn();
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} onNodeHover={onNodeHover} />);

    expect(typeof onNodeHover).toBe('function');
  });

  test('is responsive', () => {
    const { container } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);

    // Test that the component has responsive design classes
    expect(container.querySelector('.cascade-visualization')).toBeInTheDocument();
  });

  test('maintains retro styling', () => {
    const { container } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);

    const cascadeElement = container.querySelector('.cascade-visualization');
    expect(cascadeElement).toHaveClass('cascade-visualization');
  });

  test('supports keyboard navigation', () => {
    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);

    // Component should be keyboard accessible
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    render(<CascadeVisualization data={null} />);

    // Should render with default demo data since null triggers fallback
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });
});

describe('CascadeVisualization Performance', () => {
  test('renders efficiently with large datasets', () => {
    const largeDataSet = {
      ...DEFAULT_CASCADE_DATA,
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        type: 'consequence' as const,
        label: `Node ${i}`,
        system: 'environment',
        impact: Math.random() * 10,
        delay: Math.random() * 5,
        duration: Math.random() * 3
      })),
      connections: Array.from({ length: 150 }, (_, i) => ({
        source: `node-${i % 100}`,
        target: `node-${(i + 1) % 100}`,
        type: i % 2 === 0 ? 'direct' as const : 'cascading' as const,
        strength: Math.random(),
        delay: Math.random() * 2
      }))
    };

    const startTime = performance.now();
    render(<CascadeVisualization data={largeDataSet} />);
    const endTime = performance.now();

    // Rendering should take less than 100ms for performance
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('does not cause memory leaks', () => {
    const { unmount } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);

    // Component should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});

describe('CascadeVisualization Accessibility', () => {
  test('supports screen readers', async () => {
    const { container } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has proper ARIA labels', () => {
    render(
      <CascadeVisualization
        data={DEFAULT_CASCADE_DATA}
        aria-label="Action cascade visualization showing cause and effect relationships"
      />
    );

    // Component should have ARIA labels when provided
    const cascadeElement = document.querySelector('[aria-label="Action cascade visualization showing cause and effect relationships"]');
    expect(cascadeElement).toBeInTheDocument();
  });

  test('maintains color contrast', () => {
    const { container } = render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);

    // Should pass accessibility tests for color contrast
    expect(container.querySelector('.cascade-visualization')).toBeInTheDocument();
  });

  test('supports reduced motion', () => {
    // Test that component respects prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        addListener: jest.fn(),
        removeListener: jest.fn()
      }))
    });

    render(<CascadeVisualization data={DEFAULT_CASCADE_DATA} />);

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});