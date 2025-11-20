import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { WorldRules, Action, WorldState, StorageLog } from '../types/storage'

export interface BackupConfig {
  enabled: boolean
  basePath: string
  maxBackups: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
  encryptionKey?: string
}

export class BackupStorage {
  private readonly config: BackupConfig
  private readonly logs: StorageLog[] = []

  constructor(config: BackupConfig) {
    this.config = config
    this.ensureBackupDirectory()
  }

  /**
   * Backup world rules (Layer 1)
   */
  async backupWorldRules(rules: WorldRules): Promise<{ success: boolean, path?: string, error?: string }> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'blueprint',
      operation: 'backup',
      id: 'world_rules',
      success: false,
      duration: 0
    }

    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `world_rules_${timestamp}.json`
      const filePath = path.join(this.config.basePath, 'blueprint', filename)

      // Prepare backup data
      const backupData = {
        type: 'world_rules',
        timestamp: new Date().toISOString(),
        originalChecksum: rules.metadata.checksum,
        data: rules
      }

      // Write backup file
      await this.writeBackupFile(filePath, backupData)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = { filePath, checksum: backupData.originalChecksum }
      this.addLog(logEntry)

      await this.cleanupOldBackups('blueprint', 'world_rules_')

      return { success: true, path: filePath }
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
   * Backup action (Layer 2)
   */
  async backupAction(action: Action): Promise<{ success: boolean, path?: string, error?: string }> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'queue',
      operation: 'backup',
      id: action.id,
      success: false,
      duration: 0
    }

    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const filename = `action_${action.id}.json`
      const filePath = path.join(this.config.basePath, 'queue', filename)

      // Prepare backup data
      const backupData = {
        type: 'action',
        timestamp: new Date().toISOString(),
        originalChecksum: action.metadata.verificationHash,
        data: action
      }

      // Write backup file
      await this.writeBackupFile(filePath, backupData)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = { filePath, checksum: backupData.originalChecksum, playerId: action.playerId }
      this.addLog(logEntry)

      return { success: true, path: filePath }
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
   * Backup world state (Layer 3)
   */
  async backupWorldState(state: WorldState): Promise<{ success: boolean, path?: string, error?: string }> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'state',
      operation: 'backup',
      id: `state_v${state.version}`,
      success: false,
      duration: 0
    }

    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const filename = `state_v${state.version}.json`
      const filePath = path.join(this.config.basePath, 'state', filename)

      // Prepare backup data
      const backupData = {
        type: 'world_state',
        timestamp: new Date().toISOString(),
        version: state.version,
        originalChecksum: state.metadata.checksum,
        data: state
      }

      // Write backup file
      await this.writeBackupFile(filePath, backupData)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        filePath,
        checksum: backupData.originalChecksum,
        version: state.version
      }
      this.addLog(logEntry)

      await this.cleanupOldBackups('state', 'state_v')

      return { success: true, path: filePath }
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
   * Restore world rules from backup
   */
  async restoreWorldRules(timestamp?: string): Promise<{ success: boolean, data?: WorldRules, error?: string }> {
    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const backupDir = path.join(this.config.basePath, 'blueprint')
      let filePath: string

      if (timestamp) {
        filePath = path.join(backupDir, `world_rules_${timestamp}.json`)
      } else {
        // Get the latest backup
        const latest = await this.getLatestBackup('blueprint', 'world_rules_')
        if (!latest) {
          return { success: false, error: 'No backup files found' }
        }
        filePath = latest
      }

      const backupData = await this.readBackupFile(filePath)
      if (!backupData || backupData.type !== 'world_rules') {
        return { success: false, error: 'Invalid backup file format' }
      }

      return {
        success: true,
        data: backupData.data as WorldRules
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Restore action from backup
   */
  async restoreAction(actionId: string): Promise<{ success: boolean, data?: Action, error?: string }> {
    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const filePath = path.join(this.config.basePath, 'queue', `action_${actionId}.json`)
      const backupData = await this.readBackupFile(filePath)

      if (!backupData || backupData.type !== 'action') {
        return { success: false, error: 'Action backup not found' }
      }

      return {
        success: true,
        data: backupData.data as Action
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Restore world state from backup
   */
  async restoreWorldState(version?: number): Promise<{ success: boolean, data?: WorldState, error?: string }> {
    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const backupDir = path.join(this.config.basePath, 'state')
      let filePath: string

      if (version) {
        filePath = path.join(backupDir, `state_v${version}.json`)
      } else {
        // Get the latest backup
        const latest = await this.getLatestBackup('state', 'state_v')
        if (!latest) {
          return { success: false, error: 'No backup files found' }
        }
        filePath = latest
      }

      const backupData = await this.readBackupFile(filePath)
      if (!backupData || backupData.type !== 'world_state') {
        return { success: false, error: 'Invalid backup file format' }
      }

      return {
        success: true,
        data: backupData.data as WorldState
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<{
    success: boolean,
    backups?: {
      blueprint: string[]
      queue: string[]
      state: string[]
    },
    error?: string
  }> {
    try {
      const blueprint = await this.listBackupsInLayer('blueprint', 'world_rules_')
      const queue = await this.listBackupsInLayer('queue', 'action_')
      const state = await this.listBackupsInLayer('state', 'state_v')

      return {
        success: true,
        backups: {
          blueprint,
          queue,
          state
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create demo snapshot (complete backup for demo reliability)
   */
  async createDemoSnapshot(
    rules?: WorldRules,
    actions?: Action[],
    state?: WorldState
  ): Promise<{ success: boolean, snapshotPath?: string, error?: string }> {
    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const snapshotPath = path.join(this.config.basePath, 'snapshots', `demo_snapshot_${timestamp}.json`)

      const snapshotData = {
        type: 'demo_snapshot',
        timestamp: new Date().toISOString(),
        description: 'Complete demo snapshot for reliability',
        data: {
          rules,
          actions: actions || [],
          state
        }
      }

      await this.writeBackupFile(snapshotPath, snapshotData)

      return { success: true, snapshotPath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Restore demo snapshot
   */
  async restoreDemoSnapshot(timestamp: string): Promise<{
    success: boolean,
    data?: {
      rules?: WorldRules
      actions?: Action[]
      state?: WorldState
    },
    error?: string
  }> {
    try {
      if (!this.config.enabled) {
        return { success: false, error: 'Backup storage is disabled' }
      }

      const snapshotPath = path.join(this.config.basePath, 'snapshots', `demo_snapshot_${timestamp}.json`)
      const snapshotData = await this.readBackupFile(snapshotPath)

      if (!snapshotData || snapshotData.type !== 'demo_snapshot') {
        return { success: false, error: 'Demo snapshot not found or invalid' }
      }

      return {
        success: true,
        data: snapshotData.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    success: boolean,
    stats?: {
      totalFiles: number
      totalSize: number
      layerStats: {
        blueprint: { count: number, size: number }
        queue: { count: number, size: number }
        state: { count: number, size: number }
        snapshots: { count: number, size: number }
      }
    },
    error?: string
  }> {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        layerStats: {
          blueprint: { count: 0, size: 0 },
          queue: { count: 0, size: 0 },
          state: { count: 0, size: 0 },
          snapshots: { count: 0, size: 0 }
        }
      }

      const layers = ['blueprint', 'queue', 'state', 'snapshots'] as const

      for (const layer of layers) {
        const layerPath = path.join(this.config.basePath, layer)
        try {
          const files = await fs.readdir(layerPath)

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(layerPath, file)
              const fileStats = await fs.stat(filePath)

              stats.totalFiles++
              stats.totalSize += fileStats.size
              stats.layerStats[layer].count++
              stats.layerStats[layer].size += fileStats.size
            }
          }
        } catch {
          // Directory doesn't exist or can't be read
        }
      }

      return { success: true, stats }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get operation logs
   */
  getLogs(): StorageLog[] {
    return [...this.logs]
  }

  private async ensureBackupDirectory(): Promise<void> {
    if (!this.config.enabled) return

    try {
      await fs.mkdir(this.config.basePath, { recursive: true })
      await fs.mkdir(path.join(this.config.basePath, 'blueprint'), { recursive: true })
      await fs.mkdir(path.join(this.config.basePath, 'queue'), { recursive: true })
      await fs.mkdir(path.join(this.config.basePath, 'state'), { recursive: true })
      await fs.mkdir(path.join(this.config.basePath, 'snapshots'), { recursive: true })
    } catch (error) {
      console.error('Failed to create backup directories:', error)
    }
  }

  private async writeBackupFile(filePath: string, data: any): Promise<void> {
    let content = JSON.stringify(data, null, 2)

    // Apply encryption if enabled
    if (this.config.encryptionEnabled && this.config.encryptionKey) {
      content = await this.encrypt(content, this.config.encryptionKey)
    }

    // Apply compression if enabled (placeholder - would need zlib integration)
    if (this.config.compressionEnabled) {
      // content = await compress(content)
    }

    await fs.writeFile(filePath, content, 'utf8')
  }

  private async readBackupFile(filePath: string): Promise<any> {
    let content = await fs.readFile(filePath, 'utf8')

    // Apply decompression if enabled (placeholder)
    if (this.config.compressionEnabled) {
      // content = await decompress(content)
    }

    // Apply decryption if enabled
    if (this.config.encryptionEnabled && this.config.encryptionKey) {
      content = await this.decrypt(content, this.config.encryptionKey)
    }

    return JSON.parse(content)
  }

  private async encrypt(text: string, key: string): Promise<string> {
    const algorithm = 'aes-256-cbc'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, key)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
  }

  private async decrypt(encryptedText: string, key: string): Promise<string> {
    const algorithm = 'aes-256-cbc'
    const textParts = encryptedText.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encrypted = textParts.join(':')

    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  private async listBackupsInLayer(layer: string, prefix: string): Promise<string[]> {
    try {
      const layerPath = path.join(this.config.basePath, layer)
      const files = await fs.readdir(layerPath)

      return files
        .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
        .sort()
        .reverse() // Newest first
    } catch {
      return []
    }
  }

  private async getLatestBackup(layer: string, prefix: string): Promise<string | null> {
    const backups = await this.listBackupsInLayer(layer, prefix)
    return backups.length > 0 ? path.join(this.config.basePath, layer, backups[0]) : null
  }

  private async cleanupOldBackups(layer: string, prefix: string): Promise<void> {
    try {
      const backups = await this.listBackupsInLayer(layer, prefix)

      if (backups.length > this.config.maxBackups) {
        const filesToDelete = backups.slice(this.config.maxBackups)

        for (const file of filesToDelete) {
          const filePath = path.join(this.config.basePath, layer, file)
          await fs.unlink(filePath)
          console.log(`[Backup] Cleaned up old backup: ${file}`)
        }
      }
    } catch (error) {
      console.error(`[Backup] Failed to cleanup old backups for ${layer}:`, error)
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