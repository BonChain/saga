/**
 * Character API Routes Tests - Story 4.1: Character Memory & Relationship Tracking
 *
 * Integration tests for character API endpoints including authentication,
 * rate limiting, and request validation.
 */

import request from 'supertest'
import express from 'express'

import { CharacterService } from '../src/services/character-service'
import { RelationshipManager } from '../src/services/relationship-manager'
import { CharacterWorldIntegration } from '../src/services/character-world-integration'
import { Layer3State } from '../src/storage/layer3-state'
import { createCharacterRoutes } from '../src/routes/api/characters'
import { Personality, Relationship, MemoryEntry } from '../src/models/character'

// Mock dependencies
jest.mock('../src/services/character-service')
jest.mock('../src/services/relationship-manager')
jest.mock('../src/services/character-world-integration')

describe('Character API Routes', () => {
  let app: express.Application
  let mockCharacterService: jest.Mocked<CharacterService>
  let mockRelationshipManager: jest.Mocked<RelationshipManager>
  let mockCharacterWorldIntegration: jest.Mocked<CharacterWorldIntegration>
  let mockLayer3State: jest.Mocked<Layer3State>
  let mockLogger: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mocks
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }

    mockLayer3State = {
      getStoragePath: jest.fn().mockReturnValue('/mock/storage'),
      write: jest.fn(),
      read: jest.fn(),
      listFiles: jest.fn()
    } as any

    mockCharacterWorldIntegration = {
      loadCharacter: jest.fn(),
      saveCharacterState: jest.fn(),
      getAllCharacters: jest.fn(),
      getRelationship: jest.fn(),
      saveRelationship: jest.fn(),
      searchMemories: jest.fn(),
      validateAllCharacters: jest.fn(),
      createBackup: jest.fn(),
      restoreFromBackup: jest.fn()
    } as any

    mockRelationshipManager = {
      calculateRelationshipScores: jest.fn(),
      processWorldEventForNPCRelationships: jest.fn(),
      updateRelationshipFromMemory: jest.fn(),
      applyRelationshipDecay: jest.fn(),
      calculatePersonalityCompatibility: jest.fn(),
      generateRelationshipInsights: jest.fn()
    } as any

    mockCharacterService = {
      createCharacter: jest.fn(),
      getCharacter: jest.fn(),
      getAllCharacters: jest.fn(),
      updateCharacter: jest.fn(),
      addMemory: jest.fn(),
      getCharacterMemories: jest.fn(),
      updateRelationshipScore: jest.fn(),
      getRelationshipStatus: jest.fn(),
      validateCharacter: jest.fn()
    } as any

    // Create express app
    app = express()
    app.use(express.json())

    // Create character routes
    const characterRouter = createCharacterRoutes(
      mockCharacterService,
      mockLogger as any
    )
    app.use('/api/characters', characterRouter)
  })

  describe('GET /api/characters', () => {
    it('should return 200 with empty array when no characters', async () => {
      // Arrange
      mockCharacterService.getAllCharacters.mockResolvedValue([])

      // Act
      const response = await request(app)
        .get('/api/characters')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.characters).toEqual([])
      expect(response.body.data.count).toBe(0)
      expect(response.body.metadata.requestId).toBe('test-123')
    })

    it('should handle query parameters correctly', async () => {
      // Arrange
      const mockCharacters = [
        {
          id: 'char-1',
          name: 'Test Character 1',
          currentLocation: 'village',
          personality: Personality.FRIENDLY,
          type: 'npc' as const,
          memories: [],
          memoryStats: {
            totalMemories: 0,
            activeMemories: 0,
            archivedMemories: 0,
            lastMemoryUpdate: Date.now()
          },
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
      ]

      mockCharacterService.getAllCharacters.mockResolvedValue(mockCharacters)

      // Act
      const response = await request(app)
        .get('/api/characters?location=village&limit=10&offset=5')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.characters).toHaveLength(1)
      expect(mockCharacterService.getAllCharacters).toHaveBeenCalledWith({
        location: 'village',
        limit: 10,
        offset: 5
      })
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      mockCharacterService.getAllCharacters.mockRejectedValue(new Error('Database error'))

      // Act
      const response = await request(app)
        .get('/api/characters')
        .set('x-request-id', 'test-123')
        .expect(500)

      // Assert
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Database error')
    })
  })

  describe('GET /api/characters/:id', () => {
    it('should return 200 with character data', async () => {
      // Arrange
      const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
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
        backstory: 'Test backstory',
        appearance: {
          physicalDescription: 'Test appearance',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterService.getCharacter.mockResolvedValue(mockCharacter)

      // Act
      const response = await request(app)
        .get('/api/characters/char-1')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('char-1')
      expect(response.body.data.name).toBe('Test Character')
      expect(response.body.metadata.requestId).toBe('test-123')
    })

    it('should return 404 when character not found', async () => {
      // Arrange
      mockCharacterService.getCharacter.mockResolvedValue(null)

      // Act
      const response = await request(app)
        .get('/api/characters/nonexistent')
        .set('x-request-id', 'test-123')
        .expect(404)

      // Assert
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Character not found')
    })
  })

  describe('POST /api/characters', () => {
    it('should create character and return 201', async () => {
      // Arrange
      const newCharacterData = {
        name: 'New Character',
        personality: 'friendly',
        description: 'A new friendly character',
        backstory: 'Born in a small village',
        currentLocation: 'village',
        appearance: {
          physicalDescription: 'Human with brown hair'
        }
      }

      const createdCharacter = {
        id: 'char-new',
        name: 'New Character',
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {},
        description: 'A new friendly character',
        backstory: 'Born in a small village',
        appearance: {
          physicalDescription: 'Human with brown hair',
          notableFeatures: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterService.createCharacter.mockResolvedValue(createdCharacter)

      // Act
      const response = await request(app)
        .post('/api/characters')
        .send(newCharacterData)
        .set('x-request-id', 'test-123')
        .expect(201)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('char-new')
      expect(response.body.data.name).toBe('New Character')
      expect(response.body.message).toBe('Character created successfully')
      expect(mockCharacterService.createCharacter).toHaveBeenCalledWith(newCharacterData)
    })

    it('should return 400 for invalid character data', async () => {
      // Arrange
      const invalidData = {
        name: 123, // Invalid type
        // Missing required fields
      }

      // Act
      const response = await request(app)
        .post('/api/characters')
        .send(invalidData)
        .set('x-request-id', 'test-123')
        .expect(400)

      // Assert
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Name is required')
    })
  })

  describe('GET /api/characters/:id/memories', () => {
    it('should return character memories', async () => {
      // Arrange
      const mockMemories = [
        {
          id: 'mem-1',
          characterId: 'char-1',
          playerId: 'player-1',
          action: 'Helped with repairs',
          actionType: 'help' as MemoryEntry['actionType'],
          timestamp: Date.now(),
          location: 'village',
          description: 'Assisted with building repairs',
          emotionalImpact: 1,
          context: {},
          isActive: true
        }
      ]

      mockCharacterService.getCharacter.mockResolvedValue({
        id: 'char-1',
        name: 'Test Character',
        memories: mockMemories,
        memoryStats: {
          totalMemories: 1,
          activeMemories: 1,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {},
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        description: 'Test',
        backstory: 'Test',
        appearance: { physicalDescription: 'Test', notableFeatures: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      })

      mockCharacterService.getCharacterMemories.mockResolvedValue(mockMemories)

      // Act
      const response = await request(app)
        .get('/api/characters/char-1/memories')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.memories).toHaveLength(1)
      expect(response.body.data.memories[0].action).toBe('Helped with repairs')
    })

    it('should filter memories by playerId', async () => {
      // Arrange
      const mockMemories = [
        {
          id: 'mem-1',
          characterId: 'char-1',
          playerId: 'player-1',
          action: 'Helped',
          actionType: 'help' as MemoryEntry['actionType'],
          timestamp: Date.now(),
          location: 'village',
          description: 'Helped player 1',
          emotionalImpact: 1,
          context: {},
          isActive: true
        }
      ]

      const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        memories: mockMemories,
        memoryStats: {
          totalMemories: 1,
          activeMemories: 1,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {},
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        description: 'Test',
        backstory: 'Test',
        appearance: { physicalDescription: 'Test', notableFeatures: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterService.getCharacter.mockResolvedValue(mockCharacter)
      mockCharacterService.getCharacterMemories.mockResolvedValue(mockMemories)

      // Act
      const response = await request(app)
        .get('/api/characters/char-1/memories?playerId=player-1')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.data.memories).toHaveLength(1)
      expect(response.body.data.memories[0].playerId).toBe('player-1')
    })

    it('should return 404 when character not found', async () => {
      // Arrange
      mockCharacterService.getCharacter.mockResolvedValue(null)
      mockCharacterService.getCharacterMemories.mockRejectedValue(new Error('Character not found'))

      // Act
      const response = await request(app)
        .get('/api/characters/nonexistent/memories')
        .set('x-request-id', 'test-123')
        .expect(404)

      // Assert
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Character not found')
    })
  })

  describe('POST /api/characters/:id/memories', () => {
    it('should add memory successfully', async () => {
      // Arrange
      const memoryData = {
        action: 'Helped with quest',
        actionType: 'help' as MemoryEntry['actionType'],
        location: 'forest',
        description: 'Assisted player with difficult quest',
        emotionalImpact: 1
      }

      const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {},
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        description: 'Test',
        backstory: 'Test',
        appearance: { physicalDescription: 'Test', notableFeatures: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      const createdMemory = {
        id: 'mem-new',
        characterId: 'char-1',
        playerId: undefined,
        targetCharacterId: undefined,
        action: 'Helped with quest',
        actionType: 'help' as MemoryEntry['actionType'],
        timestamp: Date.now(),
        location: 'forest',
        description: 'Assisted player with difficult quest',
        emotionalImpact: 1,
        context: {},
        isActive: true
      }

      mockCharacterService.getCharacter.mockResolvedValue(mockCharacter)
      mockCharacterService.addMemory.mockResolvedValue(createdMemory)

      // Act
      const response = await request(app)
        .post('/api/characters/char-1/memories')
        .send(memoryData)
        .set('x-request-id', 'test-123')
        .expect(201)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('mem-new')
      expect(response.body.message).toBe('Memory added successfully')
      expect(mockCharacterService.addMemory).toHaveBeenCalledWith({
        ...memoryData,
        characterId: 'char-1'
      })
    })

    it('should return 400 for invalid memory data', async () => {
      // Arrange
      const invalidMemoryData = {
        action: 123, // Invalid type
        actionType: 'invalid_type',
        location: 'test'
        // Missing description
      }

      // Act
      const response = await request(app)
        .post('/api/characters/char-1/memories')
        .send(invalidMemoryData)
        .set('x-request-id', 'test-123')
        .expect(400)

      // Assert
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Action is required')
    })
  })

  describe('GET /api/characters/:id/relationships', () => {
    it('should return character relationships', async () => {
      // Arrange
      const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {
          'char-1-player-1': {
            id: 'rel-1',
            characterId: 'char-1',
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
            relationshipType: 'npc-player' as Relationship['relationshipType'],
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
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        description: 'Test',
        backstory: 'Test',
        appearance: { physicalDescription: 'Test', notableFeatures: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterService.getCharacter.mockResolvedValue(mockCharacter)

      // Act
      const response = await request(app)
        .get('/api/characters/char-1/relationships')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.relationships).toHaveProperty('char-1-player-1')
      expect(response.body.data.relationshipCount).toBe(1)
    })
  })

  describe('GET /api/characters/:id/profile', () => {
    it('should return character profile with relationship summary', async () => {
      // Arrange
      const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        memories: [],
        memoryStats: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          lastMemoryUpdate: Date.now()
        },
        currentLocation: 'village',
        relationships: {
          'char-1-player-1': {
            id: 'rel-1',
            characterId: 'char-1',
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
            relationshipType: 'npc-player' as Relationship['relationshipType'],
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
        type: 'npc' as const,
        personality: Personality.FRIENDLY,
        personalityModifiers: {
          openness: 0.5,
          empathy: 0.5,
          curiosity: 0.5,
          aggression: 0.5
        },
        description: 'Test',
        backstory: 'Test',
        appearance: { physicalDescription: 'Test', notableFeatures: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }

      mockCharacterService.getCharacter.mockResolvedValue(mockCharacter)

      // Act
      const response = await request(app)
        .get('/api/characters/char-1/profile')
        .set('x-request-id', 'test-123')
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.relationshipSummary).toBeDefined()
      expect(response.body.data.relationshipSummary.totalRelationships).toBe(1)
      expect(response.body.data.relationshipSummary.positiveRelationships).toBe(1)
      expect(response.body.data.relationshipSummary.negativeRelationships).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors with proper HTTP status', async () => {
      // Arrange
      mockCharacterService.getCharacter.mockRejectedValue(new Error('Service unavailable'))

      // Act
      const response = await request(app)
        .get('/api/characters/char-1')
        .set('x-request-id', 'test-123')
        .expect(500)

      // Assert
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Service unavailable')
    })

    it('should include request ID in error responses', async () => {
      // Arrange
      mockCharacterService.getCharacter.mockRejectedValue(new Error('Database connection failed'))

      // Act
      const response = await request(app)
        .get('/api/characters/char-1')
        .set('x-request-id', 'test-123')
        .expect(500)

      // Assert
      expect(response.body.metadata.requestId).toBe('test-123')
    })

    it('should log errors appropriately', async () => {
      // Arrange
      const error = new Error('Test error')
      mockCharacterService.getCharacter.mockRejectedValue(error)

      // Act
      await request(app)
        .get('/api/characters/char-1')
        .set('x-request-id', 'test-123')
        .expect(500)

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in getCharacter',
        expect.objectContaining({
          error: error.message,
          requestId: 'test-123'
        })
      )
    })
  })
})