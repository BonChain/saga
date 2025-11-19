import { renderHook, act, waitFor } from '@testing-library/react';
import { useCascadeData } from '../useCascadeData';
import { server } from '../../../mocks/server';
import { rest } from 'msw';
import { mockCascadeData, mockLargeCascade, mockErrorResponse } from '../../../mocks/handlers';

describe('useCascadeData Hook Integration Tests', () => {
  const defaultProps = {
    actionId: 'action-001',
    autoFetch: true,
    enableRealTime: false
  };

  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  test('fetches cascade data successfully', async () => {
    const { result } = renderHook(() => useCascadeData(defaultProps));

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    // Verify data structure
    expect(result.current.data?.actionId).toBe('action-001');
    expect(result.current.data?.nodes).toHaveLength(5);
    expect(result.current.data?.connections).toHaveLength(4);
  });

  test('handles fetch errors gracefully', async () => {
    // Override server to return error
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, error: 'Internal server error' })
        );
      })
    );

    const { result } = renderHook(() => useCascadeData(defaultProps));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
      // Should fall back to default data in development mode
      expect(result.current.data).toBeTruthy();
    });
  });

  test('handles 404 errors', async () => {
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(
          ctx.status(404),
          ctx.json({ success: false, error: 'Action not found' })
        );
      })
    );

    const { result } = renderHook(() => useCascadeData(defaultProps));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain('Action not found');
  });

  test('handles network timeout', async () => {
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(
          ctx.delay(10000), // 10 second delay
          ctx.json({ success: true, data: mockCascadeData })
        );
      })
    );

    const { result } = renderHook(() => useCascadeData(defaultProps));

    // Should show loading state for extended period
    expect(result.current.isLoading).toBe(true);
  });

  test('manually refresh data', async () => {
    const { result } = renderHook(() => useCascadeData(defaultProps));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
    });

    // Clear the data and refresh
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);

    // Refresh data
    act(() => {
      result.current.refresh();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
    });
  });

  test('resets data correctly', () => {
    const { result } = renderHook(() => useCascadeData({
      ...defaultProps,
      autoFetch: false // Don't auto-fetch for this test
    }));

    // Set some error state
    act(() => {
      // Simulate error by calling refresh with invalid actionId
      result.current.refresh();
    });

    // Reset should clear error and data
    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockCascadeData); // Default data
  });

  test('does not auto-fetch when disabled', () => {
    const { result } = renderHook(() => useCascadeData({
      ...defaultProps,
      autoFetch: false
    }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(mockCascadeData); // Default data
  });

  test('fetches different action IDs correctly', async () => {
    const { result, rerender } = renderHook(
      ({ actionId }) => useCascadeData({ ...defaultProps, actionId }),
      { initialProps: { actionId: 'action-001' } }
    );

    await waitFor(() => {
      expect(result.current.data).toBeTruthy();
    });

    // Change action ID
    rerender({ actionId: 'action-002' });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
    });
  });

  test('handles server errors with fallback to default data', async () => {
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json(mockErrorResponse)
        );
      })
    );

    const { result } = renderHook(() => useCascadeData(defaultProps));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      // Should still have data due to fallback in development mode
      expect(result.current.data).toBeTruthy();
    });
  });

  test('validates cascade data structure', async () => {
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              // Invalid data structure
              actionId: 'invalid-data',
              nodes: 'not-an-array',
              connections: null
            }
          })
        );
      })
    );

    const { result } = renderHook(() => useCascadeData(defaultProps));

    // Should handle malformed data gracefully
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should fall back to default data
    expect(result.current.data).toEqual(mockCascadeData);
  });

  test('handles large cascade data efficiently', async () => {
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockLargeCascade }));
      })
    );

    const startTime = performance.now();
    const { result } = renderHook(() => useCascadeData({
      ...defaultProps,
      actionId: 'large-test'
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
    });
    const endTime = performance.now();

    // Should process large data within reasonable time
    expect(endTime - startTime).toBeLessThan(200);
    expect(result.current.data?.nodes).toHaveLength(20);
    expect(result.current.data?.connections).toHaveLength(25);
  });

  test('handles concurrent fetch requests', async () => {
    const { result } = renderHook(() => useCascadeData(defaultProps));

    // Trigger multiple rapid refresh calls
    act(() => {
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
    });

    // Should only have one final state, not multiple conflicting states
    expect(result.current.data).toBeDefined();
  });

  test('memoization and performance optimization', async () => {
    const { result, rerender } = renderHook(() => useCascadeData(defaultProps));

    await waitFor(() => {
      expect(result.current.data).toBeTruthy();
    });

    const dataRef = result.current.data;

    // Re-render with same props
    rerender(defaultProps);

    // Data reference should be stable (no unnecessary re-fetches)
    expect(result.current.data).toBe(dataRef);
  });

  test('error recovery with retry', async () => {
    let callCount = 0;
    server.use(
      rest.get('/api/cascades/:actionId', (req, res, ctx) => {
        callCount++;
        if (callCount === 1) {
          return res(
            ctx.status(500),
            ctx.json({ success: false, error: 'Temporary error' })
          );
        }
        return res(ctx.json({ success: true, data: mockCascadeData }));
      })
    );

    const { result } = renderHook(() => useCascadeData(defaultProps));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Retry should succeed
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeTruthy();
    });
  });
});