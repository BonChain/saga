/**
 * World Context Service - Story 4.2: Dynamic Dialogue Generation
 *
 * Tracks and analyzes recent world changes relevant to NPC dialogue.
 * Integrates with existing world state system and provides context-aware
 * world event information for dialogue generation.
 */

import { WorldContext, NPCDialogueState } from '../types/dialogue'
import { Character, Personality, EmotionalImpact } from '../models/character'
import { WorldEvent } from '../types/storage'

/**
 * World change event for character responses
 */
export interface WorldChange {
  event: WorldEvent
  impactLevel: 'minor' | 'moderate' | 'major'
  affectedCharacters: string[]
  economicEffects?: Record<string, number>
  socialEffects?: Record<string, number>
  environmentalEffects?: Record<string, unknown>
  description: string // For backwards compatibility
  impact: 'minor' | 'moderate' | 'major' // For backwards compatibility
  type: WorldEvent['type'] // For backwards compatibility
}

/**
 * Service for tracking and integrating world context into dialogue generation
 */
export class WorldContextService {
  private worldEventCache: Map<string, { events: WorldEvent[]; lastUpdate: number }> = new Map()
  private locationContext: Map<string, WorldContext> = new Map()
  private npcStates: Map<string, NPCDialogueState> = new Map()

  // Memory management constants
  private readonly MAX_WORLD_EVENTS = 1000
  private readonly MAX_LOCATIONS = 100
  private readonly MAX_NPC_STATES = 500
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

  // Start periodic cleanup
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Perform cleanup of expired cache entries and enforce size limits
   */
  private performCleanup(): void {
    const now = Date.now()

    // Clean up world event cache
    this.cleanupWorldEventCache(this.worldEventCache, this.MAX_WORLD_EVENTS, now)

    // Clean up location context
    this.cleanupWorldContextMap(this.locationContext, this.MAX_LOCATIONS, now)

    // Clean up NPC states
    this.cleanupNPCStateMap(this.npcStates, this.MAX_NPC_STATES, now)
  }

  /**
   * Clean up WorldContext map
   */
  private cleanupWorldContextMap(map: Map<string, WorldContext>, maxSize: number, now: number): void {
    const entriesToDelete: string[] = []

    // Find expired entries based on last event timestamp
    for (const [key, context] of map.entries()) {
      const hasRecentEvents = context.recentEvents.some(event =>
        now - new Date(event.timestamp).getTime() < this.CACHE_TTL
      )

      if (!hasRecentEvents) {
        entriesToDelete.push(key)
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => map.delete(key))

    // Enforce size limit (LRU-style removal)
    if (map.size > maxSize) {
      const entriesToRemove = Array.from(map.keys()).slice(0, map.size - maxSize)
      entriesToRemove.forEach(key => map.delete(key))
    }
  }

  /**
   * Clean up NPCDialogueState map
   */
  private cleanupNPCStateMap(map: Map<string, NPCDialogueState>, maxSize: number, now: number): void {
    const entriesToDelete: string[] = []

    // Find expired entries based on last interaction
    for (const [key, state] of map.entries()) {
      const hasRecentInteractions = state.recentInteractions.some(interaction =>
        now - interaction.timestamp < this.CACHE_TTL
      )

      if (!hasRecentInteractions) {
        entriesToDelete.push(key)
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => map.delete(key))

    // Enforce size limit (LRU-style removal)
    if (map.size > maxSize) {
      const entriesToRemove = Array.from(map.keys()).slice(0, map.size - maxSize)
      entriesToRemove.forEach(key => map.delete(key))
    }
  }

  /**
   * Generic cleanup method for simple Maps
   */
  private cleanupSimpleMap<T extends { timestamp?: number; resetTime?: number; lastCleanup?: number }>(
    map: Map<string, T>,
    maxSize: number,
    now: number
  ): void {
    const entriesToDelete: string[] = []

    // Find expired entries
    for (const [key, value] of map.entries()) {
      const timestamp = (value as any).timestamp || (value as any).resetTime || (value as any).lastCleanup
      if (timestamp && now - timestamp > this.CACHE_TTL) {
        entriesToDelete.push(key)
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => map.delete(key))

    // Enforce size limit (LRU-style removal)
    if (map.size > maxSize) {
      const entriesToRemove = Array.from(map.keys()).slice(0, map.size - maxSize)
      entriesToRemove.forEach(key => map.delete(key))
    }
  }

  /**
   * Cleanup method for world event cache
   */
  private cleanupWorldEventCache(
    map: Map<string, { events: WorldEvent[]; lastUpdate: number }>,
    maxSize: number,
    now: number
  ): void {
    const entriesToDelete: string[] = []

    // Find expired entries
    for (const [key, value] of map.entries()) {
      if (now - value.lastUpdate > this.CACHE_TTL) {
        entriesToDelete.push(key)
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => map.delete(key))

    // Prevent memory bloat
    if (map.size > maxSize) {
      const entriesToRemove = Array.from(map.keys()).slice(0, map.size - maxSize)
      entriesToRemove.forEach(key => map.delete(key))
    }
  }

  /**
   * Cleanup method for graceful shutdown
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }

  /**
   * Track recent world changes relevant to NPCs
   * AC3: Characters mention other characters and world events they've experienced
   * AC5: Characters have unique things to say based on recent world changes
   */
  async trackWorldEvents(
    location: string,
    characterId: string,
    newEvents: Array<{
      id: string
      description: string
      impact: 'minor' | 'moderate' | 'major'
      timestamp: number
      involvedCharacters: string[]
      type: 'combat' | 'social' | 'environmental' | 'political'
    }>
  ): Promise<void> {
    const worldContext = await this.getWorldContext(location)

    // Convert events to WorldEvent format and filter relevant ones
    const relevantEvents: WorldEvent[] = []
    for (const event of newEvents) {
      // Convert impact type
      const impact = event.impact === 'major' ? 'major' as const :
                     event.impact === 'moderate' ? 'moderate' as const :
                     'minor' as const

      // Convert type - filter out 'political' as it's not in WorldEvent
      const eventType = event.type === 'political' ? 'social' as const :
                        event.type === 'combat' ? 'combat' as const :
                        event.type === 'social' ? 'social' as const :
                        event.type === 'environmental' ? 'environmental' as const :
                        'economic' as const

      const worldEvent: WorldEvent = {
        id: event.id,
        description: event.description,
        type: eventType,
        timestamp: new Date(event.timestamp).toISOString(),
        participants: event.involvedCharacters,
        location,
        impact,
        status: 'completed'
      }

      if (event.involvedCharacters.includes(characterId) ||
          event.impact === 'major' ||
          this.isEventRelevantToCharacter(worldEvent, characterId)) {
        relevantEvents.push(worldEvent)
      }
    }

    // Add to recent events
    worldContext.recentEvents.push(...relevantEvents)

    // Sort by timestamp and keep only recent events (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const oneDayAgoISO = new Date(oneDayAgo).toISOString()
    worldContext.recentEvents = worldContext.recentEvents
      .filter(event => new Date(event.timestamp).getTime() > oneDayAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Update location context
    this.locationContext.set(location, worldContext)
  }

  /**
   * Implement character-to-character relationship awareness in dialogue
   * AC3: Characters mention other characters and world events they've experienced
   */
  async getCharacterRelationshipContext(
    characterId: string,
    targetCharacterId: string
  ): Promise<{
    relationshipStatus: 'stranger' | 'acquaintance' | 'friend' | 'rival' | 'enemy'
    sharedMemories: string[]
    recentInteractions: Array<{
      timestamp: number
      type: 'positive' | 'negative' | 'neutral'
      description: string
    }>
    dialogueSuggestions: string[]
  }> {
    // This would integrate with existing CharacterService from Story 4.1
    // Placeholder implementation for now
    return {
      relationshipStatus: 'acquaintance',
      sharedMemories: ['Met at the village square'],
      recentInteractions: [{
        timestamp: Date.now() - 3600000,
        type: 'neutral',
        description: 'Brief conversation'
      }],
      dialogueSuggestions: ['Ask about recent activities', 'Mention shared location']
    }
  }

  /**
   * Add world event referencing based on NPC proximity and involvement
   */
  async generateWorldEventReferences(
    characterId: string,
    location: string,
    personality: Personality,
    conversationTopic?: string
  ): Promise<Array<{
    eventId: string
    description: string
    relevanceScore: number
    emotionalTone: 'positive' | 'negative' | 'neutral'
    suggestedPhrasing: string
  }>> {
    const worldContext = await this.getWorldContext(location)
    const npcState = await this.getNPCState(characterId)

    // Filter events based on character personality and involvement
    const relevantEvents = worldContext.recentEvents
      .filter(event => this.shouldCharacterMentionEvent(event, characterId, personality))
      .map(event => ({
        eventId: event.id,
        description: event.description,
        relevanceScore: this.calculateEventRelevance(event, characterId, conversationTopic),
        emotionalTone: this.determineEventEmotionalTone(event, npcState),
        suggestedPhrasing: this.generateEventPhrasing(event, personality)
      }))
      .filter(reference => reference.relevanceScore > 0.3) // Only include moderately relevant events
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3) // Top 3 most relevant events

    return relevantEvents
  }

  /**
   * Create unique dialogue responses for major world changes
   * AC5: Unique things to say based on recent world changes
   */
  async createWorldChangeResponses(
    characterId: string,
    worldChangeId: string
  ): Promise<{
      immediateResponse: string
      followUpQuestions: string[]
      emotionalReaction: 'excited' | 'concerned' | 'curious' | 'indifferent' | 'worried'
      longTermImpact: string[]
  }> {
    const worldChange = await this.getWorldChange(worldChangeId)
    const character = await this.getCharacter(characterId)
    const npcState = await this.getNPCState(characterId)

    // Generate immediate response based on character personality and impact
    const immediateResponse = this.generateImmediateResponse(worldChange, character, npcState)
    const emotionalReaction = this.determineEmotionalReaction(worldChange, character.personality)
    const followUpQuestions = this.generateFollowUpQuestions(worldChange, character.personality)
    const longTermImpact = this.analyzeLongTermImpact(worldChange, characterId)

    return {
      immediateResponse,
      followUpQuestions,
      emotionalReaction,
      longTermImpact
    }
  }

  /**
   * Update NPC dialogue state based on new information
   */
  async updateNPCDialogueState(
    characterId: string,
    playerId: string,
    interaction: {
      dialogue: string
      emotionalImpact: number // -1 to 1 scale
      topics: string[]
      timestamp: number
    }
  ): Promise<NPCDialogueState> {
    const npcState = await this.getNPCState(characterId)

    // Add to recent interactions
    npcState.recentInteractions.push({
      playerId,
      timestamp: interaction.timestamp,
      emotionalImpact: this.convertToEmotionalImpact(interaction.emotionalImpact),
      topics: interaction.topics
    })

    // Clean old interactions (keep last 50)
    npcState.recentInteractions = npcState.recentInteractions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)

    // Update engagement level based on interaction quality
    npcState.engagementLevel = this.calculateEngagementLevel(npcState)

    // Update available topics based on conversation
    this.updateAvailableTopics(npcState, interaction.topics)

    // Update conversation depth
    npcState.conversationDepth = Math.min(npcState.conversationDepth + 0.1, 1.0)

    this.npcStates.set(characterId, npcState)
    return npcState
  }

  // Private helper methods

  private async getWorldContext(location: string): Promise<WorldContext> {
    if (this.locationContext.has(location)) {
      return this.locationContext.get(location)!
    }

    // Create new world context for location
    const context: WorldContext = {
      location,
      timeOfDay: this.getCurrentTimeOfDay(),
      weather: this.getCurrentWeather(location),
      recentEvents: [],
      nearbyCharacters: await this.getNearbyCharacters(location)
    }

    this.locationContext.set(location, context)
    return context
  }

  private async getNPCState(characterId: string): Promise<NPCDialogueState> {
    if (this.npcStates.has(characterId)) {
      return this.npcStates.get(characterId)!
    }

    const character = await this.getCharacter(characterId)
    const state: NPCDialogueState = {
      currentMood: character.currentMood || 0, // Neutral
      recentInteractions: [],
      availableTopics: this.generateInitialTopics(character.personality),
      conversationDepth: 0,
      engagementLevel: 0.5 // Default medium engagement
    }

    this.npcStates.set(characterId, state)
    return state
  }

  private isEventRelevantToCharacter(event: WorldEvent, characterId: string): boolean {
    // Logic to determine if an event is relevant to a character
    // Based on location proximity, character interests, personality traits, etc.
    return true // Placeholder
  }

  private shouldCharacterMentionEvent(event: WorldEvent, characterId: string, personality: Personality): boolean {
    switch (personality) {
      case Personality.CURIOUS:
        return event.type === 'environmental' || event.type === 'economic'
      case Personality.AGGRESSIVE:
        return event.type === 'combat' || event.impact === 'major'
      case Personality.FRIENDLY:
        return event.type === 'social' || event.participants.includes(characterId)
      case Personality.WISE:
        return event.impact === 'major' || event.type === 'economic'
      default:
        return event.impact === 'major'
    }
  }

  private calculateEventRelevance(event: WorldEvent, characterId: string, conversationTopic?: string): number {
    let relevance = 0

    // Base relevance from impact
    const impactScores = {
      minor: 0.3,
      moderate: 0.6,
      major: 1.0,
      critical: 1.0
    }
    relevance += impactScores[event.impact] || 0

    // Boost relevance if character was involved
    if (event.participants.includes(characterId)) {
      relevance += 0.4
    }

    // Boost relevance if related to conversation topic
    if (conversationTopic && event.description.toLowerCase().includes(conversationTopic.toLowerCase())) {
      relevance += 0.3
    }

    // Time decay - recent events are more relevant
    const hoursAgo = (Date.now() - new Date(event.timestamp).getTime()) / (1000 * 60 * 60)
    relevance *= Math.max(0.1, 1 - (hoursAgo / 24)) // Decay over 24 hours

    return Math.min(relevance, 1.0)
  }

  private determineEventEmotionalTone(event: WorldEvent, npcState: NPCDialogueState): 'positive' | 'negative' | 'neutral' {
    if (event.type === 'combat' && event.impact === 'major') return 'negative'
    if (event.type === 'social' && npcState.currentMood > 0) return 'positive'
    return 'neutral'
  }

  private generateEventPhrasing(event: WorldEvent, personality: Personality): string {
    const personalityPhrasing = {
      [Personality.FRIENDLY]: `Have you heard about ${event.description}?`,
      [Personality.CAUTIOUS]: `There's been some talk about ${event.description}...`,
      [Personality.CURIOUS]: `Isn't it interesting that ${event.description}?`,
      [Personality.WISE]: `The recent events involving ${event.description} are quite noteworthy.`,
      [Personality.AGGRESSIVE]: `That whole situation with ${event.description} was intense.`,
      [Personality.MISCHIEVOUS]: `Heard the crazy story about ${event.description}?`,
      [Personality.LOYAL]: `Our community handled ${event.description} well.`,
      [Personality.GUARDED]: `There were developments regarding ${event.description}.`
    }

    return personalityPhrasing[personality] || `There was an event: ${event.description}`
  }

  private generateImmediateResponse(worldChange: WorldChange, character: Character, npcState: NPCDialogueState): string {
    const personalityResponses = {
      [Personality.FRIENDLY]: `That's wonderful news about ${worldChange.description}!`,
      [Personality.CAUTIOUS]: `We should be careful about how we respond to ${worldChange.description}.`,
      [Personality.CURIOUS]: `I'm very curious to learn more about ${worldChange.description}!`,
      [Personality.WISE]: `This development with ${worldChange.description} will have lasting consequences.`,
      [Personality.AGGRESSIVE]: `We need to deal with ${worldChange.description} decisively!`,
      [Personality.MISCHIEVOUS]: `This situation with ${worldChange.description} could be interesting...`,
      [Personality.LOYAL]: `I'll do whatever I can to help with ${worldChange.description}.`,
      [Personality.GUARDED]: `We should monitor ${worldChange.description} carefully.`
    }

    return personalityResponses[character.personality] || `I see there's been a development: ${worldChange.description}`
  }

  private determineEmotionalReaction(worldChange: WorldChange, personality: Personality): 'excited' | 'concerned' | 'curious' | 'indifferent' | 'worried' {
    const reactionMap: Record<Personality, 'excited' | 'concerned' | 'curious' | 'indifferent' | 'worried'> = {
      [Personality.FRIENDLY]: worldChange.impact === 'major' ? 'excited' : 'concerned',
      [Personality.CAUTIOUS]: 'concerned',
      [Personality.CURIOUS]: 'curious',
      [Personality.WISE]: 'concerned',
      [Personality.AGGRESSIVE]: worldChange.type === 'combat' ? 'excited' : 'worried',
      [Personality.MISCHIEVOUS]: 'curious',
      [Personality.LOYAL]: 'concerned',
      [Personality.GUARDED]: 'concerned'
    }

    return reactionMap[personality] || 'indifferent'
  }

  private generateFollowUpQuestions(worldChange: WorldChange, personality: Personality): string[] {
    const baseQuestions = [
      'How will this affect us?',
      'What should we do next?',
      'Who else is involved?'
    ]

    const personalityQuestions = {
      [Personality.CURIOUS]: [
        'What are the details?',
        'How did this happen?',
        'What can we learn from this?'
      ],
      [Personality.WISE]: [
        'What are the long-term implications?',
        'How does this fit into the bigger picture?',
        'What wisdom can we gain?'
      ]
    }

    return [...baseQuestions, ...(personalityQuestions[personality] || [])]
  }

  private analyzeLongTermImpact(worldChange: WorldChange, characterId: string): string[] {
    return [
      'This may change how we interact with others',
      'Our daily routines might be affected',
      'New opportunities or challenges may arise'
    ]
  }

  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    if (hour < 21) return 'evening'
    return 'night'
  }

  private getCurrentWeather(location: string): string {
    // This would integrate with world state system
    return 'clear' // Placeholder
  }

  private async getNearbyCharacters(location: string): Promise<string[]> {
    // This would query the world state for characters in the location
    return [] // Placeholder
  }

  private generateInitialTopics(personality: Personality): string[] {
    const personalityTopics = {
      [Personality.CURIOUS]: ['local events', 'recent discoveries', 'interesting people'],
      [Personality.FRIENDLY]: ['community activities', 'helping others', 'social gatherings'],
      [Personality.WISE]: ['long-term plans', 'wisdom', 'life experiences'],
      [Personality.AGGRESSIVE]: ['challenges', 'competition', 'strength'],
      [Personality.CAUTIOUS]: ['safety', 'planning', 'careful approaches'],
      [Personality.MISCHIEVOUS]: ['fun activities', 'jokes', 'playful situations'],
      [Personality.LOYAL]: ['friendship', 'trust', 'community'],
      [Personality.GUARDED]: ['privacy', 'security', 'careful decisions']
    }

    return personalityTopics[personality] || ['general conversation']
  }

  private convertToEmotionalImpact(impact: number): EmotionalImpact {
    if (impact > 0.5) return EmotionalImpact.VERY_POSITIVE
    if (impact > 0) return EmotionalImpact.POSITIVE
    if (impact < -0.5) return EmotionalImpact.VERY_NEGATIVE
    if (impact < 0) return EmotionalImpact.NEGATIVE
    return EmotionalImpact.NEUTRAL
  }

  private calculateEngagementLevel(npcState: NPCDialogueState): number {
    if (npcState.recentInteractions.length === 0) return 0.5

    const recentInteractions = npcState.recentInteractions.slice(0, 10)
    const avgEmotionalImpact = recentInteractions.reduce((sum, interaction) => {
      const impactValue = interaction.emotionalImpact === 2 ? 1 :
                          interaction.emotionalImpact === 1 ? 0.5 :
                          interaction.emotionalImpact === -1 ? -0.5 :
                          interaction.emotionalImpact === -2 ? -1 : 0
      return sum + impactValue
    }, 0) / recentInteractions.length

    return Math.max(0, Math.min(1, 0.5 + avgEmotionalImpact * 0.5))
  }

  private updateAvailableTopics(npcState: NPCDialogueState, newTopics: string[]): void {
    newTopics.forEach(topic => {
      if (!npcState.availableTopics.includes(topic)) {
        npcState.availableTopics.push(topic)
      }
    })

    // Keep only top 20 topics
    npcState.availableTopics = npcState.availableTopics.slice(0, 20)
  }

  private async getCharacter(characterId: string): Promise<Character> {
    // This would integrate with existing CharacterService from Story 4.1
    return {
      id: characterId,
      name: 'Sample NPC',
      type: 'npc',
      personality: Personality.FRIENDLY,
      memories: [],
      relationships: {},
      currentLocation: 'village',
      description: 'A sample character',
      backstory: 'Sample backstory',
      appearance: { physicalDescription: 'Sample appearance' },
      memoryStats: { totalMemories: 0, activeMemories: 0, archivedMemories: 0, lastMemoryUpdate: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  }

  private async getWorldChange(worldChangeId: string): Promise<any> {
    // This would query the world state system
    return {
      id: worldChangeId,
      description: 'A major world event occurred',
      impact: 'major',
      type: 'environmental'
    }
  }

  /**
   * Track dialogue history for continuity analysis
   */
  async trackDialogueHistory(
    characterId: string,
    playerId: string,
    dialogue: {
      dialogue: string
      emotionalTone: 'friendly' | 'hostile' | 'neutral'
      topics: string[]
    }
  ): Promise<{
    previousTopics: string[]
    suggestedContinuations: string[]
    continuityScore: number
    conversationFlow: 'natural' | 'forced' | 'disjointed'
  }> {
    const npcState = await this.getNPCState(characterId)

    // Extract topics from dialogue
    const topics = dialogue.topics || []

    // Update available topics
    this.updateAvailableTopics(npcState, topics)

    // Calculate continuity score
    const continuityScore = this.calculateContinuityScore(npcState, topics)

    return {
      previousTopics: npcState.availableTopics.slice(-5), // Last 5 topics
      suggestedContinuations: this.generateContinuationSuggestions(topics),
      continuityScore,
      conversationFlow: continuityScore > 0.7 ? 'natural' : continuityScore > 0.4 ? 'forced' : 'disjointed'
    }
  }

  private calculateContinuityScore(npcState: NPCDialogueState, newTopics: string[]): number {
    // Simple continuity calculation based on topic overlap
    const overlap = newTopics.filter(topic =>
      npcState.availableTopics.includes(topic)
    ).length

    return Math.min(overlap / Math.max(newTopics.length, 1), 1.0)
  }

  private generateContinuationSuggestions(topics: string[]): string[] {
    // Generate natural continuations based on current topics
    return topics.map(topic => `Tell me more about ${topic}`)
  }

  /**
   * Test helper method to access NPC state for testing
   * This should only be used in test environments
   */
  async getNPCStateForTesting(characterId: string): Promise<NPCDialogueState> {
    return this.getNPCState(characterId)
  }
}