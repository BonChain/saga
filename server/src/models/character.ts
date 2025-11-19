/**
 * Character Data Models and Interfaces
 * Story 4.1: Character Memory & Relationship Tracking
 *
 * Defines Character, MemoryEntry, Personality, and RelationshipScore interfaces
 * for NPC memory tracking and relationship management in the living world system.
 */

// Removed unused uuid import

/**
 * Personality traits that affect character behavior and memory interpretation
 * Based on Layer1Blueprint worldRules.characterBehavior settings
 */
export enum Personality {
  AGGRESSIVE = 'aggressive',
  FRIENDLY = 'friendly',
  CAUTIOUS = 'cautious',
  CURIOUS = 'curious',
  LOYAL = 'loyal',
  MISCHIEVOUS = 'mischievous',
  WISE = 'wise',
  GUARDED = 'guarded'
}

/**
 * Emotional impact levels for memory events
 * Used in relationship score calculations and personality-driven responses
 */
export enum EmotionalImpact {
  VERY_NEGATIVE = -2,
  NEGATIVE = -1,
  NEUTRAL = 0,
  POSITIVE = 1,
  VERY_POSITIVE = 2
}

/**
 * Individual memory entry for character interactions
 * Stored in character's memory array with structured data for AI processing
 */
export interface MemoryEntry {
  id: string
  characterId: string
  playerId?: string
  targetCharacterId?: string  // For NPC-to-NPC interactions
  action: string
  actionType: 'combat' | 'social' | 'trade' | 'help' | 'betrayal' | 'gift' | 'other'
  timestamp: number
  location: string
  description: string
  emotionalImpact: EmotionalImpact
  context: {
    // Additional context for AI dialogue generation
    otherCharactersPresent?: string[]
    environmentalConditions?: string
    worldStateSnapshot?: Record<string, unknown>
  }
  summary?: string  // Computed summary for long-term storage
  isActive: boolean  // false for compressed/archived memories
}

/**
 * Multi-dimensional relationship scores between characters
 * Supports complex relationship tracking beyond simple friendship levels
 */
export interface RelationshipScores {
  friendship: number      // -100 to 100 (enemy to best friend)
  hostility: number       // -100 to 100 (peaceful to hostile)
  loyalty: number         // -100 to 100 (betrayal to unwavering loyalty)
  respect: number         // -100 to 100 (disrespect to deep respect)
  fear: number           // -100 to 100 (fearless to terrified)
  trust: number          // -100 to 100 (suspicious to complete trust)
}

/**
 * Complete relationship data between two characters
 * Includes scores, history, and metadata for persistence
 */
export interface Relationship {
  id: string
  characterId: string
  targetId: string  // Can be player ID or another character ID
  scores: RelationshipScores
  lastInteraction: number
  totalInteractions: number
  relationshipType: 'player-npc' | 'npc-npc' | 'npc-player'
  sharedExperiences: {
    events: string[]
    locations: string[]
    timeSpent: number  // Total time spent together
  }
  modifiers: {
    // Personality-driven relationship modifiers
    personalityCompatibility: number
    externalInfluences: string[]
  }
  createdAt: number
  updatedAt: number
}

/**
 * Main Character interface with memory and personality systems
 * Integrates with existing WorldState patterns for 3-layer storage
 */
export interface Character {
  id: string
  name: string
  type: 'player' | 'npc'
  personality: Personality
  personalityModifiers?: {
    // Individual personality variations
    openness?: number      // How open to new experiences
    empathy?: number       // How much they consider others' feelings
    curiosity?: number    // How curious about the world
    aggression?: number   // Base aggression level
  }

  // Memory system with capacity limits from Layer1Blueprint
  memories: MemoryEntry[]
  memoryStats: {
    totalMemories: number
    activeMemories: number  // uncompressed memories
    archivedMemories: number
    lastMemoryUpdate: number
  }

  // Location and state
  currentLocation: string
  currentHealth?: number
  currentMood?: EmotionalImpact

  // Relationships cache for performance
  relationships: {
    [targetId: string]: Relationship
  }

  // Character metadata
  description: string
  backstory: string
  appearance: {
    physicalDescription: string
    notableFeatures?: string[]
  }

  // System fields for persistence
  createdAt: number
  updatedAt: number
  version: number
}

/**
 * Character creation and update parameters
 * Used for validation and API input processing
 */
export interface CharacterCreateParams {
  name: string
  personality: Personality
  description: string
  backstory: string
  currentLocation: string
  appearance: {
    physicalDescription: string
    notableFeatures?: string[]
  }
  personalityModifiers?: {
    openness?: number
    empathy?: number
    curiosity?: number
    aggression?: number
  }
}

export interface CharacterUpdateParams {
  name?: string
  currentLocation?: string
  currentHealth?: number
  currentMood?: EmotionalImpact
  appearance?: {
    physicalDescription?: string
    notableFeatures?: string[]
  }
}

/**
 * Memory creation parameters for API endpoints
 */
export interface MemoryCreateParams {
  characterId: string
  playerId?: string
  targetCharacterId?: string
  action: string
  actionType: 'combat' | 'social' | 'trade' | 'help' | 'betrayal' | 'gift' | 'other'
  location: string
  description: string
  emotionalImpact: EmotionalImpact
  context?: {
    otherCharactersPresent?: string[]
    environmentalConditions?: string
    worldStateSnapshot?: Record<string, unknown>
  }
}

/**
 * Relationship update parameters
 */
export interface RelationshipUpdateParams {
  scores?: Partial<RelationshipScores>
  modifiers?: {
    personalityCompatibility?: number
    externalInfluences?: string[]
  }
}

/**
 * Character query options for filtering and pagination
 */
export interface CharacterQueryOptions {
  location?: string
  personality?: Personality
  hasMemoriesWithPlayer?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastInteraction'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Memory query options with filtering capabilities
 */
export interface MemoryQueryOptions {
  playerId?: string
  actionType?: MemoryEntry['actionType']
  location?: string
  emotionalImpact?: EmotionalImpact
  dateRange?: {
    start: number
    end: number
  }
  includeArchived?: boolean
  limit?: number
  offset?: number
}

/**
 * Character state validation result
 * Used for consistency checks and error reporting
 */
export interface CharacterValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    characterId: string
    memoryCount: number
    relationshipCount: number
    lastUpdate: number
  }
}

/**
 * Constants based on Layer1Blueprint configuration
 */
export const CHARACTER_CONSTANTS = {
  DEFAULT_MEMORY_CAPACITY: 100,  // From worldRules.characterBehavior.memoryCapacity
  MEMORY_COMPRESSION_THRESHOLD: 90,
  MAX_RELATIONSHIP_SCORE: 100,
  MIN_RELATIONSHIP_SCORE: -100,
  RELATIONSHIP_DECAY_RATE: 0.001,  // Slow decay over time
  MEMORY_SUMMARY_LENGTH: 100
} as const