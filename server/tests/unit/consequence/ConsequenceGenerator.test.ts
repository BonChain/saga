/**
 * Unit Tests for ConsequenceGenerator Service
 * Story 3.2: Consequence Generation & World Changes
 */

import { ConsequenceGenerator } from '../../../src/services/ConsequenceGenerator'
import { AIRequest, AIConsequence, ConsequenceType } from '../../../src/types/ai'
import { Layer1Blueprint } from '../../../src/storage/Layer1Blueprint'

// Mock Layer1Blueprint
jest.mock('../../../src/storage/Layer1Blueprint')

describe('ConsequenceGenerator', () => {
  let consequenceGenerator: ConsequenceGenerator
  let mockLayer1Blueprint: jest.Mocked<Layer1Blueprint>

  beforeEach(() => {
    mockLayer1Blueprint = new Layer1Blueprint('') as jest.Mocked<Layer1Blueprint>
    mockLayer1Blueprint.getWorldRules = jest.fn().mockResolvedValue([])

    consequenceGenerator = new ConsequenceGenerator(mockLayer1Blueprint)
  })

  describe('generateConsequences', () => {
    const createMockRequest = (actionId: string = 'test-action'): AIRequest => ({
      id: 'req-1',
      actionId,
      promptType: 'consequence_generation' as any,
      context: {
        actionId,
        playerIntent: 'test action',
        originalInput: 'test input',
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
      prompt: 'Generate consequences for this action',
      timestamp: new Date().toISOString()
    })

    it('should parse JSON formatted consequences correctly', async () => {
      const jsonContent = `Here are the consequences:
\`\`\`json
[
  {
    "type": "relationship",
    "description": "The village elder becomes more friendly towards the player",
    "impact": {
      "level": "moderate",
      "affectedSystems": ["relationship", "social"],
      "magnitude": 6,
      "duration": "medium_term"
    },
    "cascadingEffects": [
      {
        "description": "Other villagers notice the improved relationship",
        "delay": 5000,
        "probability": 0.7,
        "impact": {
          "level": "minor",
          "affectedSystems": ["social"],
          "magnitude": 3,
          "duration": "temporary"
        }
      }
    ]
  },
  {
    "type": "environment",
    "description": "The forest near the village becomes safer",
    "impact": {
      "level": "major",
      "affectedSystems": ["environment", "safety"],
      "magnitude": 7,
      "duration": "long_term"
    }
  }
]
\`\`\``

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(jsonContent, request)

      expect(result.parsingSuccess).toBe(true)
      expect(result.consequences).toHaveLength(2)
      expect(result.consequences[0].type).toBe(ConsequenceType.RELATIONSHIP)
      expect(result.consequences[1].type).toBe(ConsequenceType.ENVIRONMENT)
      expect(result.metadata.sourceFormat).toBe('json')
    })

    it('should parse structured list consequences correctly', async () => {
      const listContent = `Here are the consequences of your action:
1. The village market becomes more active with increased trade
2. Local merchants offer better prices to the player
3. The town's economy improves significantly
4. Other players hear about the economic benefits`

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(listContent, request)

      expect(result.parsingSuccess).toBe(true)
      expect(result.consequences.length).toBeGreaterThan(0)
      expect(result.consequences.every(c => c.description.length > 10)).toBe(true)
      expect(result.metadata.sourceFormat).toBe('structured_text')
    })

    it('should parse narrative text consequences correctly', async () => {
      const narrativeContent = `The action results in significant changes to the local community.
The village becomes more prosperous as trade increases.
The economy begins to thrive as merchants bring new goods to market.
This creates new opportunities for all players in the area.`

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(narrativeContent, request)

      expect(result.parsingSuccess).toBe(true)
      expect(result.consequences.length).toBeGreaterThan(0)
      expect(result.consequences[0].type).toBe(ConsequenceType.ECONOMIC)
      expect(result.metadata.sourceFormat).toBe('plain_text')
    })

    it('should handle invalid content gracefully', async () => {
      const invalidContent = 'This is just some text without consequence indicators.'

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(invalidContent, request)

      expect(result.parsingSuccess).toBe(true) // Falls back to basic consequence
      expect(result.consequences).toHaveLength(1)
      expect(result.consequences[0].type).toBe(ConsequenceType.WORLD_STATE)
      expect(result.metadata.sourceFormat).toBe('fallback')
    })

    it('should respect maxConsequences option', async () => {
      const manyConsequencesContent = `
1. First consequence
2. Second consequence
3. Third consequence
4. Fourth consequence
5. Fifth consequence
6. Sixth consequence`

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(manyConsequencesContent, request, {
        maxConsequences: 3
      })

      expect(result.consequences).toHaveLength(3)
    })

    it('should validate and filter consequences', async () => {
      const invalidConsequences = [{
        type: 'invalid_type',
        description: 'Too short',
        impact: {
          level: 'invalid_level',
          affectedSystems: [],
          magnitude: 15, // Invalid: > 10
          duration: 'invalid_duration'
        }
      }]

      // Mock JSON parsing to return invalid consequences
      const jsonContent = `\`\`\`json\n${JSON.stringify(invalidConsequences)}\n\`\`\``

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(jsonContent, request)

      // Should fall back to basic consequence due to validation failures
      expect(result.consequences).toHaveLength(1)
      expect(result.consequences[0].type).toBe(ConsequenceType.WORLD_STATE)
    })

    it('should generate cascading effects when appropriate', async () => {
      const contentWithCascading = `The combat victory creates political tension.
The enemy faction becomes hostile towards the player.
Allied characters celebrate the victory.
The region's power dynamics shift significantly.`

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(contentWithCascading, request)

      const combatConsequences = result.consequences.filter(c => c.type === ConsequenceType.COMBAT)
      expect(combatConsequences.length).toBeGreaterThan(0)

      // Combat consequences should have cascading effects
      const combatConsequence = combatConsequences[0]
      expect(combatConsequence.cascadingEffects.length).toBeGreaterThan(0)
    })

    it('should limit consequence descriptions to reasonable length', async () => {
      const longContent = `This is an extremely long consequence that goes on and on and describes many different aspects of what happened in great detail and includes a lot of unnecessary information that should probably be truncated for better performance and readability in the game interface because really long consequences can be difficult for players to read and understand quickly.`

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(longContent, request)

      expect(result.consequences.every(c => c.description.length <= 200)).toBe(true)
    })

    it('should prioritize high-impact consequences', async () => {
      const mixedImpactContent = `
1. A minor improvement to the weather
2. A critical change to the village's economy
3. A moderate increase in local trade
4. A major political shift in power
5. A slight improvement in character mood`

      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(mixedImpactContent, request, {
        maxConsequences: 3
      })

      // Should prioritize the high-impact consequences (economy, political shift, trade)
      const economicConsequence = result.consequences.find(c => c.type === ConsequenceType.ECONOMIC)
      expect(economicConsequence).toBeDefined()

      // Check that high magnitude consequences are prioritized
      const sortedByMagnitude = [...result.consequences].sort((a, b) => b.impact.magnitude - a.impact.magnitude)
      expect(result.consequences).toEqual(sortedByMagnitude)
    })
  })

  describe('Consequence Type Inference', () => {
    it('should correctly infer relationship consequences', async () => {
      const relationshipContent = 'The village elder becomes your ally and offers support in future endeavors.'
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(relationshipContent, request)

      expect(result.consequences[0].type).toBe(ConsequenceType.RELATIONSHIP)
    })

    it('should correctly infer environment consequences', async () => {
      const environmentContent = 'The forest becomes more peaceful and wildlife thrives.'
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(environmentContent, request)

      expect(result.consequences[0].type).toBe(ConsequenceType.ENVIRONMENT)
    })

    it('should correctly infer economic consequences', async () => {
      const economicContent = 'Trade routes open up and the market becomes more active.'
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(economicContent, request)

      expect(result.consequences[0].type).toBe(ConsequenceType.ECONOMIC)
    })

    it('should correctly infer combat consequences', async () => {
      const combatContent = 'The battle results in victory and your reputation as a warrior grows.'
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(combatContent, request)

      expect(result.consequences[0].type).toBe(ConsequenceType.COMBAT)
    })
  })

  describe('Impact Assessment', () => {
    it('should calculate appropriate impact levels from keywords', async () => {
      const criticalContent = 'The massive victory catastrophically changes the region\'s power structure.'
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(criticalContent, request)

      expect(result.consequences[0].impact.level).toBe('critical')
      expect(result.consequences[0].impact.magnitude).toBeGreaterThan(7)
    })

    it('should identify affected systems from content', async () => {
      const villageEconomyContent = 'The village market thrives and trade brings prosperity to the local community.'
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(villageEconomyContent, request)

      expect(result.consequences[0].impact.affectedSystems).toContain('economic')
      expect(result.consequences[0].impact.affectedSystems).toContain('social')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = `\`\`\`json\n{ "invalid": json structure }\n\`\`\``
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(malformedJson, request)

      expect(result.parsingSuccess).toBe(true) // Falls back gracefully
      expect(result.consequences).toHaveLength(1)
      expect(result.errors).toHaveLength(0) // No errors should be returned to caller
    })

    it('should handle empty content gracefully', async () => {
      const emptyContent = ''
      const request = createMockRequest()
      const result = await consequenceGenerator.generateConsequences(emptyContent, request)

      expect(result.parsingSuccess).toBe(true) // Falls back to basic consequence
      expect(result.consequences).toHaveLength(1)
    })

    it('should handle very long content without performance issues', async () => {
      const longContent = 'A consequence. '.repeat(1000) // Create very long content
      const request = createMockRequest()

      const startTime = Date.now()
      const result = await consequenceGenerator.generateConsequences(longContent, request)
      const endTime = Date.now()

      expect(result.parsingSuccess).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Performance Requirements', () => {
    it('should complete processing within 15 seconds for complex input', async () => {
      const complexContent = `
1. The village economy transforms dramatically
2. New trade routes open up across the region
3. Character relationships evolve significantly
4. The political landscape shifts completely
5. Environmental conditions change permanently
6. Military alliances are formed and broken
7. Cultural traditions adapt to new realities
8. Social hierarchies reorganize completely
9. Economic power centers relocate
10. Religious institutions gain influence

Each of these changes creates ripple effects throughout the interconnected systems,
resulting in a complex web of consequences that affect every aspect of village life
and create new opportunities and challenges for all players involved in the region.
      `

      const request = createMockRequest()
      const startTime = Date.now()
      const result = await consequenceGenerator.generateConsequences(complexContent, request)
      const endTime = Date.now()

      expect(result.parsingSuccess).toBe(true)
      expect(result.consequences.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(15000) // Within 15-second requirement
    })
  })
})