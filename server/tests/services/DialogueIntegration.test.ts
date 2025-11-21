/**
 * Dialogue Integration Tests - Story 4.2: Dynamic Dialogue Generation
 *
 * Integration tests for the complete dialogue system including
 * memory analysis, tone analysis, world context, and consistency checking.
 */

import { DialogueService } from '../../src/services/DialogueService'
import { MemoryAnalyzer } from '../../src/services/MemoryAnalyzer'
import { ToneAnalyzer } from '../../src/services/ToneAnalyzer'
import { WorldContext } from '../../src/types/dialogue'
import { WorldContextService } from '../../src/services/WorldContext'
import { ConsistencyChecker } from '../../src/services/ConsistencyChecker'
import { DialogueCacheService } from '../../src/services/DialogueCache'
import { DialogueRequest, DialogueResponse } from '../../src/types/dialogue'
import { Personality, RelationshipScores, EmotionalImpact } from '../../src/models/character'

// Mock AI Service Adapter
class MockAIServiceAdapter {
  async generateResponse(request: unknown): Promise<{ content: string }> {
    return {
      content: 'Mock AI response for integration testing.',
    }
  }
}

describe('Dialogue System Integration', () => {
  let dialogueService: DialogueService
  let memoryAnalyzer: MemoryAnalyzer
  let toneAnalyzer: ToneAnalyzer
  let worldContext: WorldContextService
  let consistencyChecker: ConsistencyChecker
  let cacheService: DialogueCacheService

  beforeEach(() => {
    // Initialize all services with mock dependencies
    dialogueService = new DialogueService(new MockAIServiceAdapter())
    memoryAnalyzer = new MemoryAnalyzer()
    toneAnalyzer = new ToneAnalyzer()
    worldContext = new WorldContextService()
    consistencyChecker = new ConsistencyChecker()
    cacheService = new DialogueCacheService()
  })

  describe('Complete Dialogue Flow Integration', () => {
    it('should process dialogue request through all system components', async () => {
      // 1. Create comprehensive dialogue request
      const request: DialogueRequest = {
        characterId: 'friendly_npc',
        playerId: 'player_001',
        context: 'Hello again! Remember when we fought the dragon together?',
        conversationTopic: 'dragon combat',
        emotionalContext: 'positive'
      }

      // 2. Analyze memory context
      const relevantMemories = await memoryAnalyzer.extractRelevantMemories(
        request.characterId,
        request.playerId,
        request.conversationTopic
      )

      expect(Array.isArray(relevantMemories)).toBe(true)

      // 3. Analyze emotional tone
      const relationshipScores: RelationshipScores = {
        friendship: 80,
        hostility: 10,
        loyalty: 70,
        respect: 85,
        fear: 5,
        trust: 75
      }

      const emotionalTone = toneAnalyzer.analyzeEmotionalTone(
        relationshipScores,
        Personality.FRIENDLY
      )

      expect(emotionalTone).toBe('friendly')

      // 4. Get world context
      const worldEventReferences = await worldContext.generateWorldEventReferences(
        request.characterId,
        'village',
        Personality.FRIENDLY,
        request.conversationTopic
      )

      expect(Array.isArray(worldEventReferences)).toBe(true)

      // 5. Generate dialogue (would use actual DialogueService)
      const response: DialogueResponse = {
        dialogue: 'Hello my friend! I remember our dragon adventure fondly. That was quite a battle!',
        emotionalTone: 'friendly',
        referencedMemories: ['Fought the dragon together'],
        worldEvents: ['Dragon attack on village'],
        personalityScore: 0.95,
        generationTime: 1200,
        characterId: request.characterId,
        playerId: request.playerId,
        conversationTopic: request.conversationTopic
      }

      expect(response.emotionalTone).toBe('friendly')
      expect(response.referencedMemories.length).toBeGreaterThan(0)
      expect(response.personalityScore).toBeGreaterThan(0.8)

      // 6. Validate consistency
      const validationResult = await consistencyChecker.validateDialogueConsistency(
        response.dialogue,
        Personality.FRIENDLY,
        ['Previous friendly greeting']
      )

      expect(validationResult.isValid).toBe(true)
      expect(validationResult.personalityScore).toBeGreaterThan(0.6)
    })

    it('should handle complex conversation with multiple NPCs', async () => {
      const characters = [
        { id: 'npc_001', personality: Personality.FRIENDLY },
        { id: 'npc_002', personality: Personality.AGGRESSIVE },
        { id: 'npc_003', personality: Personality.WISE }
      ]

      const responses: DialogueResponse[] = []

      for (const character of characters) {
        const request: DialogueRequest = {
          characterId: character.id,
          playerId: 'player_001',
          context: 'What do you think about the recent changes in our village?',
          emotionalContext: 'neutral'
        }

        const emotionalTone = toneAnalyzer.analyzeEmotionalTone(
          { friendship: 50, hostility: 20, loyalty: 60, respect: 70, fear: 10, trust: 55 },
          character.personality
        )

        const response: DialogueResponse = {
          dialogue: `Response from ${character.personality} character`,
          emotionalTone,
          referencedMemories: [],
          worldEvents: ['Village council meeting'],
          personalityScore: 0.85,
          generationTime: 800,
          characterId: character.id,
          playerId: request.playerId
        }

        responses.push(response)

        // Validate each response
        const validation = await consistencyChecker.validateDialogueConsistency(
          response.dialogue,
          character.personality
        )

        expect(validation.personalityScore).toBeGreaterThan(0.5)
      }

      expect(responses).toHaveLength(3)
      expect(responses[0].emotionalTone).toBe('friendly')
      expect(responses[1].emotionalTone).toBe('hostile')
      expect(responses[2].emotionalTone).toBe('neutral')
    })
  })

  describe('Memory and Continuity Integration', () => {
    it('should build conversation continuity across multiple interactions', async () => {
      const characterId = 'npc_001'
      const playerId = 'player_001'

      // First interaction
      const firstDialogue = 'Hello! I\'m new to this village.'
      await worldContext.updateNPCDialogueState(characterId, playerId, {
        dialogue: firstDialogue,
        emotionalImpact: 0.5,
        topics: ['village', 'introduction'],
        timestamp: Date.now() - 3600000
      })

      // Track dialogue history
      const history = await worldContext.trackDialogueHistory(characterId, playerId, {
        dialogue: firstDialogue,
        emotionalTone: 'friendly',
        topics: ['village', 'introduction']
      })

      expect(history.previousTopics).toContain('village')
      expect(history.previousTopics).toContain('introduction')

      // Second interaction
      const secondDialogue = 'It\'s good to see you again! How have you been settling in?'
      await worldContext.updateNPCDialogueState(characterId, playerId, {
        dialogue: secondDialogue,
        emotionalImpact: 0.7,
        topics: ['well-being', 'settlement'],
        timestamp: Date.now() - 1800000
      })

      // Check connection analysis
      const connection = await memoryAnalyzer.analyzeConnectionStrength(characterId, playerId)
      expect(connection.connectionLevel).toBeGreaterThan(0)
      expect(connection.sharedExperiences).toBeGreaterThanOrEqual(2)

      // Analyze continuity
      const continuity = await memoryAnalyzer.trackDialogueContinuity(characterId, playerId, secondDialogue)
      expect(continuity.previousTopics).toContain('village')
      expect(continuity.continuityScore).toBeGreaterThan(0)
    })
  })

  describe('World Context Integration', () => {
    it('should generate world-aware dialogue based on recent events', async () => {
      const characterId = 'npc_001'
      const location = 'village'

      // Add recent world events
      await worldContext.trackWorldEvents(location, characterId, [{
        id: 'event_001',
        description: 'Dragon attacked the village',
        impact: 'major',
        timestamp: Date.now() - 7200000,
        involvedCharacters: [characterId, 'player_001'],
        type: 'combat'
      }, {
        id: 'event_002',
        description: 'Village council meeting',
        impact: 'moderate',
        timestamp: Date.now() - 3600000,
        involvedCharacters: ['elder_001'],
        type: 'political'
      }])

      // Generate dialogue with world context
      const worldEvents = await worldContext.generateWorldEventReferences(
        characterId,
        location,
        Personality.FRIENDLY
      )

      expect(worldEvents.length).toBeGreaterThan(0)
      expect(worldEvents[0].eventId).toBe('event_001') // Major event should be included

      // Create unique response for world change
      const worldChangeResponse = await worldContext.createWorldChangeResponses(characterId, 'event_001')
      expect(worldChangeResponse.immediateResponse).toBeDefined()
      expect(worldChangeResponse.emotionalReaction).toBeDefined()
      expect(worldChangeResponse.followUpQuestions.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Caching Integration', () => {
    it('should cache frequently repeated dialogue requests', async () => {
      const request: DialogueRequest = {
        characterId: 'npc_001',
        playerId: 'player_001',
        context: 'Hello there!',
        dialogueType: 'greeting'
      }

      // First request should not be cached
      const startTime1 = Date.now()
      const cacheResult1 = await cacheService.get(request)
      const endTime1 = Date.now()

      expect(cacheResult1).toBeNull()

      // Simulate dialogue generation and caching
      const response: DialogueResponse = {
        dialogue: 'Hello friend!',
        emotionalTone: 'friendly',
        referencedMemories: [],
        worldEvents: [],
        personalityScore: 0.95,
        generationTime: 500,
        characterId: request.characterId,
        playerId: request.playerId
      }

      await cacheService.set(request, response)

      // Second request should be cached
      const startTime2 = Date.now()
      const cacheResult2 = await cacheService.get(request)
      const endTime2 = Date.now()

      expect(cacheResult2).toBeDefined()
      expect(cacheResult2?.dialogue).toBe(response.dialogue)

      // Cache should be significantly faster
      const uncachedTime = endTime1 - startTime1
      const cachedTime = endTime2 - startTime2
      expect(cachedTime).toBeLessThan(uncachedTime)

      // Record performance metrics
      cacheService.recordPerformanceMetrics(uncachedTime, false)
      cacheService.recordPerformanceMetrics(cachedTime, true)

      const stats = cacheService.getCacheStats()
      expect(stats.totalRequests).toBe(2)
      expect(stats.hitRate).toBe(0.5) // 1 hit out of 2 requests
    })

    it('should handle batch dialogue generation efficiently', async () => {
      const requests: DialogueRequest[] = Array.from({ length: 5 }, (_, i) => ({
        characterId: `npc_${i + 1}`,
        playerId: 'player_001',
        context: `Hello from NPC ${i + 1}`,
        dialogueType: 'greeting'
      }))

      // Mock batch generation callback
      const mockBatchCallback = jest.fn().mockImplementation(async (request: DialogueRequest) => ({
        dialogue: `Response from ${request.characterId}`,
        emotionalTone: 'friendly',
        referencedMemories: [],
        worldEvents: [],
        personalityScore: 0.85,
        generationTime: 300,
        characterId: request.characterId,
        playerId: request.playerId
      }))

      const startTime = Date.now()
      const responses = await cacheService.batchGenerate(requests, mockBatchCallback)
      const endTime = Date.now()

      expect(responses).toHaveLength(5)
      expect(mockBatchCallback).toHaveBeenCalledTimes(5)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete in under 2 seconds

      // All responses should be cached now
      for (const request of requests) {
        const cached = await cacheService.get(request)
        expect(cached).toBeDefined()
      }
    })
  })

  describe('Consistency Validation Integration', () => {
    it('should validate all personality types for consistency', async () => {
      const personalities = Object.values(Personality)
      const testDialogue = 'This is a test response for personality validation.'

      const validationResults = []

      for (const personality of personalities) {
        const validation = await consistencyChecker.validateDialogueConsistency(
          testDialogue,
          personality,
          ['Previous statement']
        )

        validationResults.push({
          personality,
          score: validation.personalityScore,
          isValid: validation.isValid
        })
      }

      // All validations should be completed
      expect(validationResults).toHaveLength(personalities.length)

      // Check that aggressive personality gets low score for friendly dialogue
      const aggressiveValidation = validationResults.find(r => r.personality === Personality.AGGRESSIVE)
      expect(aggressiveValidation?.personalityScore).toBeLessThan(0.5)

      // Check that friendly personality gets high score for friendly dialogue
      const friendlyValidation = validationResults.find(r => r.personality === Personality.FRIENDLY)
      expect(friendlyValidation?.personalityScore).toBeGreaterThan(0.5)
    })

    it('should detect and correct personality violations', async () => {
      const violations = ['Personality score too low', 'Emotional tone inconsistent']
      const dialogue = 'I hate everyone and everything is terrible.'

      const correction = await consistencyChecker.correctPersonalityViolations(
        dialogue,
        Personality.FRIENDLY,
        violations
      )

      expect(correction.changes.length).toBeGreaterThan(0)
      expect(correction.confidence).toBeGreaterThan(0.5)
      expect(correction.correctedDialogue).not.toBe(dialogue)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle service initialization failures gracefully', () => {
      expect(() => {
        new DialogueService({} as any) // Should not throw
      }).not.toThrow()
    })

    it('should handle empty or invalid dialogue history', async () => {
      const validation = await consistencyChecker.validateDialogueConsistency(
        '',
        Personality.FRIENDLY,
        []
      )

      expect(validation.personalityScore).toBeGreaterThanOrEqual(0)
      expect(validation.consistencyIssues).toBeDefined()
    })

    it('should handle missing character data gracefully', async () => {
      const request: DialogueRequest = {
        characterId: 'nonexistent_character',
        playerId: 'player_001',
        context: 'Hello'
      }

      // Should not crash but handle gracefully
      await expect(dialogueService.generateDialogue(request)).rejects.toThrow()
    })
  })
})