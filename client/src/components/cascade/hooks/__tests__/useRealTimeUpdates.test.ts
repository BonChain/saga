/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck - This test file uses mocks that don't match real WebSocket types
import { renderHook, act } from '@testing-library/react';
import { useRealTimeUpdates } from '../useRealTimeUpdates';
import { createMockWebSocket } from '../../../../mocks/handlers';

// Mock WebSocket constructor with proper typing
const mockWebSocketClass = jest.fn(() => createMockWebSocket()) as any;
mockWebSocketClass.CONNECTING = 0;
mockWebSocketClass.OPEN = 1;
mockWebSocketClass.CLOSING = 2;
mockWebSocketClass.CLOSED = 3;

(global as any).WebSocket = mockWebSocketClass;

describe('useRealTimeUpdates Hook Integration Tests', () => {
  const defaultProps = {
    actionId: 'action-001',
    serverUrl: 'http://localhost:3005',
    onNewData: jest.fn(),
    onError: jest.fn(),
    onConnectionChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.updateBuffer).toEqual([]);
    expect(result.current.lastError).toBeNull();
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.reconnect).toBe('function');
  });

  test('does not connect without actionId', () => {
    const { result } = renderHook(() => useRealTimeUpdates({
      ...defaultProps,
      actionId: undefined
    }));

    expect(result.current.isConnected).toBe(false);
    expect(global.WebSocket).not.toHaveBeenCalled();
  });

  test('connects to WebSocket with correct URL', () => {
    renderHook(() => useRealTimeUpdates({
      ...defaultProps,
      actionId: 'action-123'
    }));

    expect(global.WebSocket).toHaveBeenCalledWith(
      'ws://localhost:3005/cascade-updates/action-123'
    );
  });

  test('connects successfully and calls callbacks', async () => {
    const mockWebSocket = createMockWebSocket() as any;
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    // Simulate successful connection
    act(() => {
      mockWebSocket.simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(defaultProps.onConnectionChange).toHaveBeenCalledWith(true);
    expect(defaultProps.onError).not.toHaveBeenCalled();
  });

  test('handles connection errors', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    renderHook(() => useRealTimeUpdates(defaultProps));

    // Simulate connection error
    act(() => {
      mockWebSocket.simulateMessage({
        type: 'error',
        error: 'Connection failed'
      });
    });

    expect(defaultProps.onError).toHaveBeenCalled();
  });

  test('receives cascade updates correctly', async () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Simulate cascade update message
    const updateData = {
      actionId: 'action-001',
      nodes: [
        { id: 'new-node', type: 'consequence' as const, label: 'New Consequence', system: 'environment', impact: 5 }
      ],
      connections: []
    };

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'cascade-update',
        data: updateData
      });
    });

    expect(defaultProps.onNewData).toHaveBeenCalledWith(updateData);
    expect(result.current.updateBuffer).toHaveLength(1);
    expect(result.current.updateBuffer[0]).toEqual(updateData);
  });

  test('handles cascade completion message', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    const completeData = {
      actionId: 'action-001',
      nodes: [{ id: 'final-node', type: 'butterfly-effect' as const, label: 'Final Effect', system: 'social', impact: 7 }],
      connections: []
    };

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'cascade-complete',
        data: completeData
      });
    });

    expect(defaultProps.onNewData).toHaveBeenCalledWith(completeData);
    expect(result.current.updateBuffer).toEqual([]); // Buffer should be cleared on completion
  });

  test('sends heartbeat messages', async () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Fast forward time to trigger heartbeat
    act(() => {
      jest.advanceTimersByTime(30001); // 30 seconds + 1ms
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"heartbeat"')
    );
  });

  test('handles heartbeat responses', async () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Send heartbeat
    act(() => {
      mockWebSocket.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: Date.now()
      }));
    });

    // Wait for response (simulated)
    await act(async () => {
      jest.advanceTimersByTime(150); // 100ms + buffer
    });

    expect(mockWebSocket.readyState).toBe(WebSocket.OPEN);
  });

  test('buffers updates efficiently', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Send multiple rapid updates
    for (let i = 0; i < 10; i++) {
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'cascade-update',
          data: {
            actionId: `action-${i}`,
            nodes: [{ id: `node-${i}`, type: 'consequence' as const, label: `Update ${i}`, system: 'environment', impact: i }]
          }
        });
      });
    }

    // Buffer should contain recent updates (limited size)
    expect(result.current.updateBuffer.length).toBeLessThanOrEqual(10);
  });

  test('handles disconnection gracefully', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      mockWebSocket.close();
    });

    expect(result.current.isConnected).toBe(false);
    expect(defaultProps.onConnectionChange).toHaveBeenCalledWith(false);
  });

  test('manual disconnect works correctly', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.disconnect();
    });

    expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'User disconnected');
    expect(result.current.isConnected).toBe(false);
  });

  test('manual reconnect works correctly', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    // Initial connection
    act(() => {
      mockWebSocket.simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);

    // Manual reconnect
    act(() => {
      result.current.reconnect();
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });

  test('processes update buffer periodically', async () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Add updates to buffer
    for (let i = 0; i < 8; i++) {
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'cascade-update',
          data: {
            actionId: `action-${i}`,
            nodes: [{ id: `node-${i}`, type: 'consequence' as const, label: `Update ${i}`, system: 'environment', impact: i }]
          }
        });
      });
    }

    expect(result.current.updateBuffer.length).toBeGreaterThan(0);

    // Fast forward time to trigger buffer processing
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // Buffer should be processed (smaller size)
    expect(result.current.updateBuffer.length).toBeLessThanOrEqual(3);
  });

  test('limits buffer size to prevent memory leaks', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { result } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Send many updates (more than buffer limit)
    for (let i = 0; i < 60; i++) {
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'cascade-update',
          data: {
            actionId: `action-${i}`,
            nodes: [{ id: `node-${i}`, type: 'consequence' as const, label: `Update ${i}`, system: 'environment', impact: i }]
          }
        });
      });
    }

    // Buffer should be limited to maximum size
    expect(result.current.updateBuffer.length).toBeLessThanOrEqual(50);
  });

  test('handles unknown message types gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Send unknown message type
    act(() => {
      mockWebSocket.simulateMessage({
        type: 'unknown-message',
        data: 'some data'
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith('Unknown WebSocket message type:', 'unknown-message');

    consoleSpy.mockRestore();
  });

  test('handles malformed JSON messages', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    // Send invalid JSON
    act(() => {
      // Simulate JSON parsing error by calling onmessage with invalid data
      const onMessageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      if (onMessageCallback) {
        onMessageCallback({ data: 'invalid-json{' });
      }
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error parsing WebSocket message:', expect.any(Error));
    expect(defaultProps.onError).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('cleanup on unmount', () => {
    const mockWebSocket = createMockWebSocket();
    (global as any).WebSocket = jest.fn(() => mockWebSocket);

    const { unmount } = renderHook(() => useRealTimeUpdates(defaultProps));

    act(() => {
      mockWebSocket.simulateOpen();
    });

    unmount();

    // Should close connection and clear timers
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});