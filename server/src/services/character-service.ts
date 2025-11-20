/**
 * Character Service - Story 4.1: Character Memory & Relationship Tracking
 *
 * Core business logic for character memory and relationship management.
 * Integrates with existing WorldService for Layer 3 storage and follows
 * established service patterns with Winston logging.
 */

import { Logger } from 'winston'
import { v4 as uuidv4 } from 'uuid'

import {
  Character,
  MemoryEntry,
  Relationship,
  RelationshipScores,
  Personality,
  EmotionalImpact,
  CharacterCreateParams,
  CharacterUpdateParams,
  MemoryCreateParams,
  CharacterValidationResult,
  CHARACTER_CONSTANTS,
  MemoryQueryOptions,
  CharacterQueryOptions
} from '../models/character'
import { CharacterWorldIntegration } from './character-world-integration'

export interface CharacterServiceConfig {
  logger: Logger
  worldService: Record<string, unknown>  // Will be injected from existing WorldService
  characterWorldIntegration: CharacterWorldIntegration
  memoryCapacity?: number
  enableMemoryCompression?: boolean
}

export class CharacterService {
  private config: CharacterServiceConfig
  private logger: Logger

  constructor(config: CharacterServiceConfig) {
    this.config = config
    this.logger = config.logger
  }

  /**
   * Core memory management methods
   */

  async addMemory(params: MemoryCreateParams): Promise<MemoryEntry> {
    this.logger.info(`Adding memory for character ${params.characterId}`, {
      action: params.action,
      emotionalImpact: params.emotionalImpact
    })

    const character = await this.getCharacter(params.characterId)
    if (!character) {
      throw new Error(`Character not found: ${params.characterId}`)
    }

    const memory: MemoryEntry = {
      id: uuidv4(),
      characterId: params.characterId,
      playerId: params.playerId,
      targetCharacterId: params.targetCharacterId,
      action: params.action,
      actionType: params.actionType,
      timestamp: Date.now(),
      location: params.location,
      description: params.description,
      emotionalImpact: params.emotionalImpact,
      context: params.context || {},
      isActive: true
    }

    // Add memory to character
    character.memories.push(memory)
    character.memoryStats.totalMemories++
    character.memoryStats.activeMemories++
    character.memoryStats.lastMemoryUpdate = Date.now()
    character.updatedAt = Date.now()

    // Update relationships based on memory
    await this.updateRelationshipsFromMemory(character, memory)

    // Check if memory compression is needed
    if (character.memoryStats.activeMemories > this.getMemoryCapacity()) {
      await this.compressMemories(character)
    }

    // Save updated character to world state
    await this.saveCharacter(character)

    this.logger.info(`Memory added successfully`, {
      memoryId: memory.id,
      characterId: params.characterId,
      totalMemories: character.memoryStats.totalMemories
    })

    return memory
  }

  async getCharacterMemories(characterId: string, options?: MemoryQueryOptions): Promise<MemoryEntry[]> {
    this.logger.debug(`Retrieving memories for character ${characterId}`, options)

    const character = await this.getCharacter(characterId)
    if (!character) {
      throw new Error(`Character not found: ${characterId}`)
    }

    let memories = [...character.memories]

    // Apply filters
    if (options) {
      if (options.playerId) {
        memories = memories.filter(m => m.playerId === options.playerId)
      }
      if (options.actionType) {
        memories = memories.filter(m => m.actionType === options.actionType)
      }
      if (options.location) {
        memories = memories.filter(m => m.location === options.location)
      }
      if (options.emotionalImpact !== undefined) {
        memories = memories.filter(m => m.emotionalImpact === options.emotionalImpact)
      }
      if (options.dateRange) {
        memories = memories.filter(m =>
          m.timestamp >= options.dateRange!.start &&
          m.timestamp <= options.dateRange!.end
        )
      }
      if (!options.includeArchived) {
        memories = memories.filter(m => m.isActive)
      }
      if (options.offset) {
        memories = memories.slice(options.offset)
      }
      if (options.limit) {
        memories = memories.slice(0, options.limit)
      }
    }

    // Sort by timestamp (most recent first)
    memories.sort((a, b) => b.timestamp - a.timestamp)

    return memories
  }

  /**
   * Relationship management methods
   */

  async updateRelationshipScore(
    characterId: string,
    targetId: string,
    changes: Partial<RelationshipScores>
  ): Promise<Relationship> {
    this.logger.info(`Updating relationship score`, {
      characterId,
      targetId,
      changes
    })

    const character = await this.getCharacter(characterId)
    if (!character) {
      throw new Error(`Character not found: ${characterId}`)
    }

    const relationshipKey = `${characterId}-${targetId}`
    let relationship = character.relationships[relationshipKey]

    if (!relationship) {
      // Create new relationship
      relationship = await this.createRelationship(characterId, targetId)
      character.relationships[relationshipKey] = relationship
    }

    // Apply changes with bounds checking
    if (changes.friendship !== undefined) {
      relationship.scores.friendship = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE,
        relationship.scores.friendship + changes.friendship)
      )
    }
    if (changes.hostility !== undefined) {
      relationship.scores.hostility = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE,
        relationship.scores.hostility + changes.hostility)
      )
    }
    if (changes.loyalty !== undefined) {
      relationship.scores.loyalty = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE,
        relationship.scores.loyalty + changes.loyalty)
      )
    }
    if (changes.respect !== undefined) {
      relationship.scores.respect = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE,
        relationship.scores.respect + changes.respect)
      )
    }
    if (changes.fear !== undefined) {
      relationship.scores.fear = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE,
        relationship.scores.fear + changes.fear)
      )
    }
    if (changes.trust !== undefined) {
      relationship.scores.trust = Math.max(
        CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE,
        Math.min(CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE,
        relationship.scores.trust + changes.trust)
      )
    }

    relationship.lastInteraction = Date.now()
    relationship.totalInteractions++
    relationship.updatedAt = Date.now()

    character.updatedAt = Date.now()
    await this.saveCharacter(character)

    return relationship
  }

  async getRelationshipStatus(characterId: string, targetId: string): Promise<Relationship | null> {
    this.logger.debug(`Getting relationship status`, { characterId, targetId })

    const character = await this.getCharacter(characterId)
    if (!character) {
      return null
    }

    const relationshipKey = `${characterId}-${targetId}`
    return character.relationships[relationshipKey] || null
  }

  /**
   * Character CRUD operations
   */

  async createCharacter(params: CharacterCreateParams): Promise<Character> {
    this.logger.info(`Creating new character`, { name: params.name, personality: params.personality })

    const character: Character = {
      id: uuidv4(),
      name: params.name,
      type: 'npc',
      personality: params.personality,
      personalityModifiers: params.personalityModifiers || {
        openness: 0.5,
        empathy: 0.5,
        curiosity: 0.5,
        aggression: 0.5
      },
      memories: [],
      memoryStats: {
        totalMemories: 0,
        activeMemories: 0,
        archivedMemories: 0,
        lastMemoryUpdate: Date.now()
      },
      currentLocation: params.currentLocation,
      relationships: {},
      description: params.description,
      backstory: params.backstory,
      appearance: {
        physicalDescription: params.appearance.physicalDescription,
        notableFeatures: params.appearance.notableFeatures || []
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }

    await this.saveCharacter(character)
    return character
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    try {
      // Use CharacterWorldIntegration for Layer 3 storage
      return await this.config.characterWorldIntegration.loadCharacter(characterId)
    } catch (error) {
      this.logger.error(`Failed to get character ${characterId}`, error)
      return null
    }
  }

  async getAllCharacters(options?: CharacterQueryOptions): Promise<Character[]> {
    this.logger.debug(`Retrieving all characters`, options)

    try {
      // In a full implementation, this would query all characters from Layer 3 storage
      // For now, return empty array to be implemented later
      const characters: Character[] = []

      this.logger.debug(`Retrieved characters`, { count: characters.length })
      return characters
    } catch (error) {
      this.logger.error(`Failed to retrieve all characters`, error)
      return []
    }
  }

  async updateCharacter(characterId: string, params: CharacterUpdateParams): Promise<Character> {
    this.logger.info(`Updating character ${characterId}`, params)

    const character = await this.getCharacter(characterId)
    if (!character) {
      throw new Error(`Character not found: ${characterId}`)
    }

    // Apply updates
    if (params.name) character.name = params.name
    if (params.currentLocation) character.currentLocation = params.currentLocation
    if (params.currentHealth !== undefined) character.currentHealth = params.currentHealth
    if (params.currentMood !== undefined) character.currentMood = params.currentMood
    if (params.appearance) {
      if (params.appearance.physicalDescription) {
        character.appearance.physicalDescription = params.appearance.physicalDescription
      }
      if (params.appearance.notableFeatures) {
        character.appearance.notableFeatures = params.appearance.notableFeatures
      }
    }

    character.updatedAt = Date.now()
    character.version++

    await this.saveCharacter(character)
    return character
  }

  /**
   * Advanced relationship management
   */

  async createRelationship(characterId: string, targetId: string): Promise<Relationship> {
    this.logger.debug(`Creating new relationship`, { characterId, targetId })

    const relationship: Relationship = {
      id: uuidv4(),
      characterId,
      targetId,
      scores: {
        friendship: 0,
        hostility: 0,
        loyalty: 0,
        respect: 0,
        fear: 0,
        trust: 0
      },
      lastInteraction: Date.now(),
      totalInteractions: 0,
      relationshipType: 'npc-npc',  // Default, will be updated based on context
      sharedExperiences: {
        events: [],
        locations: [],
        timeSpent: 0
      },
      modifiers: {
        personalityCompatibility: this.calculatePersonalityCompatibility(characterId, targetId),
        externalInfluences: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    return relationship
  }

  /**
   * Private helper methods
   */

  private async updateRelationshipsFromMemory(character: Character, memory: MemoryEntry): Promise<void> {
    // Update relationship with player
    if (memory.playerId) {
      const relationshipChanges = this.calculateRelationshipChanges(character.personality, memory)
      await this.updateRelationshipScore(character.id, memory.playerId, relationshipChanges)
    }

    // Update NPC-to-NPC relationships
    if (memory.targetCharacterId && memory.targetCharacterId !== character.id) {
      const relationshipChanges = this.calculateRelationshipChanges(character.personality, memory)
      await this.updateRelationshipScore(character.id, memory.targetCharacterId, relationshipChanges)
    }
  }

  private calculateRelationshipChanges(personality: Personality, memory: MemoryEntry): Partial<RelationshipScores> {
    const changes: Partial<RelationshipScores> = {}
    const impact = memory.emotionalImpact

    switch (memory.actionType) {
      case 'help':
        changes.friendship = impact * 10
        changes.trust = impact * 8
        changes.loyalty = impact * 5
        break
      case 'gift':
        changes.friendship = impact * 15
        changes.respect = impact * 5
        break
      case 'betrayal':
        changes.hostility = Math.abs(impact) * 20
        changes.trust = -Math.abs(impact) * 25
        changes.loyalty = -Math.abs(impact) * 15
        break
      case 'combat':
        changes.hostility = Math.abs(impact) * 12
        changes.fear = Math.abs(impact) * 8
        changes.respect = impact > 0 ? impact * 10 : 0
        break
      case 'social':
        changes.friendship = impact * 5
        changes.respect = impact * 3
        break
      case 'trade':
        changes.friendship = impact * 3
        changes.trust = impact * 7
        break
    }

    // Apply personality modifiers
    return this.applyPersonalityModifiers(personality, changes)
  }

  private applyPersonalityModifiers(personality: Personality, changes: Partial<RelationshipScores>): Partial<RelationshipScores> {
    const modified = { ...changes }

    switch (personality) {
      case Personality.AGGRESSIVE:
        if (modified.hostility) modified.hostility *= 1.5
        if (modified.respect) modified.respect *= 0.8
        if (modified.fear) modified.fear *= 0.6
        break
      case Personality.FRIENDLY:
        if (modified.friendship) modified.friendship *= 1.5
        if (modified.hostility) modified.hostility *= 0.5
        break
      case Personality.CAUTIOUS:
        if (modified.trust) modified.trust *= 0.7
        if (modified.fear) modified.fear *= 1.3
        break
      case Personality.LOYAL:
        if (modified.loyalty) modified.loyalty *= 2.0
        if (modified.friendship) modified.friendship *= 1.2
        break
    }

    return modified
  }

  private async compressMemories(character: Character): Promise<void> {
    this.logger.info(`Compressing memories for character ${character.id}`, {
      activeMemories: character.memoryStats.activeMemories
    })

    const activeMemories = character.memories.filter(m => m.isActive)
    const toCompress = activeMemories.slice(
      0,
      activeMemories.length - CHARACTER_CONSTANTS.MEMORY_COMPRESSION_THRESHOLD
    )

    let compressedCount = 0
    for (const memory of toCompress) {
      memory.summary = this.generateMemorySummary(memory)
      memory.isActive = false
      compressedCount++
    }

    character.memoryStats.activeMemories -= compressedCount
    character.memoryStats.archivedMemories += compressedCount
    character.updatedAt = Date.now()

    this.logger.info(`Memory compression completed`, {
      characterId: character.id,
      compressedCount,
      remainingActive: character.memoryStats.activeMemories
    })
  }

  private generateMemorySummary(memory: MemoryEntry): string {
    return `${memory.action} with ${memory.playerId || memory.targetCharacterId} at ${memory.location} (${memory.emotionalImpact > 0 ? 'positive' : memory.emotionalImpact < 0 ? 'negative' : 'neutral'})`
  }

  private calculatePersonalityCompatibility(characterId: string, targetId: string): number {
    // Simplified compatibility calculation
    // In a full implementation, this would load both characters and compare personalities
    return 0  // Neutral compatibility for now
  }

  private getMemoryCapacity(): number {
    return this.config.memoryCapacity || CHARACTER_CONSTANTS.DEFAULT_MEMORY_CAPACITY
  }

  private async saveCharacter(character: Character): Promise<void> {
    try {
      // Use CharacterWorldIntegration for Layer 3 storage
      await this.config.characterWorldIntegration.saveCharacterState(character.id, character)
    } catch (error) {
      this.logger.error(`Failed to save character ${character.id}`, error)
      throw error
    }
  }

  /**
   * Validation and utility methods
   */

  async validateCharacter(characterId: string): Promise<CharacterValidationResult> {
    const character = await this.getCharacter(characterId)
    if (!character) {
      return {
        isValid: false,
        errors: [`Character not found: ${characterId}`],
        warnings: [],
        summary: {
          characterId,
          memoryCount: 0,
          relationshipCount: 0,
          lastUpdate: 0
        }
      }
    }

    const errors: string[] = []
    const warnings: string[] = []

    // Validate memory capacity
    if (character.memoryStats.activeMemories > this.getMemoryCapacity()) {
      warnings.push(`Active memories (${character.memoryStats.activeMemories}) exceed capacity (${this.getMemoryCapacity()})`)
    }

    // Validate relationship scores
    for (const [key, relationship] of Object.entries(character.relationships)) {
      const scores = relationship.scores
      Object.entries(scores).forEach(([scoreName, value]) => {
        if (value < CHARACTER_CONSTANTS.MIN_RELATIONSHIP_SCORE || value > CHARACTER_CONSTANTS.MAX_RELATIONSHIP_SCORE) {
          errors.push(`Invalid ${scoreName} score in relationship ${key}: ${value}`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        characterId,
        memoryCount: character.memoryStats.totalMemories,
        relationshipCount: Object.keys(character.relationships).length,
        lastUpdate: character.updatedAt
      }
    }
  }
}