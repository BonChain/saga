/**
 * Character API Routes - Real Character Service Integration
 *
 * RESTful endpoints for character interaction using RealCharacterService.
 * Works with persistent JSON storage and provides full character management functionality.
 */

import { Router, Request, Response } from 'express'
import { Logger } from 'winston'
import { AuthService } from '../../services/auth-service'
import { RealCharacterService } from '../../services/RealCharacterService'
import {
  ValidationError,
  ResourceNotFoundError,
  ServiceUnavailableError,
  toAppError,
  ErrorFactory
} from '../../utils/errors'

// Response interfaces
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  metadata?: {
    timestamp: string
    requestId: string
    count?: number
    operation?: string
    errorCode?: string
    [key: string]: any // Allow additional metadata properties
  }
}

// Extend Express Request to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
    sessionToken?: string
  }
}

export class CharacterRealRoutes {
  private router: Router
  private characterService: RealCharacterService
  private authService: AuthService
  private logger: Logger

  constructor(characterService: RealCharacterService, authService: AuthService, logger: Logger) {
    this.router = Router()
    this.characterService = characterService
    this.authService = authService
    this.logger = logger
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // Apply authentication middleware
    this.router.use(this.authMiddleware.bind(this))

    // Character CRUD endpoints
    this.router.post('/', this.createCharacter.bind(this))
    this.router.get('/', this.getAllCharacters.bind(this))
    this.router.get('/:id', this.getCharacter.bind(this))
    this.router.put('/:id', this.updateCharacter.bind(this))

    // Memory management
    this.router.post('/:id/memories', this.addMemory.bind(this))
    this.router.get('/:id/memories', this.getMemories.bind(this))

    // Relationship management
    this.router.get('/:id/relationships', this.getRelationships.bind(this))
    this.router.post('/:id/relationships/:targetId', this.updateRelationship.bind(this))
    this.router.get('/:id/relationships/:targetId', this.getRelationshipStatus.bind(this))
  }

  /**
   * Authentication middleware
   */
  private async authMiddleware(req: AuthenticatedRequest, res: Response, next: Function): Promise<any> {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - No token provided'
        })
        return
      }

      const token = authHeader.substring(7)
      const validation = this.authService.validateJWT(token)

      if (!validation.valid) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Invalid token'
        })
        return
      }

      req.user = {
        id: validation.payload.sub || validation.payload.walletAddress,
        role: validation.payload.role || 'user',
        sessionToken: token
      }
      next()
    } catch (error) {
      this.logger.error('Authentication middleware error:', error)
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Authentication failed'
      })
    }
  }

  /**
   * POST /api/characters
   * Create a new character
   */
  private async createCharacter(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'

    try {
      const characterData = req.body
      const character = await this.characterService.createCharacter(characterData)

      const response: ApiResponse<any> = {
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
        characterName: character.name
      })

      res.status(201).json(response)
    } catch (error) {
      this.handleError(res, error, 'createCharacter', requestId)
    }
  }

  /**
   * GET /api/characters
   * Get all characters
   */
  private async getAllCharacters(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'

    try {
      const characters = await this.characterService.getAllCharacters({
        includeMemories: req.query.includeMemories === 'true',
        includeRelationships: req.query.includeRelationships === 'true'
      })

      const response: ApiResponse<any> = {
        success: true,
        data: {
          characters,
          count: characters.length
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: characters.length
        }
      }

      this.logger.info(`Retrieved all characters`, {
        requestId,
        count: characters.length
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getAllCharacters', requestId)
    }
  }

  /**
   * GET /api/characters/:id
   * Get a specific character
   */
  private async getCharacter(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id

    try {
      const character = await this.characterService.getCharacter(characterId)

      if (!character) {
        const response = {
          success: false,
          error: 'Character not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        return res.status(404).json(response)
      }

      const response: ApiResponse<any> = {
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
        characterName: character.name
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getCharacter', requestId)
    }
  }

  /**
   * PUT /api/characters/:id
   * Update a character
   */
  private async updateCharacter(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id

    try {
      const updateData = req.body
      const character = await this.characterService.updateCharacter(characterId, updateData)

      if (!character) {
        const response = {
          success: false,
          error: 'Character not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        return res.status(404).json(response)
      }

      const response: ApiResponse<any> = {
        success: true,
        data: character,
        message: 'Character updated successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Updated character`, {
        requestId,
        characterId
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'updateCharacter', requestId)
    }
  }

  
  /**
   * POST /api/characters/:id/memories
   * Add a memory to a character
   */
  private async addMemory(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id

    try {
      const memoryData = req.body
      const result = await this.characterService.addMemory({
        characterId,
        memory: memoryData
      })

      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Memory added successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Added memory to character`, {
        requestId,
        characterId,
        memoryId: result.id
      })

      res.status(201).json(response)
    } catch (error) {
      this.handleError(res, error, 'addMemory', requestId)
    }
  }

  /**
   * GET /api/characters/:id/memories
   * Get character memories
   */
  private async getMemories(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id

    try {
      const memories = await this.characterService.getCharacterMemories(characterId)

      const response: ApiResponse<any> = {
        success: true,
        data: {
          memories,
          count: memories.length
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
        count: memories.length
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getMemories', requestId)
    }
  }

  /**
   * GET /api/characters/:id/relationships
   * Get character relationships
   */
  private async getRelationships(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id

    try {
      const character = await this.characterService.getCharacter(characterId)

      if (!character) {
        const response = {
          success: false,
          error: 'Character not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        return res.status(404).json(response)
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          relationships: character.relationships || {},
          count: Object.keys(character.relationships || {}).length
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          count: Object.keys(character.relationships || {}).length
        }
      }

      this.logger.info(`Retrieved character relationships`, {
        requestId,
        characterId,
        count: Object.keys(character.relationships || {}).length
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getRelationships', requestId)
    }
  }

  /**
   * POST /api/characters/:id/relationships/:targetId
   * Update relationship score
   */
  private async updateRelationship(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const targetId = req.params.targetId

    try {
      const { score, type = 'friendship' } = req.body
      const result = await this.characterService.updateRelationshipScore(characterId, targetId, score)

      const response: ApiResponse<any> = {
        success: true,
        data: result,
        message: 'Relationship updated successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Updated relationship`, {
        requestId,
        characterId,
        targetId,
        score
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'updateRelationship', requestId)
    }
  }

  /**
   * GET /api/characters/:id/relationships/:targetId
   * Get relationship status
   */
  private async getRelationshipStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'
    const characterId = req.params.id
    const targetId = req.params.targetId

    try {
      const character = await this.characterService.getCharacter(characterId)

      if (!character) {
        const response = {
          success: false,
          error: 'Character not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        }
        return res.status(404).json(response)
      }

      const relationship = character.relationships?.[targetId]

      const response: ApiResponse<any> = {
        success: true,
        data: relationship || null,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      }

      this.logger.info(`Retrieved relationship status`, {
        requestId,
        characterId,
        targetId,
        hasRelationship: !!relationship
      })

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'getRelationshipStatus', requestId)
    }
  }

  /**
   * Enhanced error handling with proper error classification
   */
  private handleError(res: Response, error: any, operation: string, requestId: string): void {
    // Convert to AppError for consistent handling
    const appError = toAppError(error, {
      operation,
      requestId,
      endpoint: '/api/characters',
      timestamp: Date.now()
    })

    this.logger.error(`${operation} error:`, {
      requestId,
      error: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      stack: appError.stack,
      context: appError.context
    })

    const response: ApiResponse<any> = {
      success: false,
      error: appError.message,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        errorCode: appError.code,
        operation
      }
    }

    res.status(appError.statusCode).json(response)
  }

  /**
   * Get the Express router
   */
  getRouter(): Router {
    return this.router
  }
}

/**
 * Create character routes with RealCharacterService
 */
export function createCharacterRealRoutes(
  characterService: RealCharacterService,
  authService: AuthService,
  logger: Logger
): Router {
  const characterRoutes = new CharacterRealRoutes(characterService, authService, logger)
  return characterRoutes.getRouter()
}