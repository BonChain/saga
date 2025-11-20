/**
 * Memoization utilities for D3 calculations in cascade visualization
 * Optimizes expensive calculations to improve performance
 */

import type { CascadeNode, CascadeConnection } from '../types/cascade';
import { getCascadeConfig } from '../config/cascade-config';

// Cache for computed values
const memoCache = new Map<string, { value: unknown; timestamp: number }>();

/**
 * Generic memoization function with TTL
 */
function memoize<T>(
  key: string,
  compute: () => T,
  ttl?: number
): T {
  const config = getCascadeConfig();
  const cacheTtl = ttl || config.memoization.cacheExpiry;
  const maxCacheSize = config.memoization.maxCacheSize;
  const cleanupThreshold = config.memoization.cleanupThreshold;

  const cached = memoCache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < cacheTtl) {
    return cached.value as T;
  }

  const value = compute();
  memoCache.set(key, { value, timestamp: now });

  // Clean up expired cache entries periodically
  if (memoCache.size > cleanupThreshold) {
    for (const [cacheKey, entry] of memoCache.entries()) {
      if (now - entry.timestamp > cacheTtl) {
        memoCache.delete(cacheKey);
      }
    }
  }

  // Prevent cache from growing too large
  if (memoCache.size > maxCacheSize) {
    const entries = Array.from(memoCache.entries());
    // Remove oldest entries
    entries.slice(0, memoCache.size - maxCacheSize).forEach(([cacheKey]) => {
      memoCache.delete(cacheKey);
    });
  }

  return value;
}

/**
 * Memoized calculation for node positions
 */
export const memoizeNodePositions = (nodes: CascadeNode[], dimensions: { width: number; height: number }) => {
  const key = `node-positions-${nodes.length}-${dimensions.width}x${dimensions.height}`;

  return memoize(key, () => {
    // Calculate initial positions based on system clustering
    const positions = new Map<string, { x: number; y: number }>();
    const systemGroups = new Map<string, CascadeNode[]>();

    // Group nodes by system
    nodes.forEach(node => {
      if (!systemGroups.has(node.system)) {
        systemGroups.set(node.system, []);
      }
      systemGroups.get(node.system)!.push(node);
    });

    // Position system clusters in a grid
    const systems = Array.from(systemGroups.keys());
    const cols = Math.ceil(Math.sqrt(systems.length));
    const cellWidth = dimensions.width / cols;
    const cellHeight = dimensions.height / Math.ceil(systems.length / cols);

    systems.forEach((system, index) => {
      const systemNodes = systemGroups.get(system)!;
      const col = index % cols;
      const row = Math.floor(index / cols);

      // Position nodes within system cluster
      systemNodes.forEach((node, nodeIndex) => {
        const angle = (nodeIndex / systemNodes.length) * 2 * Math.PI;
        const radius = Math.min(cellWidth, cellHeight) * 0.3;

        positions.set(node.id, {
          x: col * cellWidth + cellWidth / 2 + Math.cos(angle) * radius,
          y: row * cellHeight + cellHeight / 2 + Math.sin(angle) * radius
        });
      });
    });

    return positions;
  });
};

/**
 * Memoized calculation for node colors
 */
export const memoizeNodeColors = (nodes: CascadeNode[]) => {
  const key = `node-colors-${nodes.map(n => `${n.id}-${n.system}`).join('|')}`;

  return memoize(key, () => {
    const colors = new Map<string, string>();

    nodes.forEach(node => {
      colors.set(node.id, node.system);
    });

    return colors;
  });
};

/**
 * Memoized calculation for connection paths
 */
export const memoizeConnectionPaths = (connections: CascadeConnection[]) => {
  const key = `connection-paths-${connections.length}-${connections.map(c => `${c.source}-${c.target}-${c.type}`).join('|')}`;

  return memoize(key, () => {
    const paths = new Map<string, string>();

    connections.forEach(conn => {
      const pathKey = `${conn.source}-${conn.target}`;
      const curvature = conn.type === 'cascading' ? 0.3 : 0.1;
      paths.set(pathKey, `M${conn.source},${conn.target}Q${curvature}0,0`);
    });

    return paths;
  });
};

/**
 * Memoized force simulation configuration
 */
export const memoizeForceConfig = (dimensions: { width: number; height: number }, nodeCount: number) => {
  const key = `force-config-${dimensions.width}x${dimensions.height}-${nodeCount}`;

  return memoize(key, () => {
    return {
      center: { x: dimensions.width / 2, y: dimensions.height / 2 },
      chargeStrength: -Math.min(300, -50 * nodeCount), // Scale with node count
      linkDistance: Math.min(100, 1000 / Math.max(nodeCount, 1)),
      collisionRadius: 20,
      velocityDecay: 0.4,
      alphaDecay: 0.0228,
      alphaMin: 0.001
    };
  });
};

/**
 * Memoized bounding box calculation
 */
export const memoizeBoundingBox = (nodes: CascadeNode[]) => {
  const key = `bounding-box-${nodes.map(n => `${n.id}-${n.x || 0}-${n.y || 0}`).join('|')}`;

  return memoize(key, () => {
    if (nodes.length === 0) {
      return { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const xValues = nodes.map(n => n.x || 0).filter(x => !isNaN(x));
    const yValues = nodes.map(n => n.y || 0).filter(y => !isNaN(y));

    if (xValues.length === 0 || yValues.length === 0) {
      return { width: 800, height: 600, minX: 0, maxX: 800, minY: 0, maxY: 600 };
    }

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      maxX,
      minY,
      maxY
    };
  });
};

/**
 * Memoized collision detection configuration
 */
export const memoizeCollisionDetection = (nodes: CascadeNode[]) => {
  const key = `collision-${nodes.length}`;

  return memoize(key, () => {
    return {
      radius: (d: CascadeNode) => {
        const baseRadius = 8;
        return baseRadius + (d.impact || 0) * 2 + 10; // Include padding
      },
      strength: 0.7
    };
  });
};

/**
 * Clear memoization cache (useful for memory management)
 */
export const clearMemoCache = () => {
  memoCache.clear();
};

/**
 * Get cache statistics for debugging
 */
export const getMemoCacheStats = () => {
  const config = getCascadeConfig();
  const now = Date.now();
  let expiredCount = 0;
  let validCount = 0;

  for (const [, entry] of memoCache.entries()) {
    if (now - entry.timestamp > config.memoization.cacheExpiry) {
      expiredCount++;
    } else {
      validCount++;
    }
  }

  return {
    total: memoCache.size,
    valid: validCount,
    expired: expiredCount,
    maxCacheSize: config.memoization.maxCacheSize,
    cacheExpiry: config.memoization.cacheExpiry,
    memoryUsage: JSON.stringify([...memoCache.entries()]).length // Approximate
  };
};