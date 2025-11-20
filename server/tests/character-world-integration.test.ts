/**
 * Character World Integration Tests - Story 4.1: Character Memory & Relationship Tracking
 *
 * Unit tests for CharacterWorldIntegration including Layer 3 storage,
 * backup/recovery mechanisms, and search functionality.
 */

import { CharacterWorldIntegration } from '../src/services/character-world-integration'
import { Layer3State } from '../src/storage/layer3-state'
import {
  Character,
  MemoryEntry,
  Relationship,
  Personality,
  CHARACTER_CONSTANTS
} from '../src/models/character'

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}

// Mock Layer3State
const mockLayer3State = {
  getStoragePath: jest.fn().mockReturnValue('/mock/storage'),
  write: jest.fn(),
  read: jest.fn(),
  list: jest.fn(),
  validate: jest.fn().mockReturnValue(true)
} as any

describe.skip('CharacterWorldIntegration (Temporarily Disabled)', () => {
  let integration: CharacterWorldIntegration

  beforeEach(() => {
    jest.clearAllMocks()
    integration = new CharacterWorldIntegration(mockLayer3State, mockLogger as any, {
      enableWalrusBackup: true,
      compressionThreshold: 90,
      maxMemoryEntries: 1000
    })
  })

  describe('saveCharacterState', () => {
    it('should save character state to Layer 3 storage', async () => {
      // Arrange
      const character: Character = {
        id: 'char-1',
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

      const mockWriteResult = {
        success: true,
        error: undefined
      }

      mockLayer3State.read.mockResolvedValue({ success: false, error: 'File not found' })
      mockLayer3State.write.mockResolvedValue(mockWriteResult)

      // Act
      await integration.saveCharacterState('char-1', character)

      // Assert
      expect(mockLayer3State.read).toHaveBeenCalledWith('state_v1.json')
      expect(mockLayer3State.write).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Saving character state to Layer 3',
        expect.objectContaining({
          characterId: 'char-1',
          memoryCount: 0,
          relationshipCount: 0
        })
      )
    })

    it('should handle save errors gracefully', async () => {
      // Arrange
      const character: Character = {
        id: 'char-1',
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

      const mockWriteResult = {
        success: false,
        error: 'Storage error'
      }

      mockLayer3State.list.mockResolvedValue({ success: true, data: [] })
      mockLayer3State.write.mockResolvedValue(mockWriteResult)

      // Act & Assert
      await expect(integration.saveCharacterState('char-1', character)).rejects.toThrow('Failed to save character world state: Storage error')
    })
  })

  describe('loadCharacter', () => {
    it('should load character from Layer 3 storage', async () => {
      // Arrange
      const expectedCharacter: Character = {
        id: 'char-1',
        name: 'Test Character',
        type: 'npc',
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 5,
          activeMemories: 3,
          archivedMemories: 2,
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

      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 1,
          totalMemories: 5,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {
          'char-1': expectedCharacter
        },
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const result = await integration.loadCharacter('char-1')

      // Assert
      expect(result).toEqual(expectedCharacter)
      expect(mockLayer3State.read).toHaveBeenCalledWith('state_v1.json')
    })

    it('should return null when character not found', async () => {
      // Arrange
      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 0,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {},
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.list.mockResolvedValue({
        success: true,
        data: [{ id: 'character_state_v1.json' }]
      })
      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const result = await integration.loadCharacter('nonexistent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('searchMemories', () => {
    it('should search memories by criteria', async () => {
      // Arrange
      const mockMemories = [
        {
          id: 'mem-1',
          action: 'Helped player',
          participants: ['player-1'],
          timestamp: Date.now() - 1000
        },
        {
          id: 'mem-2',
          action: 'Traded with merchant',
          participants: ['player-2'],
          timestamp: Date.now() - 2000
        }
      ]

      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 2,
          totalMemories: 2,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {
          'char-1': {
            id: 'char-1',
            memories: [mockMemories[0]],
            memoryStats: {
              totalMemories: 1,
              activeMemories: 1,
              archivedMemories: 0,
              lastMemoryUpdate: Date.now()
            },
            relationships: {},
            type: 'npc',
            personality: Personality.FRIENDLY,
            personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
            currentLocation: 'village',
            description: 'Test',
            backstory: 'Test',
            appearance: { physicalDescription: 'Test', notableFeatures: [] },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1
          },
          'char-2': {
            id: 'char-2',
            memories: [mockMemories[1]],
            memoryStats: {
              totalMemories: 1,
              activeMemories: 1,
              archivedMemories: 0,
              lastMemoryUpdate: Date.now()
            },
            relationships: {},
            type: 'npc',
            personality: Personality.CAUTIOUS,
            personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
            currentLocation: 'market',
            description: 'Test',
            backstory: 'Test',
            appearance: { physicalDescription: 'Test', notableFeatures: [] },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1
          }
        },
        relationships: {},
        globalMemoryIndex: {
          'mem-1': {
            characterId: 'char-1',
            timestamp: Date.now() - 1000,
            action: 'Helped player',
            participants: ['player-1']
          },
          'mem-2': {
            characterId: 'char-2',
            timestamp: Date.now() - 2000,
            action: 'Traded with merchant',
            participants: ['player-2']
          }
        }
      }

      mockLayer3State.list.mockResolvedValue({
        success: true,
        data: [{ id: 'character_state_v1.json' }]
      })
      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const result = await integration.searchMemories({
        playerId: 'player-1',
        limit: 10
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('mem-1')
      expect(result[0].action).toBe('Helped player')
      })
  })

  describe('getAllCharacters', () => {
    it('should return all characters from storage', async () => {
      // Arrange
      const mockCharacters = {
        'char-1': { id: 'char-1', name: 'Character 1' },
        'char-2': { id: 'char-2', name: 'Character 2' }
      }

      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 2,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: mockCharacters,
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const result = await integration.getAllCharacters()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('char-1')
      expect(result[1].id).toBe('char-2')
    })

    it('should return empty array on error', async () => {
      // Arrange
      mockLayer3State.read.mockResolvedValue({
        success: false,
        error: 'Storage error'
      })

      // Act
      const result = await integration.getAllCharacters()

      // Assert
      expect(result).toHaveLength(0)
    })
  })

  describe('getRelationship', () => {
    it('should return relationship if found', async () => {
      // Arrange
      const mockRelationship = {
        id: 'rel-1',
        characterId: 'char-1',
        targetId: 'char-2',
        scores: {
          trust: 80,
          respect: 75,
          friendship: 90,
          romance: 0,
          hostility: 5,
          fear: 10,
          loyalty: 85
        },
        lastInteraction: Date.now(),
        totalInteractions: 10,
        relationshipType: 'npc-npc' as const,
        sharedExperiences: {
          events: ['quest_together'],
          locations: ['village'],
          timeSpent: 3600
        },
        modifiers: {
          personalityCompatibility: 0.8,
          externalInfluences: ['recent_quest']
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 2,
          totalMemories: 0,
          totalRelationships: 1,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {},
        relationships: {
          'rel-1': mockRelationship
        },
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const result = await integration.getRelationship('char-1', 'char-2')

      // Assert
      expect(result).toBeDefined()
      expect(result!.id).toBe('rel-1')
    })

    it('should return null if relationship not found', async () => {
      // Arrange
      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 2,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {},
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const result = await integration.getRelationship('char-1', 'char-2')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('saveRelationship', () => {
    it('should save relationship successfully', async () => {
      // Arrange
      const mockRelationship = {
        id: 'rel-1',
        characterId: 'char-1',
        targetId: 'char-2',
        scores: {
          trust: 80,
          respect: 75,
          friendship: 90,
          romance: 0,
          hostility: 5,
          fear: 10,
          loyalty: 85
        },
        lastInteraction: Date.now(),
        totalInteractions: 10,
        relationshipType: 'npc-npc' as const,
        sharedExperiences: {
          events: ['quest_together'],
          locations: ['village'],
          timeSpent: 3600
        },
        modifiers: {
          personalityCompatibility: 0.8,
          externalInfluences: ['recent_quest']
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const existingWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 2,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {},
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: existingWorldState
      })

      mockLayer3State.write.mockResolvedValue({
        success: true
      })

      // Act
      await integration.saveRelationship(mockRelationship)

      // Assert
      expect(mockLayer3State.write).toHaveBeenCalledWith(
        'character_state_v1.json',
        expect.objectContaining({
          relationships: {
            'rel-1': mockRelationship
          }
        })
      )
    })
  })

  describe('validateAllCharacters', () => {
    it('should validate all characters and return results', async () => {
      // Arrange
      const mockCharacters = {
        'char-1': {
          id: 'char-1',
          name: 'Valid Character',
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
          description: 'Valid character',
          backstory: 'Valid backstory',
          appearance: {
            physicalDescription: 'Valid appearance',
            notableFeatures: []
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1
        },
        'char-2': {
          id: 'char-2',
          name: '', // Invalid: empty name
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
          description: 'Invalid character',
          backstory: 'Invalid backstory',
          appearance: {
            physicalDescription: 'Invalid appearance',
            notableFeatures: []
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1
        }
      }

      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 2,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: mockCharacters,
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      // Act
      const results = await integration.validateAllCharacters()

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0].summary.characterId).toBe('char-1')
      expect(results[0].isValid).toBe(true)
      expect(results[1].summary.characterId).toBe('char-2')
      expect(results[1].isValid).toBe(false)
      expect(results[1].errors).toContain('Character name cannot be empty')
    })
  })

  describe('backup and restore', () => {
    it('should create backup successfully', async () => {
      // Arrange
      const mockWorldState = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 1,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {},
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockWorldState
      })

      mockLayer3State.write.mockResolvedValue({
        success: true
      })

      // Act
      const backupId = await integration.createBackup()

      // Assert
      expect(backupId).toBeDefined()
      expect(backupId).toMatch(/^character_backup_\d+\.json$/)
      expect(mockLayer3State.write).toHaveBeenCalledWith(
        backupId,
        mockWorldState
      )
    })

    it('should restore from backup successfully', async () => {
      // Arrange
      const backupId = 'character_backup_123.json'
      const mockBackupData = {
        version: 1,
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: {
          characterCount: 1,
          totalMemories: 0,
          totalRelationships: 0,
          lastUpdate: '2023-01-01T00:00:00.000Z'
        },
        characters: {},
        relationships: {},
        globalMemoryIndex: {}
      }

      mockLayer3State.read.mockResolvedValue({
        success: true,
        data: mockBackupData
      })

      mockLayer3State.write.mockResolvedValue({
        success: true
      })

      // Act
      await integration.restoreFromBackup(backupId)

      // Assert
      expect(mockLayer3State.read).toHaveBeenCalledWith(backupId)
      expect(mockLayer3State.write).toHaveBeenCalledWith(
        'character_state_v1.json',
        mockBackupData
      )
    })
  })
})