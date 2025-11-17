/**
 * Integration Tests: Butterfly Effect Complete Flow
 * Story 3.3: Butterfly Effect Calculation
 */

import { CascadeProcessor } from '../../../src/services/CascadeProcessor'
import { WorldStateUpdater } from '../../../src/services/WorldStateUpdater'
import { ConsequenceGenerator } from '../../../src/services/ConsequenceGenerator'
import {
  AIConsequence,
  ConsequenceType,
  ConsequenceImpact,
  ImpactLevel,
  DurationType,
  AIRequest,
  CascadeVisualizationData,
  EffectHistory
} from '../../../src/types/ai'
import { Layer1Blueprint } from '../../../src/storage/Layer1Blueprint'
import { Layer3State } from '../../../src/storage/Layer3State'
import { v4 as uuidv4 } from 'uuid'

// Mock implementations for storage layers
class MockLayer1Blueprint implements Partial<Layer1Blueprint> {
  async getWorldRules() {
    return [
      {
        id: 'rule-1',
        name: 'Logical Consistency',
        description: 'Effects must be logically consistent',
        conditions: [],
        actions: [],
        priority: 1
      }
    ]
  }
}

class MockLayer3State implements Partial<Layer3State> {
  private data: Map<string, any> = new Map()

  async getData(key: string): Promise<any> {
    return this.data.get(key)
  }

  async setData(key: string, value: any): Promise<void> {
    this.data.set(key, value)
  }

  async updateWorldState(state: any): Promise<void> {
    // Mock implementation
  }

  async getCurrentState(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      regions: [],
      characters: [],
      economy: { tradeRoutes: [] },
      environment: {},
      events: []
    }
  }
}

describe('Butterfly Effect Integration Tests', () => {
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

  describe('Complete Butterfly Effect Flow', () => {
    const mockActionId = 'integration-test-action'
    const mockActionDescription = 'Player discovers ancient artifact in forest'
    const mockAIResponse = `The ancient artifact radiates magical energy that transforms the surrounding forest. Wildlife becomes more peaceful and the trees grow stronger. Local villagers hear rumors of the discovery and become curious about the player. The artifact's power creates opportunities for new magical research.`

    it('should process complete butterfly effect flow from AI response to persistence', async () => {
      const mockAIRequest: AIRequest = {
        actionId: mockActionId,
        playerIntent: 'Explore forest for magical artifacts',
        originalInput: 'I want to explore the forest',
        timestamp: new Date().toISOString(),
        context: {
          playerLocation: 'forest',
          nearbyCharacters: [],
          recentActions: []
        }
      }

      // Step 1: Generate consequences from AI response
      const consequenceResult = await consequenceGenerator.generateConsequences(
        mockAIResponse,
        mockAIRequest,
        { maxConsequences: 4 }
      )

      expect(consequenceResult.parsingSuccess).toBe(true)
      expect(consequenceResult.consequences.length).toBeGreaterThan(0)
      expect(consequenceResult.consequences.length).toBeLessThanOrEqual(4)

      // Step 2: Generate butterfly effect visualization
      const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        consequenceResult.consequences
      )

      expect(visualizationData.nodes.length).toBeGreaterThan(1) // Action + consequences
      expect(visualizationData.connections.length).toBeGreaterThanOrEqual(0)
      expect(visualizationData.emergentOpportunities.length).toBeGreaterThanOrEqual(0)

      // Step 3: Persist butterfly effect data
      const effectHistory = await worldStateUpdater.persistButterflyEffect(
        mockActionId,
        visualizationData,
        {
          includeVisualizationData: true,
          trackCrossRegionEffects: true,
          enablePlayerDiscovery: true,
          persistEmergentOpportunities: true
        }
      )

      expect(effectHistory.originalActionId).toBe(mockActionId)
      expect(effectHistory.visualizationData).toBeDefined()
      expect(effectHistory.discoveredBy).toEqual([])
      expect(effectHistory.achievementUnlocked).toBe(false)

      // Step 4: Retrieve effect history
      const retrievedHistory = await worldStateUpdater.getEffectHistory(mockActionId)

      expect(retrievedHistory).toHaveLength(1)
      expect(retrievedHistory[0].id).toBe(effectHistory.id)

      // Step 5: Test player discovery
      const playerId = 'test-player-1'
      const discoveryRecord = await worldStateUpdater.recordEffectDiscovery(
        playerId,
        effectHistory.id,
        'exploration'
      )

      expect(discoveryRecord.playerId).toBe(playerId)
      expect(discoveryRecord.effectId).toBe(effectHistory.id)
      expect(discoveryRecord.discoveryMethod).toBe('exploration')
      expect(discoveryRecord.rewardClaimed).toBe(false)

      // Verify discovery is recorded
      const updatedHistory = await worldStateUpdater.getEffectHistory(mockActionId)
      expect(updatedHistory[0].discoveredBy).toContain(playerId)

      // Step 6: Check emergent opportunities
      const opportunities = await worldStateUpdater.getEmergentOpportunities(playerId)

      expect(Array.isArray(opportunities)).toBe(true)

      // Verify the complete flow maintains data integrity
      expect(visualizationData.metadata.totalNodes).toBe(
        consequenceResult.consequences.length + 1 // +1 for action node
      )
    })

    it('should handle cross-region propagation with delays', async () => {
      // Create consequences that affect multiple regions
      const multiRegionConsequences: AIConsequence[] = [
        {
          id: uuidv4(),
          actionId: mockActionId,
          type: ConsequenceType.ENVIRONMENT,
          description: 'Magical energy spreads from forest to nearby village',
          impact: {
            level: ImpactLevel.MAJOR,
            affectedSystems: [ConsequenceType.ENVIRONMENT],
            magnitude: 6,
            duration: DurationType.MEDIUM_TERM,
            affectedLocations: ['forest', 'village'] // Multiple regions
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.9
        }
      ]

      const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        multiRegionConsequences
      )

      // Should have cross-region effects
      expect(visualizationData.crossRegionEffects.length).toBeGreaterThan(0)

      const crossRegionEffect = visualizationData.crossRegionEffects[0]
      expect(crossRegionEffect.sourceRegion).toBe('forest')
      expect(crossRegionEffect.targetRegion).toBe('village')
      expect(crossRegionEffect.travelTime).toBeGreaterThan(0)

      // Persist with cross-region tracking
      const effectHistory = await worldStateUpdater.persistButterflyEffect(
        mockActionId,
        visualizationData,
        { trackCrossRegionEffects: true }
      )

      expect(effectHistory.crossRegionEffects.length).toBeGreaterThan(0)
    })

    it('should maintain data consistency across cascading effect levels', async () => {
      // Create consequences with cascading effects
      const consequenceWithCascading: AIConsequence[] = [
        {
          id: uuidv4(),
          actionId: mockActionId,
          type: ConsequenceType.SOCIAL,
          description: 'Player becomes known as artifact discoverer',
          impact: {
            level: ImpactLevel.SIGNIFICANT,
            affectedSystems: [ConsequenceType.SOCIAL, ConsequenceType.RELATIONSHIP],
            magnitude: 7,
            duration: DurationType.LONG_TERM,
            affectedLocations: ['village']
          },
          cascadingEffects: [
            {
              id: uuidv4(),
              parentConsequenceId: uuidv4(), // Will be set correctly
              description: 'Other players seek player for advice',
              delay: 5000,
              probability: 0.7,
              impact: {
                level: ImpactLevel.MODERATE,
                affectedSystems: [ConsequenceType.SOCIAL],
                magnitude: 4,
                duration: DurationType.MEDIUM_TERM
              }
            }
          ],
          timestamp: new Date().toISOString(),
          confidence: 0.85
        }
      ]

      // Set correct parent ID for cascading effect
      consequenceWithCascading[0].cascadingEffects[0].parentConsequenceId = consequenceWithCascading[0].id

      const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        consequenceWithCascading
      )

      // Should have nodes for both primary consequence and cascading effect
      const cascadingNodes = visualizationData.nodes.filter(n => n.type === 'cascading_effect')
      expect(cascadingNodes.length).toBeGreaterThan(0)

      // Connections should link parent to child effects
      const cascadingConnection = visualizationData.connections.find(
        c => c.targetNodeId === cascadingNodes[0].id
      )
      expect(cascadingConnection).toBeDefined()
      expect(cascadingConnection.sourceNodeId).toBe(consequenceWithCascading[0].id)

      // Temporal progression should account for delays
      const maxEndTime = Math.max(...visualizationData.connections.map(c => c.temporalData.endTime))
      expect(maxEndTime).toBeGreaterThan(5000) // Should include cascading delay
    })

    it('should handle errors gracefully and maintain system stability', async () => {
      // Test with invalid AI response
      const invalidAIResponse = ''
      const mockAIRequest: AIRequest = {
        actionId: mockActionId,
        playerIntent: 'Test invalid response',
        originalInput: 'invalid input',
        timestamp: new Date().toISOString(),
        context: {}
      }

      // ConsequenceGenerator should handle invalid response gracefully
      const consequenceResult = await consequenceGenerator.generateConsequences(
        invalidAIResponse,
        mockAIRequest
      )

      expect(consequenceResult.parsingSuccess).toBe(false)
      expect(consequenceResult.consequences).toHaveLength(1) // Fallback consequence
      expect(consequenceResult.errors.length).toBeGreaterThan(0)

      // Visualization should still work with fallback consequences
      const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        consequenceResult.consequences
      )

      expect(visualizationData.nodes).toHaveLength(2) // Action + fallback consequence
      expect(visualizationData.rootNode.type).toBe('action')
    })

    it('should satisfy all acceptance criteria from the story', async () => {
      const testConsequences: AIConsequence[] = [
        {
          id: uuidv4(),
          actionId: mockActionId,
          type: ConsequenceType.RELATIONSHIP,
          description: 'Forest spirits become friendly to player',
          impact: {
            level: ImpactLevel.MAJOR,
            affectedSystems: [ConsequenceType.RELATIONSHIP, ConsequenceType.ENVIRONMENT],
            magnitude: 6,
            duration: DurationType.LONG_TERM,
            affectedLocations: ['forest', 'village']
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.9
        },
        {
          id: uuidv4(),
          actionId: mockActionId,
          type: ConsequenceType.ECONOMIC,
          description: 'New trade route opens for magical artifacts',
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [ConsequenceType.ECONOMIC],
            magnitude: 5,
            duration: DurationType.MEDIUM_TERM,
            affectedLocations: ['market', 'village']
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        }
      ]

      // AC1: Given a consequence has been generated, When the system calculates butterfly effects
      const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        testConsequences
      )

      // Then it identifies related world systems that will be affected
      const affectedSystems = new Set()
      visualizationData.nodes.forEach(node => {
        node.metadata.affectedSystems.forEach(system => affectedSystems.add(system))
      })
      expect(affectedSystems.has(ConsequenceType.RELATIONSHIP)).toBe(true)
      expect(affectedSystems.has(ConsequenceType.ENVIRONMENT)).toBe(true)
      expect(affectedSystems.has(ConsequenceType.ECONOMIC)).toBe(true)

      // And it calculates secondary effects on character relationships and environment
      expect(visualizationData.nodes.some(n => n.metadata.affectedSystems.includes(ConsequenceType.RELATIONSHIP))).toBe(true)
      expect(visualizationData.nodes.some(n => n.metadata.affectedSystems.includes(ConsequenceType.ENVIRONMENT))).toBe(true)

      // And it creates a visual map showing cause-and-effect relationships
      expect(visualizationData.rootNode.type).toBe('action')
      expect(visualizationData.connections.length).toBeGreaterThan(0)
      expect(visualizationData.temporalProgression.keyFrames.length).toBeGreaterThan(0)

      // And the effects persist across multiple world regions and time periods
      expect(visualizationData.crossRegionEffects.length).toBeGreaterThan(0)
      const maxDuration = Math.max(
        ...visualizationData.nodes.map(n => {
          switch (n.metadata.duration) {
            case 'long_term': return 30 * 24 * 60 * 60 * 1000 // 30 days
            case 'medium_term': return 7 * 24 * 60 * 60 * 1000 // 7 days
            case 'short_term': return 24 * 60 * 60 * 1000 // 1 day
            default: return 60 * 60 * 1000 // 1 hour
          }
        })
      )
      expect(maxDuration).toBeGreaterThan(24 * 60 * 60 * 1000) // More than 1 day

      // And players can discover effects created by other players
      const effectHistory = await worldStateUpdater.persistButterflyEffect(
        mockActionId,
        visualizationData
      )

      const playerId = 'discovery-test-player'
      await worldStateUpdater.recordEffectDiscovery(playerId, effectHistory.id)

      const discoveredHistory = await worldStateUpdater.getEffectHistory(undefined, playerId)
      expect(discoveredHistory.length).toBeGreaterThan(0)

      // And the butterfly effects create emergent gameplay opportunities
      const opportunities = await worldStateUpdater.getEmergentOpportunities()
      expect(Array.isArray(opportunities)).toBe(true)
      // May have 0 or more opportunities depending on combination logic
    })
  })
})