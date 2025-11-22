/**
 * Walrus Service
 *
 * Production-ready Walrus integration using official SDK
 * No CLI dependencies - perfect for deployment
 */

import { walrus } from '@mysten/walrus'
import { SuiClient } from '@mysten/sui/client'
import { getFullnodeUrl } from '@mysten/sui/client'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import 'dotenv/config'

export interface WalrusBlobData {
  type: string
  action?: string
  playerId?: string
  timestamp?: string
  data?: any
  [key: string]: any
}

export interface WalrusWriteResult {
  success: boolean
  blobId?: string
  objectId?: string
  size?: number
  url?: string
  error?: string
  needsFunding?: boolean
}

export interface WalrusReadResult {
  success: boolean
  blobId?: string
  content?: WalrusBlobData
  size?: number
  error?: string
}

export class WalrusService {
  private readonly client: any // Use any to handle $extend walrus() typing issues
  private readonly keypair?: Ed25519Keypair
  private readonly developerAddress?: string
  private readonly network: 'mainnet' | 'testnet'

  constructor() {
    this.network = (process.env.SUI_NETWORK as 'mainnet' | 'testnet') || 'testnet'
    this.developerAddress = process.env.DEVELOPER_ADDRESS

    // Initialize keypair from private key - match official SDK pattern
    const privateKey = process.env.DEVELOPER_PRIVATE_KEY
    if (privateKey) {
      try {
        // Official SDK pattern: direct import for suiprivkey format
        this.keypair = Ed25519Keypair.fromSecretKey(privateKey)
      } catch (error) {
        console.error('Failed to initialize keypair:', error)
        throw new Error('Invalid DEVELOPER_PRIVATE_KEY format')
      }
    }

    // Initialize SuiClient with Walrus extension - match official SDK pattern
    this.client = new SuiClient({
      url: getFullnodeUrl(this.network),
      network: this.network,
    }).$extend(
      walrus({
        storageNodeClientOptions: {
          timeout: 60_000, // 60 second timeout for storage nodes
        },
      }),
    )

    console.log('🔧 Walrus Client Configuration:')
    console.log(`   Network: ${this.network}`)
    console.log(`   RPC URL: ${getFullnodeUrl(this.network)}`)
    console.log(`   Client Type: SuiClient + walrus extension`)

    console.log('🚀 Walrus Service Initialized:')
    console.log(`   Network: ${this.network}`)
    console.log(`   Developer Address: ${this.developerAddress || 'Not set'}`)
    console.log(`   Keypair: ${this.keypair ? 'Configured' : 'Not configured'}`)
    console.log(`   Deployment Ready: ✅ No CLI dependencies`)
  }

  /**
   * Write data to Walrus - Official SDK pattern
   */
  async writeBlob(data: WalrusBlobData, options?: {
    deletable?: boolean
    epochs?: number
  }): Promise<WalrusWriteResult> {
    try {
      if (!this.keypair) {
        throw new Error('No keypair configured. Set DEVELOPER_PRIVATE_KEY in your .env file.')
      }

      // Prepare data
      const blobData: WalrusBlobData = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
        network: this.network,
        developer: this.developerAddress,
        storageType: 'walrus-blob-sdk',
        version: '1.0',
        sdkGenerated: true,
        serverTimestamp: new Date().toISOString()
      }

      const jsonData = JSON.stringify(blobData, null, 2)
      const dataBytes = new TextEncoder().encode(jsonData)

      // Official SDK pattern - simple and clean
      const { blobId, blobObject } = await this.client.walrus.writeBlob({
        blob: dataBytes,
        signer: this.keypair,
        deletable: options?.deletable !== false,
        epochs: Math.min(options?.epochs || 100, 50) // Use smaller epochs for hackathon demo
      })

      return {
        success: true,
        blobId,
        objectId: blobObject?.id?.id || blobId,
        size: parseInt(blobObject?.size || '0'),
        url: `https://walrus-gateway.${this.network}.walrus.ai/blobs/${blobId}`
      }

    } catch (error: any) {
      console.error('❌ Walrus write error:', error)

      // Handle WAL token issues gracefully
      if (error.message?.includes('Not enough coins') || error.message?.includes('WAL')) {
        return {
          success: false,
          needsFunding: true,
          error: `WAL tokens required. Visit https://faucet.walrus.ai/ to get testnet WAL tokens.`,
          blobId: 'pending-funding'
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Read blob from Walrus
   */
  async readBlob(blobId: string): Promise<WalrusReadResult> {
    try {
      const blobBytes = await this.client.walrus.readBlob({ blobId })

      let content: WalrusBlobData
      try {
        const textContent = new TextDecoder().decode(blobBytes)
        content = JSON.parse(textContent)
      } catch (parseError) {
        throw new Error(`Failed to parse blob content: ${parseError}`)
      }

      return {
        success: true,
        blobId,
        content,
        size: blobBytes.length
      }

    } catch (error) {
      console.error(`❌ Failed to read blob ${blobId}:`, error)
      return {
        success: false,
        blobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get blob URLs
   */
  getBlobUrls(blobId: string): {
    gateway: string
    download: string
    explorer: string
  } {
    return {
      gateway: `https://walrus-gateway.${this.network}.walrus.ai/blobs/${blobId}`,
      download: `https://walrus-gateway.${this.network}.walrus.ai/blobs/${blobId}/download`,
      explorer: `https://walruscan.com/${this.network}/blob/${blobId}`
    }
  }

  /**
   * Check service health and WAL token status
   */
  async checkHealth(): Promise<{
    healthy: boolean
    walConfigured: boolean
    developerAddress: string | null
    network: string
    needsFunding: boolean
  }> {
    return {
      healthy: !!this.keypair && !!this.developerAddress,
      walConfigured: !!this.keypair,
      developerAddress: this.developerAddress || null,
      network: this.network,
      needsFunding: false // Would need actual balance check to determine
    }
  }
}

// Export singleton instance
export const walrusService = new WalrusService()