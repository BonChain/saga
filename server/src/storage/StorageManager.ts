import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Layer1Blueprint } from './Layer1Blueprint'
import { Layer2Queue } from './Layer2Queue'
import { Layer3State } from './Layer3State'
import { WalrusClient } from './WalrusClient'
import { BackupStorage } from './BackupStorage'
import { DataValidation } from './DataValidation'
import { StorageLogger } from './StorageLogger'
import { WorldRules, Action, WorldState, WalrusConfig, BackupConfig, ValidationConfig, LoggerConfig } from '../types/storage'

export interface StorageManagerConfig {
  storageBasePath: string
  walrus: WalrusConfig
  backup: BackupConfig
  validation: ValidationConfig
  logger: LoggerConfig
}

export class StorageManager {
  private readonly config: StorageManagerConfig
  private readonly layer1: Layer1Blueprint
  private readonly layer2: Layer2Queue
  private readonly layer3: Layer3State
  private readonly walrusClient: WalrusClient
  private readonly backupStorage: BackupStorage
  private readonly dataValidation: DataValidation
  private readonly logger: StorageLogger

  constructor(config: StorageManagerConfig) {
    this.config = config

    // Initialize storage layers
    this.layer1 = new Layer1Blueprint(
      path.join(config.storageBasePath, 'layer1-blueprint'),
      config.walrus
    )

    this.layer2 = new Layer2Queue(
      path.join(config.storageBasePath, 'layer2-queue'),
      config.walrus
    )

    this.layer3 = new Layer3State(
      path.join(config.storageBasePath, 'layer3-state'),
      config.walrus
    )

    // Initialize supporting services
    this.walrusClient = new WalrusClient(config.walrus)
    this.backupStorage = new BackupStorage(config.backup)
    this.dataValidation = new DataValidation(config.validation)
    this.logger = new StorageLogger(config.logger)
  }

  // LAYER 1: BLUEPRINT OPERATIONS

  /**
   * Initialize world rules
   */
  async initializeWorldRules(rules?: WorldRules): Promise<{ success: boolean, error?: string, rules?: WorldRules }> {
    try {
      this.logger.info('blueprint', 'initialize', 'Initializing world rules...')

      let worldRules: WorldRules

      if (rules) {
        // Validate provided rules
        const validation = this.dataValidation.validateWorldRules(rules)
        if (!validation.valid) {
          const errorMsg = `Invalid world rules: ${validation.errors.join(', ')}`
          this.logger.error('blueprint', 'initialize', errorMsg)
          return { success: false, error: errorMsg }
        }

        worldRules = rules
      } else {
        // Get existing rules or create defaults
        const result = await this.layer1.read()
        if (result.success && result.data) {
          worldRules = result.data
        } else {
          worldRules = await this.createDefaultWorldRules()
        }
      }

      // Store rules
      const storeResult = await this.layer1.write(worldRules)
      if (!storeResult.success) {
        this.logger.error('blueprint', 'initialize', 'Failed to store world rules', new Error(storeResult.error))
        return { success: false, error: storeResult.error }
      }

      // Create backup
      await this.backupStorage.backupWorldRules(worldRules)

      this.logger.info('blueprint', 'initialize', 'World rules initialized successfully')

      return { success: true, rules: worldRules }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('blueprint', 'initialize', 'Failed to initialize world rules', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Get world rules
   */
  async getWorldRules(): Promise<{ success: boolean, error?: string, rules?: WorldRules }> {
    try {
      const result = await this.layer1.read()
      if (result.success && result.data) {
        return { success: true, rules: result.data }
      } else {
        return { success: false, error: result.error || 'Failed to read world rules' }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('blueprint', 'read', 'Failed to read world rules', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Get butterfly effects for a trigger
   */
  async getButterflyEffects(trigger: string): Promise<{ success: boolean, effects?: any[], error?: string }> {
    try {
      const effects = await this.layer1.getButterflyEffects(trigger)
      return { success: true, effects }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('blueprint', 'getButterflyEffects', 'Failed to get butterfly effects', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  // LAYER 2: QUEUE OPERATIONS

  /**
   * Submit a new action
   */
  async submitAction(
    playerId: string,
    intent: string,
    originalInput: string,
    parsedIntent?: any
  ): Promise<{ success: boolean, error?: string, action?: Action }> {
    try {
      this.logger.info('queue', 'submit', `Submitting action for player ${playerId}: ${intent}`)

      // Create action object
      // Story 2.3: Use 'received' status for immediate confirmation
      const action: Action = {
        id: this.generateActionId(),
        playerId,
        intent,
        originalInput,
        timestamp: new Date().toISOString(),
        status: 'received', // Actions start as 'received' for immediate confirmation
        metadata: {
          confidence: 0.8, // Default confidence
          parsedIntent
        }
      }

      // Validate action
      const validation = this.dataValidation.validateAction(action)
      if (!validation.valid) {
        const errorMsg = `Invalid action: ${validation.errors.join(', ')}`
        this.logger.error('queue', 'submit', errorMsg)
        return { success: false, error: errorMsg }
      }

      // Store action
      const storeResult = await this.layer2.write(action)
      if (!storeResult.success) {
        const errorMsg = `Failed to store action: ${storeResult.error}`
        this.logger.error('queue', 'submit', errorMsg)
        return { success: false, error: errorMsg }
      }

      // Create backup
      await this.backupStorage.backupAction(action)

      this.logger.info('queue', 'submit', `Action submitted successfully: ${action.id}`, {
        id: action.id,
        playerId,
        success: true
      })

      return { success: true, action }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('queue', 'submit', 'Failed to submit action', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Get actions
   */
  async getActions(
    playerId?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ success: boolean, error?: string, actions?: Action[], total?: number }> {
    try {
      const filter: any = {}
      if (playerId) filter.playerId = playerId
      if (status) filter.status = status

      const result = await this.layer2.list({ filter, limit, offset })
      if (result.success) {
        return { success: true, actions: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('queue', 'list', 'Failed to get actions', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Get pending actions for processing
   */
  async getPendingActions(limit: number = 10): Promise<{ success: boolean, actions?: Action[], error?: string }> {
    try {
      const result = await this.layer2.getPendingActions(limit)
      if (result.success) {
        return { success: true, actions: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('queue', 'getPending', 'Failed to get pending actions', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Update action status
   */
  async updateActionStatus(
    actionId: string,
    status: Action['status'],
    consequences?: any[]
  ): Promise<{ success: boolean, error?: string, action?: Action }> {
    try {
      const result = await this.layer2.updateActionStatus(actionId, status)

      if (result.success && result.data && consequences) {
        result.data.consequences = consequences
        // Re-write the action with consequences
        const updateResult = await this.layer2.write(result.data)
        return updateResult.success ? { success: true, action: updateResult.data } : { success: false, error: updateResult.error }
      }

      return result.success ? { success: true, action: result.data } : { success: false, error: result.error }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('queue', 'updateStatus', 'Failed to update action status', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  // LAYER 3: STATE OPERATIONS

  /**
   * Get current world state
   */
  async getCurrentWorldState(): Promise<{ success: boolean, error?: string, state?: WorldState }> {
    try {
      const result = await this.layer3.getLatestVersion()
      if (result.success && result.data) {
        return { success: true, state: result.data }
      } else {
        return { success: false, error: result.error || 'Failed to get world state' }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('state', 'getCurrent', 'Failed to get current world state', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Initialize world state on server startup
   * Ensures a valid world state exists and loads latest version if available
   */
  async initializeWorldState(): Promise<{ success: boolean, error?: string, state?: WorldState }> {
    try {
      this.logger.info('state', 'initialize', 'Initializing world state...')

      // Try to get the latest world state
      const latestResult = await this.layer3.getLatestVersion()

      if (latestResult.success && latestResult.data) {
        this.logger.info('state', 'initialize', `Loaded existing world state version ${latestResult.data.version}`)
        return { success: true, state: latestResult.data }
      } else {
        // No existing world state, create initial one
        this.logger.info('state', 'initialize', 'No existing world state found, creating initial state...')

        const initialState = await this.createDefaultWorldState()
        const saveResult = await this.layer3.write(initialState)

        if (saveResult.success) {
          this.logger.info('state', 'initialize', `Created initial world state version ${initialState.version}`)
          return { success: true, state: initialState }
        } else {
          const errorMsg = `Failed to save initial world state: ${saveResult.error}`
          this.logger.error('state', 'initialize', errorMsg)
          return { success: false, error: errorMsg }
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('state', 'initialize', 'Failed to initialize world state', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Create default world state with initial regions, characters, and environment
   */
  private async createDefaultWorldState(): Promise<WorldState> {
    const timestamp = new Date().toISOString()

    const defaultRegions: Record<string, any> = {
      'village-greenvalley': {
        id: 'village-greenvalley',
        name: 'Green Valley Village',
        type: 'village' as const,
        status: 'peaceful' as const,
        population: 150,
        economy: {
          prosperity: 75,
          resources: {
            food: 100,
            wood: 50,
            stone: 30,
            gold: 25
          },
          tradeRoutes: ['forest-whispering', 'mountain-ironpeak']
        },
        events: [],
        properties: {
          defenses: 'basic',
          reputation: 'friendly',
          shops: ['tavern', 'blacksmith', 'general-store'],
          description: 'A peaceful village nestled in a green valley, known for its friendly inhabitants and thriving trade.'
        }
      },
      'lair-dragonspeak': {
        id: 'lair-dragonspeak',
        name: 'Dragon\'s Peak Lair',
        type: 'lair' as const,
        status: 'tense' as const,
        population: 1,
        economy: {
          prosperity: 200,
          resources: {
            gold: 1000,
            gems: 500,
            artifacts: 10
          },
          tradeRoutes: []
        },
        events: [],
        properties: {
          danger: 'extreme',
          wealth: 'legendary',
          boss: 'ancient-dragon',
          description: 'An ancient dragon\'s lair high in the mountains, filled with legendary treasures and immense danger.'
        }
      },
      'forest-whispering': {
        id: 'forest-whispering',
        name: 'Whispering Forest',
        type: 'forest' as const,
        status: 'recovering' as const,
        population: 25,
        economy: {
          prosperity: 40,
          resources: {
            herbs: 80,
            wood: 200,
            game: 60,
            rare_ingredients: 15
          },
          tradeRoutes: ['village-greenvalley']
        },
        events: [],
        properties: {
          mystery: 'high',
          magic: 'present',
          danger: 'moderate',
          description: 'An ancient forest where the trees seem to whisper secrets to those who know how to listen.'
        }
      }
    }

    const defaultCharacters: Record<string, any> = {
      'dragon-ancient': {
        id: 'dragon-ancient',
        name: 'Ignis, the Ancient Dragon',
        type: 'dragon' as const,
        location: {
          regionId: 'lair-dragonspeak',
          coordinates: { x: 100, y: 100 }
        },
        attributes: {
          health: 1000,
          maxHealth: 1000,
          relationships: {
            'village-greenvalley': -50,
            'forest-whispering': -20
          },
          reputation: {
            'village-greenvalley': 'terror',
            'forest-whispering': 'caution'
          },
          inventory: {
            gold: 10000,
            gems: 100
          }
        },
        memories: [],
        properties: {
          age: 'ancient',
          power: 'legendary',
          temperament: 'territorial',
          description: 'An ancient dragon who has ruled these lands for centuries, fiercely guarding its treasure hoard.'
        }
      },
      'village-elder': {
        id: 'village-elder',
        name: 'Elder Marcus',
        type: 'npc' as const,
        location: {
          regionId: 'village-greenvalley',
          coordinates: { x: 50, y: 50 }
        },
        attributes: {
          health: 80,
          maxHealth: 80,
          relationships: {
            'village-greenvalley': 100,
            'dragon-ancient': -30
          },
          reputation: {
            'village-greenvalley': 'wise',
            'forest-whispering': 'respectful'
          },
          inventory: {
            gold: 50,
            herbs: 20
          }
        },
        memories: [],
        properties: {
          role: 'village_elder',
          wisdom: 'high',
          description: 'The wise elder of Green Valley, keeper of village history and traditions.'
        }
      }
    }

    const defaultRelationships: Record<string, any> = {
      'dragon-village': {
        id: 'dragon-village',
        character1Id: 'dragon-ancient',
        character2Id: 'village-elder',
        type: 'hostility' as const,
        strength: -80,
        status: 'active' as const,
        history: [{
          timestamp,
          type: 'conflict',
          description: 'The dragon demands tribute from the village'
        }],
        properties: {
          duration: 'generations',
          reason: 'territorial_dispute'
        }
      }
    }

    const defaultEconomy: any = {
      currency: 'gold',
      exchangeRates: {
        'silver': 10,
        'copper': 100,
        'gems': 0.1
      },
      marketStatus: 'stable' as const,
      resources: {
        food: {
          supply: 150,
          demand: 120,
          price: 1,
          trend: 'stable' as const
        },
        wood: {
          supply: 200,
          demand: 80,
          price: 0.5,
          trend: 'falling' as const
        }
      }
    }

    const defaultEnvironment: any = {
      timeOfDay: 12, // Noon
      weather: 'clear' as const,
      season: 'spring' as const,
      magicalEnergy: 65,
      phenomena: [{
        id: 'spring-bloom',
        name: 'Spring Bloom',
        type: 'natural',
        description: 'The forest is alive with spring blossoms, increasing magical energy in the region.',
        affectedRegions: ['forest-whispering']
      }]
    }

    return {
      version: 1,
      timestamp,
      regions: defaultRegions,
      characters: defaultCharacters,
      relationships: defaultRelationships,
      economy: defaultEconomy,
      environment: defaultEnvironment,
      metadata: {
        checksum: '',
        actionCount: 0,
        lastActionId: undefined,
        description: 'Initial world state for SuiSaga living world',
        walrusUrl: ''
      }
    }
  }

  /**
   * Create new world state version
   */
  async createWorldStateVersion(
    modifications: Partial<WorldState>
  ): Promise<{ success: boolean, error?: string, state?: WorldState }> {
    try {
      this.logger.info('state', 'createVersion', 'Creating new world state version')

      const result = await this.layer3.createStateTransition(modifications)
      if (result.success && result.data) {
        // Validate the new state
        const validation = this.dataValidation.validateWorldState(result.data)
        if (!validation.valid) {
          const errorMsg = `Invalid world state: ${validation.errors.join(', ')}`
          this.logger.error('state', 'createVersion', errorMsg)
          return { success: false, error: errorMsg }
        }

        // Create backup
        await this.backupStorage.backupWorldState(result.data)

        this.logger.info('state', 'createVersion', `Created world state version ${result.data.version}`, {
          version: result.data.version,
          success: true
        })

        return { success: true, state: result.data }
      } else {
        const errorMsg = result.error || 'Failed to create world state version'
        this.logger.error('state', 'createVersion', errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('state', 'createVersion', 'Failed to create world state version', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Get world state history
   */
  async getWorldStateHistory(limit: number = 10): Promise<{ success: boolean, states?: WorldState[], error?: string }> {
    try {
      const result = await this.layer3.list({ limit, sortBy: 'version', sortOrder: 'desc' })
      if (result.success) {
        return { success: true, states: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('state', 'getHistory', 'Failed to get world state history', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  // SYSTEM OPERATIONS

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    success: boolean,
    status?: {
      walrus: { healthy: boolean, message?: string }
      backup: { enabled: boolean, stats?: any }
      layers: {
        blueprint: { available: boolean, lastModified?: string }
        queue: { totalActions: number, pendingActions: number }
        state: { currentVersion: number, totalVersions: number }
      }
      logs: { totalLogs: number, errorRate: number }
    },
    error?: string
  }> {
    try {
      // Check Walrus health
      const walrusHealth = await this.walrusClient.checkHealth()

      // Get backup stats
      const backupStats = await this.backupStorage.getBackupStats()

      // Get layer status
      const worldRulesResult = await this.layer1.read()
      const actionsResult = await this.layer2.list({ limit: 1 })
      const pendingResult = await this.layer2.getPendingActions(1)
      const stateResult = await this.layer3.list({ limit: 1 })

      // Get log stats
      const logStats = this.logger.getStats()

      return {
        success: true,
        status: {
          walrus: walrusHealth,
          backup: {
            enabled: this.config.backup.enabled,
            stats: backupStats.success ? backupStats.stats : undefined
          },
          layers: {
            blueprint: {
              available: worldRulesResult.success && !!worldRulesResult.data,
              lastModified: worldRulesResult.data?.lastModified
            },
            queue: {
              totalActions: actionsResult.success ? actionsResult.data.length : 0,
              pendingActions: pendingResult.success ? pendingResult.data.length : 0
            },
            state: {
              currentVersion: stateResult.success && stateResult.data.length > 0 ? Math.max(...stateResult.data.map(s => s.version)) : 0,
              totalVersions: stateResult.success ? stateResult.data.length : 0
            }
          },
          logs: {
            totalLogs: logStats.totalLogs,
            errorRate: logStats.errorRate
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('system', 'status', 'Failed to get system status', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Create demo snapshot for reliability
   */
  async createDemoSnapshot(): Promise<{ success: boolean, error?: string, snapshotPath?: string }> {
    try {
      this.logger.info('system', 'createSnapshot', 'Creating demo snapshot for reliability')

      // Get current data
      const [rulesResult, actionsResult, stateResult] = await Promise.all([
        this.layer1.read(),
        this.layer2.list({ limit: 1000 }), // Get recent actions
        this.layer3.getLatestVersion()
      ])

      const snapshotResult = await this.backupStorage.createDemoSnapshot(
        rulesResult.success ? rulesResult.data : undefined,
        actionsResult.success ? actionsResult.data : undefined,
        stateResult.success ? stateResult.data : undefined
      )

      if (snapshotResult.success) {
        this.logger.info('system', 'createSnapshot', 'Demo snapshot created successfully')
        return { success: true, snapshotPath: snapshotResult.snapshotPath }
      } else {
        return { success: false, error: snapshotResult.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('system', 'createSnapshot', 'Failed to create demo snapshot', error as Error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return this.logger.getPerformanceMetrics()
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100) {
    return this.logger.getRecentLogs(limit)
  }

  /**
   * Export logs
   */
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<{ success: boolean, data?: string, error?: string }> {
    try {
      const filePath = path.join(this.config.storageBasePath, `logs_export_${Date.now()}.${format}`)
      const result = await this.logger.exportLogs(filePath, format)

      if (result.success) {
        const { promises: fs } = await import('fs')
        const data = await fs.readFile(filePath, 'utf8')
        return { success: true, data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMsg }
    }
  }

  private generateActionId(): string {
    // Story 2.3: Upgrade to UUID for cryptographically unique action IDs
    return uuidv4()
  }

  private async createDefaultWorldRules(): Promise<WorldRules> {
    // This would create the same default rules as Layer1Blueprint
    // For now, let Layer1Blueprint handle it
    const result = await this.layer1.read()
    if (result.success && result.data) {
      return result.data
    }

    // If no rules exist, create minimal defaults
    return {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      rules: {
        physics: {},
        characterBehavior: {},
        actionConstraints: {},
        butterflyEffects: []
      },
      metadata: {
        description: 'Default world rules',
        author: 'SuiSaga System',
        checksum: ''
      }
    }
  }
}