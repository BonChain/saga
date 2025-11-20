/**
 * Configuration options for cascade visualization performance and behavior
 * Allows customization of cache sizes, budgets, and thresholds
 */

export interface CascadeConfig {
  // Memoization cache settings
  memoization: {
    maxCacheSize: number;        // Maximum entries in memoization cache
    cacheExpiry: number;         // Cache TTL in milliseconds
    cleanupThreshold: number;    // When to trigger cache cleanup
  };

  // Performance budgets (can override device-specific defaults)
  performance?: {
    maxNodes?: number;
    maxConnections?: number;
    maxRenderTime?: number;
    maxMemoryUsage?: number;
    minFPS?: number;
  };

  // Virtualization settings
  virtualization: {
    nodeLimit: number;           // Nodes threshold for enabling virtualization
    detailLevels: Array<{
      zoom: number;
      nodeLimit: number;
      detailLevel: 'low' | 'medium' | 'high' | 'very-high';
    }>;
  };

  // WebSocket settings
  websocket: {
    bufferSize: number;          // Maximum buffered updates
    reconnectDelay: number;      // Base reconnection delay in ms
    maxReconnectAttempts: number; // Maximum reconnection attempts
    heartbeatInterval: number;    // Heartbeat interval in ms
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CASCADE_CONFIG: CascadeConfig = {
  memoization: {
    maxCacheSize: 1000,          // Previously hardcoded value
    cacheExpiry: 60000,          // 1 minute
    cleanupThreshold: 1000       // Trigger cleanup at this size
  },

  virtualization: {
    nodeLimit: 500,              // Enable virtualization for 500+ nodes
    detailLevels: [
      { zoom: 0.5, nodeLimit: 100, detailLevel: 'low' },
      { zoom: 1.0, nodeLimit: 300, detailLevel: 'medium' },
      { zoom: 1.5, nodeLimit: 500, detailLevel: 'high' },
      { zoom: 2.0, nodeLimit: 1000, detailLevel: 'very-high' }
    ]
  },

  websocket: {
    bufferSize: 50,              // Previously BUFFER_SIZE
    reconnectDelay: 2000,        // 2 seconds
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000     // 30 seconds
  }
};

/**
 * Global configuration instance - can be modified at runtime
 */
let currentConfig: CascadeConfig = { ...DEFAULT_CASCADE_CONFIG };

/**
 * Get current cascade configuration
 */
export const getCascadeConfig = (): CascadeConfig => {
  return { ...currentConfig };
};

/**
 * Update cascade configuration
 */
export const updateCascadeConfig = (updates: Partial<CascadeConfig>): void => {
  currentConfig = {
    ...currentConfig,
    ...updates,
    memoization: {
      ...currentConfig.memoization,
      ...(updates.memoization || {})
    },
    virtualization: {
      ...currentConfig.virtualization,
      ...(updates.virtualization || {})
    },
    websocket: {
      ...currentConfig.websocket,
      ...(updates.websocket || {})
    }
  };
};

/**
 * Reset configuration to defaults
 */
export const resetCascadeConfig = (): void => {
  currentConfig = { ...DEFAULT_CASCADE_CONFIG };
};

/**
 * Environment-specific configuration overrides
 */
export const applyEnvironmentConfig = (): void => {
  const overrides: Partial<CascadeConfig> = {};

  // Development environment - more lenient limits
  if (import.meta.env?.DEV as boolean) {
    overrides.memoization = {
      maxCacheSize: 2000,        // Larger cache for development
      cacheExpiry: 120000,       // 2 minutes
      cleanupThreshold: 2000
    };
  }

  // Production environment - stricter limits
  if (import.meta.env?.PROD as boolean) {
    overrides.memoization = {
      maxCacheSize: 500,         // Smaller cache for production
      cacheExpiry: 30000,        // 30 seconds
      cleanupThreshold: 500
    };

    overrides.websocket = {
      bufferSize: 25,            // Smaller buffer in production
      reconnectDelay: 1000,      // Faster reconnection
      maxReconnectAttempts: 3,
      heartbeatInterval: 15000   // More frequent heartbeats
    };
  }

  if (Object.keys(overrides).length > 0) {
    updateCascadeConfig(overrides);
  }
};