import { promises as fs } from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { WorldState, StorageLayer, StorageResult, ListOptions, WalrusConfig, StorageLog } from '../types/storage'

export class Layer3State implements StorageLayer<WorldState> {
  private readonly storagePath: string
  private readonly walrusConfig: WalrusConfig
  private readonly logs: StorageLog[] = []
  private readonly STATE_PREFIX = 'state_'
  private readonly STATE_SUFFIX = '.json'
  private currentStateVersion: number = 1

  constructor(storagePath: string, walrusConfig: WalrusConfig) {
    this.storagePath = storagePath
    this.walrusConfig = walrusConfig
    this.ensureStorageDirectory()
  }

  /**
   * Write a new world state version
   * Creates versioned world state shards in state_*_vN.json files
   */
  async write(state: WorldState): Promise<StorageResult<WorldState>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'state',
      operation: 'write',
      id: `state_v${state.version}`,
      success: false,
      duration: 0
    }

    try {
      // Validate world state structure
      if (!this.validate(state)) {
        throw new Error('Invalid world state structure')
      }

      // Auto-increment version if not specified
      if (!state.version || state.version <= this.currentStateVersion) {
        state.version = this.currentStateVersion + 1
      }

      // Add timestamp
      state.timestamp = new Date().toISOString()

      // Generate checksum for data integrity
      const checksum = this.generateChecksum(state)
      state.metadata.checksum = checksum

      // Write to local storage
      const filePath = this.getStateFilePath(state.version)
      const data = JSON.stringify(state, null, 2)
      await fs.writeFile(filePath, data, 'utf8')

      // Update current version
      this.currentStateVersion = state.version

      // Try to write to Walrus if sponsored transactions are enabled
      let walrusUrl: string | undefined
      if (this.walrusConfig.sponsoredTransactions) {
        const walrusResult = await this.writeToWalrus(state)
        if (walrusResult.success && walrusResult.url) {
          walrusUrl = walrusResult.url
          state.metadata.walrusUrl = walrusUrl
        }
      }

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        version: state.version,
        checksum,
        walrusUrl,
        actionCount: state.metadata.actionCount
      }
      this.addLog(logEntry)

      return {
        success: true,
        data: state,
        metadata: {
          checksum,
          url: walrusUrl,
          timestamp: state.timestamp
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
   * Read a specific world state version
   */
  async read(id: string): Promise<StorageResult<WorldState | null>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'state',
      operation: 'read',
      id,
      success: false,
      duration: 0
    }

    try {
      let filePath: string

      if (id === 'latest' || id === 'current') {
        // Get the latest version
        const latestResult = await this.getLatestVersion()
        if (!latestResult.success || !latestResult.data) {
          throw new Error('No world state versions available')
        }
        filePath = this.getStateFilePath(latestResult.data.version)
      } else {
        // Parse version from id
        const version = this.parseVersionFromId(id)
        if (!version) {
          throw new Error(`Invalid state ID format: ${id}`)
        }
        filePath = this.getStateFilePath(version)
      }

      // Check if file exists
      try {
        await fs.access(filePath)
      } catch {
        // File doesn't exist, create default world state
        const defaultState = this.createDefaultWorldState()
        const duration = Date.now() - startTime
        logEntry.success = true
        logEntry.duration = duration
        logEntry.metadata = { source: 'default' }
        this.addLog(logEntry)

        return {
          success: true,
          data: defaultState
        }
      }

      // Read existing file
      const data = await fs.readFile(filePath, 'utf8')
      const state: WorldState = JSON.parse(data)

      // Validate checksum if present
      if (state.metadata.checksum) {
        const expectedChecksum = this.generateChecksum(state)
        if (expectedChecksum !== state.metadata.checksum) {
          throw new Error('Data integrity check failed: checksum mismatch')
        }
      }

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        version: state.version,
        actionCount: state.metadata.actionCount,
        regionCount: Object.keys(state.regions).length
      }
      this.addLog(logEntry)

      return {
        success: true,
        data: state
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
   * List available world state versions
   */
  async list(options: ListOptions = {}): Promise<StorageResult<WorldState[]>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'state',
      operation: 'list',
      success: false,
      duration: 0
    }

    try {
      // Read all state files
      const files = await fs.readdir(this.storagePath)
      const stateFiles = files.filter(file =>
        file.startsWith(this.STATE_PREFIX) && file.endsWith(this.STATE_SUFFIX)
      )

      const states: WorldState[] = []

      for (const file of stateFiles) {
        try {
          const filePath = path.join(this.storagePath, file)
          const data = await fs.readFile(filePath, 'utf8')
          const state: WorldState = JSON.parse(data)

          // Apply filters if provided
          if (options.filter) {
            let matches = true

            if (options.filter.minVersion && state.version < options.filter.minVersion) {
              matches = false
            }

            if (options.filter.maxVersion && state.version > options.filter.maxVersion) {
              matches = false
            }

            if (options.filter.regionCount && Object.keys(state.regions).length !== options.filter.regionCount) {
              matches = false
            }

            if (!matches) continue
          }

          states.push(state)
        } catch (error) {
          console.warn(`Failed to read state file ${file}:`, error)
        }
      }

      // Sort states by version (newest first by default)
      states.sort((a, b) => {
        if (options.sortBy === 'timestamp') {
          const aTime = new Date(a.timestamp).getTime()
          const bTime = new Date(b.timestamp).getTime()
          return options.sortOrder === 'asc' ? aTime - bTime : bTime - aTime
        }

        // Default sort by version
        return options.sortOrder === 'asc' ? a.version - b.version : b.version - a.version
      })

      // Apply pagination
      const limit = options.limit || states.length
      const offset = options.offset || 0
      const paginatedStates = states.slice(offset, offset + limit)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        total: states.length,
        returned: paginatedStates.length,
        latestVersion: states.length > 0 ? Math.max(...states.map(s => s.version)) : 0
      }
      this.addLog(logEntry)

      return {
        success: true,
        data: paginatedStates
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
   * Delete a specific world state version
   */
  async delete(id: string): Promise<StorageResult<boolean>> {
    const startTime = Date.now()
    const logEntry: StorageLog = {
      timestamp: new Date().toISOString(),
      layer: 'state',
      operation: 'delete',
      id,
      success: false,
      duration: 0
    }

    try {
      const version = this.parseVersionFromId(id)
      if (!version) {
        throw new Error(`Invalid state ID format: ${id}`)
      }

      const filePath = this.getStateFilePath(version)

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

      // Read state before deleting for logging
      const stateData = await fs.readFile(filePath, 'utf8')
      const state: WorldState = JSON.parse(stateData)

      // Don't allow deletion of the latest version
      if (state.version === this.currentStateVersion) {
        throw new Error('Cannot delete the latest world state version')
      }

      // Delete the file
      await fs.unlink(filePath)

      const duration = Date.now() - startTime
      logEntry.success = true
      logEntry.duration = duration
      logEntry.metadata = {
        existed: true,
        version: state.version,
        actionCount: state.metadata.actionCount
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
   * Validate world state structure
   */
  validate(state: WorldState): boolean {
    try {
      // Check required top-level fields
      if (!state.version || !state.timestamp || !state.regions || !state.characters) {
        return false
      }

      // Validate regions
      for (const [regionId, region] of Object.entries(state.regions)) {
        if (!region.id || !region.name || !region.type || !region.status) {
          return false
        }
      }

      // Validate characters
      for (const [characterId, character] of Object.entries(state.characters)) {
        if (!character.id || !character.name || !character.type || !character.location) {
          return false
        }
      }

      // Validate metadata
      if (!state.metadata || typeof state.metadata.actionCount !== 'number') {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Get the latest world state version
   */
  async getLatestVersion(): Promise<StorageResult<WorldState | null>> {
    const result = await this.list({ limit: 1, sortBy: 'version', sortOrder: 'desc' })

    if (result.success && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      }
    }

    return {
      success: false,
      data: null,
      error: 'No world state versions available'
    }
  }

  /**
   * Create a new world state based on the current one with modifications
   */
  async createStateTransition(modifications: Partial<WorldState>): Promise<StorageResult<WorldState>> {
    const latestResult = await this.getLatestVersion()

    if (!latestResult.success || !latestResult.data) {
      return {
        success: false,
        error: latestResult.error || 'Failed to get current world state'
      }
    }

    const currentState = latestResult.data

    // Create new state with modifications
    const newState: WorldState = {
      ...currentState,
      version: currentState.version + 1,
      previousVersion: currentState.version,
      timestamp: new Date().toISOString(),
      ...modifications
    }

    // Deep merge complex objects
    if (modifications.regions) {
      newState.regions = { ...currentState.regions, ...modifications.regions }
    }

    if (modifications.characters) {
      newState.characters = { ...currentState.characters, ...modifications.characters }
    }

    if (modifications.relationships) {
      newState.relationships = { ...currentState.relationships, ...modifications.relationships }
    }

    if (modifications.economy) {
      newState.economy = { ...currentState.economy, ...modifications.economy }
    }

    if (modifications.environment) {
      newState.environment = { ...currentState.environment, ...modifications.environment }
    }

    return this.write(newState)
  }

  /**
   * Get operation logs
   */
  getLogs(): StorageLog[] {
    return [...this.logs]
  }

  /**
   * Get state history for a specific region
   */
  async getRegionHistory(regionId: string, limit: number = 10): Promise<StorageResult<any[]>> {
    const result = await this.list({ limit, sortBy: 'timestamp', sortOrder: 'desc' })

    if (!result.success) {
      return {
        success: false,
        data: [],
        error: result.error
      }
    }

    const regionHistory = result.data
      .filter(state => state.regions[regionId])
      .map(state => ({
        version: state.version,
        timestamp: state.timestamp,
        region: state.regions[regionId]
      }))

    return {
      success: true,
      data: regionHistory
    }
  }

  /**
   * Get character history
   */
  async getCharacterHistory(characterId: string, limit: number = 10): Promise<StorageResult<any[]>> {
    const result = await this.list({ limit, sortBy: 'timestamp', sortOrder: 'desc' })

    if (!result.success) {
      return {
        success: false,
        data: [],
        error: result.error
      }
    }

    const characterHistory = result.data
      .filter(state => state.characters[characterId])
      .map(state => ({
        version: state.version,
        timestamp: state.timestamp,
        character: state.characters[characterId]
      }))

    return {
      success: true,
      data: characterHistory
    }
  }

  /**
   * Create backup of all world states
   */
  async backup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.storagePath, 'backups')

    try {
      await fs.mkdir(backupPath, { recursive: true })

      // Read all state files
      const files = await fs.readdir(this.storagePath)
      const stateFiles = files.filter(file =>
        file.startsWith(this.STATE_PREFIX) && file.endsWith(this.STATE_SUFFIX)
      )

      // Create backup batch file
      const backupData: { timestamp: string; states: WorldState[] } = {
        timestamp: new Date().toISOString(),
        states: []
      }

      for (const file of stateFiles) {
        try {
          const filePath = path.join(this.storagePath, file)
          const data = await fs.readFile(filePath, 'utf8')
          const state: WorldState = JSON.parse(data)
          backupData.states.push(state)
        } catch (error) {
          console.warn(`Failed to backup state file ${file}:`, error)
        }
      }

      const backupFilePath = path.join(backupPath, `states_${timestamp}.json`)
      await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  private parseVersionFromId(id: string): number | null {
    // Try to extract version from ID like "state_v1" or "state_1"
    const match = id.match(/(?:state[_v]?)(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  private getStateFilePath(version: number): string {
    return path.join(this.storagePath, `${this.STATE_PREFIX}v${version}${this.STATE_SUFFIX}`)
  }

  private generateChecksum(state: WorldState): string {
    const data = JSON.stringify({
      version: state.version,
      timestamp: state.timestamp,
      regions: state.regions,
      characters: state.characters,
      relationships: state.relationships
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

  private async writeToWalrus(state: WorldState): Promise<{ success: boolean, url?: string, error?: string }> {
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

  private createDefaultWorldState(): WorldState {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      regions: {
        village: {
          id: 'village',
          name: 'Dragonslayer Village',
          type: 'village',
          status: 'peaceful',
          population: 150,
          economy: {
            prosperity: 70,
            resources: {
              gold: 1000,
              food: 500,
              weapons: 100
            },
            tradeRoutes: ['forest', 'mountains']
          },
          events: [],
          properties: {
            description: 'A quiet village on the edge of dragon territory',
            tavern: 'The Gilded Dragon',
            blacksmith: 'Ironforge Arms'
          }
        },
        lair: {
          id: 'lair',
          name: 'Ancient Dragon Lair',
          type: 'lair',
          status: 'tense',
          population: 3,
          economy: {
            prosperity: 0,
            resources: {
              gold: 50000,
              gems: 1000,
              artifacts: 10
            },
            tradeRoutes: []
          },
          events: [],
          properties: {
            description: 'The ancient lair of powerful dragons',
            magicalEnergy: 95,
            dangerLevel: 10
          }
        },
        forest: {
          id: 'forest',
          name: 'Whispering Woods',
          type: 'forest',
          status: 'peaceful',
          population: 45,
          economy: {
            prosperity: 40,
            resources: {
              herbs: 200,
              wood: 300,
              game: 150
            },
            tradeRoutes: ['village']
          },
          events: [],
          properties: {
            description: 'Ancient forest with magical properties',
            magicalCreatures: true,
            hiddenPaths: 5
          }
        }
      },
      characters: {
        elder: {
          id: 'elder',
          name: 'Village Elder',
          type: 'npc',
          location: {
            regionId: 'village',
            coordinates: { x: 10, y: 15 }
          },
          status: 'active',
          attributes: {
            health: 80,
            maxHealth: 80,
            relationships: {},
            reputation: { village: 90 },
            inventory: { wisdom_tome: 1, healing_herbs: 10 }
          },
          memories: [],
          properties: {
            role: 'village_elder',
            personality: 'wise_cautious',
            knowledge: 'local_history'
          }
        },
        dragon_lord: {
          id: 'dragon_lord',
          name: 'Ignis the Ancient',
          type: 'dragon',
          location: {
            regionId: 'lair',
            coordinates: { x: 50, y: 50 }
          },
          status: 'active',
          attributes: {
            health: 500,
            maxHealth: 500,
            relationships: { villagers: -80, adventurers: -60 },
            reputation: { feared: 100 },
            inventory: { ancient_gems: 10 }
          },
          memories: [],
          properties: {
            age: 'ancient',
            element: 'fire',
            intelligence: 'genius'
          }
        }
      },
      relationships: {},
      economy: {
        currency: 'gold',
        exchangeRates: { gem: 100, silver: 1 },
        marketStatus: 'stable',
        resources: {
          food: {
            supply: 500,
            demand: 450,
            price: 2,
            trend: 'stable'
          },
          weapons: {
            supply: 100,
            demand: 80,
            price: 50,
            trend: 'rising'
          }
        }
      },
      environment: {
        timeOfDay: 12,
        weather: 'clear',
        season: 'summer',
        magicalEnergy: 75,
        phenomena: []
      },
      metadata: {
        checksum: '',
        actionCount: 0,
        description: 'Initial world state for SuiSaga Living World'
      }
    }
  }

  /**
   * Get current world state (highest version)
   */
  async getCurrentState(): Promise<any> {
    const result = await this.list()
    if (result.success && result.data.length > 0) {
      // Sort by version and return the highest
      const sorted = result.data.sort((a, b) => (b.version || 0) - (a.version || 0))
      return sorted[0]
    }

    // Return default world state if no state exists
    return this.createDefaultWorldState()
  }

  /**
   * Update world state with new data
   */
  async updateWorldState(updates: any): Promise<StorageResult<WorldState>> {
    try {
      // Get current state
      const currentState = await this.getCurrentState()

      // Apply updates
      const updatedState = {
        ...currentState,
        ...updates,
        version: (currentState.version || 0) + 1,
        timestamp: new Date().toISOString(),
        metadata: {
          ...currentState.metadata,
          ...updates.metadata,
          lastUpdate: new Date().toISOString()
        }
      }

      // Write updated state
      return await this.write(updatedState)
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