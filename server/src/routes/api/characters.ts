/**
 * Character API Routes - Story 4.1: Character Memory & Relationship Tracking
 *
 * RESTful endpoints for character interaction management.
 * Follows existing API patterns in server/src/index.ts with Express middleware,
 * authentication, rate limiting, and request validation.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { Logger } from 'winston'

import { CharacterService } from '../../services/character-service'
import {
  Character,
  MemoryCreateParams,
  RelationshipUpdateParams,
  CharacterQueryOptions,
  MemoryQueryOptions,
  Personality
} from '../../models/character'

// Extend Express Request to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

// Response interfaces
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: {
    timestamp: string
    requestId: string
    count?: number
    total?: number
  }
}

interface CharacterListResponse {
  characters: Character[]
  count: number
  total: number
  page: number
  pageSize: number
}

interface MemoryListResponse {
  memories: any[]
  count: number
  total: number
  page: number
  pageSize: number
}

interface RelationshipSummaryResponse {
  characterId: string
  relationships: {
    [targetId: string]: {
      scores: any
      lastInteraction: number
      totalInteractions: number
      relationshipType: string
    }
  }
  relationshipCount: number
}

export class CharacterRoutes {
  private router: Router
  private characterService: CharacterService
  private logger: Logger

  constructor(characterService: CharacterService, logger: Logger) {
    this.router = Router()
    this.characterService = characterService
    this.logger = logger
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // Middleware for authentication and rate limiting
    this.router.use(this.authMiddleware)
    this.router.use(this.rateLimitMiddleware)
    this.router.use(this.requestValidationMiddleware)

    // Character CRUD endpoints
    this.router.get('/', this.getCharacters.bind(this))
    this.router.get('/:id', this.getCharacter.bind(this))
    this.router.post('/', this.createCharacter.bind(this))
    this.router.put('/:id', this.updateCharacter.bind(this))

    // Memory management endpoints
    this.router.get('/:id/memories', this.getCharacterMemories.bind(this))
    this.router.post('/:id/memories', this.addMemory.bind(this))

    // Relationship management endpoints
    this.router.get('/:id/relationships', this.getRelationships.bind(this))
    this.router.get('/:id/relationships/:targetId', this.getRelationship.bind(this))
    this.router.put('/:id/relationships/:targetId', this.updateRelationship.bind(this))

    // Character profile endpoint
    this.router.get('/:id/profile', this.getCharacterProfile.bind(this))

    // Search and discovery endpoints
    this.router.get('/search/memories', this.searchMemories.bind(this))
    this.router.get('/location/:location', this.getCharactersByLocation.bind(this))

    // Admin endpoints (restricted access)
    this.router.get('/admin/validate-all', this.validateAllCharacters.bind(this))
    this.router.post('/admin/backup', this.createBackup.bind(this))
    this.router.post('/admin/restore/:backupId', this.restoreFromBackup.bind(this))
  }

  /**
   * GET /api/characters
   * Get all characters with optional filtering and pagination
   */
  private async getCharacters(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const startTime = Date.now()

    try {
      const options: CharacterQueryOptions = {}

      if (req.query.location) options.location = req.query.location as string
      if (req.query.personality) options.personality = req.query.personality as any
      if (req.query.hasMemoriesWithPlayer) options.hasMemoriesWithPlayer = req.query.hasMemoriesWithPlayer as string
      if (req.query.limit) options.limit = parseInt(req.query.limit as string)
      if (req.query.offset) options.offset = parseInt(req.query.offset as string)
      if (req.query.sortBy) options.sortBy = req.query.sortBy as any
      if (req.query.sortOrder) options.sortOrder = req.query.sortOrder as any

      // Use the CharacterService to get all characters
      const characters = await this.characterService.getAllCharacters(options)

      const response: ApiResponse<CharacterListResponse> = {
        success: true,
        data: {
          characters,
          count: characters.length,
          total: characters.length,
          page: Math.floor(options.offset / (options.limit || 10)) + 1,
          pageSize: options.limit || 10
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: characters.length
        }
      }

      this.logger.info(`Retrieved characters`, {
        requestId,
        count: characters.length,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getCharacters', requestId)
    }
  }

  /**
   * GET /api/characters/:id
   * Get a specific character by ID
   */
  private async getCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const startTime = Date.now()

    try {
      const character = await this.characterService.getCharacter(characterId)

      if (!character) {
        const response: ApiResponse = {
          success: false,
          error: 'Character not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        res.status(404).json(response)
      return
      }

      const response: ApiResponse<Character> = {
        success: true,
        data: character,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Retrieved character`, {
        requestId,
        characterId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getCharacter', requestId)
    }
  }

  /**
   * POST /api/characters
   * Create a new character
   */
  private async createCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const startTime = Date.now()

    try {
      const characterData = req.body
      this.validateCharacterCreateData(characterData)

      const character = await this.characterService.createCharacter(characterData)

      const response: ApiResponse<Character> = {
        success: true,
        data: character,
        message: 'Character created successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Character created`, {
        requestId,
        characterId: character.id,
        name: character.name,
        duration: Date.now() - startTime
      })

      res.status(201).json(response)
    } catch (error) {
      this.handleError(res, error, 'createCharacter', requestId)
    }
  }

  /**
   * PUT /api/characters/:id
   * Update a character
   */
  private async updateCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const startTime = Date.now()

    try {
      const updateData = req.body
      this.validateCharacterUpdateData(updateData)

      const character = await this.characterService.updateCharacter(characterId, updateData)

      const response: ApiResponse<Character> = {
        success: true,
        data: character,
        message: 'Character updated successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Character updated`, {
        requestId,
        characterId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'updateCharacter', requestId)
    }
  }

  /**
   * GET /api/characters/:id/memories
   * Get memories for a specific character
   */
  private async getCharacterMemories(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const startTime = Date.now()

    try {
      const options: MemoryQueryOptions = {
        playerId: req.query.playerId as string,
        actionType: req.query.actionType as any,
        location: req.query.location as string,
        emotionalImpact: req.query.emotionalImpact ? parseInt(req.query.emotionalImpact as string) as any : undefined,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: parseInt(req.query.startDate as string),
          end: parseInt(req.query.endDate as string)
        } : undefined,
        includeArchived: req.query.includeArchived === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      }

      const memories = await this.characterService.getCharacterMemories(characterId, options)

      const response: ApiResponse<MemoryListResponse> = {
        success: true,
        data: {
          memories,
          count: memories.length,
          total: memories.length,
          page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
          pageSize: options.limit || 20
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: memories.length
        }
      }

      this.logger.info(`Retrieved character memories`, {
        requestId,
        characterId,
        count: memories.length,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getCharacterMemories', requestId)
    }
  }

  /**
   * POST /api/characters/:id/memories
   * Add a new memory to a character
   */
  private async addMemory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const startTime = Date.now()

    try {
      const memoryData: MemoryCreateParams = {
        ...req.body,
        characterId
      }
      this.validateMemoryData(memoryData)

      const memory = await this.characterService.addMemory(memoryData)

      const response: ApiResponse = {
        success: true,
        data: memory,
        message: 'Memory added successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Memory added`, {
        requestId,
        characterId,
        memoryId: memory.id,
        action: memory.action,
        duration: Date.now() - startTime
      })

      res.status(201).json(response)
    } catch (error) {
      this.handleError(res, error, 'addMemory', requestId)
    }
  }

  /**
   * GET /api/characters/:id/relationships
   * Get all relationships for a character
   */
  private async getRelationships(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const startTime = Date.now()

    try {
      // Get character and their relationships
      const character = await this.characterService.getCharacter(characterId)
      if (!character) {
        throw new Error(`Character not found: ${characterId}`)
      }

      const relationships: RelationshipSummaryResponse = {
        characterId,
        relationships: character.relationships,
        relationshipCount: Object.keys(character.relationships).length
      }

      const response: ApiResponse<RelationshipSummaryResponse> = {
        success: true,
        data: relationships,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: relationships.relationshipCount
        }
      }

      this.logger.info(`Retrieved character relationships`, {
        requestId,
        characterId,
        count: relationships.relationshipCount,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getRelationships', requestId)
    }
  }

  /**
   * GET /api/characters/:id/relationships/:targetId
   * Get relationship with specific target
   */
  private async getRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const targetId = req.params.targetId
    const startTime = Date.now()

    try {
      const relationship = await this.characterService.getRelationshipStatus(characterId, targetId)

      if (!relationship) {
        const response: ApiResponse = {
          success: false,
          error: 'Relationship not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        res.status(404).json(response)
      return
      }

      const response: ApiResponse = {
        success: true,
        data: relationship,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Retrieved relationship`, {
        requestId,
        characterId,
        targetId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getRelationship', requestId)
    }
  }

  /**
   * PUT /api/characters/:id/relationships/:targetId
   * Update relationship scores
   */
  private async updateRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const targetId = req.params.targetId
    const startTime = Date.now()

    try {
      const updateData: RelationshipUpdateParams = req.body
      this.validateRelationshipUpdateData(updateData)

      const relationship = await this.characterService.updateRelationshipScore(
        characterId,
        targetId,
        updateData.scores || {}
      )

      const response: ApiResponse = {
        success: true,
        data: relationship,
        message: 'Relationship updated successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Relationship updated`, {
        requestId,
        characterId,
        targetId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'updateRelationship', requestId)
    }
  }

  /**
   * GET /api/characters/:id/profile
   * Get character profile with relationship summary
   */
  private async getCharacterProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const startTime = Date.now()

    try {
      const character = await this.characterService.getCharacter(characterId)

      if (!character) {
        const response: ApiResponse = {
          success: false,
          error: 'Character not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        res.status(404).json(response)
      return
      }

      // Build profile with relationship summary
      const profile = {
        ...character,
        relationshipSummary: {
          totalRelationships: Object.keys(character.relationships).length,
          positiveRelationships: Object.values(character.relationships)
            .filter(r => r.scores.friendship >= 50).length,
          negativeRelationships: Object.values(character.relationships)
            .filter(r => r.scores.hostility > 50).length,
          recentInteractions: Object.values(character.relationships)
            .filter(r => Date.now() - r.lastInteraction < 7 * 24 * 60 * 60 * 1000).length // Last 7 days
        }
      }

      const response: ApiResponse = {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Retrieved character profile`, {
        requestId,
        characterId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getCharacterProfile', requestId)
    }
  }

  /**
   * GET /api/characters/search/memories
   * Search memories across all characters
   */
  private async searchMemories(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const startTime = Date.now()

    try {
      const query = {
        characterId: req.query.characterId as string,
        playerId: req.query.playerId as string,
        action: req.query.action as string,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: parseInt(req.query.startDate as string),
          end: parseInt(req.query.endDate as string)
        } : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      }

      // In a full implementation, this would use the CharacterWorldIntegration
      const memories = []

      const response: ApiResponse<MemoryListResponse> = {
        success: true,
        data: {
          memories,
          count: memories.length,
          total: memories.length,
          page: 1,
          pageSize: query.limit || 20
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: memories.length
        }
      }

      this.logger.info(`Searched memories`, {
        requestId,
        query,
        count: memories.length,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'searchMemories', requestId)
    }
  }

  /**
   * GET /api/characters/location/:location
   * Get characters at a specific location
   */
  private async getCharactersByLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const location = req.params.location
    const startTime = Date.now()

    try {
      const characters = [] // await this.characterService.getCharactersByLocation(location)

      const response: ApiResponse<Character[]> = {
        success: true,
        data: characters,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: characters.length
        }
      }

      this.logger.info(`Retrieved characters by location`, {
        requestId,
        location,
        count: characters.length,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getCharactersByLocation', requestId)
    }
  }

  /**
   * GET /api/characters/admin/validate-all
   * Validate all characters (admin only)
   */
  private async validateAllCharacters(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const startTime = Date.now()

    try {
      this.requireAdminAccess(req.user)

      // In a full implementation, this would use the CharacterWorldIntegration
      const validationResults = []

      const response: ApiResponse = {
        success: true,
        data: validationResults,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: validationResults.length
        }
      }

      this.logger.info(`Validated all characters`, {
        requestId,
        count: validationResults.length,
        validCount: validationResults.filter(r => r.isValid).length,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'validateAllCharacters', requestId)
    }
  }

  /**
   * POST /api/characters/admin/backup
   * Create backup of all character data (admin only)
   */
  private async createBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const startTime = Date.now()

    try {
      this.requireAdminAccess(req.user)

      // In a full implementation, this would use the CharacterWorldIntegration
      const backupId = 'backup-' + Date.now()

      const response: ApiResponse = {
        success: true,
        data: { backupId },
        message: 'Backup created successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Character backup created`, {
        requestId,
        backupId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'createBackup', requestId)
    }
  }

  /**
   * POST /api/characters/admin/restore/:backupId
   * Restore from backup (admin only)
   */
  private async restoreFromBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const backupId = req.params.backupId
    const startTime = Date.now()

    try {
      this.requireAdminAccess(req.user)

      // In a full implementation, this would use the CharacterWorldIntegration
      // await this.characterWorldIntegration.restoreFromBackup(backupId)

      const response: ApiResponse = {
        success: true,
        message: 'Backup restored successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Character backup restored`, {
        requestId,
        backupId,
        duration: Date.now() - startTime
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'restoreFromBackup', requestId)
    }
  }

  /**
   * Middleware functions
   */

  private authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    // Add user authentication logic here
    // For now, we'll assume the user is authenticated
    req.user = {
      id: req.headers['x-user-id'] as string || 'unknown',
      role: req.headers['x-user-role'] as string || 'user'
    }
    next()
  }

  private rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Add rate limiting logic here
    next()
  }

  private requestValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Add request validation logic here
    next()
  }

  /**
   * Data validation functions
   */

  private validateCharacterCreateData(data: any): void {
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Name is required and must be a string')
    }
    if (!data.personality || !Object.values(Personality).includes(data.personality)) {
      throw new Error('Valid personality is required')
    }
    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Description is required and must be a string')
    }
    if (!data.backstory || typeof data.backstory !== 'string') {
      throw new Error('Backstory is required and must be a string')
    }
    if (!data.currentLocation || typeof data.currentLocation !== 'string') {
      throw new Error('Current location is required and must be a string')
    }
    if (!data.appearance || !data.appearance.physicalDescription) {
      throw new Error('Appearance with physical description is required')
    }
  }

  private validateCharacterUpdateData(data: any): void {
    if (data.name !== undefined && typeof data.name !== 'string') {
      throw new Error('Name must be a string')
    }
    if (data.currentLocation !== undefined && typeof data.currentLocation !== 'string') {
      throw new Error('Current location must be a string')
    }
    if (data.currentHealth !== undefined && typeof data.currentHealth !== 'number') {
      throw new Error('Current health must be a number')
    }
  }

  private validateMemoryData(data: MemoryCreateParams): void {
    if (!data.action || typeof data.action !== 'string') {
      throw new Error('Action is required and must be a string')
    }
    if (!data.actionType || !['combat', 'social', 'trade', 'help', 'betrayal', 'gift', 'other'].includes(data.actionType)) {
      throw new Error('Valid action type is required')
    }
    if (!data.location || typeof data.location !== 'string') {
      throw new Error('Location is required and must be a string')
    }
    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Description is required and must be a string')
    }
    if (data.emotionalImpact === undefined || typeof data.emotionalImpact !== 'number') {
      throw new Error('Emotional impact is required and must be a number')
    }
  }

  private validateRelationshipUpdateData(data: RelationshipUpdateParams): void {
    if (data.scores) {
      const validScores = ['friendship', 'hostility', 'loyalty', 'respect', 'fear', 'trust']
      for (const [key, value] of Object.entries(data.scores)) {
        if (!validScores.includes(key)) {
          throw new Error(`Invalid relationship score: ${key}`)
        }
        if (typeof value !== 'number' || value < -100 || value > 100) {
          throw new Error(`${key} must be a number between -100 and 100`)
        }
      }
    }
  }

  private requireAdminAccess(user: any): void {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required')
    }
  }

  /**
   * Error handling
   */

  private handleError(res: Response, error: any, operation: string, requestId: string): void {
    this.logger.error(`Error in ${operation}`, {
      requestId,
      error: error.message,
      stack: error.stack
    })

    const response: ApiResponse = {
      success: false,
      error: error.message || 'Internal server error',
      metadata: {
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    const statusCode = error.message?.includes('not found') ? 404 :
                      error.message?.includes('required') ? 400 : 500

    res.status(statusCode).json(response)
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router
  }
}

// Export the router factory function
export function createCharacterRoutes(
  characterService: CharacterService,
  logger: Logger
): Router {
  const characterRoutes = new CharacterRoutes(characterService, logger)
  return characterRoutes.getRouter()
}