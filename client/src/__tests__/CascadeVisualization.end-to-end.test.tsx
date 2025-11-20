import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { server } from '../mocks/server';
import { http } from 'msw';
import App from '../App';
import { mockCascadeData, mockSmallCascade, mockLargeCascade } from '../mocks/handlers';

// Mock window dimensions for consistent testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock performance monitoring
jest.mock('../utils/performanceMonitor', () => ({
  setPerformanceProfile: jest.fn(),
  startMonitoring: jest.fn(),
  toggleOverlay: jest.fn(),
  stopMonitoring: jest.fn(),
}));

describe('Cascade Visualization End-to-End Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    server.resetHandlers();
  });

  test('complete flow from action submission to cascade visualization', async () => {
    // Mock successful action submission
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-test-123',
              status: 'received',
              message: 'Action received! Processing world changes...'
            }
          })
        );
      })
    );

    // Mock cascade data
    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockCascadeData }));
      })
    );

    const { container } = render(<App />);

    // 1. Verify initial state
    expect(screen.getByPlaceholderText('Enter any action you can imagine...')).toBeInTheDocument();

    // 2. Submit an action
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'attack dragon with sword');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    // 3. Wait for action confirmation
    await waitFor(() => {
      expect(screen.getByText(/Action received: ID/)).toBeInTheDocument();
    });

    // 4. Cascade visualization should appear
    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
      expect(screen.getByRole('generic')).toHaveClass('cascade-visualization');
    });

    // 5. Verify accessibility
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // 6. Verify retro styling
    const cascadeSection = screen.getByText('ACTION CASCADE VISUALIZATION').parentElement;
    expect(cascadeSection).toHaveClass('cascade-section');

    // 7. Verify close button works
    const closeButton = screen.getByLabelText('Close cascade visualization');
    await userEvent.click(closeButton);

    // 8. Cascade should be closed
    expect(screen.queryByText('ACTION CASCADE VISUALIZATION')).not.toBeInTheDocument();
    expect(screen.getByText('Submit an action to see cascade visualization')).toBeInTheDocument();
  });

  test('handles action submission errors gracefully', async () => {
    // Mock action submission error
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, error: 'Server unavailable' })
        );
      })
    );

    render(<App />);

    // Submit an action
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'test action');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/❌ Server error - please try again/)).toBeInTheDocument();
    });

    // Cascade should not appear
    expect(screen.queryByText('ACTION CASCADE VISUALIZATION')).not.toBeInTheDocument();
  });

  test('handles cascade data fetch errors gracefully', async () => {
    // Mock successful action submission but cascade fetch error
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-error-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, error: 'Cascade generation failed' })
        );
      })
    );

    render(<App />);

    // Submit action
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'test action');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    // Cascade should still appear (uses default demo data in dev mode)
    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
    });

    // Accessibility should still work
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  test('handles real-time cascade updates', async () => {
    // Mock initial action submission
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-realtime-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    render(<App />);

    // Submit action and wait for cascade to appear
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'burn village and marry dragon');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
    });

    // Cascade should render with default data initially
    expect(screen.getByRole('generic')).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  test('responsive design works on different screen sizes', async () => {
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 568,
    });

    // Mock successful flow
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-mobile-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockSmallCascade }));
      })
    );

    const { container } = render(<App />);

    // Submit action
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'mobile test action');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    // Cascade should adapt to mobile size
    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
    });

    const cascadeElement = screen.getByRole('generic');
    expect(cascadeElement).toBeInTheDocument();

    // Should still be accessible on mobile
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Reset to desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  test('performance with large cascade datasets', async () => {
    // Mock large cascade data
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-large-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockLargeCascade }));
      })
    );

    render(<App />);

    // Submit action
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'large dataset action');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    // Should render large cascade within reasonable time
    const startTime = performance.now();
    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
    });
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // Should render quickly

    // Should still be accessible
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  test('multiple action submissions', async () => {
    // Track action submissions
    const actionResponses = [
      { id: 'action-1', message: 'Action received!' },
      { id: 'action-2', message: 'Action received!' },
      { id: 'action-3', message: 'Action received!' }
    ];

    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        const response = actionResponses.shift();
        if (response) {
          return res(ctx.json({
            success: true,
            data: { ...response, status: 'received' }
          }));
        }
        return res(ctx.status(500).json({ success: false }));
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockSmallCascade }));
      })
    );

    render(<App />);

    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');

    // Submit multiple actions
    for (let i = 0; i < 3; i++) {
      await userEvent.clear(actionInput);
      await userEvent.type(actionInput, `action ${i + 1}`);
      await userEvent.click(screen.getByText('EXECUTE ACTION'));

      // Wait for confirmation
      await waitFor(() => {
        expect(screen.getByText(/Action received:/)).toBeInTheDocument();
      });

      // Check recent actions
      const recentActionsList = screen.getByText('Recent Actions:').nextElementSibling;
      expect(recentActionsList).toBeInTheDocument();
      expect(recentActionsList.textContent).toContain(`action ${i + 1}`);
    }

    // All actions should be in recent list
    const recentActions = screen.getAllByRole('listitem');
    expect(recentActions).toHaveLength(3);
  });

  test('handles keyboard navigation', async () => {
    // Mock successful flow
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-keyboard-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockSmallCascade }));
      })
    );

    render(<App />);

    // Submit action using keyboard
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'keyboard test action');
    await userEvent.tab(); // Move to submit button
    await userEvent.keyboard('{Enter}');

    // Cascade should appear
    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
    });

    // Close cascade using keyboard (Escape or close button)
    const closeButton = screen.getByLabelText('Close cascade visualization');
    closeButton.focus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('ACTION CASCADE VISUALIZATION')).not.toBeInTheDocument();
    });
  });

  test('maintains accessibility throughout flow', async () => {
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: 'action-accessibility-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockCascadeData }));
      })
    );

    const { container } = render(<App />);

    // Test accessibility at each step
    let results = await axe(container);
    expect(results).toHaveNoViolations();

    // Submit action
    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'accessibility test');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    await waitFor(() => {
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Cascade should be accessible
    await waitFor(() => {
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  test('handles network timeouts gracefully', async () => {
    // Mock slow server response
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.delay(2000), // 2 second delay
          ctx.json({
            success: true,
            data: {
              id: 'action-slow-123',
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    render(<App />);

    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');
    await userEvent.type(actionInput, 'slow network test');
    await userEvent.click(screen.getByText('EXECUTE ACTION'));

    // Should show loading state
    expect(screen.getByText('PROCESSING...')).toBeInTheDocument();

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/Action received:/)).toBeInTheDocument();
    }, 3000);

    // Cascade should appear
    await waitFor(() => {
      expect(screen.getByText('ACTION CASCADE VISUALIZATION')).toBeInTheDocument();
    });
  });

  test('data persistence across multiple submissions', async () => {
    server.use(
      rest.post('/api/actions/submit', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: `action-${Date.now()}`,
              status: 'received',
              message: 'Action received!'
            }
          })
        );
      })
    );

    server.use(
      http.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockSmallCascade }));
      })
    );

    render(<App />);

    const actionInput = screen.getByPlaceholderText('Enter any action you can imagine...');

    // Submit multiple actions
    const actions = ['first action', 'second action', 'third action'];
    for (const action of actions) {
      await userEvent.clear(actionInput);
      await userEvent.type(actionInput, action);
      await userEvent.click(screen.getByText('EXECUTE ACTION'));

      await waitFor(() => {
        expect(screen.getByText(/Action received:/)).toBeInTheDocument();
      });

      // Close cascade visualization
      const closeButton = screen.getByLabelText('Close cascade visualization');
      await userEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByText('ACTION CASCADE VISUALIZATION')).not.toBeInTheDocument();
      });
    }

    // All actions should be in recent actions list
    const recentActions = screen.getAllByRole('listitem');
    expect(recentActions).toHaveLength(3);
  });
});