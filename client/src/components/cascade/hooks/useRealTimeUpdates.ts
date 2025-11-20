import { useState, useEffect, useRef, useCallback } from 'react';
import type { CascadeData } from '../types/cascade';

interface UseRealTimeUpdatesOptions {
  actionId?: string;
  serverUrl?: string;
  onNewData?: (data: CascadeData) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Hook for managing real-time WebSocket connections for cascade updates
 * Handles connection lifecycle, data buffering, and smooth performance
 */
export const useRealTimeUpdates = ({
  actionId,
  serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3005',
  onNewData,
  onError,
  onConnectionChange
}: UseRealTimeUpdatesOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [updateBuffer, setUpdateBuffer] = useState<Partial<CascadeData>[]>([]);
  const [lastError, setLastError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 seconds
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const BUFFER_SIZE = 50; // Maximum buffered updates

  const connectWebSocket = useCallback((): WebSocket | null => {
    if (!actionId) {
      console.warn('No actionId provided for WebSocket connection');
      return null;
    }

    try {
      // Construct WebSocket URL for cascade updates
      const wsUrl = serverUrl.replace(/^http/, 'ws') + `/cascade-updates/${actionId}`;

      wsRef.current = new WebSocket(wsUrl) as WebSocket;

      wsRef.current.onopen = () => {
        console.log('Cascade WebSocket connected');
        setIsConnected(true);
        setLastError(null);
        onConnectionChange?.(true);

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          }
        }, HEARTBEAT_INTERVAL);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'cascade-update':
              // Buffer the update for smooth processing
              setUpdateBuffer(prev => {
                const newBuffer = [...prev, message.data];
                // Limit buffer size to prevent memory issues
                return newBuffer.slice(-BUFFER_SIZE);
              });

              // Notify parent component immediately
              onNewData?.(message.data as CascadeData);
              break;

            case 'cascade-complete':
              // Final cascade data with all effects
              onNewData?.(message.data as CascadeData);
              setUpdateBuffer([]);
              break;

            case 'error': {
              const error = new Error(message.error || 'Unknown WebSocket error');
              setLastError(error);
              onError?.(error);
              break;
            }

            case 'heartbeat':
              // Echo response for connection health
              break;

            default:
              console.warn('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setLastError(error as Error);
          onError?.(error as Error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Cascade WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        onConnectionChange?.(false);

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection if not intentional
        if (event.code !== 1000 && !wsRef.current?.CLOSED) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('Cascade WebSocket error:', event);
        const error = new Error('WebSocket connection error');
        setLastError(error);
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setLastError(error as Error);
      onError?.(error as Error);
    }

    return wsRef.current;
  }, [actionId, serverUrl, onError, onConnectionChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    let attempts = 0;

    const reconnect = () => {
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached');
        return;
      }

      try {
        if (wsRef.current) {
          wsRef.current.close();
        }

        // Create new WebSocket connection directly
        const wsUrl = serverUrl.replace(/^http/, 'ws') + `/cascade-updates/${actionId}`;
        wsRef.current = new WebSocket(wsUrl) as WebSocket;

        wsRef.current.onopen = () => {
          console.log('Cascade WebSocket reconnected');
          setIsConnected(true);
          onConnectionChange?.(true);
        };

        wsRef.current.onclose = () => {
          console.log('Cascade WebSocket disconnected');
          setIsConnected(false);
          onConnectionChange?.(false);
        };

        wsRef.current.onerror = (error) => {
          console.error('Cascade WebSocket error:', error);
          const errorMessage = error instanceof Event ? 'WebSocket connection error' : 'Unknown WebSocket error';
          setLastError(new Error(errorMessage));
          onError?.(new Error(errorMessage));
        };
      } catch (error) {
        console.error('Failed to reconnect:', error);
        const errorMessage = error instanceof Error ? error.message : 'Reconnection failed';
        setLastError(new Error(errorMessage));
        onError?.(new Error(errorMessage));
      }

      attempts++;
      console.log(`Attempting reconnection ${attempts}/${MAX_RECONNECT_ATTEMPTS}...`);
    };

    reconnectTimeoutRef.current = setTimeout(reconnect, RECONNECT_DELAY);
  }, [actionId, serverUrl, onError, onConnectionChange]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  // Initial connection when actionId changes
  useEffect(() => {
    if (actionId) {
      disconnect(); // Clean up any existing connection
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [actionId, connectWebSocket, disconnect]);

  // Process update buffer periodically for smooth performance
  useEffect(() => {
    if (updateBuffer.length === 0) return;

    const interval = setInterval(() => {
      setUpdateBuffer(prev => {
        // Process updates in batches
        const processed = prev.slice(0, Math.min(5, prev.length));
        return prev.slice(processed.length);
      });
    }, 100); // Process every 100ms for smooth 60fps

    return () => clearInterval(interval);
  }, [updateBuffer.length]);

  return {
    isConnected,
    updateBuffer: updateBuffer.slice(-10), // Return last 10 updates for debugging
    lastError,
    disconnect,
    reconnect: () => connectWebSocket()
  };
};