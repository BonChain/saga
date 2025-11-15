import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { WorldRules, StorageLayer, StorageResult, ButterflyEffect, Effect, WalrusConfig, StorageLog } from '../types/storage'

export class Layer1Blueprint implements StorageLayer<WorldRules> {
  private readonly storagePath: string
  private readonly walrusConfig: WalrusConfig
  private readonly logs: StorageLog[] = []
  private readonly WORLD_RULES_FILE = 'world_rules.json'

  constructor(storagePath: string, walrusConfig: WalrusConfig) {
    this.storagePath = storagePath
    this.walrusConfig = walrusConfig
    this.ensureStorageDirectory()
  }

  /**
   * Write world rules to storage Layer 1
   * This contains immutable world rules and butterfly effect logic
   */
  async write(rules: WorldRules): Promise<StorageResult<WorldRules>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'blueprint',
      operation: 'write',
      id: this.WORLD_RULES_FILE,
      success: false,
      duration: 0
    }

    try {
      // Validate world rules structure
      if (!this.validate(rules)) {
        throw new Error('Invalid world rules structure')
      }

      // Generate checksum for data integrity
      const checksum = this.generateChecksum(rules)
      rules.metadata.checksum = checksum

      // Add timestamp
      rules.lastModified = new Date().toISOString()

      // Write to local storage
      const filePath = path.join(this.storagePath, this.WORLD_RULES_FILE)
      const data = JSON.stringify(rules, null, 2)
      await fs.writeFile(filePath, data, 'utf8')

      // Try to write to Walrus if sponsored transactions are enabled
      let walrusUrl: string | undefined
      if (this.walrusConfig.sponsoredTransactions) {
        const walrusResult = await this.writeToWalrus(rules)
        if (walrusResult.success && walrusResult.url) {
          walrusUrl = walrusResult.url
        }
      }

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = { checksum, walrusUrl }
      this.addLog(logEntry)

      return {
        success: true,
        data: rules,
        metadata: {
          checksum,
          url: walrusUrl,
          timestamp: rules.lastModified
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logEntry.duration = duration
      logEntry.error = error instanceof Error ? error.message : 'Unknown error'
      this.addLog(logEntry)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Read world rules from storage
   */
  async read(): Promise<StorageResult<WorldRules | null>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'blueprint',
      operation: 'read',
      id: this.WORLD_RULES_FILE,
      success: false,
      duration: 0
    }

    try {
      const filePath = path.join(this.storagePath, this.WORLD_RULES_FILE)

      // Check if file exists
      try {
        await fs.access(filePath)
      } catch {
        // File doesn't exist, return default world rules
        const defaultRules = this.createDefaultWorldRules()
        const duration = Date.now() - startTime
        logEntry.success = true
        logEntry.duration = duration
        logEntry.metadata = { source: 'default' }
        this.addLog(logEntry)

        return {
          success: true,
          data: defaultRules
        }
      }

      // Read existing file
      const data = await fs.readFile(filePath, 'utf8')
      const rules: WorldRules = JSON.parse(data)

      // Validate checksum if present
      if (rules.metadata.checksum) {
        const expectedChecksum = this.generateChecksum(rules)
        if (expectedChecksum !== rules.metadata.checksum) {
          throw new Error('Data integrity check failed: checksum mismatch')
        }
      }

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      this.addLog(logEntry)

      return {
        success: true,
        data: rules
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logEntry.duration = duration
      logEntry.error = error instanceof Error ? error.message : 'Unknown error'
      this.addLog(logEntry)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }
    }
  }

  /**
   * List available world rules (only one set allowed)
   */
  async list(): Promise<StorageResult<WorldRules[]>> {
    const result = await this.read()

    if (result.success && result.data) {
      return {
        success: true,
        data: [result.data]
      }
    }

    return {
      success: result.success,
      data: [],
      error: result.error
    }
  }

  /**
   * Delete world rules (not recommended for production)
   */
  async delete(): Promise<StorageResult<boolean>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'blueprint',
      operation: 'delete',
      id: this.WORLD_RULES_FILE,
      success: false,
      duration: 0
    }

    try {
      const filePath = path.join(this.storagePath, this.WORLD_RULES_FILE)
      await fs.unlink(filePath)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      this.addLog(logEntry)

      return {
        success: true,
        data: true
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logEntry.duration = duration
      logEntry.error = error instanceof Error ? error.message : 'Unknown error'
      this.addLog(logEntry)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: false
      }
    }
  }

  /**
   * Validate world rules structure
   */
  validate(rules: WorldRules): boolean {
    try {
      // Check required top-level fields
      if (!rules.version || !rules.rules || !rules.metadata) {
        return false
      }

      // Validate rules structure
      const { rules: worldRules } = rules
      if (!worldRules.physics || !worldRules.characterBehavior ||
          !worldRules.actionConstraints || !Array.isArray(worldRules.butterflyEffects)) {
        return false
      }

      // Validate metadata
      if (!rules.metadata.description || !rules.metadata.author) {
        return false
      }

      // Validate butterfly effects
      for (const effect of worldRules.butterflyEffects) {
        if (!this.validateButterflyEffect(effect)) {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Create backup of world rules
   */
  async backup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.storagePath, `backups`)

    try {
      await fs.mkdir(backupPath, { recursive: true })

      const sourcePath = path.join(this.storagePath, this.WORLD_RULES_FILE)
      const backupFilePath = path.join(backupPath, `world_rules_${timestamp}.json`)

      await fs.copyFile(sourcePath, backupFilePath)
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  /**
   * Get operation logs
   */
  getLogs(): StorageLog[] {
    return [...this.logs]
  }

  /**
   * Get butterfly effects for a specific trigger
   */
  async getButterflyEffects(trigger: string): Promise<ButterflyEffect[]> {
    const result = await this.read()
    if (result.success && result.data) {
      return result.data.rules.butterflyEffects.filter(
        effect => effect.trigger.toLowerCase().includes(trigger.toLowerCase())
      )
    }
    return []
  }

  private validateButterflyEffect(effect: ButterflyEffect): boolean {
    if (!effect.id || !effect.trigger || !effect.description ||
        typeof effect.probability !== 'number' || !Array.isArray(effect.effects)) {
      return false
    }

    // Validate effects array
    for (const eff of effect.effects) {
      if (!eff.type || !eff.target || !eff.change) {
        return false
      }
    }

    return true
  }

  private generateChecksum(rules: WorldRules): string {
    const data = JSON.stringify({
      version: rules.version,
      rules: rules.rules
    })
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true })
      await fs.mkdir(path.join(this.storagePath, 'backups'), { recursive: true })
    } catch (error) {
      console.error('Failed to create storage directory:', error)
    }
  }

  private async writeToWalrus(rules: WorldRules): Promise<{ success: boolean, url?: string, error?: string }> {
    // Walrus integration placeholder
    // In a real implementation, this would interact with the Walrus storage API
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))

      // Return mock result for now
      return {
        success: false,
        error: 'Walrus integration not yet implemented'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private createDefaultWorldRules(): WorldRules {
    return {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      rules: {
        physics: {
          gravity: 9.81,
          timeFlow: 1,
          weatherPatterns: ['clear', 'cloudy', 'rain', 'storm'],
          magicalEnergy: true
        },
        characterBehavior: {
          maxHealth: 100,
          baseMovementSpeed: 5,
          socialInteractionRange: 10,
          memoryCapacity: 1000,
          emotionInfluence: 0.8
        },
        actionConstraints: {
          maxActionsPerTurn: 1,
          actionCooldown: 5000,
          rangeLimit: 100,
          resourceRequirements: true
        },
        butterflyEffects: [
          {
            id: 'dragon_defeat',
            trigger: 'defeat_dragon',
            effects: [
              {
                type: 'economic',
                target: 'village',
                change: { prosperity: 50, celebration: true },
                duration: 7200000, // 2 hours
                cascading: true
              },
              {
                type: 'relationship',
                target: 'dragons',
                change: { hostility: 80 },
                permanent: true
              }
            ],
            probability: 1.0,
            description: 'Defeating a dragon causes village celebration and increased dragon hostility'
          },
          {
            id: 'tavern_burn',
            trigger: 'burn_tavern',
            effects: [
              {
                type: 'economic',
                target: 'village',
                change: { prosperity: -20, rebuilding: true },
                duration: 86400000, // 24 hours
                cascading: true
              },
              {
                type: 'relationship',
                target: 'villagers',
                change: { hostility: 30, suspicion: true },
                duration: 43200000 // 12 hours
              }
            ],
            probability: 0.9,
            description: 'Burning the tavern damages village economy and villager relationships'
          }
        ]
      },
      metadata: {
        description: 'SuiSaga Living World Rules - Default Configuration',
        author: 'SuiSaga System',
        checksum: ''
      }
    }
  }

  private addLog(log: StorageLog): void {
    this.logs.push(log)

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.splice(0, this.logs.length - 1000)
    }
  }
}