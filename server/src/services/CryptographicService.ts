/**
 * Cryptographic Service
 *
 * Provides cryptographic hashing and digital signature functionality
 * Ensures action integrity and authenticity for blockchain verification
 */

import { createHash, createHmac, randomBytes, sign, verify } from 'crypto'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Action } from '../types/storage'

export interface CryptographicProof {
  hash: string
  signature?: string
  algorithm: string
  timestamp: string
  publicKey?: string
}

export interface IntegrityCheckResult {
  isValid: boolean
  expectedHash?: string
  actualHash?: string
  signatureValid?: boolean
  tamperDetected?: boolean
  error?: string
}

export interface DigitalKeyPair {
  publicKey: string
  privateKey: string
  algorithm: string
  createdAt: string
}

export class CryptographicService {
  private static readonly HASH_ALGORITHM = 'sha256'
  private static readonly SIGNATURE_ALGORITHM = 'ED25519'
  private static readonly HMAC_ALGORITHM = 'sha256'
  private static readonly DEFAULT_KEY_SIZE = 2048

  private readonly keyPair: Ed25519Keypair | null = null

  constructor(privateKey?: string) {
    // Initialize Ed25519Keypair for real digital signatures
    if (privateKey) {
      try {
        this.keyPair = Ed25519Keypair.fromSecretKey(privateKey)
        console.log('✅ CryptographicService initialized with Ed25519Keypair')
      } catch (error) {
        console.error('Failed to initialize Ed25519Keypair:', error)
        throw new Error('Invalid DEVELOPER_PRIVATE_KEY format for Ed25519')
      }
    } else {
      console.warn('⚠️ No private key provided - cryptographic signatures will be limited')
    }
  }

  /**
   * Generate cryptographic hash for action data
   */
  static generateActionHash(action: Action): string {
    // Create deterministic serialization
    const actionString = this.serializeForHashing(action)
    return createHash(this.HASH_ALGORITHM).update(actionString).digest('hex')
  }

  /**
   * Generate HMAC for message authentication
   */
  static generateHMAC(data: string, secretKey: string): string {
    return createHmac(this.HASH_ALGORITHM, secretKey).update(data).digest('hex')
  }

  /**
   * Verify HMAC for message authentication
   */
  static verifyHMAC(data: string, secretKey: string, expectedHmac: string): boolean {
    const computedHmac = this.generateHMAC(data, secretKey)
    return this.timingSafeEqual(computedHmac, expectedHmac)
  }

  /**
   * Generate digital signature for action using Ed25519
   */
  async generateDigitalSignature(action: Action): Promise<CryptographicProof | null> {
    if (!this.keyPair) {
      throw new Error('No Ed25519Keypair available for digital signature')
    }

    try {
      const actionString = CryptographicService.serializeForHashing(action)
      const hash = createHash(CryptographicService.HASH_ALGORITHM).update(actionString).digest('hex')

      // Use real Ed25519 digital signature
      const dataBytes = new TextEncoder().encode(actionString)
      const signature = await this.generateEd25519Signature(dataBytes)

      return {
        hash,
        signature,
        algorithm: CryptographicService.SIGNATURE_ALGORITHM,
        timestamp: new Date().toISOString(),
        publicKey: this.keyPair.getPublicKey().toSuiAddress() // Use proper Sui address format
      }
    } catch (error) {
      console.error('Failed to generate Ed25519 digital signature:', error)
      return null
    }
  }

  /**
   * Verify digital signature for action
   */
  async verifyDigitalSignature(
    action: Action,
    proof: CryptographicProof
  ): Promise<IntegrityCheckResult> {
    try {
      // Compute expected hash
      const expectedHash = CryptographicService.generateActionHash(action)

      // Verify hash matches
      const hashMatches = expectedHash === proof.hash

      if (!hashMatches) {
        return {
          isValid: false,
          expectedHash,
          actualHash: expectedHash,
          tamperDetected: true,
          error: 'Action data has been modified'
        }
      }

      // Verify Ed25519 signature if present
      let signatureValid = true
      if (proof.signature) {
        const actionString = CryptographicService.serializeForHashing(action)
        const dataBytes = new TextEncoder().encode(actionString)
        signatureValid = await this.verifyEd25519Signature(dataBytes, proof.signature)
      }

      return {
        isValid: hashMatches && signatureValid,
        expectedHash,
        actualHash: expectedHash,
        signatureValid,
        tamperDetected: !hashMatches
      }

    } catch (error) {
      return {
        isValid: false,
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate unique cryptographic nonce
   */
  static generateNonce(length: number = 32): string {
    return randomBytes(length).toString('hex')
  }

  /**
   * Generate deterministic action ID
   */
  static generateActionId(playerId: string, intent: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString()
    const data = `${playerId}:${intent}:${ts}`
    const hash = createHash(this.HASH_ALGORITHM).update(data).digest('hex')
    return `action_${hash.substring(0, 16)}_${Date.now()}`
  }

  /**
   * Generate verification checksum for action chain
   */
  static generateChainChecksum(actions: Action[]): string {
    const actionHashes = actions
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(action => this.generateActionHash(action))

    const combinedHashes = actionHashes.join(':')
    return createHash(this.HASH_ALGORITHM).update(combinedHashes).digest('hex')
  }

  /**
   * Verify action chain integrity
   */
  static verifyActionChain(
    actions: Action[],
    expectedChecksum: string
  ): IntegrityCheckResult {
    try {
      const actualChecksum = this.generateChainChecksum(actions)
      const isValid = actualChecksum === expectedChecksum

      return {
        isValid,
        expectedHash: expectedChecksum,
        actualHash: actualChecksum,
        tamperDetected: !isValid
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Chain verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate cryptographic proof for blockchain storage
   */
  static generateBlockchainProof(action: Action, worldStateVersion: number): {
    actionHash: string
    worldStateHash: string
    combinedHash: string
    proof: CryptographicProof
  } {
    const actionHash = this.generateActionHash(action)
    const worldStateHash = this.generateWorldStateHash(worldStateVersion)
    const combinedData = `${actionHash}:${worldStateVersion}`
    const combinedHash = createHash(this.HASH_ALGORITHM).update(combinedData).digest('hex')

    const proof: CryptographicProof = {
      hash: combinedHash,
      algorithm: this.HASH_ALGORITHM,
      timestamp: new Date().toISOString()
    }

    return {
      actionHash,
      worldStateHash,
      combinedHash,
      proof
    }
  }

  /**
   * Verify blockchain proof
   */
  static verifyBlockchainProof(
    action: Action,
    worldStateVersion: number,
    proof: CryptographicProof
  ): IntegrityCheckResult {
    try {
      const generatedProof = this.generateBlockchainProof(action, worldStateVersion)
      const isValid = generatedProof.combinedHash === proof.hash

      return {
        isValid,
        expectedHash: generatedProof.combinedHash,
        actualHash: proof.hash,
        tamperDetected: !isValid
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Blockchain proof verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Create tamper-evident log entry
   */
  static createTamperEvidentLog(action: Action, previousLogHash?: string): {
    entry: any
    hash: string
    previousHash: string | undefined
  } {
    const logEntry = {
      actionId: action.id,
      playerId: action.playerId,
      intent: action.intent,
      timestamp: action.timestamp,
      status: action.status,
      previousLogHash
    }

    const entryString = JSON.stringify(logEntry)
    const hash = createHash(CryptographicService.HASH_ALGORITHM).update(entryString).digest('hex')

    return {
      entry: logEntry,
      hash,
      previousHash: previousLogHash
    }
  }

  // Private helper methods

  private static serializeForHashing(action: Action): string {
    // Create deterministic JSON serialization
    const sortedAction = {
      id: action.id,
      playerId: action.playerId,
      intent: action.intent,
      originalInput: action.originalInput,
      timestamp: action.timestamp,
      status: action.status,
      consequences: action.consequences ? action.consequences.map(c => ({
        id: c.id,
        actionId: c.actionId,
        description: c.description,
        impact: c.impact,
        timestamp: c.timestamp
      })) : undefined,
      confidence: action.metadata.confidence
    }

    return JSON.stringify(sortedAction, Object.keys(sortedAction).sort())
  }

  private static generateWorldStateHash(worldStateVersion: number): string {
    return createHash(this.HASH_ALGORITHM)
      .update(`world_state_v${worldStateVersion}`)
      .digest('hex')
  }

  private async generateEd25519Signature(data: Uint8Array): Promise<string> {
    // Use real Ed25519 digital signatures
    if (!this.keyPair) {
      throw new Error('No Ed25519Keypair available for signing')
    }

    const signature = await this.keyPair.sign(data)
    return Array.from(signature).map(byte => byte.toString(16).padStart(2, '0')).join('')
  }

  private async verifyEd25519Signature(data: Uint8Array, signatureHex: string): Promise<boolean> {
    if (!this.keyPair) {
      return false
    }

    try {
      // Convert hex signature back to Uint8Array
      const signatureBytes = new Uint8Array(
        signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      )

      // Get the public key from the keypair
      const publicKey = this.keyPair.getPublicKey()

      // Verify the signature using Ed25519
      return await publicKey.verify(data, signatureBytes)
    } catch (error) {
      console.error('Ed25519 signature verification failed:', error)
      return false
    }
  }

  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  private loadKeyPair(privateKey: string): DigitalKeyPair {
    // In production, this would load from secure key store
    // For demo purposes, generate a deterministic key pair
    return {
      publicKey: `demo_public_key_${privateKey.substring(0, 8)}`,
      privateKey: privateKey,
      algorithm: CryptographicService.SIGNATURE_ALGORITHM,
      createdAt: new Date().toISOString()
    }
  }
}

// Export default instance
export const cryptographicService = new CryptographicService()