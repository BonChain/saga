/**
 * Character Service Tests - Story 4.1: Character Memory & Relationship Tracking
 *
 * Unit tests for CharacterService methods including memory management,
 * relationship tracking, and CRUD operations.
 */

import { CharacterService } from '../src/services/character-service'
import { CharacterWorldIntegration } from '../src/services/character-world-integration'
import {
  Character,
  MemoryCreateParams,
  Personality,
  EmotionalImpact,
  CHARACTER_CONSTANTS
} from '../src/models/character'

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}

const mockWorldService = {
  getWorldState: jest.fn(),
  updateCharacterState: jest.fn()
}

const mockLayer3State = {
  getStoragePath: jest.fn().mockReturnValue('/mock/storage'),
  write: jest.fn(),
  read: jest.fn(),
  listFiles: jest.fn()
}

const mockCharacterWorldIntegration = {
  loadCharacter: jest.fn(),
  saveCharacterState: jest.fn()
} as any

describe('CharacterService', () => {
  let characterService: CharacterService

  beforeEach(() => {
    jest.clearAllMocks()
    characterService = new CharacterService({
      logger: mockLogger as any,
      worldService: mockWorldService,
      characterWorldIntegration: mockCharacterWorldIntegration,
      memoryCapacity: 100,
      enableMemoryCompression: true
    })
  })

  describe('addMemory', () => {
    it('should create a memory successfully', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const memoryParams: MemoryCreateParams = {
        characterId,
        playerId: 'player-1',
        action: 'helped the villager',
        actionType: 'help',
        location: 'village',
        description: 'Assisted with village repairs',
        emotionalImpact: EmotionalImpact.POSITIVE
      }

      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {},
        description: 'Test character',
        backstory: 'A test character',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)
      mockCharacterWorldIntegration.saveCharacterState.mockResolvedValue()

      // Act
      const result = await characterService.addMemory(memoryParams)

      // Assert
      expect(result).toBeDefined()
      expect(result.characterId).toBe(characterId)
      expect(result.playerId).toBe('player-1')
      expect(result.action).toBe('helped the villager')
      expect(result.actionType).toBe('help')
      expect(result.emotionalImpact).toBe(EmotionalImpact.POSITIVE)
      expect(result.isActive).toBe(true)

      expect(mockCharacterWorldIntegration.loadCharacter).toHaveBeenCalledWith(characterId)
      expect(mockCharacterWorldIntegration.saveCharacterState).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should throw error when character not found', async () => {
      // Arrange
      const memoryParams: MemoryCreateParams = {
        characterId: 'nonexistent-character',
        playerId: 'player-1',
        action: 'test action',
        actionType: 'social',
        location: 'test',
        description: 'test description',
        emotionalImpact: EmotionalImpact.NEUTRAL
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(null)

      // Act & Assert
      await expect(characterService.addMemory(memoryParams)).rejects.toThrow('Character not found: nonexistent-character')
    })

    it('should compress memories when capacity exceeded', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const memoryParams: MemoryCreateParams = {
        characterId,
        playerId: 'player-1',
        action: 'test action',
        actionType: 'social',
        location: 'test',
        description: 'test description',
        emotionalImpact: EmotionalImpact.NEUTRAL
      }

      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: Array(110).fill(null).map((_, i) => ({
          id: `memory-${i}`,
          characterId,
          action: `Action ${i}`,
          actionType: 'social' as const,
          timestamp: Date.now() - i,
          location: 'test',
          description: `Test memory ${i}`,
          emotionalImpact: EmotionalImpact.NEUTRAL,
          context: {},
          isActive: true
        })),
        memoryStats: {
          totalMemories: 110,
          activeMemories: 110,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'test',
        relationships: {},
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)
      mockCharacterWorldIntegration.saveCharacterState.mockResolvedValue()

      // Act
      await characterService.addMemory(memoryParams)

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Compressing memories for character test-character-1',
        { activeMemories: 111 }
      )
    })
  })

  describe('getCharacterMemories', () => {
    it('should return filtered memories', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [
          {
            id: 'memory-1',
            characterId,
            playerId: 'player-1',
            action: 'helped',
            actionType: 'help',
            timestamp: Date.now() - 1000,
            location: 'village',
            description: 'Helped with repairs',
            emotionalImpact: EmotionalImpact.POSITIVE,
            context: {},
            isActive: true
          },
          {
            id: 'memory-2',
            characterId,
            playerId: 'player-2',
            action: 'traded',
            actionType: 'trade',
            timestamp: Date.now() - 2000,
            location: 'market',
            description: 'Traded goods',
            emotionalImpact: EmotionalImpact.NEUTRAL,
            context: {},
            isActive: true
          }
        ],
        memoryStats: {
          totalMemories: 2,
          activeMemories: 2,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'village',
        relationships: {},
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)

      // Act
      const result = await characterService.getCharacterMemories(characterId, {
        playerId: 'player-1',
        limit: 10
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].playerId).toBe('player-1')
      expect(result[0].action).toBe('helped')
    })

    it('should throw error when character not found', async () => {
      // Arrange
      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(null)

      // Act & Assert
      await expect(characterService.getCharacterMemories('nonexistent')).rejects.toThrow('Character not found: nonexistent')
    })
  })

  describe('updateRelationshipScore', () => {
    it('should update relationship scores correctly', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const targetId = 'player-1'
      const changes = { friendship: 10, trust: 5 }

      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'test',
        relationships: {},
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)
      mockCharacterWorldIntegration.saveCharacterState.mockResolvedValue()

      // Act
      const result = await characterService.updateRelationshipScore(characterId, targetId, changes)

      // Assert
      expect(result).toBeDefined()
      expect(result.characterId).toBe(characterId)
      expect(result.targetId).toBe(targetId)
      expect(result.scores.friendship).toBe(10)
      expect(result.scores.trust).toBe(5)
      expect(result.totalInteractions).toBe(1)
    })

    it('should respect score bounds', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const targetId = 'player-1'
      const changes = { friendship: 200 } // Above max limit

      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'test',
        relationships: {},
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)
      mockCharacterWorldIntegration.saveCharacterState.mockResolvedValue()

      // Act
      const result = await characterService.updateRelationshipScore(characterId, targetId, changes)

      // Assert
      expect(result.scores.friendship).toBe(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE)
    })
  })

  describe('createCharacter', () => {
    it('should create a character successfully', async () => {
      // Arrange
      const characterParams = {
        name: 'Test Character',
        personality: Personality.FRIENDLY as Personality,
        description: 'A friendly test character',
        backstory: 'Test backstory',
        currentLocation: 'village',
        appearance: {
          physicalDescription: 'Test appearance'
        }
      }

      mockCharacterWorldIntegration.saveCharacterState.mockResolvedValue()

      // Act
      const result = await characterService.createCharacter(characterParams)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe('Test Character')
      expect(result.personality).toBe(Personality.FRIENDLY)
      expect(result.type).toBe('npc')
      expect(result.memories).toHaveLength(0)
      expect(result.memoryStats.totalMemories).toBe(0)
      expect(mockCharacterWorldIntegration.saveCharacterState).toHaveBeenCalled()
    })
  })

  describe('updateCharacter', () => {
    it('should update character fields', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const updateParams = {
        name: 'Updated Name',
        currentLocation: 'city'
      }

      const mockCharacter: Character = {
        id: characterId,
        name: 'Original Name',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'village',
        relationships: {},
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)
      mockCharacterWorldIntegration.saveCharacterState.mockResolvedValue()

      // Act
      const result = await characterService.updateCharacter(characterId, updateParams)

      // Assert
      expect(result.name).toBe('Updated Name')
      expect(result.currentLocation).toBe('city')
      expect(result.version).toBe(2)
    })

    it('should throw error when character not found', async () => {
      // Arrange
      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(null)

      // Act & Assert
      await expect(characterService.updateCharacter('nonexistent', {})).rejects.toThrow('Character not found: nonexistent')
    })
  })

  describe('validateCharacter', () => {
    it('should validate character successfully', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'test',
        relationships: {
          'relationship-1': {
            id: 'relationship-1',
            characterId,
            targetId: 'player-1',
            scores: {
              friendship: 50,
              hostility: 0,
              loyalty: 25,
              respect: 75,
              fear: 10,
              trust: 60
            },
            lastInteraction: Date.now(),
            totalInteractions: 5,
            relationshipType: 'npc-player',
            sharedExperiences: {
              events: [],
              locations: [],
              timeSpent: 0
            },
            modifiers: {
              personalityCompatibility: 0.8,
              externalInfluences: []
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        },
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)

      // Act
      const result = await characterService.validateCharacter(characterId)

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.summary.characterId).toBe(characterId)
    })

    it('should detect invalid relationship scores', async () => {
      // Arrange
      const characterId = 'test-character-1'
      const mockCharacter: Character = {
        id: characterId,
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        currentLocation: 'test',
        relationships: {
          'relationship-1': {
            id: 'relationship-1',
            characterId,
            targetId: 'player-1',
            scores: {
              friendship: 150, // Invalid - above max
              hostility: -150, // Invalid - below min
              loyalty: 25,
              respect: 75,
              fear: 10,
              trust: 60
            },
            lastInteraction: Date.now(),
            totalInteractions: 5,
            relationshipType: 'npc-player',
            sharedExperiences: {
              events: [],
              locations: [],
              timeSpent: 0
            },
            modifiers: {
              personalityCompatibility: 0.8,
              externalInfluences: []
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        },
        description: 'Test character',
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterWorldIntegration.loadCharacter.mockResolvedValue(mockCharacter)

      // Act
      const result = await characterService.validateCharacter(characterId)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('friendship'))).toBe(true)
      expect(result.errors.some(e => e.includes('hostility'))).toBe(true)
    })
  })
})