/**
 * Relationship Management System - Story 4.1: Character Memory & Relationship Tracking
 *
 * Advanced relationship calculation and NPC-to-NPC relationship tracking.
 * Handles shared world events, personality compatibility, and complex relationship dynamics.
 */

import { Logger } from 'winston'

import {
  EmotionalImpact,
  MemoryEntry,
  Personality,
  RelationshipScores,
  CHARACTER_CONSTANTS
} from '../models/character'

export interface RelationshipEvent {
  id: string
  type: 'shared_experience' | 'conflict' | 'cooperation' | 'witnessed_interaction'
  characters: string[]
  location: string
  timestamp: number
  description: string
  emotionalImpact: EmotionalImpact
  worldEventId?: string
}

export interface RelationshipCalculationParams {
  baseScores: RelationshipScores
  personalityA: Personality
  personalityB: Personality
  sharedExperiences: number
  totalInteractions: number
  timeSinceLastInteraction: number
  conflictCount: number
  cooperationCount: number
}

export interface RelationshipManagerConfig {
  logger: Logger
  decayRate?: number
  personalityWeight?: number
  experienceWeight?: number
  timeWeight?: number
}

export class RelationshipManager {
  private config: RelationshipManagerConfig
  private logger: Logger

  constructor(config: RelationshipManagerConfig) {
    this.config = config
    this.logger = config.logger
  }

  /**
   * Calculate relationship scores based on memories and events
   */
  async calculateRelationshipScores(
    characterId: string,
    targetId: string,
    memories: MemoryEntry[]
  ): Promise<RelationshipScores> {
    this.logger.debug(`Calculating relationship scores`, {
      characterId,
      targetId,
      memoryCount: memories.length
    })

    const params: RelationshipCalculationParams = await this.extractCalculationParams(
      characterId,
      targetId,
      memories
    )

    const scores = this.performRelationshipCalculation(params)

    this.logger.debug(`Relationship calculation completed`, {
      characterId,
      targetId,
      scores
    })

    return scores
  }

  /**
   * Track NPC-to-NPC relationships based on shared world events
   */
  async processWorldEventForNPCRelationships(event: RelationshipEvent): Promise<void> {
    this.logger.info(`Processing world event for NPC relationships`, {
      eventId: event.id,
      type: event.type,
      characters: event.characters
    })

    // Create shared experiences between all involved NPCs
    for (let i = 0; i < event.characters.length; i++) {
      for (let j = i + 1; j < event.characters.length; j++) {
        const charA = event.characters[i]
        const charB = event.characters[j]

        await this.updateSharedExperience(charA, charB, event)
        await this.updateSharedExperience(charB, charA, event)
      }
    }

    this.logger.info(`World event processed for ${event.characters.length} characters`)
  }

  /**
   * Update relationship scores based on memory events
   */
  async updateRelationshipFromMemory(
    characterId: string,
    memory: MemoryEntry
  ): Promise<void> {
    if (!memory.playerId && !memory.targetCharacterId) {
      return // No relationship to update
    }

    const targetId = memory.playerId || memory.targetCharacterId!

    this.logger.debug(`Updating relationship from memory`, {
      characterId,
      targetId,
      action: memory.action,
      emotionalImpact: memory.emotionalImpact
    })

    // Calculate score changes based on action type and personality
    const scoreChanges = this.calculateScoreChangesFromMemory(memory)

    // Apply the changes
    // This would integrate with CharacterService in practice
    this.logger.debug(`Relationship score changes calculated`, scoreChanges)
  }

  /**
   * Apply relationship decay over time
   */
  async applyRelationshipDecay(characterId: string, _currentTime: number): Promise<void> {
    this.logger.debug(`Applying relationship decay`, { characterId })

    const decayRate = this.config.decayRate || CHARACTER_CONSTANTS.RELATIONSHIP_DECAY_RATE

    // In a full implementation, this would load all relationships for the character
    // and apply time-based decay
    this.logger.debug(`Relationship decay applied`, { characterId, decayRate })
  }

  /**
   * Get relationship compatibility between personalities
   */
  calculatePersonalityCompatibility(
    personalityA: Personality,
    personalityB: Personality
  ): number {
    const compatibilityMatrix: Record<Personality, Record<Personality, number>> = {
      [Personality.AGGRESSIVE]: {
        [Personality.AGGRESSIVE]: 0.3,
        [Personality.FRIENDLY]: -0.2,
        [Personality.CAUTIOUS]: -0.1,
        [Personality.CURIOS]: 0.1,
        [Personality.LOYAL]: 0.2,
        [Personality.MISCHIEVOUS]: 0.4,
        [Personality.WISE]: -0.3,
        [Personality.GUARDED]: 0.0
      },
      [Personality.FRIENDLY]: {
        [Personality.AGGRESSIVE]: -0.2,
        [Personality.FRIENDLY]: 0.8,
        [Personality.CAUTIOUS]: 0.4,
        [Personality.CURIOS]: 0.6,
        [Personality.LOYAL]: 0.7,
        [Personality.MISCHIEVOUS]: 0.3,
        [Personality.WISE]: 0.5,
        [Personality.GUARDED]: 0.2
      },
      [Personality.CAUTIOUS]: {
        [Personality.AGGRESSIVE]: -0.1,
        [Personality.FRIENDLY]: 0.4,
        [Personality.CAUTIOUS]: 0.6,
        [Personality.CURIOS]: 0.3,
        [Personality.LOYAL]: 0.5,
        [Personality.MISCHIEVOUS]: -0.2,
        [Personality.WISE]: 0.4,
        [Personality.GUARDED]: 0.3
      },
      [Personality.CURIOS]: {
        [Personality.AGGRESSIVE]: 0.1,
        [Personality.FRIENDLY]: 0.6,
        [Personality.CAUTIOUS]: 0.3,
        [Personality.CURIOS]: 0.7,
        [Personality.LOYAL]: 0.4,
        [Personality.MISCHIEVOUS]: 0.5,
        [Personality.WISE]: 0.6,
        [Personality.GUARDED]: 0.2
      },
      [Personality.LOYAL]: {
        [Personality.AGGRESSIVE]: 0.2,
        [Personality.FRIENDLY]: 0.7,
        [Personality.CAUTIOUS]: 0.5,
        [Personality.CURIOS]: 0.4,
        [Personality.LOYAL]: 0.9,
        [Personality.MISCHIEVOUS]: -0.1,
        [Personality.WISE]: 0.6,
        [Personality.GUARDED]: 0.3
      },
      [Personality.MISCHIEVOUS]: {
        [Personality.AGGRESSIVE]: 0.4,
        [Personality.FRIENDLY]: 0.3,
        [Personality.CAUTIOUS]: -0.2,
        [Personality.CURIOS]: 0.5,
        [Personality.LOYAL]: -0.1,
        [Personality.MISCHIEVOUS]: 0.7,
        [Personality.WISE]: 0.2,
        [Personality.GUARDED]: 0.0
      },
      [Personality.WISE]: {
        [Personality.AGGRESSIVE]: -0.3,
        [Personality.FRIENDLY]: 0.5,
        [Personality.CAUTIOUS]: 0.4,
        [Personality.CURIOS]: 0.6,
        [Personality.LOYAL]: 0.6,
        [Personality.MISCHIEVOUS]: 0.2,
        [Personality.WISE]: 0.8,
        [Personality.GUARDED]: 0.4
      },
      [Personality.GUARDED]: {
        [Personality.AGGRESSIVE]: 0.0,
        [Personality.FRIENDLY]: 0.2,
        [Personality.CAUTIOUS]: 0.3,
        [Personality.CURIOS]: 0.2,
        [Personality.LOYAL]: 0.3,
        [Personality.MISCHIEVOUS]: 0.0,
        [Personality.WISE]: 0.4,
        [Personality.GUARDED]: 0.6
      }
    }

    return compatibilityMatrix[personalityA][personalityB] || 0.0
  }

  /**
   * Generate relationship insights and predictions
   */
  async generateRelationshipInsights(
    characterId: string,
    targetId: string
  ): Promise<{
    currentStatus: string
    trendDirection: 'improving' | 'declining' | 'stable'
    potentialConflicts: string[]
    compatibilityNotes: string[]
    recommendations: string[]
  }> {
    this.logger.debug(`Generating relationship insights`, { characterId, targetId })

    // This would analyze relationship history and patterns
    // For now, return a basic structure
    return {
      currentStatus: 'neutral',
      trendDirection: 'stable',
      potentialConflicts: [],
      compatibilityNotes: [],
      recommendations: []
    }
  }

  /**
   * Private helper methods
   */

  private async extractCalculationParams(
    characterId: string,
    targetId: string,
    memories: MemoryEntry[]
  ): Promise<RelationshipCalculationParams> {
    const relevantMemories = memories.filter(m =>
      m.playerId === targetId || m.targetCharacterId === targetId
    )

    const baseScores: RelationshipScores = {
      friendship: 0,
      hostility: 0,
      loyalty: 0,
      respect: 0,
      fear: 0,
      trust: 0
    }

    // Count interaction types
    let cooperationCount = 0
    let conflictCount = 0
    let _totalEmotionalImpact = 0

    for (const memory of relevantMemories) {
      _totalEmotionalImpact += memory.emotionalImpact

      if (memory.actionType === 'help' || memory.actionType === 'gift' || memory.actionType === 'social') {
        cooperationCount++
      } else if (memory.actionType === 'combat' || memory.actionType === 'betrayal') {
        conflictCount++
      }
    }

    return {
      baseScores,
      personalityA: Personality.FRIENDLY, // Would load actual personality
      personalityB: Personality.FRIENDLY,
      sharedExperiences: relevantMemories.length,
      totalInteractions: relevantMemories.length,
      timeSinceLastInteraction: relevantMemories.length > 0
        ? Date.now() - Math.max(...relevantMemories.map(m => m.timestamp))
        : Infinity,
      conflictCount,
      cooperationCount
    }
  }

  private performRelationshipCalculation(params: RelationshipCalculationParams): RelationshipScores {
    const weights = {
      personality: this.config.personalityWeight || 0.3,
      experience: this.config.experienceWeight || 0.5,
      time: this.config.timeWeight || 0.2
    }

    const compatibility = this.calculatePersonalityCompatibility(
      params.personalityA,
      params.personalityB
    )

    // Calculate base scores from experiences
    const experienceScore = this.calculateExperienceScore(
      params.sharedExperiences,
      params.cooperationCount,
      params.conflictCount
    )

    // Calculate time factor (recent interactions have more weight)
    const timeFactor = Math.max(0, 1 - (params.timeSinceLastInteraction / (30 * 24 * 60 * 60 * 1000))) // 30 days

    const scores: RelationshipScores = {
      friendship: Math.round(this.combineScoreComponents(
        params.baseScores.friendship,
        compatibility * weights.personality * 50,
        experienceScore.friendship * weights.experience,
        timeFactor * weights.time * 10
      )),
      hostility: Math.round(this.combineScoreComponents(
        params.baseScores.hostility,
        (-compatibility + 1) * weights.personality * 50,
        experienceScore.hostility * weights.experience,
        0
      )),
      loyalty: Math.round(this.combineScoreComponents(
        params.baseScores.loyalty,
        compatibility * weights.personality * 40,
        experienceScore.loyalty * weights.experience,
        timeFactor * weights.time * 8
      )),
      respect: Math.round(this.combineScoreComponents(
        params.baseScores.respect,
        (compatibility + 0.5) * weights.personality * 40,
        experienceScore.respect * weights.experience,
        0
      )),
      fear: Math.round(this.combineScoreComponents(
        params.baseScores.fear,
        (1 - compatibility) * weights.personality * 30,
        experienceScore.fear * weights.experience,
        0
      )),
      trust: Math.round(this.combineScoreComponents(
        params.baseScores.trust,
        compatibility * weights.personality * 45,
        experienceScore.trust * weights.experience,
        timeFactor * weights.time * 12
      ))
    }

    // Apply bounds checking
    Object.keys(scores).forEach(key => {
      const scoreKey = key as keyof RelationshipScores
      scores[scoreKey] = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE, scores[scoreKey])
      )
    })

    return scores
  }

  private calculateExperienceScore(
    sharedExperiences: number,
    cooperationCount: number,
    conflictCount: number
  ): RelationshipScores {
    const experienceWeight = Math.min(sharedExperiences / 10, 1) // Normalize to 0-1
    const cooperationRatio = cooperationCount / Math.max(1, cooperationCount + conflictCount)

    return {
      friendship: cooperationRatio * experienceWeight * 30,
      hostility: (1 - cooperationRatio) * experienceWeight * 60,  // Increased from 40
      loyalty: cooperationRatio * experienceWeight * 25,
      respect: experienceWeight * 20,
      fear: (1 - cooperationRatio) * experienceWeight * 30,    // Increased from 15
      trust: cooperationRatio * experienceWeight * 35
    }
  }

  private combineScoreComponents(...components: number[]): number {
    return components.reduce((sum, component) => sum + component, 0)
  }

  private async updateSharedExperience(
    characterA: string,
    characterB: string,
    event: RelationshipEvent
  ): Promise<void> {
    this.logger.debug(`Updating shared experience`, {
      characterA,
      characterB,
      eventId: event.id
    })

    // In a full implementation, this would update the relationship record
    // with the shared experience details
  }

  public calculateScoreChangesFromMemory(memory: MemoryEntry): Partial<RelationshipScores> {
    const changes: Partial<RelationshipScores> = {}
    const impact = memory.emotionalImpact

    switch (memory.actionType) {
      case 'help':
        changes.friendship = impact * 8
        changes.trust = impact * 6
        changes.loyalty = impact * 4
        break
      case 'gift':
        changes.friendship = impact * 12
        changes.respect = impact * 3
        break
      case 'betrayal':
        changes.hostility = Math.abs(impact) * 15
        changes.trust = -Math.abs(impact) * 20
        changes.loyalty = -Math.abs(impact) * 12
        break
      case 'combat':
        changes.hostility = Math.abs(impact) * 10
        changes.fear = Math.abs(impact) * 6
        changes.respect = impact > 0 ? impact * 8 : -4
        break
      case 'social':
        changes.friendship = impact * 4
        changes.respect = impact * 2
        break
      case 'trade':
        changes.friendship = impact * 2
        changes.trust = impact * 5
        break
    }

    return changes
  }
}