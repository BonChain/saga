/**
 * Authentication API Routes
 *
 * Wallet-based JWT authentication endpoints.
 * Handles wallet signature verification and JWT token generation.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { Logger } from 'winston'
import { AuthService, WalletAuthRequest } from '../../services/auth-service'

export class AuthRoutes {
  private router: Router
  private authService: AuthService
  private logger: Logger
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(authService: AuthService, logger: Logger) {
    this.router = Router()
    this.authService = authService
    this.logger = logger
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // Rate limiting middleware
    this.router.use(this.rateLimitMiddleware)

    // Authentication endpoints
    this.router.post('/challenge', this.getChallenge.bind(this))
    this.router.post('/authenticate', this.authenticate.bind(this))
    this.router.post('/refresh', this.refreshToken.bind(this))
    this.router.get('/validate', this.validateToken.bind(this))
  }

  /**
   * Get authentication challenge for wallet signing
   */
  private async getChallenge(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'

    try {
      const { walletAddress } = req.body

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'MISSING_WALLET_ADDRESS',
          message: 'Wallet address is required',
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      const challenge = this.authService.generateChallengeMessage(walletAddress)

      this.logger.info('Challenge generated', {
        requestId,
        walletAddress,
        timestamp: challenge.timestamp
      })

      res.json({
        success: true,
        data: {
          message: challenge.message,
          timestamp: challenge.timestamp,
          expiresAt: new Date(challenge.timestamp + 5 * 60 * 1000).toISOString()
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      this.handleError(res, error, 'getChallenge', requestId)
    }
  }

  /**
   * Authenticate wallet signature and return JWT token
   */
  private async authenticate(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'

    try {
      const authRequest: WalletAuthRequest = req.body

      // Validate required fields
      const requiredFields = ['walletAddress', 'signature', 'message', 'timestamp']
      const missingFields = requiredFields.filter(field => !authRequest[field])

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      const authResponse = await this.authService.authenticateWallet(authRequest)

      if (!authResponse.success) {
        res.status(401).json({
          success: false,
          error: authResponse.error,
          message: authResponse.message,
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      this.logger.info('Authentication successful', {
        requestId,
        walletAddress: authRequest.walletAddress
      })

      res.json({
        success: true,
        data: {
          token: authResponse.token,
          expiresIn: authResponse.expiresIn,
          user: authResponse.user
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      this.handleError(res, error, 'authenticate', requestId)
    }
  }

  /**
   * Refresh JWT token
   */
  private async refreshToken(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'

    try {
      const { token } = req.body

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'MISSING_TOKEN',
          message: 'Token is required for refresh',
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      const refreshResponse = this.authService.refreshToken(token)

      if (!refreshResponse.success) {
        res.status(401).json({
          success: false,
          error: refreshResponse.error,
          message: 'Failed to refresh token',
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      this.logger.info('Token refreshed successfully', {
        requestId
      })

      res.json({
        success: true,
        data: {
          token: refreshResponse.token,
          expiresIn: 24 * 3600 // 24 hours
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      this.handleError(res, error, 'refreshToken', requestId)
    }
  }

  /**
   * Validate JWT token
   */
  private async validateToken(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string || 'unknown'

    try {
      const token = req.headers['authorization']?.replace('Bearer ', '') || req.body.token

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'MISSING_TOKEN',
          message: 'Token is required for validation',
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      const validation = this.authService.validateJWT(token)

      if (!validation.valid) {
        res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: validation.error,
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
        return
      }

      res.json({
        success: true,
        data: {
          valid: true,
          payload: validation.payload
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      this.handleError(res, error, 'validateToken', requestId)
    }
  }

  /**
   * Rate limiting middleware
   */
  private rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void | Response => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxRequests = 10 // 10 requests per window

    const clientData = this.rateLimitStore.get(clientIp)

    if (!clientData || now > clientData.resetTime) {
      // New client or window reset
      this.rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication requests. Please try again later.',
        metadata: {
          requestId: req.headers['x-request-id'] as string || 'unknown',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        }
      })
    }

    clientData.count++
    next()
  }

  /**
   * Error handling helper
   */
  private handleError(res: Response, error: any, operation: string, requestId: string): void {
    this.logger.error(`Authentication error in ${operation}`, {
      error: (error as Error).message,
      stack: (error as Error).stack,
      requestId
    })

    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An internal error occurred during authentication',
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    })
  }

  public getRouter(): Router {
    return this.router
  }
}

/**
 * Create authentication routes
 */
export function createAuthRoutes(authService: AuthService, logger: Logger): Router {
  const authRoutes = new AuthRoutes(authService, logger)
  return authRoutes.getRouter()
}