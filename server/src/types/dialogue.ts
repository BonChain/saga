/**
 * Dialogue System Types - Story 4.2: Dynamic Dialogue Generation
 *
 * TypeScript interfaces for dialogue generation, emotional tone analysis,
 * and conversation tracking. Integrates with existing character models.
 */

import { Personality, EmotionalImpact } from '../models/character'

/**
 * Main request interface for dialogue generation
 */
export interface DialogueRequest {
  characterId: string
  playerId: string
  context: string
  conversationTopic?: string
  dialogueType?: 'greeting' | 'response' | 'question' | 'farewell'
  emotionalContext?: 'positive' | 'negative' | 'neutral'
}

/**
 * Complete dialogue response with metadata
 */
export interface DialogueResponse {
  dialogue: string
  emotionalTone: 'friendly' | 'hostile' | 'neutral'
  referencedMemories: string[]
  worldEvents: string[]
  personalityScore: number // 0-1 scale
  generationTime: number // milliseconds
  characterId: string
  playerId: string
  conversationTopic?: string
}

/**
 * Comprehensive dialogue context for AI generation
 */
export interface DialogueContext {
  character: {
    id: string
    name: string
    personality: Personality
    personalityModifiers?: {
      openness?: number
      empathy?: number
      curiosity?: number
      aggression?: number
    }
    currentMood?: EmotionalImpact
  }
  player: {
    id: string
    relationshipScores: {
      friendship: number
      hostility: number
      loyalty: number
      respect: number
      fear: number
      trust: number
    }
  }
  relevantMemories: Array<{
    id: string
    action: string
    description: string
    emotionalImpact: EmotionalImpact
    timestamp: number
    location: string
  }>
  recentWorldEvents: string[]
  conversationTopic?: string
  location: string
  timestamp: number
}

/**
 * Emotional tone mapping for dialogue generation
 */
export interface ToneMapping {
  languageStyle: string
  vocabularyChoice: string
  sentenceStructure: string
  emotionalIndicators: string[]
  defaultPhrases: string[]
  responsePatterns: string[]
}

/**
 * Personality template for dialogue generation
 */
export interface PersonalityTemplate {
  personality: Personality
  keyTraits: string[]
  dialoguePatterns: string[]
  vocabularyStyle: string
  emotionalRange: {
    minTone: 'friendly' | 'neutral' | 'hostile'
    maxTone: 'friendly' | 'neutral' | 'hostile'
  }
  samplePhrases: string[]
}

/**
 * Conversation topic suggestion
 */
export interface ConversationTopic {
  topic: string
  relevanceScore: number
  emotionalTone: 'friendly' | 'hostile' | 'neutral'
  relatedMemories: Array<{
    id: string
    description: string
  }>
}

/**
 * Dialogue continuity tracking
 */
export interface DialogueContinuity {
  previousTopics: string[]
  suggestedContinuations: string[]
  continuityScore: number // 0-1 scale
  conversationFlow: 'natural' | 'forced' | 'disjointed'
}

/**
 * Connection analysis between characters
 */
export interface ConnectionAnalysis {
  connectionLevel: number // 0-1 scale
  connectionType: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend'
  sharedExperiences: number
  emotionalDepth: number
  suggestedConnectionActions: string[]
  relationshipTrajectory: 'improving' | 'stable' | 'declining'
}

/**
 * Dialogue generation options
 */
export interface DialogueGenerationOptions {
  maxLength?: number // Maximum characters in response
  includeMemories?: boolean // Whether to reference past interactions
  includeWorldEvents?: boolean // Whether to mention world events
  personalityStrictness?: number // 0-1 scale, how strictly to follow personality
  emotionalIntensity?: number // 0-1 scale, intensity of emotional expression
  responseTime?: number // Target response time in milliseconds
}

/**
 * AI service interface for dialogue generation
 */
export interface AIDialogueRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  context?: {
    characterId: string
    personality: Personality
    emotionalTone: 'friendly' | 'hostile' | 'neutral'
  }
}

export interface AIDialogueResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
}

/**
 * Dialogue validation result
 */
export interface DialogueValidationResult {
  isValid: boolean
  personalityScore: number // 0-1 scale
  emotionalTone: 'friendly' | 'hostile' | 'neutral'
  consistencyIssues: string[]
  suggestedImprovements: string[]
}

/**
 * Dialogue performance metrics
 */
export interface DialoguePerformanceMetrics {
  generationTime: number
  aiResponseTime: number
  contextProcessingTime: number
  validationTime: number
  totalTime: number
  cacheHit: boolean
}

/**
 * Dialogue cache entry
 */
export interface DialogueCacheEntry {
  key: string
  response: DialogueResponse
  timestamp: number
  hitCount: number
  lastAccessed: number
}

/**
 * World context for dialogue generation
 */
export interface WorldContext {
  location: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: string
  recentEvents: Array<import('./storage').WorldEvent>
  nearbyCharacters: string[]
}

/**
 * NPC state for dialogue generation
 */
export interface NPCDialogueState {
  currentMood: EmotionalImpact
  recentInteractions: Array<{
    playerId: string
    timestamp: number
    emotionalImpact: EmotionalImpact
    topics: string[]
  }>
  availableTopics: string[]
  conversationDepth: number
  engagementLevel: number
}

/**
 * Type definitions for emotional tones
 */
export type EmotionalTone = 'friendly' | 'hostile' | 'neutral'

/**
 * Type definitions for dialogue types
 */
export type DialogueType = 'greeting' | 'response' | 'question' | 'farewell' | 'statement'

/**
 * Type definitions for dialogue contexts
 */
export type DialogueContextType = 'positive' | 'negative' | 'neutral'

/**
 * Error types for dialogue generation
 */
export interface DialogueErrorContext {
  characterId?: string
  playerId?: string
  emotionalTone?: EmotionalTone
  timestamp?: number
  additionalInfo?: Record<string, unknown>
}

export class DialogueGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: DialogueErrorContext
  ) {
    super(message)
    this.name = 'DialogueGenerationError'
  }
}

/**
 * Cache key generator for dialogue responses
 */
export interface DialogueCacheKey {
  characterId: string
  playerId: string
  topic?: string
  personality: Personality
  emotionalTone: EmotionalTone
  timestamp: number // For cache invalidation
}

/**
 * Dialogue analysis results for debugging and optimization
 */
export interface DialogueAnalysis {
  generatedDialogue: string
  promptUsed: string
  contextProvided: DialogueContext
  generationMetrics: DialoguePerformanceMetrics
  validationResults: DialogueValidationResult
  aiModel: string
  tokensUsed: number
}

/**
 * Export all dialogue-related types for easy importing
 */
export type {
  EmotionalTone as Tone,
  DialogueType as Type,
  DialogueContextType as Context
}