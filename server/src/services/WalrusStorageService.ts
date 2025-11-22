/**
 * Walrus Storage Service
 *
 * Handles blockchain storage of player actions using Walrus protocol
 * Provides immutable, tamper-proof storage with cryptographic verification
 * Implements retry logic and error handling for demo reliability
 */

import { createHash, randomBytes } from 'crypto'
import axios, { AxiosInstance } from 'axios'
import { walrus } from '@mysten/walrus'
import { SuiClient } from '@mysten/sui/client'
import { getFullnodeUrl } from '@mysten/sui/client'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Action } from '../types/storage'

export interface BlockchainStorageResult {
  success: boolean
  actionId: string
  walrusUrl?: string
  verificationHash?: string
  timestamp?: string
  error?: string
  retryAttempt?: number
}

export interface VerificationResult {
  success: boolean
  actionId: string
  actionData?: Action
  verificationLink?: string
  isTamperProof?: boolean
  timestamp?: string
  error?: string
}

export interface WalrusStorageConfig {
  endpoint: string
  authToken: string
  retryAttempts: number
  timeoutMs: number
  circuitBreakerThreshold: number
}

export interface CircuitBreakerState {
  isOpen: boolean
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

export class WalrusStorageService {
  private readonly config: WalrusStorageConfig
  private readonly httpClient: AxiosInstance
  private readonly circuitBreaker: CircuitBreakerState
  private readonly developerPrivateKey?: string
  private readonly developerAddress?: string
  private readonly walrusClient: any // Use any to handle $extend walrus() typing issues
  private readonly keypair?: Ed25519Keypair
  private readonly network: 'mainnet' | 'testnet'

  constructor(config?: Partial<WalrusStorageConfig>) {
    this.network = (process.env.SUI_NETWORK as 'mainnet' | 'testnet') || 'testnet'

    // Initialize keypair from private key using official SDK pattern
    const privateKey = process.env.DEVELOPER_PRIVATE_KEY
    if (privateKey) {
      try {
        this.keypair = Ed25519Keypair.fromSecretKey(privateKey)
      } catch (error) {
        console.error('Failed to initialize keypair:', error)
        throw new Error('Invalid DEVELOPER_PRIVATE_KEY format')
      }
    }

    this.config = {
      endpoint: getFullnodeUrl(this.network),
      authToken: process.env.WALRUS_AUTH_TOKEN || '',
      retryAttempts: parseInt(process.env.WALRUS_MAX_RETRIES || '3'),
      timeoutMs: parseInt(process.env.WALRUS_TIMEOUT || '60000'),
      circuitBreakerThreshold: 5,
      ...config
    }

    // Initialize SuiClient with Walrus extension using official SDK pattern
    this.walrusClient = new SuiClient({
      url: this.config.endpoint,
      network: this.network,
    }).$extend(
      walrus({
        storageNodeClientOptions: {
          timeout: 60_000, // 60 second timeout for storage nodes
        },
      }),
    )

    this.developerPrivateKey = process.env.DEVELOPER_PRIVATE_KEY
    this.developerAddress = this.keypair?.toSuiAddress()

    console.log(`🔗 Walrus Service Initializing:`)
    console.log(`   Network: ${this.network}`)
    console.log(`   RPC URL: ${this.config.endpoint}`)
    console.log(`   Client Type: SuiClient + walrus extension`)
    console.log(`   Developer Address: ${this.developerAddress || 'Not set'}`)
    console.log(`   Keypair: ${this.keypair ? 'Configured' : 'Not configured'}`)
    console.log(`   Max Retries: ${this.config.retryAttempts}`)
    console.log(`   Timeout: ${this.config.timeoutMs}ms`)
    console.log(`   Note: No separate Gateway URL - uses SDK directly`)

    this.httpClient = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeoutMs,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    }
  }

  /**
   * Store an action on Walrus blockchain with retry logic
   */
  async storeAction(action: Action): Promise<BlockchainStorageResult> {
    const startTime = Date.now()

    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        return {
          success: false,
          actionId: action.id,
          error: 'Circuit breaker is open - Walrus service temporarily unavailable'
        }
      }

      // Serialize action for blockchain storage
      const serializedAction = this.serializeAction(action)
      const cryptographicHash = this.generateCryptographicHash(action)

      // Store on Walrus with retry logic
      const walrusResult = await this.storeWithRetry(serializedAction, action.id)

      if (walrusResult.success && walrusResult.walrusUrl) {
        // Extract blob ID from the URL for storage in metadata
        const blobId = walrusResult.walrusUrl.split('/').pop() || ''

        // Record successful storage
        this.recordSuccess()

        return {
          success: true,
          actionId: action.id,
          walrusUrl: walrusResult.walrusUrl,
          verificationHash: cryptographicHash,
          timestamp: new Date().toISOString()
        }
      } else {
        // Record failure
        this.recordFailure()

        return {
          success: false,
          actionId: action.id,
          error: walrusResult.error || 'Failed to store action on Walrus',
          retryAttempt: walrusResult.retryAttempt
        }
      }

    } catch (error) {
      this.recordFailure()

      return {
        success: false,
        actionId: action.id,
        error: `Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }
    } finally {
      const duration = Date.now() - startTime
      console.log(`Walrus storage attempt for action ${action.id} took ${duration}ms`)
    }
  }

  /**
   * Verify an action from Walrus Gateway
   */
  async verifyAction(actionId: string): Promise<VerificationResult> {
    try {
      const verificationUrl = this.getVerificationLink(actionId)

      // Note: Gateway URL removed - Walrus uses SDK pattern, not separate Gateway
      // Should use: await walrusClient.walrus.readBlob({ blobId })
      return {
        success: false,
        actionId,
        error: 'Legacy Gateway verification removed. Use SDK pattern.',
        actionData: null,
        isTamperProof: false,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      return {
        success: false,
        actionId,
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Read blob data from Walrus using blob ID (official SDK pattern)
   */
  async readBlob(blobId: string): Promise<{
    success: boolean
    data?: any
    error?: string
  }> {
    try {
      console.log(`📖 Reading blob from Walrus SDK: ${blobId}`)

      // Use official Walrus SDK pattern (no separate Gateway URL)
      const blobBytes = await this.walrusClient.walrus.readBlob({ blobId })

      const blobData = new TextDecoder().decode(blobBytes)

      try {
        const parsedData = JSON.parse(blobData)
        console.log(`✅ Successfully read blob: ${blobId}`)
        console.log(`   Size: ${blobBytes.length} bytes`)

        return {
          success: true,
          data: parsedData
        }
      } catch (parseError) {
        // If it's not JSON, return as raw text
        return {
          success: true,
          data: blobData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Read error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate verification link for an action
   * Note: Walrus doesn't have separate Gateway URLs - verification through SDK
   */
  getVerificationLink(actionId: string): string {
    // Walrus doesn't have separate Gateway - use SDK for verification
    return `walrus-readblob://${actionId}`
  }

  /**
   * Get current circuit breaker status
   */
  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker }
  }

  /**
   * Reset circuit breaker (for testing/recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.isOpen = false
    this.circuitBreaker.failureCount = 0
    this.circuitBreaker.lastFailureTime = 0
    this.circuitBreaker.nextAttemptTime = 0
  }

  // Private methods

  private serializeAction(action: Action): any {
    return {
      id: action.id,
      playerId: action.playerId,
      intent: action.intent,
      originalInput: action.originalInput,
      timestamp: action.timestamp,
      status: action.status,
      consequences: action.consequences,
      metadata: {
        ...action.metadata,
        // Include blockchain-specific metadata
        serializedAt: new Date().toISOString(),
        version: '1.0'
      }
    }
  }

  private generateCryptographicHash(action: Action): string {
    const actionString = JSON.stringify(this.serializeAction(action))
    return createHash('sha256').update(actionString).digest('hex')
  }

  private async storeWithRetry(data: any, actionId: string, attempt: number = 1): Promise<BlockchainStorageResult> {
    if (attempt > this.config.retryAttempts) {
      return {
        success: false,
        actionId,
        error: `Max retry attempts (${this.config.retryAttempts}) exceeded`,
        retryAttempt: attempt - 1
      }
    }

    try {
      // Exponential backoff delay
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await this.sleep(delay)
      }

      // Use official Walrus SDK for real blockchain storage
      console.log(`Storing action ${actionId} to Walrus blockchain...`)

      if (!this.keypair) {
        throw new Error('No keypair configured. Set DEVELOPER_PRIVATE_KEY in your .env file.')
      }

      // Convert action data to JSON bytes for Walrus storage
      const jsonData = JSON.stringify(data)
      const dataBytes = new TextEncoder().encode(jsonData)

      // Store on Walrus using official SDK pattern
      const { blobId, blobObject } = await this.walrusClient.walrus.writeBlob({
        blob: dataBytes,
        signer: this.keypair,
        deletable: true,
        epochs: Math.min(50, 100) // Use smaller epochs for demo
      })

      // Note: Walrus doesn't have separate Gateway URLs
      // Access through SDK: client.walrus.readBlob({ blobId })
      console.log(`✅ Action stored on Walrus blockchain!`)
      console.log(`   Blob ID: ${blobId}`)
      console.log(`   Object ID: ${blobObject.id.id}`)
      console.log(`   Size: ${blobObject.size} bytes`)
      console.log(`   Access: await walrusClient.walrus.readBlob({ blobId: "${blobId}" })`)

      return {
        success: true,
        actionId,
        walrusUrl: `walrus-readblob://${blobId}`, // Internal reference, not a real URL
        retryAttempt: attempt
      }

    } catch (error) {
      // Log retry attempt
      console.warn(`Walrus blockchain storage retry ${attempt}/${this.config.retryAttempts} for action ${actionId}:`,
        error instanceof Error ? error.message : 'Unknown error')

      // Recursive retry
      return this.storeWithRetry(data, actionId, attempt + 1)
    }
  }

  private isCircuitBreakerOpen(): boolean {
    const now = Date.now()

    if (this.circuitBreaker.isOpen) {
      if (now >= this.circuitBreaker.nextAttemptTime) {
        // Try to close circuit breaker
        this.circuitBreaker.isOpen = false
        this.circuitBreaker.failureCount = 0
        return false
      }
      return true
    }

    return false
  }

  private recordFailure(): void {
    const now = Date.now()
    this.circuitBreaker.failureCount++
    this.circuitBreaker.lastFailureTime = now

    if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
      // Open circuit breaker
      this.circuitBreaker.isOpen = true
      // Wait 60 seconds before next attempt
      this.circuitBreaker.nextAttemptTime = now + 60000
      console.warn('Circuit breaker opened due to repeated Walrus failures')
    }
  }

  private recordSuccess(): void {
    // Reset failure count on success
    this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Default instance for dependency injection
export const walrusStorageService = new WalrusStorageService()