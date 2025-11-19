import { useState, useEffect, useRef, useCallback } from 'react';
import type { CascadeData } from '../types/cascade';
import { createWebSocketUrl, sanitizeErrorMessage } from '../utils/websocket-utils';

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
  // @ts-ignore - import.meta.env causes issues in Jest test environment
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

  const connectWebSocket = useCallback(() => {
    if (!actionId) {
      console.warn('No actionId provided for WebSocket connection');
      return;
    }

    try {
      // Construct secure WebSocket URL for cascade updates
      const wsUrl = createWebSocketUrl(serverUrl, actionId);
      wsRef.current = new WebSocket(wsUrl);

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
  }, [actionId, serverUrl, onNewData, onError, onConnectionChange]);

  const scheduleReconnect = useCallback(() => {
    let attempts = 0;

    const reconnect = () => {
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached');
        return;
      }

      attempts++;
      console.log(`Attempting reconnection ${attempts}/${MAX_RECONNECT_ATTEMPTS}...`);

      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, RECONNECT_DELAY * attempts); // Exponential backoff
    };

    reconnectTimeoutRef.current = setTimeout(reconnect, RECONNECT_DELAY);
  }, [connectWebSocket, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY]);

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