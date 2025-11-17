/**
 * World State Updater Service - Story 3.2: Consequence Generation & World Changes
 *
 * This service applies validated consequences to the world state and ensures
 * consistency across all affected systems. It handles character relationships,
 * environmental conditions, and world state updates.
 *
 * Purpose: Apply AI-generated consequences to the persistent world state
 * while maintaining logical consistency.
 */

import { v4 as uuidv4 } from 'uuid'
import {
  AIConsequence,
  ConsequenceType,
  ConsequenceImpact,
  CascadingEffect,
  WorldStateSnapshot,
  CharacterState,
  RegionState,
  EconomyState,
  EnvironmentState
} from '../types/ai'
import { Layer3State } from '../storage/Layer3State'
import { Layer1Blueprint } from '../storage/Layer1Blueprint'

export interface WorldStateUpdateResult {
  success: boolean
  updatedWorldState: WorldStateSnapshot
  appliedConsequences: string[]
  failedConsequences: string[]
  conflicts: Conflict[]
  auditTrail: AuditEntry[]
  metadata: {
    updateTime: number
    affectedSystems: string[]
    totalChanges: number
  }
}

export interface Conflict {
  type: 'state_conflict' | 'relationship_conflict' | 'resource_conflict'
  consequenceId: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolution?: ConflictResolution
}

export interface ConflictResolution {
  strategy: 'overwrite' | 'merge' | 'reject' | 'escalate'
  resolvedValue?: any
  notes?: string
}

export interface AuditEntry {
  timestamp: string
  consequenceId: string
  action: 'applied' | 'conflict' | 'failed'
  system: string
  change: string
  previousValue?: any
  newValue?: any
}

export class WorldStateUpdater {
  private layer3State: Layer3State
  private layer1Blueprint: Layer1Blueprint
  private logger: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void

  constructor(layer3State: Layer3State, layer1Blueprint: Layer1Blueprint) {
    this.layer3State = layer3State
    this.layer1Blueprint = layer1Blueprint
    this.logger = this.createLogger()
  }

  /**
   * Apply consequences to the world state
   */
  async applyConsequences(
    consequences: AIConsequence[],
    currentWorldState?: WorldStateSnapshot
  ): Promise<WorldStateUpdateResult> {
    const startTime = Date.now()
    this.logger('info', 'Applying consequences to world state', {
      consequenceCount: consequences.length,
      hasCurrentState: !!currentWorldState
    })

    try {
      // Get current world state if not provided
      const worldState = currentWorldState || await this.layer3State.getCurrentState()

      // Initialize result
      const result: WorldStateUpdateResult = {
        success: false,
        updatedWorldState: { ...worldState },
        appliedConsequences: [],
        failedConsequences: [],
        conflicts: [],
        auditTrail: [],
        metadata: {
          updateTime: 0,
          affectedSystems: [],
          totalChanges: 0
        }
      }

      // Sort consequences by impact and priority
      const sortedConsequences = this.sortConsequencesByPriority(consequences)

      // Apply consequences one by one
      for (const consequence of sortedConsequences) {
        try {
          const applicationResult = await this.applySingleConsequence(
            consequence,
            result.updatedWorldState,
            result.auditTrail
          )

          if (applicationResult.success) {
            result.appliedConsequences.push(consequence.id)
            result.updatedWorldState = applicationResult.updatedState

            // Track affected systems
            consequence.impact.affectedSystems.forEach(system => {
              if (!result.metadata.affectedSystems.includes(system)) {
                result.metadata.affectedSystems.push(system)
              }
            })

            result.metadata.totalChanges += applicationResult.changeCount
          } else {
            result.failedConsequences.push(consequence.id)

            if (applicationResult.conflict) {
              result.conflicts.push(applicationResult.conflict)
            }
          }
        } catch (error) {
          this.logger('error', 'Failed to apply consequence', {
            consequenceId: consequence.id,
            error
          })

          result.failedConsequences.push(consequence.id)

          result.auditTrail.push({
            timestamp: new Date().toISOString(),
            consequenceId: consequence.id,
            action: 'failed',
            system: 'unknown',
            change: 'application error',
            newValue: (error as Error).message
          })
        }
      }

      // Resolve any conflicts
      const resolvedConflicts = await this.resolveConflicts(result.conflicts, result.updatedWorldState)
      result.conflicts = resolvedConflicts

      // Save updated world state
      try {
        await this.layer3State.updateWorldState(result.updatedWorldState)
        result.success = result.appliedConsequences.length > 0
      } catch (saveError) {
        this.logger('error', 'Failed to save world state', { error: saveError })
        result.success = false
        result.conflicts.push({
          type: 'state_conflict',
          consequenceId: 'save_failed',
          description: 'Failed to save updated world state',
          severity: 'critical'
        })
      }

      result.metadata.updateTime = Date.now() - startTime

      this.logger('info', 'Consequence application completed', {
        success: result.success,
        applied: result.appliedConsequences.length,
        failed: result.failedConsequences.length,
        conflicts: result.conflicts.length,
        processingTime: result.metadata.updateTime
      })

      return result
    } catch (error) {
      this.logger('error', 'World state update failed', { error })

      return {
        success: false,
        updatedWorldState: currentWorldState || await this.layer3State.getCurrentState(),
        appliedConsequences: [],
        failedConsequences: consequences.map(c => c.id),
        conflicts: [{
          type: 'state_conflict',
          consequenceId: 'update_failed',
          description: (error as Error).message,
          severity: 'critical'
        }],
        auditTrail: [],
        metadata: {
          updateTime: Date.now() - startTime,
          affectedSystems: [],
          totalChanges: 0
        }
      }
    }
  }

  /**
   * Apply a single consequence to the world state
   */
  private async applySingleConsequence(
    consequence: AIConsequence,
    currentState: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{
    success: boolean
    updatedState: WorldStateSnapshot
    conflict?: Conflict
    changeCount: number
  }> {
    this.logger('info', 'Applying single consequence', {
      consequenceId: consequence.id,
      type: consequence.type
    })

    const updatedState = { ...currentState }
    let changeCount = 0

    try {
      switch (consequence.type) {
        case ConsequenceType.RELATIONSHIP:
          const relationshipResult = await this.applyRelationshipConsequence(
            consequence,
            updatedState,
            auditTrail
          )
          if (relationshipResult.success) {
            changeCount = relationshipResult.changeCount
          } else {
            return {
              success: false,
              updatedState: currentState,
              conflict: relationshipResult.conflict,
              changeCount: 0
            }
          }
          break

        case ConsequenceType.ENVIRONMENT:
          const environmentResult = await this.applyEnvironmentConsequence(
            consequence,
            updatedState,
            auditTrail
          )
          if (environmentResult.success) {
            changeCount = environmentResult.changeCount
          } else {
            return {
              success: false,
              updatedState: currentState,
              conflict: environmentResult.conflict,
              changeCount: 0
            }
          }
          break

        case ConsequenceType.CHARACTER:
          const characterResult = await this.applyCharacterConsequence(
            consequence,
            updatedState,
            auditTrail
          )
          if (characterResult.success) {
            changeCount = characterResult.changeCount
          } else {
            return {
              success: false,
              updatedState: currentState,
              conflict: characterResult.conflict,
              changeCount: 0
            }
          }
          break

        case ConsequenceType.WORLD_STATE:
          const worldStateResult = await this.applyWorldStateConsequence(
            consequence,
            updatedState,
            auditTrail
          )
          if (worldStateResult.success) {
            changeCount = worldStateResult.changeCount
          } else {
            return {
              success: false,
              updatedState: currentState,
              conflict: worldStateResult.conflict,
              changeCount: 0
            }
          }
          break

        case ConsequenceType.ECONOMIC:
          const economicResult = await this.applyEconomicConsequence(
            consequence,
            updatedState,
            auditTrail
          )
          if (economicResult.success) {
            changeCount = economicResult.changeCount
          } else {
            return {
              success: false,
              updatedState: currentState,
              conflict: economicResult.conflict,
              changeCount: 0
            }
          }
          break

        default:
          // Handle other consequence types generically
          const genericResult = await this.applyGenericConsequence(
            consequence,
            updatedState,
            auditTrail
          )
          if (genericResult.success) {
            changeCount = genericResult.changeCount
          } else {
            return {
              success: false,
              updatedState: currentState,
              conflict: genericResult.conflict,
              changeCount: 0
            }
          }
      }

      // Apply cascading effects
      for (const cascadingEffect of consequence.cascadingEffects) {
        const cascadeResult = await this.applyCascadingEffect(
          cascadingEffect,
          updatedState,
          auditTrail
        )
        if (cascadeResult.success) {
          changeCount += cascadeResult.changeCount
        }
      }

      return {
        success: true,
        updatedState,
        changeCount
      }
    } catch (error) {
      this.logger('error', 'Error applying consequence', {
        consequenceId: consequence.id,
        error
      })

      return {
        success: false,
        updatedState: currentState,
        changeCount: 0
      }
    }
  }

  /**
   * Apply relationship consequence
   */
  private async applyRelationshipConsequence(
    consequence: AIConsequence,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    let changeCount = 0

    // Update character relationships based on consequence description
    const affectedCharacters = this.extractCharacterNames(consequence.description)

    if (affectedCharacters.length >= 2) {
      // Update relationships between characters
      for (let i = 0; i < affectedCharacters.length - 1; i++) {
        for (let j = i + 1; j < affectedCharacters.length; j++) {
          const char1 = affectedCharacters[i]
          const char2 = affectedCharacters[j]

          // Find or create characters in world state
          const character1 = this.findOrCreateCharacter(state, char1)
          const character2 = this.findOrCreateCharacter(state, char2)

          // Update relationship
          const relationshipChange = this.calculateRelationshipChange(consequence)
          const existingRelationship = character1.relationships.find(r => r.characterId === character2.id)

          if (existingRelationship) {
            const oldValue = existingRelationship.strength

            // Update existing relationship
            existingRelationship.strength += relationshipChange
            existingRelationship.strength = Math.max(-100, Math.min(100, existingRelationship.strength))
            existingRelationship.lastInteraction = new Date().toISOString()

            // Add to history
            existingRelationship.history.push(consequence.description)

            changeCount++

            auditTrail.push({
              timestamp: new Date().toISOString(),
              consequenceId: consequence.id,
              action: 'applied',
              system: 'relationship',
              change: `Updated relationship between ${char1} and ${char2}`,
              previousValue: oldValue,
              newValue: existingRelationship.strength
            })
          } else {
            // Create new relationship
            const newRelationship = {
              characterId: character2.id,
              relationshipType: this.inferRelationshipType(consequence.description),
              strength: Math.max(-100, Math.min(100, relationshipChange)),
              history: [consequence.description],
              lastInteraction: new Date().toISOString(),
              sentiment: relationshipChange
            }

            character1.relationships.push(newRelationship)
            changeCount++

            auditTrail.push({
              timestamp: new Date().toISOString(),
              consequenceId: consequence.id,
              action: 'applied',
              system: 'relationship',
              change: `Created new relationship between ${char1} and ${char2}`,
              newValue: newRelationship.strength
            })
          }
        }
      }
    }

    return { success: true, changeCount }
  }

  /**
   * Apply environment consequence
   */
  private async applyEnvironmentConsequence(
    consequence: AIConsequence,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    let changeCount = 0

    // Update environment state based on consequence
    const affectedRegions = this.extractRegionNames(consequence.description)

    for (const regionName of affectedRegions) {
      const region = state.regions.find(r => r.name.toLowerCase().includes(regionName.toLowerCase()))

      if (region) {
        const oldValue = region.currentConditions

        // Update region conditions
        const newConditions = this.generateEnvironmentConditions(consequence, region)
        region.currentConditions = newConditions

        // Update other properties based on consequence impact
        if (consequence.impact.affectedSystems.includes('environment')) {
          region.status = this.updateRegionStatus(region, consequence)
          region.prosperity = Math.max(0, Math.min(100,
            region.prosperity + this.calculateProsperityChange(consequence)))
          region.safety = Math.max(0, Math.min(100,
            region.safety + this.calculateSafetyChange(consequence)))
        }

        changeCount++

        auditTrail.push({
          timestamp: new Date().toISOString(),
          consequenceId: consequence.id,
          action: 'applied',
          system: 'environment',
          change: `Updated conditions in ${regionName}`,
          previousValue: oldValue,
          newValue: newConditions
        })
      }
    }

    return { success: true, changeCount }
  }

  /**
   * Apply character consequence
   */
  private async applyCharacterConsequence(
    consequence: AIConsequence,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    let changeCount = 0

    const affectedCharacters = this.extractCharacterNames(consequence.description)

    for (const characterName of affectedCharacters) {
      const character = this.findOrCreateCharacter(state, characterName)

      // Update character properties based on consequence
      if (consequence.impact.affectedSystems.includes('character')) {
        const oldStatus = character.status
        const oldMood = character.mood

        character.status = this.updateCharacterStatus(character, consequence)
        character.mood = this.updateCharacterMood(character, consequence)
        character.currentActivity = this.inferActivityFromConsequence(consequence)

        changeCount++

        auditTrail.push({
          timestamp: new Date().toISOString(),
          consequenceId: consequence.id,
          action: 'applied',
          system: 'character',
          change: `Updated character ${characterName}`,
          previousValue: { status: oldStatus, mood: oldMood },
          newValue: { status: character.status, mood: character.mood }
        })
      }
    }

    return { success: true, changeCount }
  }

  /**
   * Apply world state consequence
   */
  private async applyWorldStateConsequence(
    consequence: AIConsequence,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    let changeCount = 0

    // Apply general world state changes
    if (consequence.impact.affectedSystems.includes('world_state')) {
      // Update world-level properties
      const newEvent = {
        id: uuidv4(),
        name: `Consequence: ${consequence.description.substring(0, 50)}...`,
        description: consequence.description,
        type: this.inferEventType(consequence),
        impact: consequence.impact,
        timestamp: new Date().toISOString(),
        duration: consequence.impact.duration,
        affectedRegions: this.extractRegionNames(consequence.description)
      }

      state.events.push(newEvent)
      changeCount++

      auditTrail.push({
        timestamp: new Date().toISOString(),
        consequenceId: consequence.id,
        action: 'applied',
        system: 'world_state',
        change: 'Added new world event',
        newValue: newEvent.name
      })
    }

    return { success: true, changeCount }
  }

  /**
   * Apply economic consequence
   */
  private async applyEconomicConsequence(
    consequence: AIConsequence,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    let changeCount = 0

    // Update economic state
    if (consequence.impact.affectedSystems.includes('economic')) {
      const affectedRegions = this.extractRegionNames(consequence.description)

      for (const regionName of affectedRegions) {
        const region = state.regions.find(r => r.name.toLowerCase().includes(regionName.toLowerCase()))

        if (region) {
          const oldProsperity = region.prosperity

          // Update economic indicators
          region.prosperity = Math.max(0, Math.min(100,
            region.prosperity + this.calculateEconomicImpact(consequence)))

          // Add notable economic features
          const economicFeature = this.extractEconomicFeature(consequence.description)
          if (economicFeature && !region.notableFeatures.includes(economicFeature)) {
            region.notableFeatures.push(economicFeature)
          }

          changeCount++

          auditTrail.push({
            timestamp: new Date().toISOString(),
            consequenceId: consequence.id,
            action: 'applied',
            system: 'economic',
            change: `Updated economic conditions in ${regionName}`,
            previousValue: oldProsperity,
            newValue: region.prosperity
          })
        }
      }

      // Update global economy if needed
      if (consequence.impact.magnitude > 7) {
        // High magnitude consequences affect global economy
        const oldTradeActivity = state.economy.tradeRoutes.reduce((sum, route) => sum + route.activity, 0)

        state.economy.tradeRoutes.forEach(route => {
          route.activity = Math.max(0, route.activity + this.calculateTradeImpact(consequence))
          route.danger = Math.max(0, route.danger + this.calculateDangerImpact(consequence))
        })

        const newTradeActivity = state.economy.tradeRoutes.reduce((sum, route) => sum + route.activity, 0)

        if (oldTradeActivity !== newTradeActivity) {
          changeCount++

          auditTrail.push({
            timestamp: new Date().toISOString(),
            consequenceId: consequence.id,
            action: 'applied',
            system: 'economic',
            change: 'Updated global trade activity',
            previousValue: oldTradeActivity,
            newValue: newTradeActivity
          })
        }
      }
    }

    return { success: true, changeCount }
  }

  /**
   * Apply generic consequence
   */
  private async applyGenericConsequence(
    consequence: AIConsequence,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    // Apply generic changes based on affected systems
    let changeCount = 0

    for (const system of consequence.impact.affectedSystems) {
      // Apply system-agnostic changes
      const oldValue = JSON.stringify(state)

      // Create a generic change entry
      state.events.push({
        id: uuidv4(),
        name: `System Change: ${system}`,
        description: consequence.description,
        type: 'social' as any,
        impact: consequence.impact,
        timestamp: new Date().toISOString(),
        duration: consequence.impact.duration,
        affectedRegions: []
      })

      changeCount++

      auditTrail.push({
        timestamp: new Date().toISOString(),
        consequenceId: consequence.id,
        action: 'applied',
        system,
        change: 'Applied generic consequence',
        previousValue: oldValue,
        newValue: consequence.description
      })
    }

    return { success: true, changeCount }
  }

  /**
   * Apply cascading effect
   */
  private async applyCascadingEffect(
    effect: CascadingEffect,
    state: WorldStateSnapshot,
    auditTrail: AuditEntry[]
  ): Promise<{ success: boolean; conflict?: Conflict; changeCount: number }> {
    // Create a mock consequence from the cascading effect
    const mockConsequence: AIConsequence = {
      id: uuidv4(),
      actionId: 'cascading_effect',
      type: this.inferTypeFromDescription(effect.description),
      description: effect.description,
      impact: effect.impact,
      cascadingEffects: [],
      timestamp: new Date().toISOString(),
      confidence: effect.probability
    }

    return this.applyGenericConsequence(mockConsequence, state, auditTrail)
  }

  /**
   * Sort consequences by priority and impact
   */
  private sortConsequencesByPriority(consequences: AIConsequence[]): AIConsequence[] {
    return [...consequences].sort((a, b) => {
      const scoreA = (a.impact.magnitude * a.confidence) + (a.cascadingEffects.length * 2)
      const scoreB = (b.impact.magnitude * b.confidence) + (b.cascadingEffects.length * 2)
      return scoreB - scoreA
    })
  }

  /**
   * Resolve conflicts
   */
  private async resolveConflicts(
    conflicts: Conflict[],
    state: WorldStateSnapshot
  ): Promise<Conflict[]> {
    const resolvedConflicts: Conflict[] = []

    for (const conflict of conflicts) {
      // Attempt to resolve conflicts automatically
      switch (conflict.type) {
        case 'state_conflict':
          // Try to merge or overwrite based on severity
          if (conflict.severity === 'low') {
            conflict.resolution = { strategy: 'overwrite', notes: 'Low severity conflict auto-resolved' }
          } else {
            conflict.resolution = { strategy: 'escalate', notes: 'Requires manual review' }
          }
          break

        case 'relationship_conflict':
          conflict.resolution = { strategy: 'merge', notes: 'Relationship conflicts merged' }
          break

        case 'resource_conflict':
          conflict.resolution = { strategy: 'reject', notes: 'Resource conflict rejected to prevent issues' }
          break
      }

      resolvedConflicts.push(conflict)
    }

    return resolvedConflicts
  }

  // Helper methods

  private findOrCreateCharacter(state: WorldStateSnapshot, name: string): CharacterState {
    let character = state.characters.find(c => c.name.toLowerCase().includes(name.toLowerCase()))

    if (!character) {
      character = {
        id: uuidv4(),
        name,
        location: 'unknown',
        health: 100,
        status: 'active',
        relationships: [],
        currentActivity: 'idle',
        mood: 'neutral'
      }
      state.characters.push(character)
    }

    return character
  }

  private extractCharacterNames(description: string): string[] {
    const commonCharacters = ['dragon', 'goblin', 'villager', 'merchant', 'guard', 'wizard', 'king', 'queen']
    const descLower = description.toLowerCase()

    return commonCharacters.filter(name => descLower.includes(name))
  }

  private extractRegionNames(description: string): string[] {
    const commonRegions = ['village', 'forest', 'mountain', 'river', 'castle', 'market', 'town']
    const descLower = description.toLowerCase()

    return commonRegions.filter(region => descLower.includes(region))
  }

  private extractEconomicFeature(description: string): string | null {
    const economicTerms = ['market', 'trade', 'shop', 'merchant', 'price', 'goods', 'supply']
    const descLower = description.toLowerCase()

    for (const term of economicTerms) {
      if (descLower.includes(term)) {
        return `${term.charAt(0).toUpperCase() + term.slice(1)} activity`
      }
    }

    return null
  }

  private calculateRelationshipChange(consequence: AIConsequence): number {
    const base = consequence.impact.magnitude
    const multiplier = consequence.confidence

    if (consequence.description.toLowerCase().includes('ally') ||
        consequence.description.toLowerCase().includes('friend')) {
      return base * multiplier * 5
    } else if (consequence.description.toLowerCase().includes('enemy') ||
               consequence.description.toLowerCase().includes('hostile')) {
      return -base * multiplier * 5
    }

    return base * multiplier * 2
  }

  private inferRelationshipType(description: string): any {
    if (description.includes('ally') || description.includes('friend')) return 'friend'
    if (description.includes('enemy') || description.includes('hostile')) return 'enemy'
    if (description.includes('trade') || description.includes('merchant')) return 'business'
    if (description.includes('family') || description.includes('relative')) return 'family'

    return 'neutral'
  }

  private inferActivityFromConsequence(consequence: AIConsequence): string {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('fight') || desc.includes('battle')) return 'combat'
    if (desc.includes('trade') || desc.includes('buy')) return 'trading'
    if (desc.includes('travel') || desc.includes('move')) return 'traveling'
    if (desc.includes('rest') || desc.includes('sleep')) return 'resting'

    return 'active'
  }

  private inferEventType(consequence: AIConsequence): any {
    switch (consequence.type) {
      case ConsequenceType.COMBAT: return 'combat'
      case ConsequenceType.ECONOMIC: return 'economic'
      case ConsequenceType.EXPLORATION: return 'discovery'
      case ConsequenceType.ENVIRONMENT: return 'natural'
      default: return 'social'
    }
  }

  private generateEnvironmentConditions(consequence: AIConsequence, region: RegionState): string {
    const current = region.currentConditions || 'normal'
    const desc = consequence.description.toLowerCase()

    if (desc.includes('rain') || desc.includes('storm')) {
      return `${current}, rainy conditions`
    }
    if (desc.includes('sun') || desc.includes('clear')) {
      return `${current}, clear weather`
    }
    if (desc.includes('cold') || desc.includes('snow')) {
      return `${current}, cold weather`
    }
    if (desc.includes('damage') || desc.includes('destruction')) {
      return `${current}, damaged environment`
    }

    return `${current}, changed by recent events`
  }

  private updateRegionStatus(region: RegionState, consequence: AIConsequence): string {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('prosper') || desc.includes('thrive')) {
      return 'thriving'
    }
    if (desc.includes('damage') || desc.includes('destroy')) {
      return 'damaged'
    }
    if (desc.includes('peace') || desc.includes('calm')) {
      return 'peaceful'
    }

    return region.status
  }

  private updateCharacterStatus(character: CharacterState, consequence: AIConsequence): string {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('wound') || desc.includes('injure')) {
      return 'injured'
    }
    if (desc.includes('heal') || desc.includes('recover')) {
      return 'recovered'
    }
    if (desc.includes('happy') || desc.includes('joy')) {
      return 'happy'
    }

    return character.status
  }

  private updateCharacterMood(character: CharacterState, consequence: AIConsequence): string {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('angry') || desc.includes('rage')) {
      return 'angry'
    }
    if (desc.includes('happy') || desc.includes('joy')) {
      return 'happy'
    }
    if (desc.includes('sad') || desc.includes('grief')) {
      return 'sad'
    }
    if (desc.includes('fear') || desc.includes('scared')) {
      return 'afraid'
    }

    return character.mood
  }

  private calculateProsperityChange(consequence: AIConsequence): number {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('trade') || desc.includes('prosper') || desc.includes('growth')) {
      return Math.floor(consequence.impact.magnitude * 2)
    }
    if (desc.includes('damage') || desc.includes('destroy') || desc.includes('loss')) {
      return -Math.floor(consequence.impact.magnitude * 3)
    }

    return Math.floor(consequence.impact.magnitude)
  }

  private calculateSafetyChange(consequence: AIConsequence): number {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('safe') || desc.includes('peace') || desc.includes('calm')) {
      return Math.floor(consequence.impact.magnitude * 2)
    }
    if (desc.includes('danger') || desc.includes('threat') || desc.includes('attack')) {
      return -Math.floor(consequence.impact.magnitude * 3)
    }

    return 0
  }

  private calculateEconomicImpact(consequence: AIConsequence): number {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('trade') || desc.includes('merchant') || desc.includes('market')) {
      return Math.floor(consequence.impact.magnitude * 1.5)
    }

    return Math.floor(consequence.impact.magnitude)
  }

  private calculateTradeImpact(consequence: AIConsequence): number {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('route') || desc.includes('trade')) {
      return Math.floor(consequence.impact.magnitude * 0.8)
    }

    return 0
  }

  private calculateDangerImpact(consequence: AIConsequence): number {
    const desc = consequence.description.toLowerCase()

    if (desc.includes('danger') || desc.includes('attack') || desc.includes('bandit')) {
      return Math.floor(consequence.impact.magnitude * 0.6)
    }

    return 0
  }

  private inferTypeFromDescription(description: string): ConsequenceType {
    const desc = description.toLowerCase()

    if (desc.includes('relationship') || desc.includes('friend')) return ConsequenceType.RELATIONSHIP
    if (desc.includes('environment') || desc.includes('weather')) return ConsequenceType.ENVIRONMENT
    if (desc.includes('character') || desc.includes('person')) return ConsequenceType.CHARACTER
    if (desc.includes('economy') || desc.includes('trade')) return ConsequenceType.ECONOMIC
    if (desc.includes('combat') || desc.includes('fight')) return ConsequenceType.COMBAT
    if (desc.includes('explore') || desc.includes('discover')) return ConsequenceType.EXPLORATION

    return ConsequenceType.WORLD_STATE
  }

  /**
   * Create logger function
   */
  private createLogger() {
    return (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [WorldStateUpdater] [${level.toUpperCase()}] ${message}`, data || '')
    }
  }
}

export default WorldStateUpdater