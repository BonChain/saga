/**
 * Performance Tests for Consequence Generation System
 * Story 3.2: Consequence Generation & World Changes
 *
 * Performance Requirements:
 * - Complete consequence generation within 15 seconds
 * - Handle multiple concurrent actions
 * - Maintain response time under load
 */

import { AIServiceAdapter } from '../../../src/services/ai/AIServiceAdapter'
import { ConsequenceValidator } from '../../../src/services/ConsequenceValidator'
import { CascadeProcessor } from '../../../src/services/CascadeProcessor'
import { WorldStateUpdater } from '../../../src/services/WorldStateUpdater'
import { Layer1Blueprint } from '../../../src/storage/Layer1Blueprint'
import { Layer3State } from '../../../src/storage/Layer3State'
import { AIRequest, AIConsequence, ConsequenceType } from '../../../src/types/ai'

// Mock storage layers to focus on performance testing
jest.mock('../../../src/storage/Layer1Blueprint')
jest.mock('../../../src/storage/Layer3State')

describe('Consequence Generation Performance Tests', () => {
  let aiServiceAdapter: AIServiceAdapter
  let consequenceValidator: ConsequenceValidator
  let cascadeProcessor: CascadeProcessor
  let worldStateUpdater: WorldStateUpdater
  let mockLayer1Blueprint: jest.Mocked<Layer1Blueprint>
  let mockLayer3State: jest.Mocked<Layer3State>

  beforeEach(() => {
    // Setup minimal mocks for performance testing
    mockLayer1Blueprint = new Layer1Blueprint('') as jest.Mocked<Layer1Blueprint>
    mockLayer3State = new Layer3State('') as jest.Mocked<Layer3State>

    // Mock with minimal overhead
    mockLayer1Blueprint.getWorldRules = jest.fn().mockResolvedValue([])
    mockLayer3State.getCurrentState = jest.fn().mockResolvedValue({
      timestamp: new Date().toISOString(),
      regions: [],
      characters: [],
      economy: { resources: [], tradeRoutes: [], markets: [] },
      environment: { weather: 'clear', timeOfDay: 'day', season: 'spring', magicalConditions: [], naturalDisasters: [] },
      events: []
    })
    mockLayer3State.updateWorldState = jest.fn().mockResolvedValue(undefined)

    consequenceValidator = new ConsequenceValidator(mockLayer1Blueprint, mockLayer3State)
    cascadeProcessor = new CascadeProcessor()
    worldStateUpdater = new WorldStateUpdater(mockLayer3State, mockLayer1Blueprint)
    aiServiceAdapter = new AIServiceAdapter()
  })

  const PERFORMANCE_TIMEOUT = 15000 // 15 seconds requirement
  const PERFORMANCE_MARGIN = 1000 // 1 second margin for test overhead

  describe('Single Consequence Generation Performance', () => {
    it('should complete simple consequence generation within 15 seconds', async () => {
      const simpleAIResponse = `Here are the consequences:
1. The village becomes more prosperous
2. Trade routes open up
3. Local merchants offer better prices`

      const startTime = Date.now()

      const consequences = await aiServiceAdapter.parseConsequences?.(simpleAIResponse, {
        id: 'test-req',
        actionId: 'test-action',
        promptType: 'consequence_generation' as any,
        context: {} as any,
        prompt: '',
        timestamp: new Date().toISOString()
      }) || []

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_TIMEOUT - PERFORMANCE_MARGIN)
      expect(consequences.length).toBeGreaterThan(0)
    }, 20000) // 20 second test timeout

    it('should handle complex consequence generation within 15 seconds', async () => {
      const complexAIResponse = `
Based on your action, the following significant changes occur:

1. The political landscape of the region undergoes dramatic transformation as power dynamics shift between competing factions
2. Economic systems rebalance themselves creating new opportunities while closing old avenues of commerce
3. Environmental changes cascade through interconnected ecosystems affecting wildlife migration patterns and resource availability
4. Social hierarchies reorganize as reputation and influence redistribute throughout the community
5. Military alliances form and dissolve in response to shifting power centers creating new security paradigms
6. Cultural practices evolve as traditions adapt to accommodate new realities and opportunities
7. Religious institutions gain or lose influence based on their alignment with emerging power structures
8. Trade networks reconfigure themselves creating new hubs of commerce while others diminish in importance

Each of these primary effects creates secondary consequences:
- Neighboring regions react to the changes in your area
- Distant powers send envoys to establish or sever diplomatic ties
- Criminal organizations adapt their operations to new law enforcement realities
- Ancient institutions awaken to address the unprecedented developments
- New forms of social organization emerge from the chaos
- Environmental restoration efforts begin in areas affected by secondary impacts
- Educational institutions develop new curricula to address changing societal needs
- Healthcare systems adapt to meet new challenges created by population movements

The cumulative effect creates a permanent shift in how the world operates, establishing new normals that will persist for generations to come.
      `

      const startTime = Date.now()

      const consequences = await aiServiceAdapter.parseConsequences?.(complexAIResponse, {
        id: 'test-req',
        actionId: 'test-action',
        promptType: 'consequence_generation' as any,
        context: {} as any,
        prompt: '',
        timestamp: new Date().toISOString()
      }) || []

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(PERFORMANCE_TIMEOUT - PERFORMANCE_MARGIN)
      expect(consequences.length).toBeGreaterThan(0)
      expect(consequences.length).toBeLessThanOrEqual(4) // Should respect max consequences
    }, 20000)
  })

  describe('Validation Performance', () => {
    it('should validate 10 consequences within 5 seconds', async () => {
      const testConsequences: AIConsequence[] = Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i}`,
        actionId: 'test-action',
        type: Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length],
        description: `Test consequence ${i} with reasonable description length for performance testing`,
        impact: {
          level: 'moderate' as any,
          affectedSystems: ['world_state', 'economic', 'social'],
          magnitude: 5 + (i % 3),
          duration: 'medium_term' as any
        },
        cascadingEffects: Array.from({ length: 2 }, (_, j) => ({
          id: `cascade-${i}-${j}`,
          parentConsequenceId: `test-${i}`,
          description: `Cascading effect ${j}`,
          delay: (i + 1) * 1000,
          probability: 0.6,
          impact: {
            level: 'minor' as any,
            affectedSystems: ['world_state'],
            magnitude: 2 + j,
            duration: 'temporary' as any
          }
        })),
        timestamp: new Date().toISOString(),
        confidence: 0.7 + (i * 0.02)
      }))

      const startTime = Date.now()

      const result = await consequenceValidator.validateConsequences(testConsequences)

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(5000) // 5 seconds for validation
      expect(result.validConsequences.length).toBeGreaterThan(0)
      expect(result.validConsequences.length).toBeLessThanOrEqual(10)
    }, 10000)

    it('should handle consequence conflict detection efficiently', async () => {
      // Create consequences with potential conflicts
      const conflictingConsequences: AIConsequence[] = [
        {
          id: 'conflict-1',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'The village elder becomes your loyal friend and ally',
          impact: {
            level: 'major' as any,
            affectedSystems: ['relationship', 'social'],
            magnitude: 8,
            duration: 'permanent' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.9
        },
        {
          id: 'conflict-2',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'The village elder becomes your sworn enemy',
          impact: {
            level: 'major' as any,
            affectedSystems: ['relationship', 'social'],
            magnitude: 8,
            duration: 'permanent' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.9
        },
        {
          id: 'conflict-3',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'The village elder becomes neutral towards you',
          impact: {
            level: 'minor' as any,
            affectedSystems: ['relationship', 'social'],
            magnitude: 3,
            duration: 'temporary' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.6
        }
      ]

      const startTime = Date.now()

      const result = await consequenceValidator.validateConsequences(conflictingConsequences)

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(3000) // 3 seconds for conflict detection
      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.validConsequences.length).toBeLessThan(3) // Should resolve conflicts
    }, 8000)
  })

  describe('Cascading Effect Performance', () => {
    it('should process cascading effects for high-impact consequences efficiently', async () => {
      const highImpactConsequences: AIConsequence[] = [
        {
          id: 'high-impact-1',
          actionId: 'test-action',
          type: ConsequenceType.COMBAT,
          description: 'A massive battle changes the power structure of the entire region',
          impact: {
            level: 'critical' as any,
            affectedSystems: ['combat', 'political', 'economic', 'social'],
            magnitude: 10,
            duration: 'permanent' as any
          },
          cascadingEffects: Array.from({ length: 5 }, (_, i) => ({
            id: `cascade-${i}`,
            parentConsequenceId: 'high-impact-1',
            description: `Secondary effect ${i} spreading through multiple systems`,
            delay: (i + 1) * 2000,
            probability: 0.8 - (i * 0.1),
            impact: {
              level: 'major' as any,
              affectedSystems: ['world_state', 'economic', 'social'],
              magnitude: 7 - i,
              duration: 'long_term' as any
            }
          })),
          timestamp: new Date().toISOString(),
          confidence: 0.95
        }
      ]

      const startTime = Date.now()

      const result = await cascadeProcessor.processCascadingEffects(highImpactConsequences, {
        maxCascadingLevels: 3,
        maxEffectsPerLevel: 4,
        probabilityThreshold: 0.2
      })

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(10000) // 10 seconds for cascading effects
      expect(result.totalEffects).toBeGreaterThan(0)
      expect(result.maxCascadeDepth).toBeGreaterThan(1)
      expect(result.relationships.length).toBeGreaterThan(0)
    }, 15000)

    it('should handle large cascade networks without memory leaks', async () => {
      // Create many primary consequences that could generate large cascade networks
      const manyConsequences: AIConsequence[] = Array.from({ length: 20 }, (_, i) => ({
        id: `primary-${i}`,
        actionId: 'test-action',
        type: Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length],
        description: `Primary consequence ${i} that generates multiple cascading effects`,
        impact: {
          level: 'moderate' as any,
          affectedSystems: ['world_state', 'economic', 'social'],
          magnitude: 6,
          duration: 'medium_term' as any
        },
        cascadingEffects: Array.from({ length: 3 }, (_, j) => ({
          id: `cascade-${i}-${j}`,
          parentConsequenceId: `primary-${i}`,
          description: `Cascading effect ${j} for primary ${i}`,
          delay: (i + j + 1) * 1000,
          probability: 0.6,
          impact: {
            level: 'minor' as any,
            affectedSystems: ['world_state'],
            magnitude: 3,
            duration: 'temporary' as any
          }
        })),
        timestamp: new Date().toISOString(),
        confidence: 0.7
      }))

      const startTime = Date.now()
      const initialMemory = process.memoryUsage()

      const result = await cascadeProcessor.processCascadingEffects(manyConsequences, {
        maxCascadingLevels: 2,
        maxEffectsPerLevel: 3,
        probabilityThreshold: 0.3
      })

      const processingTime = Date.now() - startTime
      const finalMemory = process.memoryUsage()

      expect(processingTime).toBeLessThan(12000) // 12 seconds for large network
      expect(result.totalEffects).toBeGreaterThan(0)

      // Check for reasonable memory usage (should not grow excessively)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
    }, 20000)
  })

  describe('World State Update Performance', () => {
    it('should apply consequences to world state within performance limits', async () => {
      const testConsequences: AIConsequence[] = Array.from({ length: 15 }, (_, i) => ({
        id: `apply-${i}`,
        actionId: 'test-action',
        type: Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length],
        description: `Consequence to apply to world state ${i} with various system impacts`,
        impact: {
          level: 'moderate' as any,
          affectedSystems: ['world_state', 'economic', 'social'],
          magnitude: 5 + (i % 3),
          duration: 'medium_term' as any
        },
        cascadingEffects: Array.from({ length: 2 }, (_, j) => ({
          id: `apply-cascade-${i}-${j}`,
          parentConsequenceId: `apply-${i}`,
          description: `Cascading effect to apply ${j}`,
          delay: 1000,
          probability: 0.7,
          impact: {
            level: 'minor' as any,
            affectedSystems: ['world_state'],
            magnitude: 2,
            duration: 'temporary' as any
          }
        })),
        timestamp: new Date().toISOString(),
        confidence: 0.8
      }))

      const startTime = Date.now()

      const result = await worldStateUpdater.applyConsequences(testConsequences)

      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(8000) // 8 seconds for world state updates
      expect(result.success).toBe(true)
      expect(result.appliedConsequences.length).toBeGreaterThan(0)
      expect(result.metadata.affectedSystems.length).toBeGreaterThan(0)
    }, 15000)
  })

  describe('End-to-End Performance with Real-Time Requirements', () => {
    it('should complete full consequence pipeline within 15 seconds for typical action', async () => {
      // Simulate a typical AI response
      const typicalAIResponse = `Here are the consequences of your action:
1. The village becomes more prosperous as trade increases
2. Your reputation with the elder improves significantly
3. New opportunities become available through established relationships
4. The local economy begins to flourish with increased activity`

      const testRequest: AIRequest = {
        id: 'perf-test-req',
        actionId: 'perf-test-action',
        promptType: 'consequence_generation' as any,
        context: {
          actionId: 'perf-test-action',
          playerIntent: 'improve village prosperity',
          originalInput: 'I want to help make the village more prosperous',
          worldState: {
            timestamp: new Date().toISOString(),
            regions: [],
            characters: [],
            economy: { resources: [], tradeRoutes: [], markets: [] },
            environment: { weather: 'clear', timeOfDay: 'day', season: 'spring', magicalConditions: [], naturalDisasters: [] },
            events: []
          },
          characterRelationships: [],
          locationContext: {
            currentLocation: 'village',
            nearbyLocations: ['forest', 'market'],
            environmentConditions: ['peaceful'],
            availableResources: ['food', 'tools'],
            dangers: ['wild animals'],
            opportunities: ['trade', 'quests']
          },
          recentActions: [],
          worldRules: []
        },
        prompt: 'Generate consequences for improving village prosperity',
        timestamp: new Date().toISOString()
      }

      const startTime = Date.now()

      // Step 1: Parse consequences from AI response
      const consequences = await aiServiceAdapter.parseConsequences?.(typicalAIResponse, testRequest) || []

      // Step 2: Validate consequences
      const validationResult = await consequenceValidator.validateConsequences(consequences)

      // Step 3: Process cascading effects
      const cascadeNetwork = await cascadeProcessor.processCascadingEffects(validationResult.validConsequences)

      // Step 4: Apply to world state
      const updateResult = await worldStateUpdater.applyConsequences(validationResult.validConsequences)

      const totalTime = Date.now() - startTime

      expect(totalTime).toBeLessThan(PERFORMANCE_TIMEOUT - PERFORMANCE_MARGIN)
      expect(consequences.length).toBeGreaterThanOrEqual(2)
      expect(consequences.length).toBeLessThanOrEqual(4) // AC requirement
      expect(validationResult.validConsequences.length).toBeGreaterThan(0)
      expect(cascadeNetwork.totalEffects).toBeGreaterThanOrEqual(0)
      expect(updateResult.success).toBe(true)
      expect(updateResult.appliedConsequences.length).toBeGreaterThan(0)
    }, 20000)

    it('should handle concurrent consequence processing requests', async () => {
      const concurrentRequests = 5
      const requestPromises = Array.from({ length: concurrentRequests }, (_, i) => {
        const testConsequences: AIConsequence[] = [
          {
            id: `concurrent-${i}`,
            actionId: `action-${i}`,
            type: ConsequenceType.WORLD_STATE,
            description: `Consequence for concurrent request ${i}`,
            impact: {
              level: 'moderate' as any,
              affectedSystems: ['world_state', 'economic'],
              magnitude: 5,
              duration: 'medium_term' as any
            },
            cascadingEffects: [],
            timestamp: new Date().toISOString(),
            confidence: 0.7
          }
        ]

        return consequenceValidator.validateConsequences(testConsequences)
      })

      const startTime = Date.now()

      const results = await Promise.all(requestPromises)

      const totalTime = Date.now() - startTime

      // Each request should complete within reasonable time, and total time should be reasonable for concurrent processing
      expect(totalTime).toBeLessThan(20000) // 20 seconds for 5 concurrent requests
      results.forEach(result => {
        expect(result.validConsequences.length).toBeGreaterThan(0)
      })
    }, 25000)
  })

  describe('Memory and Resource Management', () => {
    it('should not leak memory during repeated consequence processing', async () => {
      const iterations = 10
      const memorySnapshots = []

      for (let i = 0; i < iterations; i++) {
        const testConsequences: AIConsequence[] = Array.from({ length: 5 }, (_, j) => ({
          id: `memory-test-${i}-${j}`,
          actionId: `action-${i}`,
          type: Object.values(ConsequenceType)[j % Object.values(ConsequenceType).length],
          description: `Memory test consequence ${i}-${j}`,
          impact: {
            level: 'moderate' as any,
            affectedSystems: ['world_state', 'economic'],
            magnitude: 5,
            duration: 'medium_term' as any
          },
          cascadingEffects: Array.from({ length: 2 }, (_, k) => ({
            id: `memory-cascade-${i}-${j}-${k}`,
            parentConsequenceId: `memory-test-${i}-${j}`,
            description: `Memory test cascade ${i}-${j}-${k}`,
            delay: 1000,
            probability: 0.6,
            impact: {
              level: 'minor' as any,
              affectedSystems: ['world_state'],
              magnitude: 2,
              duration: 'temporary' as any
            }
          })),
          timestamp: new Date().toISOString(),
          confidence: 0.7
        }))

        // Process consequences
        await consequenceValidator.validateConsequences(testConsequences)
        await cascadeProcessor.processCascadingEffects(testConsequences)
        await worldStateUpdater.applyConsequences(testConsequences)

        // Capture memory usage
        if (i % 2 === 0) { // Sample every other iteration
          memorySnapshots.push({
            iteration: i,
            memory: process.memoryUsage()
          })
        }
      }

      // Check that memory usage doesn't grow excessively
      if (memorySnapshots.length >= 2) {
        const first = memorySnapshots[0].memory
        const last = memorySnapshots[memorySnapshots.length - 1].memory
        const memoryGrowth = last.heapUsed - first.heapUsed

        // Should not grow more than 10MB during processing
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
      }
    }, 60000) // 60 second timeout for memory test
  })
})