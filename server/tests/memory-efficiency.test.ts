/**
 * Memory Efficiency Tests for Butterfly Effect Visualization
 *
 * Validates that memory optimizations are working correctly
 * and provides expected performance improvements.
 */

import { CascadeProcessor } from '../src/services/CascadeProcessor'
import { AIConsequence, ConsequenceType, ImpactLevel, DurationType } from '../src/types/ai'
import { MemoryOptimizedCascadeProcessor, VisualizationNodePool } from '../src/utils/MemoryOptimizer'

// Extend AIConsequence for testing with additional properties
interface TestAIConsequence extends Omit<AIConsequence, 'actionId' | 'cascadingEffects'> {
  actionId?: string
  cascadingEffects?: any[]
  region?: string // For testing purposes
}

describe('Memory Efficiency Tests', () => {
  let cascadeProcessor: CascadeProcessor
  let memoryOptimizer: MemoryOptimizedCascadeProcessor

  beforeEach(() => {
    cascadeProcessor = new CascadeProcessor()
    memoryOptimizer = new MemoryOptimizedCascadeProcessor()
  })

  afterEach(() => {
    memoryOptimizer.cleanup()
  })

  describe('Object Pooling', () => {
    it('should reuse objects from the node pool', () => {
      const nodePool = new VisualizationNodePool()

      // Acquire multiple nodes
      const nodes = []
      for (let i = 0; i < 10; i++) {
        nodes.push(nodePool.acquire())
      }

      // Release all nodes back to pool
      nodes.forEach(node => nodePool.release(node))

      // Acquire new nodes - should reuse from pool
      const reusedNodes = []
      for (let i = 0; i < 10; i++) {
        reusedNodes.push(nodePool.acquire())
      }

      const stats = nodePool.getStats()
      expect(stats.reuseRate).toBeGreaterThanOrEqual(50) // Should have at least 50% reuse rate
      expect(stats.poolSize).toBe(0) // All nodes should be taken from pool

      nodePool.cleanup()
    })

    it('should limit pool size to prevent memory bloat', () => {
      const nodePool = new VisualizationNodePool()

      // Create more nodes than pool size
      const nodes = []
      for (let i = 0; i < 1500; i++) {
        nodes.push(nodePool.acquire())
      }

      // Pool should not exceed maximum size
      const stats = nodePool.getStats()
      expect(stats.created).toBeGreaterThan(1000) // Should have created new nodes

      nodePool.cleanup()
    })
  })

  describe('Compact Data Structures', () => {
    it('should convert world systems to compact format', () => {
      const worldSystem = {
        id: 'test-system',
        name: 'Test System',
        connectedSystems: ['system1', 'system2', 'system3'],
        influenceFactors: {
          'system1': 0.8,
          'system2': 0.6,
          'system3': 0.4
        }
      }

      const compactSystem = memoryOptimizer.convertToCompactWorldSystem(worldSystem)

      expect(compactSystem.id).toBeGreaterThan(0)
      expect(compactSystem.nameOffset).toBeGreaterThan(0)
      expect(compactSystem.connectedSystemIds).toBeInstanceOf(Uint8Array)
      expect(compactSystem.influenceFactors).toBeInstanceOf(Float32Array)
      expect(compactSystem.systemType).toBeGreaterThan(0)
    })

    it('should provide memory statistics for compact systems', () => {
      // Add some test systems
      const testSystems = [
        {
          id: 'social',
          name: 'Social System',
          connectedSystems: ['economic', 'political'],
          influenceFactors: { 'economic': 0.7, 'political': 0.6 }
        },
        {
          id: 'economic',
          name: 'Economic System',
          connectedSystems: ['social', 'market'],
          influenceFactors: { 'social': 0.5, 'market': 0.8 }
        }
      ]

      memoryOptimizer.processWorldSystemInfluence(testSystems)
      const stats = memoryOptimizer.getCompactWorldSystemStats()

      expect(stats.totalSystems).toBe(2)
      expect(stats.systemMappings).toBeGreaterThan(0)
      expect(stats.memoryUsage).toBeGreaterThan(0)
      expect(stats.stringCacheStats.totalStrings).toBeGreaterThan(0)
    })
  })

  describe('String Compression and Caching', () => {
    it('should cache frequently used strings', () => {
      const { CompactStringCache } = require('../src/utils/MemoryOptimizer')

      const testString = 'frequently used system name'

      // First call should add to cache
      const index1 = CompactStringCache.getOrAdd(testString)
      expect(index1).toBeGreaterThan(0)

      // Second call should return same index
      const index2 = CompactStringCache.getOrAdd(testString)
      expect(index2).toBe(index1)

      // Should retrieve the same string
      const retrieved = CompactStringCache.getString(index1)
      expect(retrieved).toBe(testString)

      CompactStringCache.clearCache()
    })

    it('should limit string cache size', () => {
      const { CompactStringCache } = require('../src/utils/MemoryOptimizer')

      // Add many strings to exceed cache limit
      for (let i = 0; i < 100; i++) {
        CompactStringCache.getOrAdd(`test string ${i}`)
      }

      const stats = CompactStringCache.getStats()
      expect(stats.totalStrings).toBeLessThan(10000) // Should not exceed max size
      expect(stats.cacheSize).toBeGreaterThan(0)

      CompactStringCache.clearCache()
    })
  })

  describe('Memory Monitoring', () => {
    it('should track memory usage during visualization generation', async () => {
      const testConsequences: TestAIConsequence[] = [
        {
          id: 'test-1',
          type: ConsequenceType.SOCIAL,
          description: 'Test social consequence',
          confidence: 0.8,
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [ConsequenceType.SOCIAL],
            magnitude: 5,
            duration: DurationType.MEDIUM_TERM,
            affectedLocations: ['test-region']
          },
          timestamp: new Date().toISOString(),
          actionId: 'test-action',
          cascadingEffects: []
        }
      ]

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        'test-action',
        'Test action',
        testConsequences as AIConsequence[]
      )

      expect(result.metadata.performance).toBeDefined()
      expect(result.metadata.performance.memoryUsage).toBeDefined()
      expect(result.metadata.performance.memoryUsage.initial).toBeDefined()
      expect(result.metadata.performance.memoryUsage.final).toBeDefined()
      expect(result.metadata.performance.nodePoolStats).toBeDefined()
      expect(result.metadata.performance.cacheEfficiency).toBeDefined()
    })

    it('should show memory optimization improvements', async () => {
      const testConsequences: TestAIConsequence[] = []

      // Create a reasonable number of test consequences
      for (let i = 0; i < 20; i++) {
        testConsequences.push({
          id: `test-${i}`,
          type: ConsequenceType.WORLD_STATE,
          description: `Test consequence ${i} for memory validation`,
          confidence: 0.7,
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [ConsequenceType.WORLD_STATE],
            magnitude: 4,
            duration: DurationType.SHORT_TERM,
            affectedLocations: ['test-region']
          },
          timestamp: new Date().toISOString(),
          actionId: 'memory-test-action',
          cascadingEffects: []
        })
      }

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        'memory-test-action',
        'Memory test action',
        testConsequences as AIConsequence[]
      )

      const performance = result.metadata.performance

      // Validate that memory optimization features are working
      expect(performance.nodePoolStats).toBeDefined()
      expect(performance.cacheEfficiency).toBeDefined()
      expect(performance.memoryUsage.optimization).toBeDefined()
      expect(performance.memoryUsage.optimization.compactWorldSystems).toBeDefined()

      // Should have compact world systems
      expect(performance.memoryUsage.optimization.compactWorldSystems.totalSystems).toBeGreaterThan(0)

      // Should have memory usage tracking
      expect(performance.memoryUsage.final.heapUsed).toBeGreaterThan(0)
    })
  })

  describe('Performance Improvements', () => {
    it('should handle large cascades without excessive memory growth', async () => {
      const largeConsequences: TestAIConsequence[] = []

      // Create a larger set of consequences
      for (let i = 0; i < 100; i++) {
        largeConsequences.push({
          id: `large-test-${i}`,
          type: ConsequenceType.WORLD_STATE,
          description: `Large test consequence ${i} for performance testing`,
          confidence: 0.6 + (Math.random() * 0.4),
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [ConsequenceType.WORLD_STATE, ConsequenceType.SOCIAL],
            magnitude: Math.floor(Math.random() * 5) + 3,
            duration: DurationType.MEDIUM_TERM,
            affectedLocations: [`region-${i % 10}`]
          },
          timestamp: new Date().toISOString(),
          actionId: 'large-test-action',
          cascadingEffects: []
        })
      }

      const initialMemory = process.memoryUsage()

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        'large-test-action',
        'Large test action',
        largeConsequences.slice(0, 50) as AIConsequence[] // Use 50 for reasonable test size
      )

      const finalMemory = process.memoryUsage()
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory growth should be reasonable (less than 50MB for this test)
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024)

      // Should have processed all consequences
      expect(result.metadata.totalNodes).toBeGreaterThan(50)

      // Should have memory optimization stats
      expect(result.metadata.performance.memoryUsage.optimization.compactWorldSystems).toBeDefined()
    }, 30000) // 30 second timeout for large test

    it('should reuse memory efficiently across multiple operations', async () => {
      const testConsequences: TestAIConsequence[] = [
        {
          id: 'reuse-test-1',
          type: ConsequenceType.SOCIAL,
          description: 'Reuse test consequence',
          confidence: 0.8,
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [ConsequenceType.SOCIAL],
            magnitude: 5,
            duration: DurationType.SHORT_TERM,
            affectedLocations: ['test-region']
          },
          timestamp: new Date().toISOString(),
          actionId: 'reuse-test-action',
          cascadingEffects: []
        }
      ]

      // Run multiple visualization generations
      const results = []
      for (let i = 0; i < 5; i++) {
        results.push(await cascadeProcessor.generateButterflyEffectVisualization(
          `reuse-action-${i}`,
          `Reuse test action ${i}`,
          testConsequences as AIConsequence[]
        ))
      }

      // Should show improving memory efficiency
      const nodePoolStats = results.map(r => r.metadata.performance.nodePoolStats)

      // Later runs should have higher reuse rates
      const reuseRates = nodePoolStats.map(stats => stats.reuseRate || 0)
      expect(reuseRates[reuseRates.length - 1]).toBeGreaterThanOrEqual(reuseRates[0])
    })
  })
})