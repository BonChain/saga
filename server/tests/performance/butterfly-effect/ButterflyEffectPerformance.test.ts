/**
 * Performance Tests: Butterfly Effect Calculation
 * Story 3.3: Butterfly Effect Calculation
 *
 * Verifies that all butterfly effect calculations complete within 15 seconds
 * as required by the acceptance criteria and constraints.
 */

import { CascadeProcessor } from '../../../src/services/cascade-processor'
import { WorldStateUpdater } from '../../../src/services/world-state-updater'
import { ConsequenceGenerator } from '../../../src/services/consequence-generator'
import {
  AIConsequence,
  ConsequenceType,
  ConsequenceImpact,
  ImpactLevel,
  DurationType,
  AIRequest,
  ButterflyEffectNode,
  CascadeVisualizationData
} from '../../../src/types/ai'
import { Layer1Blueprint } from '../../../src/storage/layer1-blueprint'
import { Layer3State } from '../../../src/storage/layer3-state'
import { v4 as uuidv4 } from 'uuid'

// Mock implementations for storage layers
class MockLayer1Blueprint implements Partial<Layer1Blueprint> {
  async getWorldRules() {
    return Array(50).fill(null).map((_, i) => ({
      id: `rule-${i}`,
      name: `Rule ${i}`,
      description: `Mock world rule ${i}`,
      conditions: [],
      actions: [],
      priority: i % 5
    }))
  }
}

class MockLayer3State implements Partial<Layer3State> {
  private data: Map<string, any> = new Map()

  async getData(key: string): Promise<any> {
    return this.data.get(key)
  }

  async setData(key: string, value: any): Promise<void> {
    // Simulate storage delay
    await new Promise(resolve => setTimeout(resolve, 10))
    this.data.set(key, value)
  }

  async updateWorldState(state: any): Promise<void> {
    // Simulate state update delay
    await new Promise(resolve => setTimeout(resolve, 20))
  }

  async getCurrentState(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      regions: Array(20).fill(null).map((_, i) => ({
        id: `region-${i}`,
        name: `Region ${i}`,
        status: 'active',
        prosperity: 50 + Math.random() * 50,
        safety: 50 + Math.random() * 50,
        notableFeatures: [`Feature ${i}`],
        currentConditions: 'normal'
      })),
      characters: Array(100).fill(null).map((_, i) => ({
        id: `character-${i}`,
        name: `Character ${i}`,
        location: `region-${i % 20}`,
        health: 100,
        status: 'active',
        relationships: [],
        currentActivity: 'idle',
        mood: 'neutral'
      })),
      economy: {
        tradeRoutes: Array(30).fill(null).map((_, i) => ({
          id: `route-${i}`,
          from: `region-${i % 20}`,
          to: `region-${(i + 1) % 20}`,
          activity: Math.random() * 100,
          danger: Math.random() * 50
        }))
      },
      environment: {
        globalConditions: 'stable',
        weatherPatterns: Array(10).fill(null).map((_, i) => ({
          regionId: `region-${i}`,
          currentWeather: 'clear',
          temperature: 20 + Math.random() * 15
        }))
      },
      events: []
    }
  }
}

describe('Butterfly Effect Performance Tests', () => {
  let cascadeProcessor: CascadeProcessor
  let worldStateUpdater: WorldStateUpdater
  let consequenceGenerator: ConsequenceGenerator
  let mockLayer1Blueprint: MockLayer1Blueprint
  let mockLayer3State: MockLayer3State

  beforeEach(() => {
    cascadeProcessor = new CascadeProcessor()
    mockLayer1Blueprint = new MockLayer1Blueprint()
    mockLayer3State = new MockLayer3State()
    worldStateUpdater = new WorldStateUpdater(
      mockLayer3State as Layer3State,
      mockLayer1Blueprint as Layer1Blueprint
    )
    consequenceGenerator = new ConsequenceGenerator(
      mockLayer1Blueprint as Layer1Blueprint
    )
  })

  const PERFORMANCE_REQUIREMENT_MS = 15000 // 15 seconds

  describe('CascadeProcessor Performance', () => {
    it('should generate butterfly effect visualization within 15 seconds for simple consequences', async () => {
      const consequences: AIConsequence[] = [
        {
          id: uuidv4(),
          actionId: 'perf-test-1',
          type: ConsequenceType.RELATIONSHIP,
          description: 'Simple relationship consequence',
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [ConsequenceType.RELATIONSHIP],
            magnitude: 5,
            duration: DurationType.TEMPORARY
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        }
      ]

      const startTime = Date.now()

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        'perf-test-1',
        'Performance test action',
        consequences
      )

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.metadata.processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.nodes.length).toBe(2) // Action + consequence
    })

    it('should handle medium complexity consequences within 15 seconds', async () => {
      const consequences: AIConsequence[] = Array(10).fill(null).map((_, i) => ({
        id: uuidv4(),
        actionId: 'perf-test-medium',
        type: Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length],
        description: `Medium complexity consequence ${i}`,
        impact: {
          level: ImpactLevel.MODERATE,
          affectedSystems: [Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length]],
          magnitude: 5 + Math.random() * 3,
          duration: DurationType.MEDIUM_TERM,
          affectedLocations: [`region-${i % 5}`]
        },
        cascadingEffects: Array(3).fill(null).map((_, j) => ({
          id: uuidv4(),
          parentConsequenceId: '',
          description: `Cascading effect ${i}-${j}`,
          delay: 1000 + j * 500,
          probability: 0.5 + Math.random() * 0.4,
          impact: {
            level: ImpactLevel.MINOR,
            affectedSystems: [ConsequenceType.WORLD_STATE],
            magnitude: 2 + Math.random() * 2,
            duration: DurationType.TEMPORARY
          }
        })),
        timestamp: new Date().toISOString(),
        confidence: 0.7 + Math.random() * 0.2
      }))

      const startTime = Date.now()

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        'perf-test-medium',
        'Medium complexity performance test',
        consequences
      )

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.metadata.processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.nodes.length).toBe(consequences.length + 1)
    })

    it('should handle high complexity consequences within 15 seconds', async () => {
      const consequences: AIConsequence[] = Array(25).fill(null).map((_, i) => ({
        id: uuidv4(),
        actionId: 'perf-test-complex',
        type: Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length],
        description: `High complexity consequence ${i}`,
        impact: {
          level: Object.values(ImpactLevel)[i % Object.values(ImpactLevel).length],
          affectedSystems: Array(3).fill(null).map((_, j) =>
            Object.values(ConsequenceType)[(i + j) % Object.values(ConsequenceType).length]
          ),
          magnitude: 1 + Math.random() * 9,
          duration: Object.values(DurationType)[i % Object.values(DurationType).length],
          affectedLocations: Array(4).fill(null).map((_, j) => `region-${(i + j) % 10}`)
        },
        cascadingEffects: Array(5).fill(null).map((_, j) => ({
          id: uuidv4(),
          parentConsequenceId: '',
          description: `Complex cascading effect ${i}-${j}`,
          delay: 500 + j * 300,
          probability: 0.3 + Math.random() * 0.6,
          impact: {
            level: Object.values(ImpactLevel)[j % Object.values(ImpactLevel).length],
            affectedSystems: Array(2).fill(null).map((_, k) =>
              Object.values(ConsequenceType)[(i + j + k) % Object.values(ConsequenceType).length]
            ),
            magnitude: 1 + Math.random() * 8,
            duration: Object.values(DurationType)[j % Object.values(DurationType).length]
          }
        })),
        timestamp: new Date().toISOString(),
        confidence: 0.5 + Math.random() * 0.4
      }))

      const startTime = Date.now()

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        'perf-test-complex',
        'High complexity performance test',
        consequences
      )

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.metadata.processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.nodes.length).toBeGreaterThan(consequences.length) // Should include cascading effects
    })
  })

  describe('ConsequenceGenerator Performance', () => {
    it('should parse AI responses within 15 seconds', async () => {
      const complexAIResponse = `
        Based on your action of discovering the ancient artifact, the following consequences occur:

        1. The magical energy from the artifact creates a peaceful aura that spreads throughout the forest, causing wildlife to become calm and friendly towards travelers.

        2. Local villagers hear rumors of your discovery and their opinion of you improves significantly, opening up new dialogue options and trading opportunities.

        3. The artifact's presence begins to slowly transform the local environment, causing unusual plants to grow that have alchemical properties.

        4. Other adventurers are drawn to the area, seeking to learn from your discovery or potentially claim the artifact for themselves.

        This creates a complex web of social, environmental, and economic changes that will evolve over time.
      `

      const mockAIRequest: AIRequest = {
        actionId: 'perf-parsing-test',
        playerIntent: 'Discover magical artifact',
        originalInput: 'I search the area for ancient magical items',
        timestamp: new Date().toISOString(),
        context: {
          playerLocation: 'forest',
          nearbyCharacters: [],
          recentActions: ['explored_cave', 'fought_goblins']
        }
      }

      const startTime = Date.now()

      const result = await consequenceGenerator.generateConsequences(
        complexAIResponse,
        mockAIRequest,
        { maxConsequences: 6 }
      )

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.parsingSuccess).toBe(true)
      expect(result.consequences.length).toBeGreaterThan(0)
      expect(result.consequences.length).toBeLessThanOrEqual(6)
    })
  })

  describe('WorldStateUpdater Performance', () => {
    it('should persist butterfly effect data within 15 seconds', async () => {
      const visualizationData = {
        rootNode: {
          id: 'test-action',
          type: 'action' as const,
          position: { x: 0, y: 0, layer: 0 },
          metadata: {
            title: 'Test Action',
            description: 'Performance test action',
            severity: ImpactLevel.MODERATE,
            confidence: 1.0,
            affectedSystems: [],
            affectedRegions: [],
            duration: DurationType.TEMPORARY,
            magnitude: 1
          },
          visualProperties: {
            color: '#4CAF50',
            size: 20,
            opacity: 1.0,
            pulseSpeed: 2.0
          }
        },
        nodes: Array(50).fill(null).map((_, i) => ({
          id: `node-${i}`,
          type: 'consequence' as const,
          position: { x: i * 10, y: i * 10, layer: i % 3 },
          metadata: {
            title: `Consequence ${i}`,
            description: `Test consequence ${i}`,
            severity: ImpactLevel.MODERATE,
            confidence: 0.8,
            affectedSystems: [ConsequenceType.WORLD_STATE],
            affectedRegions: [`region-${i % 10}`],
            duration: DurationType.MEDIUM_TERM,
            magnitude: 5
          },
          visualProperties: {
            color: '#2196F3',
            size: 15,
            opacity: 0.8,
            pulseSpeed: 1.5
          }
        })),
        connections: Array(100).fill(null).map((_, i) => ({
          id: `connection-${i}`,
          sourceNodeId: `node-${i % 50}`,
          targetNodeId: `node-${(i + 1) % 50}`,
          relationshipType: 'direct' as const,
          strength: 0.5 + Math.random() * 0.5,
          delay: Math.random() * 5000,
          probability: 0.3 + Math.random() * 0.6,
          visualProperties: {
            color: '#4CAF50',
            thickness: 2,
            dashPattern: 'solid' as const,
            animationType: 'curved' as const
          },
          temporalData: {
            startTime: Math.random() * 10000,
            endTime: 10000 + Math.random() * 10000,
            animationDuration: 2000
          }
        })),
        temporalProgression: {
          totalDuration: 15000,
          keyFrames: Array(10).fill(null).map((_, i) => ({
            time: i * 1500,
            activeNodes: Array(20).fill(null).map((_, j) => `node-${j}`),
            activeConnections: Array(10).fill(null).map((_, j) => `connection-${j}`)
          }))
        },
        crossRegionEffects: Array(20).fill(null).map((_, i) => ({
          nodeId: `node-${i}`,
          sourceRegion: `region-${i}`,
          targetRegion: `region-${(i + 1) % 10}`,
          travelTime: 1000 + i * 100
        })),
        emergentOpportunities: Array(15).fill(null).map((_, i) => ({
          id: `opportunity-${i}`,
          title: `Emergent Opportunity ${i}`,
          description: `Test opportunity ${i}`,
          requiredConditions: [`condition-${i}`],
          potentialOutcomes: [`outcome-${i}`],
          relatedNodes: [`node-${i}`, `node-${(i + 1) % 50}`]
        })),
        metadata: {
          totalNodes: 51,
          totalConnections: 100,
          maxCascadeDepth: 3,
          processingTime: 0,
          lastUpdated: new Date().toISOString()
        }
      }

      const startTime = Date.now()

      const result = await worldStateUpdater.persistButterflyEffect(
        'perf-persistence-test',
        visualizationData,
        {
          includeVisualizationData: true,
          trackCrossRegionEffects: true,
          enablePlayerDiscovery: true,
          persistEmergentOpportunities: true
        }
      )

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)
      expect(result.originalActionId).toBe('perf-persistence-test')
      expect(result.visualizationData).toBeDefined()
      expect(result.persistentEffects.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('End-to-End Performance', () => {
    it('should complete full butterfly effect pipeline within 15 seconds', async () => {
      const aiResponse = `
        Your action of liberating the captured unicorn has far-reaching consequences:

        1. The forest spirits bless you, granting you enhanced magical abilities and improved relations with nature.

        2. The local villagers celebrate your heroism, improving your reputation and opening new quests.

        3. The dark cultists who captured the unicorn now see you as an enemy and may seek revenge.

        4. Other magical creatures are drawn to the area, creating both opportunities and dangers.

        5. The balance of magic in the region shifts, affecting all spellcasting and enchantments.
      `

      const mockAIRequest: AIRequest = {
        actionId: 'e2e-perf-test',
        playerIntent: 'Liberate captured unicorn',
        originalInput: 'I free the unicorn from the dark cultists',
        timestamp: new Date().toISOString(),
        context: {
          playerLocation: 'dark_forest',
          nearbyCharacters: ['unicorn', 'cultists'],
          recentActions: ['investigated_cult', 'followed_tracks']
        }
      }

      const totalStartTime = Date.now()

      // Step 1: Generate consequences
      const consequenceResult = await consequenceGenerator.generateConsequences(
        aiResponse,
        mockAIRequest,
        { maxConsequences: 5 }
      )

      // Step 2: Generate butterfly effect visualization
      const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
        mockAIRequest.actionId,
        mockAIRequest.originalInput,
        consequenceResult.consequences
      )

      // Step 3: Persist butterfly effect data
      const effectHistory = await worldStateUpdater.persistButterflyEffect(
        mockAIRequest.actionId,
        visualizationData
      )

      // Step 4: Test retrieval performance
      const retrievedHistory = await worldStateUpdater.getEffectHistory(mockAIRequest.actionId)

      // Step 5: Test discovery performance
      await worldStateUpdater.recordEffectDiscovery(
        'test-player',
        effectHistory.id,
        'direct'
      )

      const totalProcessingTime = Date.now() - totalStartTime

      // Verify all steps completed successfully
      expect(consequenceResult.parsingSuccess).toBe(true)
      expect(visualizationData.nodes.length).toBeGreaterThan(1)
      expect(effectHistory.originalActionId).toBe(mockAIRequest.actionId)
      expect(retrievedHistory.length).toBe(1)

      // Verify performance requirement
      expect(totalProcessingTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS)

      console.log(`End-to-end performance test completed in ${totalProcessingTime}ms`)
      console.log(`Step breakdown:`)
      console.log(`- Consequence generation: ${consequenceResult.metadata.processingTime}ms`)
      console.log(`- Visualization generation: ${visualizationData.metadata.processingTime}ms`)
      console.log(`- Total pipeline: ${totalProcessingTime}ms`)
    })

    it('should handle concurrent requests without performance degradation', async () => {
      const concurrentRequests = 10
      const aiResponse = 'Your action creates magical ripples that spread throughout the world.'
      const promises = Array(concurrentRequests).fill(null).map((_, i) => {
        const mockAIRequest: AIRequest = {
          actionId: `concurrent-test-${i}`,
          playerIntent: 'Test concurrent performance',
          originalInput: `Test action ${i}`,
          timestamp: new Date().toISOString(),
          context: {}
        }

        return consequenceGenerator.generateConsequences(aiResponse, mockAIRequest)
      })

      const startTime = Date.now()

      const results = await Promise.all(promises)

      const totalTime = Date.now() - startTime
      const averageTime = totalTime / concurrentRequests

      // Each individual request should be fast, and total time should be reasonable
      expect(results.every(r => r.parsingSuccess)).toBe(true)
      expect(averageTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS / 2) // Average should be well under limit
      expect(totalTime).toBeLessThan(PERFORMANCE_REQUIREMENT_MS * 2) // Total should be reasonable

      console.log(`Concurrent performance test: ${concurrentRequests} requests in ${totalTime}ms (avg: ${averageTime}ms)`)
    })
  })
})