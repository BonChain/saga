/**
 * JWT Authentication Service with Wallet-based Authentication
 *
 * Provides secure JWT token generation and validation using Sui wallet addresses.
 * Follows JWT best practices and includes wallet signature verification.
 */

import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { Logger } from 'winston'

export interface WalletAuthRequest {
  walletAddress: string
  signature: string
  message: string
  timestamp: number
}

export interface JWTPayload {
  sub: string // wallet address
  iat: number // issued at
  exp: number // expiration
  jti: string // JWT ID
  role?: 'user' | 'admin' | 'moderator' | 'guest' // Make role optional
  walletAddress: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  expiresIn?: number
  user?: {
    walletAddress: string
    role: string
  }
  error?: string
  message?: string
}

export class AuthService {
  private readonly JWT_SECRET: string
  private readonly JWT_EXPIRES_IN: string
  private readonly MESSAGE_EXPIRY: number = 5 * 60 * 1000 // 5 minutes
  private readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = logger

    // Use environment variable for JWT secret, or generate a secure one
    this.JWT_SECRET = process.env.JWT_SECRET || this.generateSecureSecret()
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

    if (!process.env.JWT_SECRET) {
      this.logger.warn('JWT_SECRET not set in environment, using generated secret. Set JWT_SECRET for production.')
    }
  }

  /**
   * Generate a secure JWT secret
   */
  private generateSecureSecret(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  /**
   * Generate a challenge message for wallet signature
   */
  public generateChallengeMessage(walletAddress: string): { message: string; timestamp: number } {
    const timestamp = Date.now()
    const message = `Sign this message to authenticate with SuiSaga: ${walletAddress}:${timestamp}`

    return {
      message,
      timestamp
    }
  }

  /**
   * Verify wallet signature and generate JWT token
   */
  public async authenticateWallet(authRequest: WalletAuthRequest): Promise<AuthResponse> {
    try {
      const { walletAddress, signature, message, timestamp } = authRequest

      // Validate input
      if (!walletAddress || !signature || !message) {
        return {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Missing required authentication fields'
        }
      }

      // Check timestamp (prevent replay attacks)
      const now = Date.now()
      if (now - timestamp > this.MESSAGE_EXPIRY) {
        return {
          success: false,
          error: 'EXPIRED_MESSAGE',
          message: 'Authentication message has expired'
        }
      }

      // Verify wallet address format (basic Sui address validation)
      if (!this.isValidSuiAddress(walletAddress)) {
        return {
          success: false,
          error: 'INVALID_WALLET',
          message: 'Invalid wallet address format'
        }
      }

      // Verify message matches expected format
      const expectedMessage = `Sign this message to authenticate with SuiSaga: ${walletAddress}:${timestamp}`
      if (message !== expectedMessage) {
        return {
          success: false,
          error: 'INVALID_MESSAGE',
          message: 'Message does not match expected format'
        }
      }

      // TODO: Implement actual signature verification
      // For now, we'll simulate signature verification
      // In production, you would verify the signature using the wallet's public key
      const isSignatureValid = await this.verifyWalletSignature(walletAddress, message, signature)

      if (!isSignatureValid) {
        return {
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Invalid wallet signature'
        }
      }

      // Generate JWT token
      const token = this.generateJWT(walletAddress)

      this.logger.info('Wallet authentication successful', {
        walletAddress,
        timestamp: now
      })

      return {
        success: true,
        token,
        expiresIn: this.getExpirationInSeconds(),
        user: {
          walletAddress,
          role: 'user' as const // Default role, could be enhanced with role management
        }
      }

    } catch (error) {
      this.logger.error('Wallet authentication error', { error: (error as Error).message })
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Authentication failed due to internal error'
      }
    }
  }

  /**
   * Generate JWT token for wallet address
   */
  public generateJWT(walletAddress: string, role: string = 'user'): string {
    const now = Math.floor(Date.now() / 1000)
    const jwtId = crypto.randomUUID()

    const payload: JWTPayload = {
      sub: walletAddress,
      iat: now,
      exp: now + this.getExpirationInSeconds(),
      jti: jwtId,
      role: role as 'user' | 'admin' | 'moderator' | 'guest',
      walletAddress
    }

    return jwt.sign(payload, this.JWT_SECRET, {
      algorithm: 'HS256'
    })
  }

  /**
   * Validate JWT token
   */
  public validateJWT(token: string): { valid: boolean; payload?: JWTPayload; error?: string } {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET, {
        algorithms: ['HS256']
      }) as JWTPayload

      return {
        valid: true,
        payload
      }
    } catch (error: any) {
      let errorMessage = 'Invalid token'

      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired'
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format'
      }

      return {
        valid: false,
        error: errorMessage
      }
    }
  }

  /**
   * Refresh JWT token
   */
  public refreshToken(oldToken: string): { success: boolean; token?: string; error?: string } {
    try {
      const validation = this.validateJWT(oldToken)

      if (!validation.valid || !validation.payload) {
        return {
          success: false,
          error: validation.error || 'Invalid token'
        }
      }

      const newToken = this.generateJWT(
        validation.payload.walletAddress,
        validation.payload.role
      )

      return {
        success: true,
        token: newToken
      }
    } catch (error) {
      this.logger.error('Token refresh error', { error: (error as Error).message })
      return {
        success: false,
        error: 'Failed to refresh token'
      }
    }
  }

  /**
   * Verify wallet signature (placeholder implementation)
   * In production, implement proper signature verification using the wallet's public key
   */
  private async verifyWalletSignature(walletAddress: string, message: string, signature: string): Promise<boolean> {
    // TODO: Implement actual signature verification
    // This would involve:
    // 1. Extract the public key from the wallet address
    // 2. Verify the signature using the public key and message
    // 3. Ensure the signature matches the expected format

    // For development/testing, we'll accept any signature that's not empty
    // In production, this MUST be replaced with actual cryptographic verification
    return signature.length > 0 && signature.startsWith('0x')
  }

  /**
   * Validate Sui wallet address format
   */
  private isValidSuiAddress(address: string): boolean {
    // Basic Sui address validation (starts with "0x" and is correct length)
    return /^0x[a-fA-F0-9]{40,64}$/.test(address)
  }

  /**
   * Get token expiration time in seconds
   */
  private getExpirationInSeconds(): number {
    const timeUnits: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    }

    const match = this.JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 24 * 3600 // Default to 24 hours
    }

    const [, amount, unit] = match
    return parseInt(amount) * (timeUnits[unit] || 1)
  }

  /**
   * Get authentication headers for HTTP responses
   */
  public getAuthHeaders(token: string): Record<string, string> {
    return {
      'x-user-id': this.extractWalletFromToken(token),
      'x-user-role': 'user',
      'x-session-token': token
    }
  }

  /**
   * Extract wallet address from JWT token (without full validation)
   */
  public extractWalletFromToken(token: string): string {
    try {
      const decoded = jwt.decode(token) as any
      return decoded?.walletAddress || decoded?.sub || 'unknown'
    } catch (error) {
      return 'unknown'
    }
  }
}

// Export singleton instance factory
export const createAuthService = (logger: Logger): AuthService => {
  return new AuthService(logger)
}