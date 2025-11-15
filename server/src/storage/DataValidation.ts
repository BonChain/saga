import crypto from 'crypto'
import { WorldRules, Action, WorldState, IntegrityCheck, StorageStats, ButterflyEffect, Effect } from '../types/storage'

export interface ValidationConfig {
  strictMode: boolean
  maxActionLength: number
  maxWorldStateSize: number
  allowedActionTypes: string[]
  requiredWorldRules: string[]
  checksumAlgorithm: string
  enableCrossLayerValidation: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metadata: {
    checksum: string
    size: number
    validatedAt: string
  }
}

export interface CrossLayerValidationResult {
  valid: boolean
  issues: string[]
  recommendations: string[]
  metadata: {
    worldRulesVersion: string
    worldStateVersion: number
    actionCount: number
    lastValidated: string
  }
}

export class DataValidation {
  private readonly config: ValidationConfig

  constructor(config: ValidationConfig) {
    this.config = config
  }

  /**
   * Validate world rules structure and content
   */
  validateWorldRules(rules: WorldRules): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic structure validation
    if (!rules.version) {
      errors.push('World rules version is required')
    }

    if (!rules.lastModified) {
      errors.push('World rules lastModified timestamp is required')
    }

    if (!rules.rules) {
      errors.push('World rules object is required')
    }

    if (!rules.metadata) {
      errors.push('World rules metadata is required')
    }

    // Version format validation
    if (rules.version && !/^\d+\.\d+\.\d+$/.test(rules.version)) {
      errors.push('World rules version must be in format X.Y.Z')
    }

    // Timestamp validation
    if (rules.lastModified && isNaN(new Date(rules.lastModified).getTime())) {
      errors.push('World rules lastModified must be a valid ISO timestamp')
    }

    // Rules object validation
    if (rules.rules) {
      if (!rules.rules.physics) {
        errors.push('Physics rules are required')
      }

      if (!rules.rules.characterBehavior) {
        errors.push('Character behavior rules are required')
      }

      if (!rules.rules.actionConstraints) {
        errors.push('Action constraints are required')
      }

      if (!Array.isArray(rules.rules.butterflyEffects)) {
        errors.push('Butterfly effects must be an array')
      } else {
        // Validate each butterfly effect
        rules.rules.butterflyEffects.forEach((effect, index) => {
          const effectErrors = this.validateButterflyEffect(effect, index)
          errors.push(...effectErrors)
        })
      }

      // Validate required world rules
      if (this.config.requiredWorldRules.length > 0) {
        const missingRules = this.config.requiredWorldRules.filter(
          rule => !(rule in rules.rules)
        )
        missingRules.forEach(rule => {
          errors.push(`Required world rule '${rule}' is missing`)
        })
      }
    }

    // Metadata validation
    if (rules.metadata) {
      if (!rules.metadata.description || rules.metadata.description.trim().length === 0) {
        warnings.push('World rules description is recommended')
      }

      if (!rules.metadata.author || rules.metadata.author.trim().length === 0) {
        warnings.push('World rules author is recommended')
      }

      if (!rules.metadata.checksum) {
        warnings.push('World rules checksum is recommended for integrity')
      }
    }

    const checksum = this.generateChecksum(rules)
    const size = JSON.stringify(rules).length

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        checksum,
        size,
        validatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Validate action structure and content
   */
  validateAction(action: Action): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic structure validation
    if (!action.id) {
      errors.push('Action ID is required')
    }

    if (!action.playerId) {
      errors.push('Player ID is required')
    }

    if (!action.intent || action.intent.trim().length === 0) {
      errors.push('Action intent is required')
    }

    if (!action.originalInput || action.originalInput.trim().length === 0) {
      errors.push('Original input is required')
    }

    if (!action.timestamp) {
      errors.push('Action timestamp is required')
    }

    // Length validations
    if (this.config.strictMode) {
      if (action.intent && action.intent.length > this.config.maxActionLength) {
        errors.push(`Action intent exceeds maximum length of ${this.config.maxActionLength}`)
      }

      if (action.originalInput && action.originalInput.length > this.config.maxActionLength) {
        errors.push(`Original input exceeds maximum length of ${this.config.maxActionLength}`)
      }
    }

    // Status validation
    const validStatuses = ['pending', 'processing', 'completed', 'failed']
    if (action.status && !validStatuses.includes(action.status)) {
      errors.push(`Invalid action status: ${action.status}`)
    }

    // Timestamp validation
    if (action.timestamp && isNaN(new Date(action.timestamp).getTime())) {
      errors.push('Action timestamp must be a valid ISO timestamp')
    }

    // Metadata validation
    if (!action.metadata) {
      errors.push('Action metadata is required')
    } else {
      if (typeof action.metadata.confidence !== 'number' || action.metadata.confidence < 0 || action.metadata.confidence > 1) {
        errors.push('Action confidence must be a number between 0 and 1')
      }

      // Validate parsed intent if present
      if (action.metadata.parsedIntent) {
        const intentErrors = this.validateParsedIntent(action.metadata.parsedIntent)
        errors.push(...intentErrors)
      }

      // Validate consequences if present
      if (action.consequences && !Array.isArray(action.consequences)) {
        errors.push('Action consequences must be an array')
      } else if (action.consequences) {
        action.consequences.forEach((consequence, index) => {
          const consequenceErrors = this.validateConsequence(consequence, index)
          errors.push(...consequenceErrors)
        })
      }
    }

    // ID format validation
    if (action.id && !/^[a-zA-Z0-9_-]+$/.test(action.id)) {
      warnings.push('Action ID should contain only alphanumeric characters, hyphens, and underscores')
    }

    const checksum = this.generateChecksum(action)
    const size = JSON.stringify(action).length

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        checksum,
        size,
        validatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Validate world state structure and content
   */
  validateWorldState(state: WorldState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic structure validation
    if (typeof state.version !== 'number' || state.version <= 0) {
      errors.push('World state version must be a positive number')
    }

    if (!state.timestamp) {
      errors.push('World state timestamp is required')
    }

    if (!state.regions || typeof state.regions !== 'object') {
      errors.push('World state regions object is required')
    }

    if (!state.characters || typeof state.characters !== 'object') {
      errors.push('World state characters object is required')
    }

    if (!state.relationships || typeof state.relationships !== 'object') {
      errors.push('World state relationships object is required')
    }

    if (!state.economy) {
      errors.push('World state economy is required')
    }

    if (!state.environment) {
      errors.push('World state environment is required')
    }

    // Size validation
    const size = JSON.stringify(state).length
    if (this.config.strictMode && size > this.config.maxWorldStateSize) {
      errors.push(`World state size (${size}) exceeds maximum allowed size (${this.config.maxWorldStateSize})`)
    }

    // Timestamp validation
    if (state.timestamp && isNaN(new Date(state.timestamp).getTime())) {
      errors.push('World state timestamp must be a valid ISO timestamp')
    }

    // Version sequence validation
    if (state.previousVersion && state.previousVersion >= state.version) {
      errors.push('Previous version must be less than current version')
    }

    // Regions validation
    if (state.regions) {
      if (Object.keys(state.regions).length === 0) {
        warnings.push('World state should contain at least one region')
      }

      Object.entries(state.regions).forEach(([regionId, region]) => {
        const regionErrors = this.validateRegion(region, regionId)
        errors.push(...regionErrors)
      })
    }

    // Characters validation
    if (state.characters) {
      Object.entries(state.characters).forEach(([characterId, character]) => {
        const characterErrors = this.validateCharacter(character, characterId)
        errors.push(...characterErrors)
      })
    }

    // Economy validation
    if (state.economy) {
      const economyErrors = this.validateEconomy(state.economy)
      errors.push(...economyErrors)
    }

    // Environment validation
    if (state.environment) {
      const environmentErrors = this.validateEnvironment(state.environment)
      errors.push(...environmentErrors)
    }

    // Metadata validation
    if (!state.metadata) {
      errors.push('World state metadata is required')
    } else {
      if (typeof state.metadata.actionCount !== 'number' || state.metadata.actionCount < 0) {
        errors.push('Action count must be a non-negative number')
      }
    }

    const checksum = this.generateChecksum(state)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        checksum,
        size,
        validatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Perform cross-layer validation
   */
  validateCrossLayer(
    rules: WorldRules,
    actions: Action[],
    state: WorldState
  ): CrossLayerValidationResult {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check if world rules are compatible with current state
    if (rules.rules.butterflyEffects.length > 0) {
      let activeEffects = 0
      rules.rules.butterflyEffects.forEach(effect => {
        if (this.isButterflyEffectActive(effect, actions, state)) {
          activeEffects++
        }
      })

      if (activeEffects === 0) {
        recommendations.push('Consider adding more butterfly effects to create dynamic world changes')
      }
    }

    // Validate action count consistency
    const processedActions = actions.filter(a => a.status === 'completed').length
    if (state.metadata.actionCount !== processedActions) {
      issues.push(`Action count mismatch: state shows ${state.metadata.actionCount} but ${processedActions} actions are completed`)
    }

    // Check for orphaned actions (actions without consequences)
    const orphanedActions = actions.filter(a =>
      a.status === 'completed' && (!a.consequences || a.consequences.length === 0)
    )
    if (orphanedActions.length > 0) {
      recommendations.push(`${orphanedActions.length} completed actions lack consequences`)
    }

    // Validate character consistency
    const playerIds = new Set(actions.map(a => a.playerId))
    const characterIds = new Set(Object.keys(state.characters))

    playerIds.forEach(playerId => {
      if (!characterIds.has(playerId)) {
        issues.push(`Player ${playerId} has actions but no character in world state`)
      }
    })

    // Check for excessive world state size
    const stateSize = JSON.stringify(state).length
    if (stateSize > this.config.maxWorldStateSize * 0.8) {
      recommendations.push('World state is approaching size limits, consider cleanup')
    }

    // Validate time sequence
    const latestAction = actions.reduce((latest, action) => {
      return !latest || new Date(action.timestamp) > new Date(latest.timestamp) ? action : latest
    }, null as Action | null)

    if (latestAction && new Date(latestAction.timestamp) > new Date(state.timestamp)) {
      issues.push('World state timestamp is older than latest action timestamp')
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
      metadata: {
        worldRulesVersion: rules.version,
        worldStateVersion: state.version,
        actionCount: actions.length,
        lastValidated: new Date().toISOString()
      }
    }
  }

  /**
   * Generate integrity check report
   */
  generateIntegrityCheck(
    layer: string,
    id: string,
    data: any,
    expectedChecksum?: string
  ): IntegrityCheck {
    const actualChecksum = this.generateChecksum(data)
    const valid = !expectedChecksum || expectedChecksum === actualChecksum

    return {
      layer,
      id,
      checksum: actualChecksum,
      timestamp: new Date().toISOString(),
      valid,
      errors: valid ? [] : [`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`]
    }
  }

  /**
   * Generate storage statistics
   */
  generateStorageStats(
    rules: WorldRules,
    actions: Action[],
    state: WorldState
  ): StorageStats[] {
    return [
      {
        layer: 'blueprint',
        totalOperations: 1, // Always one world rules file
        successRate: 100,
        averageLatency: 50, // Mock value
        lastOperation: 'write',
        errorCount: 0,
        lastBackup: new Date().toISOString()
      },
      {
        layer: 'queue',
        totalOperations: actions.length,
        successRate: actions.filter(a => a.status !== 'failed').length / actions.length * 100,
        averageLatency: 25, // Mock value
        lastOperation: actions.length > 0 ? 'write' : 'none',
        errorCount: actions.filter(a => a.status === 'failed').length,
        lastBackup: new Date().toISOString()
      },
      {
        layer: 'state',
        totalOperations: state.version,
        successRate: 100,
        averageLatency: 100, // Mock value
        lastOperation: 'write',
        errorCount: 0,
        lastBackup: new Date().toISOString()
      }
    ]
  }

  private validateButterflyEffect(effect: ButterflyEffect, index: number): string[] {
    const errors: string[] = []

    if (!effect.id) {
      errors.push(`Butterfly effect at index ${index} is missing ID`)
    }

    if (!effect.trigger || effect.trigger.trim().length === 0) {
      errors.push(`Butterfly effect at index ${index} is missing trigger`)
    }

    if (!effect.description || effect.description.trim().length === 0) {
      errors.push(`Butterfly effect at index ${index} is missing description`)
    }

    if (typeof effect.probability !== 'number' || effect.probability < 0 || effect.probability > 1) {
      errors.push(`Butterfly effect at index ${index} has invalid probability`)
    }

    if (!Array.isArray(effect.effects) || effect.effects.length === 0) {
      errors.push(`Butterfly effect at index ${index} must have at least one effect`)
    } else {
      effect.effects.forEach((eff, effIndex) => {
        const effectErrors = this.validateEffect(eff, index, effIndex)
        errors.push(...effectErrors)
      })
    }

    return errors
  }

  private validateEffect(effect: Effect, butterflyIndex: number, effectIndex: number): string[] {
    const errors: string[] = []

    if (!effect.type) {
      errors.push(`Effect ${effectIndex} in butterfly effect ${butterflyIndex} is missing type`)
    }

    if (!effect.target || effect.target.trim().length === 0) {
      errors.push(`Effect ${effectIndex} in butterfly effect ${butterflyIndex} is missing target`)
    }

    if (!effect.change || typeof effect.change !== 'object') {
      errors.push(`Effect ${effectIndex} in butterfly effect ${butterflyIndex} has invalid change object`)
    }

    return errors
  }

  private validateParsedIntent(intent: any): string[] {
    const errors: string[] = []

    if (!intent.actionType) {
      errors.push('Parsed intent action type is required')
    } else if (this.config.allowedActionTypes.length > 0 &&
               !this.config.allowedActionTypes.includes(intent.actionType)) {
      errors.push(`Invalid action type: ${intent.actionType}`)
    }

    if (!intent.urgency) {
      errors.push('Parsed intent urgency is required')
    }

    const validUrgencies = ['low', 'medium', 'high']
    if (intent.urgency && !validUrgencies.includes(intent.urgency)) {
      errors.push(`Invalid urgency level: ${intent.urgency}`)
    }

    return errors
  }

  private validateConsequence(consequence: any, index: number): string[] {
    const errors: string[] = []

    if (!consequence.id) {
      errors.push(`Consequence at index ${index} is missing ID`)
    }

    if (!consequence.description || consequence.description.trim().length === 0) {
      errors.push(`Consequence at index ${index} is missing description`)
    }

    if (!consequence.impact) {
      errors.push(`Consequence at index ${index} is missing impact level`)
    }

    const validImpacts = ['minor', 'moderate', 'major', 'critical']
    if (consequence.impact && !validImpacts.includes(consequence.impact)) {
      errors.push(`Invalid impact level: ${consequence.impact}`)
    }

    return errors
  }

  private validateRegion(region: any, regionId: string): string[] {
    const errors: string[] = []

    if (!region.id) {
      errors.push(`Region ${regionId} is missing ID`)
    }

    if (!region.name || region.name.trim().length === 0) {
      errors.push(`Region ${regionId} is missing name`)
    }

    if (!region.type) {
      errors.push(`Region ${regionId} is missing type`)
    }

    if (!region.status) {
      errors.push(`Region ${regionId} is missing status`)
    }

    if (typeof region.population !== 'number' || region.population < 0) {
      errors.push(`Region ${regionId} has invalid population`)
    }

    return errors
  }

  private validateCharacter(character: any, characterId: string): string[] {
    const errors: string[] = []

    if (!character.id) {
      errors.push(`Character ${characterId} is missing ID`)
    }

    if (!character.name || character.name.trim().length === 0) {
      errors.push(`Character ${characterId} is missing name`)
    }

    if (!character.type) {
      errors.push(`Character ${characterId} is missing type`)
    }

    if (!character.location || !character.location.regionId) {
      errors.push(`Character ${characterId} is missing location`)
    }

    if (character.attributes) {
      if (typeof character.attributes.health !== 'number' || character.attributes.health < 0) {
        errors.push(`Character ${characterId} has invalid health`)
      }

      if (typeof character.attributes.maxHealth !== 'number' || character.attributes.maxHealth <= 0) {
        errors.push(`Character ${characterId} has invalid max health`)
      }
    }

    return errors
  }

  private validateEconomy(economy: any): string[] {
    const errors: string[] = []

    if (!economy.currency) {
      errors.push('Economy is missing currency')
    }

    if (!economy.marketStatus) {
      errors.push('Economy is missing market status')
    }

    if (!economy.resources || typeof economy.resources !== 'object') {
      errors.push('Economy is missing resources object')
    }

    return errors
  }

  private validateEnvironment(environment: any): string[] {
    const errors: string[] = []

    if (typeof environment.timeOfDay !== 'number' || environment.timeOfDay < 0 || environment.timeOfDay > 24) {
      errors.push('Environment time of day must be between 0 and 24')
    }

    if (!environment.weather) {
      errors.push('Environment is missing weather')
    }

    if (!environment.season) {
      errors.push('Environment is missing season')
    }

    if (typeof environment.magicalEnergy !== 'number' || environment.magicalEnergy < 0 || environment.magicalEnergy > 100) {
      errors.push('Environment magical energy must be between 0 and 100')
    }

    return errors
  }

  private isButterflyEffectActive(effect: ButterflyEffect, actions: Action[], state: WorldState): boolean {
    // Simplified check - in a real implementation this would be more sophisticated
    return actions.some(action =>
      action.intent.toLowerCase().includes(effect.trigger.toLowerCase())
    )
  }

  private generateChecksum(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort())
    return crypto.createHash(this.config.checksumAlgorithm).update(dataString).digest('hex')
  }
}