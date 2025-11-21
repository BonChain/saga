/**
 * Memory Analyzer Service - Story 4.2: Dynamic Dialogue Generation
 *
 * Analyzes character memories to extract relevant context for dialogue generation.
 * Leverages existing MemoryEntry and Character models from Story 4.1.
 */

import {
  MemoryEntry,
  Character,
  EmotionalImpact,
  RelationshipScores
} from '../models/character'
import { ConversationTopic } from '../types/dialogue'

/**
 * Service for analyzing character memories and extracting dialogue context
 */
export class MemoryAnalyzer {
  /**
   * Extract relevant memories for dialogue context
   * AC1: References specific shared experiences and history
   * AC6: Build genuine connections through repeated interactions
   */
  async extractRelevantMemories(
    characterId: string,
    playerId: string,
    conversationTopic?: string,
    limit: number = 5
  ): Promise<MemoryEntry[]> {
    // This would integrate with existing CharacterService from Story 4.1
    const allMemories = await this.getCharacterMemories(characterId)

    // Filter memories relevant to this player and conversation
    const relevantMemories = allMemories
      .filter(memory => memory.playerId === playerId)
      .filter(memory => this.isMemoryRelevant(memory, conversationTopic))
      .sort((a, b) => this.calculateMemoryRelevanceScore(b, conversationTopic) -
                        this.calculateMemoryRelevanceScore(a, conversationTopic))
      .slice(0, limit)

    return relevantMemories
  }

  /**
   * Suggest conversation topics based on shared experiences
   */
  async suggestConversationTopics(
    characterId: string,
    playerId: string
  ): Promise<ConversationTopic[]> {
    const memories = await this.extractRelevantMemories(characterId, playerId)
    const topics: ConversationTopic[] = []

    // Group memories by location, action type, and emotional impact
    const locationGroups = this.groupMemoriesBy(memories, 'location')
    const actionGroups = this.groupMemoriesBy(memories, 'actionType')
    const emotionalGroups = this.groupMemoriesBy(memories, 'emotionalImpact')

    // Generate topic suggestions from memory patterns
    topics.push(...this.generateTopicsFromLocations(locationGroups))
    topics.push(...this.generateTopicsFromActions(actionGroups))
    topics.push(...this.generateTopicsFromEmotions(emotionalGroups))

    return topics
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8) // Return top 8 suggestions
  }

  /**
   * Track dialogue continuity for repeated interactions
   */
  async trackDialogueContinuity(
    characterId: string,
    playerId: string,
    newDialogue: string
  ): Promise<{
    previousTopics: string[]
    suggestedContinuations: string[]
    continuityScore: number
  }> {
    const memories = await this.extractRelevantMemories(characterId, playerId, undefined, 10)
    const previousTopics = this.extractTopicsFromMemories(memories)

    const continuityScore = this.calculateContinuityScore(previousTopics, newDialogue)
    const suggestedContinuations = this.generateContinuationSuggestions(memories, newDialogue)

    return {
      previousTopics,
      suggestedContinuations,
      continuityScore
    }
  }

  /**
   * Create connection building mechanisms through evolving dialogue patterns
   */
  async analyzeConnectionStrength(
    characterId: string,
    playerId: string
  ): Promise<{
    connectionLevel: number
    connectionType: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend'
    sharedExperiences: number
    emotionalDepth: number
    suggestedConnectionActions: string[]
  }> {
    const memories = await this.extractRelevantMemories(characterId, playerId, undefined, 50)
    const sharedExperiences = memories.length

    // Calculate emotional depth based on variety of emotional impacts
    const emotionalVariety = new Set(memories.map(m => m.emotionalImpact)).size
    const emotionalDepth = Math.min(emotionalVariety / 5, 1.0) // Normalize to 0-1

    // Calculate connection level based on shared experiences and emotional depth
    const connectionLevel = Math.min((sharedExperiences * 0.6 + emotionalDepth * 100 * 0.4) / 100, 1.0)

    const connectionType = this.getConnectionType(connectionLevel)
    const suggestedConnectionActions = this.generateConnectionActions(connectionType, memories)

    return {
      connectionLevel,
      connectionType,
      sharedExperiences,
      emotionalDepth,
      suggestedConnectionActions
    }
  }

  // Private helper methods

  private async getCharacterMemories(characterId: string): Promise<MemoryEntry[]> {
    // This would integrate with existing CharacterService from Story 4.1
    // Placeholder implementation for now
    return []
  }

  private isMemoryRelevant(memory: MemoryEntry, conversationTopic?: string): boolean {
    if (!conversationTopic) return true

    const keywords = conversationTopic.toLowerCase().split(/\s+/)
    const memoryText = `${memory.action} ${memory.description} ${memory.location}`.toLowerCase()

    return keywords.some((keyword: string) => memoryText.includes(keyword))
  }

  private calculateMemoryRelevanceScore(memory: MemoryEntry, conversationTopic?: string): number {
    let score = memory.emotionalImpact * 10 // Weight emotional impact
    score += memory.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000 ? 50 : 0 // Recent memories

    if (conversationTopic && this.isMemoryRelevant(memory, conversationTopic)) {
      score += 30 // Topic relevance bonus
    }

    return score
  }

  private groupMemoriesBy(memories: MemoryEntry[], field: keyof MemoryEntry): Record<string, MemoryEntry[]> {
    return memories.reduce((groups, memory) => {
      const key = String(memory[field] || 'unknown')
      if (!groups[key]) groups[key] = []
      groups[key].push(memory)
      return groups
    }, {} as Record<string, MemoryEntry[]>)
  }

  private generateTopicsFromLocations(locationGroups: Record<string, MemoryEntry[]>): ConversationTopic[] {
    return Object.entries(locationGroups).map(([location, memories]) => ({
      topic: `Remember our time at ${location}?`,
      relevanceScore: memories.length * 10,
      emotionalTone: this.getEmotionalToneFromMemories(memories),
      relatedMemories: memories.slice(0, 3)
    }))
  }

  private generateTopicsFromActions(actionGroups: Record<string, MemoryEntry[]>): ConversationTopic[] {
    return Object.entries(actionGroups).map(([actionType, memories]) => ({
      topic: `That time we ${actionType.toLowerCase()}...`,
      relevanceScore: memories.length * 8,
      emotionalTone: this.getEmotionalToneFromMemories(memories),
      relatedMemories: memories.slice(0, 2)
    }))
  }

  private generateTopicsFromEmotions(emotionalGroups: Record<string, MemoryEntry[]>): ConversationTopic[] {
    return Object.entries(emotionalGroups)
      .filter(([emotion]) => parseInt(emotion, 10) > 0) // Only positive emotions
      .map(([emotion, memories]) => ({
        topic: `That memorable experience...`,
        relevanceScore: memories.length * 12,
        emotionalTone: 'friendly',
        relatedMemories: memories.slice(0, 2)
      }))
  }

  private getEmotionalToneFromMemories(memories: MemoryEntry[]): 'friendly' | 'hostile' | 'neutral' {
    const avgEmotionalImpact = memories.reduce((sum, m) => sum + m.emotionalImpact, 0) / memories.length

    if (avgEmotionalImpact > 0.5) return 'friendly'
    if (avgEmotionalImpact < -0.5) return 'hostile'
    return 'neutral'
  }

  private extractTopicsFromMemories(memories: MemoryEntry[]): string[] {
    return memories.map(memory => `${memory.action} at ${memory.location}`)
  }

  private calculateContinuityScore(previousTopics: string[], newDialogue: string): number {
    const newDialogueWords = newDialogue.toLowerCase().split(/\s+/)
    let matches = 0

    previousTopics.forEach(topic => {
      const topicWords = topic.toLowerCase().split(/\s+/)
      const overlap = topicWords.filter(word => newDialogueWords.includes(word)).length
      if (overlap > 0) matches++
    })

    return previousTopics.length > 0 ? matches / previousTopics.length : 0
  }

  private generateContinuationSuggestions(memories: MemoryEntry[], newDialogue: string): string[] {
    const suggestions: string[] = []

    // Suggest following up on recent memories
    const recentMemories = memories.slice(-3)
    recentMemories.forEach(memory => {
      if (memory.emotionalImpact > 0) {
        suggestions.push(`Ask about that time we ${memory.action.toLowerCase()}`)
      }
    })

    // Suggest exploring related topics
    if (newDialogue.toLowerCase().includes('remember')) {
      suggestions.push('Share another related memory')
    }

    return suggestions
  }

  private getConnectionType(connectionLevel: number): 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend' {
    if (connectionLevel > 0.8) return 'best_friend'
    if (connectionLevel > 0.6) return 'close_friend'
    if (connectionLevel > 0.4) return 'friend'
    if (connectionLevel > 0.2) return 'acquaintance'
    return 'stranger'
  }

  private generateConnectionActions(connectionType: string, memories: MemoryEntry[]): string[] {
    const actions: string[] = []

    switch (connectionType) {
      case 'stranger':
        actions.push('Introduce yourself properly', 'Ask about their background')
        break
      case 'acquaintance':
        actions.push('Share a personal story', 'Ask about their interests')
        break
      case 'friend':
        actions.push('Recall a shared positive memory', 'Offer help or support')
        break
      case 'close_friend':
        actions.push('Share something vulnerable', 'Plan future activities together')
        break
      case 'best_friend':
        actions.push('Create new inside jokes', 'Deepen your bond')
        break
    }

    return actions
  }
}