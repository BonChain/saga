import { useState, useEffect, useRef, useCallback } from 'react';
import type { CascadeData } from '../types/cascade';
import { createWebSocketUrl, sanitizeErrorMessage } from '../utils/websocket-utils';
import { getCascadeConfig } from '../config/cascade-config';

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
  serverUrl = (import.meta.env?.VITE_SERVER_URL as string) || 'http://localhost:3005',
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

  // Get configuration values
  const config = getCascadeConfig().websocket;
  const MAX_RECONNECT_ATTEMPTS = config.maxReconnectAttempts;
  const RECONNECT_DELAY = config.reconnectDelay;
  const HEARTBEAT_INTERVAL = config.heartbeatInterval;
  const BUFFER_SIZE = config.bufferSize;

  const connectWebSocket = useCallback((): WebSocket | null => {
    if (!actionId) {
      console.warn('No actionId provided for WebSocket connection');
      return null;
    }

    try {
<<<<<<< HEAD
      // Construct WebSocket URL for cascade updates
      const wsUrl = serverUrl.replace(/^http/, 'ws') + `/cascade-updates/${actionId}`;

      wsRef.current = new WebSocket(wsUrl) as WebSocket;
=======
      // Construct secure WebSocket URL for cascade updates
      const wsUrl = createWebSocketUrl(serverUrl, actionId);
      wsRef.current = new WebSocket(wsUrl);
>>>>>>> b2f71a199ce6b4dbb6824f9fc0cb2e92f273d2f2

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
              const error = new Error(sanitizeErrorMessage(message.error || 'Unknown WebSocket error'));
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
          const sanitizedError = new Error(sanitizeErrorMessage(error as Error));
          setLastError(sanitizedError);
          onError?.(sanitizedError);
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
        const error = new Error(sanitizeErrorMessage('WebSocket connection error'));
        setLastError(error);
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      const sanitizedError = new Error(sanitizeErrorMessage(error as Error));
      setLastError(sanitizedError);
      onError?.(sanitizedError);
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
<<<<<<< HEAD
  }, [actionId, serverUrl, onError, onConnectionChange]);
=======
  }, [connectWebSocket, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY]);
>>>>>>> b2f71a199ce6b4dbb6824f9fc0cb2e92f273d2f2

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