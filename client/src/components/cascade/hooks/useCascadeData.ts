import { useState, useEffect, useCallback } from 'react';
import type { CascadeData } from '../types/cascade';
import { DEFAULT_CASCADE_DATA } from '../types/cascade';
import { useRealTimeUpdates } from './useRealTimeUpdates';

interface UseCascadeDataOptions {
  actionId?: string;
  serverUrl?: string;
  autoFetch?: boolean;
  enableRealTime?: boolean;
}

/**
 * Hook for fetching and managing cascade data
 * Combines initial data fetching with real-time WebSocket updates
 */
export const useCascadeData = ({
  actionId,
  serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3005',
  autoFetch = true,
  enableRealTime = true
}: UseCascadeDataOptions = {}) => {
  const [data, setData] = useState<CascadeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial cascade data
  const fetchCascadeData = useCallback(async (fetchActionId: string) => {
    if (!fetchActionId) {
      console.warn('No actionId provided for cascade data fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/api/cascades/${fetchActionId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const cascadeData = await response.json();
      setData(cascadeData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch cascade data:', errorMessage);
      setError(errorMessage);

      // For development/demo purposes, use default data if fetch fails
      if (import.meta.env.DEV) {
        console.log('Using default cascade data for development');
        setData({
          ...DEFAULT_CASCADE_DATA,
          actionId: fetchActionId,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((newData: CascadeData) => {
    console.log('Received real-time cascade update:', newData.actionId);
    setData(newData);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleRealTimeError = useCallback((err: Error) => {
    console.error('Real-time cascade update error:', err);
    setError(err.message);
  }, []);

  const handleConnectionChange = useCallback((isConnected: boolean) => {
    console.log('Cascade WebSocket connection:', isConnected ? 'connected' : 'disconnected');
    if (!isConnected && !data && autoFetch && actionId) {
      // Fall back to polling if WebSocket fails
      console.log('WebSocket disconnected, falling back to polling');
      setTimeout(() => fetchCascadeData(actionId), 1000);
    }
  }, [data, autoFetch, actionId, fetchCascadeData]);

  // Real-time updates hook
  const {
    isConnected: realTimeConnected,
    updateBuffer,
    lastError: realTimeError,
    disconnect,
    reconnect
  } = useRealTimeUpdates({
    actionId: enableRealTime ? actionId : undefined,
    serverUrl,
    onNewData: handleRealTimeUpdate,
    onError: handleRealTimeError,
    onConnectionChange: handleConnectionChange
  });

  // Initial fetch when actionId changes
  useEffect(() => {
    if (autoFetch && actionId) {
      fetchCascadeData(actionId);
    } else if (!actionId) {
      // Use default data when no actionId provided
      setData(DEFAULT_CASCADE_DATA);
      setIsLoading(false);
    }
  }, [actionId, autoFetch, fetchCascadeData]);

  // Refresh data manually
  const refresh = useCallback(() => {
    if (actionId) {
      fetchCascadeData(actionId);
    }
  }, [actionId, fetchCascadeData]);

  // Reset to default data
  const reset = useCallback(() => {
    setData(DEFAULT_CASCADE_DATA);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    isConnected: realTimeConnected,
    updateBuffer,
    refresh,
    reset,
    disconnect,
    reconnect,
    lastError: realTimeError
  };
};