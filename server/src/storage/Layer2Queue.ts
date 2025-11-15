import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { Action, StorageLayer, StorageResult, ListOptions, WalrusConfig, StorageLog } from '../types/storage'

export class Layer2Queue implements StorageLayer<Action> {
  private readonly storagePath: string
  private readonly walrusConfig: WalrusConfig
  private readonly logs: StorageLog[] = []
  private readonly ACTION_PREFIX = 'action_'
  private readonly ACTION_SUFFIX = '.json'

  constructor(storagePath: string, walrusConfig: WalrusConfig) {
    this.storagePath = storagePath
    this.walrusConfig = walrusConfig
    this.ensureStorageDirectory()
  }

  /**
   * Write a new action to the queue
   * Creates individual action files in action_*.json format
   */
  async write(action: Action): Promise<StorageResult<Action>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'queue',
      operation: 'write',
      id: action.id,
      success: false,
      duration: 0
    }

    try {
      // Validate action structure
      if (!this.validate(action)) {
        throw new Error('Invalid action structure')
      }

      // Generate unique ID if not provided
      if (!action.id) {
        action.id = this.generateActionId()
      }

      // Add timestamp if not provided
      if (!action.timestamp) {
        action.timestamp = new Date().toISOString()
      }

      // Generate checksum for data integrity
      const checksum = this.generateChecksum(action)
      action.metadata.verificationHash = checksum

      // Write to local storage
      const filePath = this.getActionFilePath(action.id)
      const data = JSON.stringify(action, null, 2)
      await fs.writeFile(filePath, data, 'utf8')

      // Try to write to Walrus if sponsored transactions are enabled
      let walrusUrl: string | undefined
      if (this.walrusConfig.sponsoredTransactions) {
        const walrusResult = await this.writeToWalrus(action)
        if (walrusResult.success && walrusResult.url) {
          walrusUrl = walrusResult.url
          action.metadata.walrusUrl = walrusUrl
        }
      }

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = { checksum, walrusUrl, playerId: action.playerId }
      this.addLog(logEntry)

      return {
        success: true,
        data: action,
        metadata: {
          checksum,
          url: walrusUrl,
          timestamp: action.timestamp
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
   * Read a specific action from the queue
   */
  async read(id: string): Promise<StorageResult<Action | null>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'queue',
      operation: 'read',
      id,
      success: false,
      duration: 0
    }

    try {
      const filePath = this.getActionFilePath(id)

      // Check if file exists
      try {
        await fs.access(filePath)
      } catch {
        // File doesn't exist
        const duration = Date.now() - startTime
        logEntry.success = true
        logEntry.duration = duration
        logEntry.metadata = { found: false }
        this.addLog(logEntry)

        return {
          success: true,
          data: null
        }
      }

      // Read existing file
      const data = await fs.readFile(filePath, 'utf8')
      const action: Action = JSON.parse(data)

      // Validate checksum if present
      if (action.metadata.verificationHash) {
        const expectedChecksum = this.generateChecksum(action)
        if (expectedChecksum !== action.metadata.verificationHash) {
          throw new Error('Data integrity check failed: checksum mismatch')
        }
      }

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        found: true,
        playerId: action.playerId,
        status: action.status
      }
      this.addLog(logEntry)

      return {
        success: true,
        data: action
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
   * List actions in the queue with optional filtering
   */
  async list(options: ListOptions = {}): Promise<StorageResult<Action[]>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'queue',
      operation: 'list',
      success: false,
      duration: 0
    }

    try {
      // Read all action files
      const files = await fs.readdir(this.storagePath)
      const actionFiles = files.filter(file =>
        file.startsWith(this.ACTION_PREFIX) && file.endsWith(this.ACTION_SUFFIX)
      )

      const actions: Action[] = []

      for (const file of actionFiles) {
        try {
          const filePath = path.join(this.storagePath, file)
          const data = await fs.readFile(filePath, 'utf8')
          const action: Action = JSON.parse(data)

          // Apply filters if provided
          if (options.filter) {
            let matches = true

            if (options.filter.playerId && action.playerId !== options.filter.playerId) {
              matches = false
            }

            if (options.filter.status && action.status !== options.filter.status) {
              matches = false
            }

            if (options.filter.actionType && action.metadata.parsedIntent?.actionType !== options.filter.actionType) {
              matches = false
            }

            if (!matches) continue
          }

          actions.push(action)
        } catch (error) {
          console.warn(`Failed to read action file ${file}:`, error)
        }
      }

      // Sort actions
      if (options.sortBy) {
        actions.sort((a, b) => {
          const aValue = this.getSortValue(a, options.sortBy!)
          const bValue = this.getSortValue(b, options.sortBy!)

          if (options.sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
          }
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        })
      }

      // Apply pagination
      const limit = options.limit || actions.length
      const offset = options.offset || 0
      const paginatedActions = actions.slice(offset, offset + limit)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        total: actions.length,
        returned: paginatedActions.length,
        filtered: options.filter ? true : false
      }
      this.addLog(logEntry)

      return {
        success: true,
        data: paginatedActions
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logEntry.duration = duration
      logEntry.error = error instanceof Error ? error.message : 'Unknown error'
      this.addLog(logEntry)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }
    }
  }

  /**
   * Delete an action from the queue
   */
  async delete(id: string): Promise<StorageResult<boolean>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'queue',
      operation: 'delete',
      id,
      success: false,
      duration: 0
    }

    try {
      const filePath = this.getActionFilePath(id)

      // Check if file exists
      try {
        await fs.access(filePath)
      } catch {
        // File doesn't exist
        const duration = Date.now() - startTime
        logEntry.success = true
        logEntry.duration = duration
        logEntry.metadata = { existed: false }
        this.addLog(logEntry)

        return {
          success: true,
          data: false
        }
      }

      // Read action before deleting for logging
      const actionData = await fs.readFile(filePath, 'utf8')
      const action: Action = JSON.parse(actionData)

      // Delete the file
      await fs.unlink(filePath)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        existed: true,
        playerId: action.playerId,
        status: action.status
      }
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
   * Validate action structure
   */
  validate(action: Action): boolean {
    try {
      // Check required fields
      if (!action.id || !action.playerId || !action.intent || !action.timestamp) {
        return false
      }

      // Validate status
      const validStatuses = ['pending', 'processing', 'completed', 'failed']
      if (!validStatuses.includes(action.status)) {
        return false
      }

      // Validate metadata
      if (!action.metadata || typeof action.metadata.confidence !== 'number') {
        return false
      }

      // Validate parsed intent if present
      if (action.metadata.parsedIntent) {
        const { parsedIntent } = action.metadata
        if (!parsedIntent.actionType || !parsedIntent.urgency) {
          return false
        }
      }

      // Validate consequences if present
      if (action.consequences) {
        if (!Array.isArray(action.consequences)) {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Get actions by player ID
   */
  async getActionsByPlayer(playerId: string, options: ListOptions = {}): Promise<StorageResult<Action[]>> {
    return this.list({
      ...options,
      filter: { ...options.filter, playerId }
    })
  }

  /**
   * Get actions by status
   */
  async getActionsByStatus(status: string, options: ListOptions = {}): Promise<StorageResult<Action[]>> {
    return this.list({
      ...options,
      filter: { ...options.filter, status }
    })
  }

  /**
   * Update action status
   */
  async updateActionStatus(id: string, status: Action['status']): Promise<StorageResult<Action | null>> {
    const actionResult = await this.read(id)

    if (!actionResult.success || !actionResult.data) {
      return {
        success: false,
        error: actionResult.error || 'Action not found',
        data: null
      }
    }

    const action = actionResult.data
    action.status = status
    action.timestamp = new Date().toISOString()

    return this.write(action)
  }

  /**
   * Get pending actions (for processing queue)
   */
  async getPendingActions(limit: number = 10): Promise<StorageResult<Action[]>> {
    return this.getActionsByStatus('pending', {
      limit,
      sortBy: 'timestamp',
      sortOrder: 'asc'
    })
  }

  /**
   * Get operation logs
   */
  getLogs(): StorageLog[] {
    return [...this.logs]
  }

  /**
   * Create backup of all actions
   */
  async backup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.storagePath, 'backups')

    try {
      await fs.mkdir(backupPath, { recursive: true })

      // Read all action files
      const files = await fs.readdir(this.storagePath)
      const actionFiles = files.filter(file =>
        file.startsWith(this.ACTION_PREFIX) && file.endsWith(this.ACTION_SUFFIX)
      )

      // Create backup batch file
      const backupData: { timestamp: string; actions: Action[] } = {
        timestamp: new Date().toISOString(),
        actions: []
      }

      for (const file of actionFiles) {
        try {
          const filePath = path.join(this.storagePath, file)
          const data = await fs.readFile(filePath, 'utf8')
          const action: Action = JSON.parse(data)
          backupData.actions.push(action)
        } catch (error) {
          console.warn(`Failed to backup action file ${file}:`, error)
        }
      }

      const backupFilePath = path.join(backupPath, `actions_${timestamp}.json`)
      await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  private generateActionId(): string {
    const timestamp = new Date().getTime()
    const random = crypto.randomBytes(4).toString('hex')
    return `${timestamp}_${random}`
  }

  private getActionFilePath(id: string): string {
    return path.join(this.storagePath, `${this.ACTION_PREFIX}${id}${this.ACTION_SUFFIX}`)
  }

  private generateChecksum(action: Action): string {
    const data = JSON.stringify({
      id: action.id,
      playerId: action.playerId,
      intent: action.intent,
      timestamp: action.timestamp,
      status: action.status
    })
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  private getSortValue(action: Action, sortBy: string): string | number {
    switch (sortBy) {
      case 'timestamp':
        return new Date(action.timestamp).getTime()
      case 'playerId':
        return action.playerId
      case 'status':
        return action.status
      case 'confidence':
        return action.metadata.confidence
      default:
        return action.id
    }
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true })
      await fs.mkdir(path.join(this.storagePath, 'backups'), { recursive: true })
    } catch (error) {
      console.error('Failed to create storage directory:', error)
    }
  }

  private async writeToWalrus(action: Action): Promise<{ success: boolean, url?: string, error?: string }> {
    // Walrus integration placeholder
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))

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

  private addLog(log: StorageLog): void {
    this.logs.push(log)

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.splice(0, this.logs.length - 1000)
    }
  }
}