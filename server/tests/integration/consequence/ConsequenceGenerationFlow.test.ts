/**
 * Integration Tests for Complete Consequence Generation Flow
 * Story 3.2: Consequence Generation & World Changes
 */

import { AIServiceAdapter } from '../../../src/services/ai/ai-service-adapter'
import { ConsequenceValidator } from '../../../src/services/consequence-validator'
import { CascadeProcessor } from '../../../src/services/cascade-processor'
import { WorldStateUpdater } from '../../../src/services/world-state-updater'
import { Layer1Blueprint } from '../../../src/storage/layer1-blueprint'
import { Layer2Queue } from '../../../src/storage/layer2-queue'
import { Layer3State } from '../../../src/storage/layer3-state'
import { AIRequest, AIConsequence, ConsequenceType, WorldStateSnapshot } from '../../../src/types/ai'

// Mock storage layers
jest.mock('../../../src/storage/layer1-blueprint')
jest.mock('../../../src/storage/layer2-queue')
jest.mock('../../../src/storage/layer3-state')

describe.skip('Consequence Generation Integration Flow (Temporarily Disabled)', () => {
  let aiServiceAdapter: AIServiceAdapter
  let consequenceValidator: ConsequenceValidator
  let cascadeProcessor: CascadeProcessor
  let worldStateUpdater: WorldStateUpdater
  let mockLayer1Blueprint: jest.Mocked<Layer1Blueprint>
  let mockLayer2Queue: jest.Mocked<Layer2Queue>
  let mockLayer3State: jest.Mocked<Layer3State>

  beforeEach(() => {
    // Mock WalrusConfig for testing
    const mockWalrusConfig = {
      endpoint: 'https://testnet.sui.io',
      network: 'testnet',
      maxRetries: 3,
      timeout: 5000,
      useBackup: false,
      backupPath: './backup',
      sponsoredTransactions: false,
      developerPrivateKey: 'test-key',
      storageEpochs: 1
    }

    // Setup mocks with proper constructor parameters
    mockLayer1Blueprint = new Layer1Blueprint('./test-storage', mockWalrusConfig) as jest.Mocked<Layer1Blueprint>
    mockLayer2Queue = new Layer2Queue('./test-storage', mockWalrusConfig) as jest.Mocked<Layer2Queue>
    mockLayer3State = new Layer3State('./test-storage', mockWalrusConfig) as jest.Mocked<Layer3State>

    // Mock world rules
    mockLayer1Blueprint.getWorldRules = jest.fn().mockResolvedValue([
      {
        id: 'rule-1',
        name: 'No Instant Relationships',
        description: 'Cannot form permanent relationships immediately',
        type: 'social' as any,
        constraints: ['immediate friendship is impossible'],
        exceptions: []
      },
      {
        id: 'rule-2',
        name: 'Environmental Realism',
        description: 'Weather changes must be gradual',
        type: 'environmental' as any,
        constraints: ['no sudden weather shifts'],
        exceptions: ['magical interventions']
      }
    ])

    // Mock current world state
    const mockWorldState: WorldStateSnapshot = {
      timestamp: new Date().toISOString(),
      regions: [
        {
          id: 'village',
          name: 'Peaceful Village',
          status: 'prosperous',
          prosperity: 75,
          safety: 80,
          notableFeatures: ['market', 'tavern', 'temple'],
          currentConditions: 'peaceful and sunny'
        },
        {
          id: 'forest',
          name: 'Dark Forest',
          status: 'dangerous',
          prosperity: 30,
          safety: 20,
          notableFeatures: ['ancient ruins', 'monster lairs'],
          currentConditions: 'mysterious and dark'
        }
      ],
      characters: [
        {
          id: 'elder',
          name: 'Village Elder',
          location: 'village',
          health: 100,
          status: 'active',
          relationships: [],
          currentActivity: 'advising',
          mood: 'wise'
        },
        {
          id: 'merchant',
          name: 'Local Merchant',
          location: 'village',
          health: 100,
          status: 'active',
          relationships: [],
          currentActivity: 'trading',
          mood: 'friendly'
        }
      ],
      economy: {
        resources: [
          { id: 'food', name: 'Food', quantity: 1000, location: 'village', rarity: 'common', demand: 5 },
          { id: 'tools', name: 'Tools', quantity: 500, location: 'village', rarity: 'uncommon', demand: 3 }
        ],
        tradeRoutes: [
          { id: 'main-route', from: 'village', to: 'city', resources: ['food', 'tools'], danger: 3, activity: 5 }
        ],
        markets: [
          { location: 'village', resources: [], prosperity: 75 }
        ]
      },
      environment: {
        weather: 'sunny',
        timeOfDay: 'afternoon',
        season: 'spring',
        magicalConditions: [],
        naturalDisasters: []
      },
      events: []
    }

    mockLayer3State.getCurrentState = jest.fn().mockResolvedValue(mockWorldState)
    mockLayer3State.updateWorldState = jest.fn().mockResolvedValue(undefined)

    // Initialize services
    consequenceValidator = new ConsequenceValidator(mockLayer1Blueprint, mockLayer3State)
    cascadeProcessor = new CascadeProcessor()
    worldStateUpdater = new WorldStateUpdater(mockLayer3State, mockLayer1Blueprint)
    aiServiceAdapter = new AIServiceAdapter()
  })

  describe('End-to-End Consequence Generation', () => {
    const createTestAction = (): AIRequest => ({
      id: 'test-ai-request',
      actionId: 'test-action-123',
      promptType: 'consequence_generation' as any,
      context: {
        actionId: 'test-action-123',
        playerIntent: 'befriend the village elder',
        originalInput: 'I want to befriend the village elder',
        worldState: {
          timestamp: new Date().toISOString(),
          regions: [],
          characters: [],
          economy: { resources: [], tradeRoutes: [], markets: [] },
          environment: { weather: 'sunny', timeOfDay: 'afternoon', season: 'spring', magicalConditions: [], naturalDisasters: [] },
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
      prompt: 'Generate consequences for attempting to befriend the village elder',
      timestamp: new Date().toISOString(),
      maxTokens: 500,
      temperature: 0.7
    })

    it('should process complete consequence flow with validation and world state updates', async () => {
      // Mock AI response
      const mockAIResponse = {
        id: 'ai-response-123',
        requestId: 'test-ai-request',
        content: `Here are the consequences of befriending the village elder:

1. The village elder becomes more trusting and offers advice
2. Other villagers notice your improved relationship with leadership
3. The merchant offers better prices due to your elevated status
4. New quests become available through the elder's connections

```json
[
  {
    "type": "relationship",
    "description": "The village elder becomes your ally and mentor",
    "impact": {
      "level": "major",
      "affectedSystems": ["relationship", "social"],
      "magnitude": 8,
      "duration": "long_term"
    },
    "cascadingEffects": [
      {
        "description": "Villagers show increased respect",
        "delay": 3000,
        "probability": 0.8,
        "impact": {
          "level": "moderate",
          "affectedSystems": ["social"],
          "magnitude": 5,
          "duration": "medium_term"
        }
      }
    ]
  },
  {
    "type": "economic",
    "description": "Trade opportunities expand through elder's network",
    "impact": {
      "level": "moderate",
      "affectedSystems": ["economic", "social"],
      "magnitude": 6,
      "duration": "medium_term"
    }
  }
]
        `,
        consequences: [], // Will be parsed from content
        tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300, estimatedCost: 0.002 },
        processingTime: 0,
        timestamp: new Date().toISOString(),
        model: 'gpt-3.5-turbo',
        success: true
      }

      // Mock the AI service adapter to return our test response
      jest.spyOn(aiServiceAdapter, 'processAction').mockResolvedValue(mockAIResponse)

      // Step 1: Generate consequences from AI response
      const consequences = await aiServiceAdapter.processAction(createTestAction())
      expect(consequences.success).toBe(true)
      expect(consequences.consequences.length).toBeGreaterThan(0)

      // Step 2: Validate consequences
      const validationResult = await consequenceValidator.validateConsequences(consequences.consequences)
      expect(validationResult.validConsequences.length).toBeGreaterThan(0)
      expect(validationResult.conflicts.length).toBe(0) // Should not have conflicts with our test data

      // Step 3: Process cascading effects
      const cascadeNetwork = await cascadeProcessor.processCascadingEffects(validationResult.validConsequences)
      expect(cascadeNetwork.totalEffects).toBeGreaterThan(0)
      expect(cascadeNetwork.cascadingEffects.length).toBeGreaterThan(0)

      // Step 4: Apply consequences to world state
      const updateResult = await worldStateUpdater.applyConsequences(validationResult.validConsequences)
      expect(updateResult.success).toBe(true)
      expect(updateResult.appliedConsequences.length).toBeGreaterThan(0)
      expect(updateResult.metadata.affectedSystems.length).toBeGreaterThan(0)

      // Verify world state was updated
      expect(mockLayer3State.updateWorldState).toHaveBeenCalled()
    })

    it('should handle conflicting consequences appropriately', async () => {
      // Create conflicting consequences
      const conflictingConsequences: AIConsequence[] = [
        {
          id: 'conflict-1',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'The village elder becomes your enemy',
          impact: {
            level: 'major' as any,
            affectedSystems: ['relationship', 'social'],
            magnitude: 8,
            duration: 'long_term' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        },
        {
          id: 'conflict-2',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'The village elder becomes your closest ally',
          impact: {
            level: 'major' as any,
            affectedSystems: ['relationship', 'social'],
            magnitude: 8,
            duration: 'long_term' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        }
      ]

      // Validate should detect conflicts
      const validationResult = await consequenceValidator.validateConsequences(conflictingConsequences)
      expect(validationResult.validConsequences.length).toBeLessThan(2) // Should resolve conflict
      expect(validationResult.conflicts.length).toBeGreaterThan(0)

      // Should apply only one of the conflicting consequences
      const updateResult = await worldStateUpdater.applyConsequences(validationResult.validConsequences)
      expect(updateResult.success).toBe(true)
      expect(updateResult.appliedConsequences.length).toBe(1)
    })

    it('should maintain performance requirements for complex scenarios', async () => {
      // Create a complex scenario with many consequences
      const complexConsequences: AIConsequence[] = Array.from({ length: 20 }, (_, i) => ({
        id: `complex-${i}`,
        actionId: 'test-action',
        type: Object.values(ConsequenceType)[i % Object.values(ConsequenceType).length],
        description: `Complex consequence ${i} affecting multiple systems with significant impact`,
        impact: {
          level: 'moderate' as any,
          affectedSystems: ['world_state', 'economic', 'social'],
          magnitude: 6,
          duration: 'medium_term' as any
        },
        cascadingEffects: Array.from({ length: 2 }, (_, j) => ({
          id: `cascade-${i}-${j}`,
          parentConsequenceId: `complex-${i}`,
          description: `Secondary effect ${j}`,
          delay: (i + 1) * 1000,
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

      // Process the complex scenario
      const validationResult = await consequenceValidator.validateConsequences(complexConsequences)
      const cascadeNetwork = await cascadeProcessor.processCascadingEffects(validationResult.validConsequences)
      const updateResult = await worldStateUpdater.applyConsequences(validationResult.validConsequences)

      const processingTime = Date.now() - startTime

      // Should complete within performance requirements
      expect(processingTime).toBeLessThan(15000) // 15 seconds
      expect(validationResult.validConsequences.length).toBeGreaterThan(0)
      expect(cascadeNetwork.totalEffects).toBeGreaterThan(0)
      expect(updateResult.success).toBe(true)
    })

    it('should create appropriate cascading effects across multiple levels', async () => {
      const primaryConsequences: AIConsequence[] = [
        {
          id: 'primary-1',
          actionId: 'test-action',
          type: ConsequenceType.COMBAT,
          description: 'A major battle is won against the local dragon',
          impact: {
            level: 'critical' as any,
            affectedSystems: ['combat', 'social', 'economic'],
            magnitude: 10,
            duration: 'permanent' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.9
        }
      ]

      const cascadeNetwork = await cascadeProcessor.processCascadingEffects(primaryConsequences, {
        maxCascadingLevels: 3,
        maxEffectsPerLevel: 3,
        probabilityThreshold: 0.3
      })

      // Should generate cascading effects across multiple levels
      expect(cascadeNetwork.totalEffects).toBeGreaterThan(0)
      expect(cascadeNetwork.maxCascadeDepth).toBeGreaterThan(1)

      // Should have relationships between effects
      expect(cascadeNetwork.relationships.length).toBeGreaterThan(0)

      // Each relationship should have valid parent-child links
      cascadeNetwork.relationships.forEach(relationship => {
        expect(relationship.parentId).toBeDefined()
        expect(relationship.childId).toBeDefined()
        expect(relationship.strength).toBeGreaterThan(0)
        expect(relationship.strength).toBeLessThanOrEqual(1)
      })
    })

    it('should generate 2-4 consequences per action as required by AC', async () => {
      const testRequest = createTestAction()

      // Mock a typical AI response
      const typicalAIResponse = `The action creates the following effects:
1. The village elder becomes more friendly
2. Trade opportunities expand
3. Local reputation improves`

      // Mock the AI service to parse this response
      const mockAIResponse = {
        id: 'ai-response-123',
        requestId: 'test-ai-request',
        content: typicalAIResponse,
        consequences: [],
        tokenUsage: { promptTokens: 100, completionTokens: 150, totalTokens: 250, estimatedCost: 0.0015 },
        processingTime: 0,
        timestamp: new Date().toISOString(),
        model: 'gpt-3.5-turbo',
        success: true
      }

      jest.spyOn(aiServiceAdapter, 'processAction').mockResolvedValue(mockAIResponse)

      const result = await aiServiceAdapter.processAction(testRequest)

      // Should generate 2-4 consequences as per AC requirements
      expect(result.consequences.length).toBeGreaterThanOrEqual(2)
      expect(result.consequences.length).toBeLessThanOrEqual(4)
    })

    it('should create consequences that affect character relationships, environment, and future possibilities', async () => {
      const comprehensiveConsequences: AIConsequence[] = [
        {
          id: 'comprehensive-1',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'The village elder becomes your trusted advisor',
          impact: {
            level: 'major' as any,
            affectedSystems: ['relationship', 'social'],
            magnitude: 8,
            duration: 'long_term' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.9
        },
        {
          id: 'comprehensive-2',
          actionId: 'test-action',
          type: ConsequenceType.ENVIRONMENT,
          description: 'The village entrance becomes more welcoming with new decorations',
          impact: {
            level: 'minor' as any,
            affectedSystems: ['environment'],
            magnitude: 3,
            duration: 'short_term' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.7
        }
      ]

      // Apply consequences to see if they affect world state appropriately
      const updateResult = await worldStateUpdater.applyConsequences(comprehensiveConsequences)

      expect(updateResult.success).toBe(true)
      expect(updateResult.metadata.affectedSystems).toContain('relationship')
      expect(updateResult.metadata.affectedSystems).toContain('environment')

      // Check that character relationships were updated
      expect(mockLayer3State.updateWorldState).toHaveBeenCalled()

      // The audit trail should show relationship and environment changes
      const relationshipAudit = updateResult.auditTrail.filter(a => a.system === 'relationship')
      const environmentAudit = updateResult.auditTrail.filter(a => a.system === 'environment')

      expect(relationshipAudit.length).toBeGreaterThan(0)
      expect(environmentAudit.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle AI service failure gracefully', async () => {
      // Mock AI service failure
      jest.spyOn(aiServiceAdapter, 'processAction').mockRejectedValue(new Error('AI service unavailable'))

      const testRequest = createTestAction()

      // Should not throw but should return error response
      const result = await aiServiceAdapter.processAction(testRequest)
      expect(result.success).toBe(false)
      expect(result.consequences).toHaveLength(0)
      expect(result.error).toBeDefined()
    })

    it('should handle world state update failures gracefully', async () => {
      // Mock world state update failure
      mockLayer3State.updateWorldState.mockRejectedValue(new Error('Storage unavailable'))

      const testConsequences: AIConsequence[] = [
        {
          id: 'test-1',
          actionId: 'test-action',
          type: ConsequenceType.WORLD_STATE,
          description: 'A simple consequence',
          impact: {
            level: 'minor' as any,
            affectedSystems: ['world_state'],
            magnitude: 2,
            duration: 'temporary' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        }
      ]

      const updateResult = await worldStateUpdater.applyConsequences(testConsequences)

      expect(updateResult.success).toBe(false)
      expect(updateResult.conflicts).toHaveLength(1)
      expect(updateResult.conflicts[0].type).toBe('state_conflict')
      expect(updateResult.conflicts[0].severity).toBe('critical')
    })

    it('should handle partial success scenarios appropriately', async () => {
      // Create a mix of valid and invalid consequences
      const mixedConsequences: AIConsequence[] = [
        {
          id: 'valid-1',
          actionId: 'test-action',
          type: ConsequenceType.RELATIONSHIP,
          description: 'A valid relationship consequence with proper description',
          impact: {
            level: 'moderate' as any,
            affectedSystems: ['relationship'],
            magnitude: 5,
            duration: 'medium_term' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        },
        {
          id: 'invalid-1',
          actionId: 'test-action',
          type: 'invalid_type' as any,
          description: 'Too', // Too short
          impact: {
            level: 'invalid_level' as any,
            affectedSystems: [],
            magnitude: 15, // Invalid
            duration: 'invalid_duration' as any
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 2.0 // Invalid
        }
      ]

      const validationResult = await consequenceValidator.validateConsequences(mixedConsequences)

      // Should filter out invalid consequences
      expect(validationResult.validConsequences.length).toBe(1)
      expect(validationResult.invalidConsequences.length).toBe(1)

      // Should apply only the valid one
      const updateResult = await worldStateUpdater.applyConsequences(validationResult.validConsequences)
      expect(updateResult.success).toBe(true)
      expect(updateResult.appliedConsequences).toHaveLength(1)
    })
  })
})