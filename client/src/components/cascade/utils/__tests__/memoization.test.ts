/**
 * Tests for memoization utilities
 */

import {
  memoizeNodePositions,
  memoizeNodeColors,
  memoizeForceConfig,
  memoizeBoundingBox,
  memoizeCollisionDetection,
  clearMemoCache,
  getMemoCacheStats
} from '../memoization';
import type { CascadeNode } from '../../types/cascade';

describe('Memoization Utilities', () => {
  const mockNodes: CascadeNode[] = [
    { id: 'node1', type: 'action', label: 'Node 1', system: 'combat', impact: 5, delay: 0, duration: 1 },
    { id: 'node2', type: 'consequence', label: 'Node 2', system: 'social', impact: 3, delay: 1, duration: 2 },
    { id: 'node3', type: 'butterfly-effect', label: 'Node 3', system: 'environment', impact: 7, delay: 2, duration: 1 }
  ];

  beforeEach(() => {
    clearMemoCache();
  });

  describe('memoizeNodePositions', () => {
    it('should cache node position calculations', () => {
      const dimensions = { width: 800, height: 600 };

      const positions1 = memoizeNodePositions(mockNodes, dimensions);
      const positions2 = memoizeNodePositions(mockNodes, dimensions);

      expect(positions1).toBe(positions2); // Same reference due to caching
      expect(positions1.size).toBe(3);
      expect(positions1.get('node1')).toBeDefined();
    });

    it('should recalculate for different inputs', () => {
      const dimensions1 = { width: 800, height: 600 };
      const dimensions2 = { width: 1024, height: 768 };

      const positions1 = memoizeNodePositions(mockNodes, dimensions1);
      const positions2 = memoizeNodePositions(mockNodes, dimensions2);

      expect(positions1).not.toBe(positions2); // Different calculations
    });
  });

  describe('memoizeNodeColors', () => {
    it('should cache node color mappings', () => {
      const colors1 = memoizeNodeColors(mockNodes);
      const colors2 = memoizeNodeColors(mockNodes);

      expect(colors1).toBe(colors2); // Same reference due to caching
      expect(colors1.get('node1')).toBe('combat');
      expect(colors1.get('node2')).toBe('social');
    });
  });

  describe('memoizeForceConfig', () => {
    it('should cache force simulation configuration', () => {
      const dimensions = { width: 800, height: 600 };

      const config1 = memoizeForceConfig(dimensions, 3);
      const config2 = memoizeForceConfig(dimensions, 3);

      expect(config1).toBe(config2); // Same reference due to caching
      expect(config1.center.x).toBe(400);
      expect(config1.center.y).toBe(300);
    });

    it('should scale charge strength with node count', () => {
      const dimensions = { width: 800, height: 600 };

      const config1 = memoizeForceConfig(dimensions, 10);
      const config2 = memoizeForceConfig(dimensions, 100);

      expect(Math.abs(config2.chargeStrength)).toBeGreaterThan(Math.abs(config1.chargeStrength));
    });
  });

  describe('memoizeBoundingBox', () => {
    it('should cache bounding box calculations', () => {
      const nodesWithPositions = mockNodes.map((node, i) => ({
        ...node,
        x: i * 100,
        y: i * 50
      }));

      const bbox1 = memoizeBoundingBox(nodesWithPositions);
      const bbox2 = memoizeBoundingBox(nodesWithPositions);

      expect(bbox1).toBe(bbox2); // Same reference due to caching
      expect(bbox1.width).toBe(200); // 200 (max x) - 0 (min x)
      expect(bbox1.height).toBe(100); // 100 (max y) - 0 (min y)
    });

    it('should handle empty node arrays', () => {
      const bbox = memoizeBoundingBox([]);

      expect(bbox.width).toBe(0);
      expect(bbox.height).toBe(0);
    });
  });

  describe('memoizeCollisionDetection', () => {
    it('should cache collision configuration', () => {
      const config1 = memoizeCollisionDetection(mockNodes);
      const config2 = memoizeCollisionDetection(mockNodes);

      expect(config1).toBe(config2); // Same reference due to caching
      expect(typeof config1.radius).toBe('function');
      expect(config1.strength).toBe(0.7);
    });
  });

  describe('Cache Management', () => {
    it('should track cache statistics', () => {
      memoizeNodeColors(mockNodes);
      memoizeForceConfig({ width: 800, height: 600 }, 3);

      const stats = getMemoCacheStats();

      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(2);
      expect(stats.expired).toBe(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      memoizeNodeColors(mockNodes);

      let stats = getMemoCacheStats();
      expect(stats.total).toBe(1);

      clearMemoCache();

      stats = getMemoCacheStats();
      expect(stats.total).toBe(0);
    });
  });
});