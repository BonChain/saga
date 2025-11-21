/**
 * Dialogue Cache Service - Story 4.2: Dynamic Dialogue Generation
 *
 * Implements dialogue caching for frequently repeated conversations,
 * personality template pre-compilation, and performance monitoring.
 */

import { DialogueRequest, DialogueResponse, DialogueCacheEntry } from '../types/dialogue'
import { Personality } from '../models/character'

/**
 * Cache service for dialogue generation optimization
 */
export class DialogueCacheService {
  private cache: Map<string, DialogueCacheEntry> = new Map()
  private personalityTemplates: Map<Personality, string[]> = new Map()
  private performanceMetrics: {
    hits: number
    misses: number
    totalRequests: number
    averageResponseTime: number
  } = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    averageResponseTime: 0
  }

  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly MAX_CACHE_SIZE = 1000
  private readonly PRECOMPILED_TEMPLATES_COUNT = 20

  /**
   * Implement dialogue caching for frequently repeated conversations
   */
  async get(request: DialogueRequest): Promise<DialogueResponse | null> {
    const key = this.generateCacheKey(request)
    const entry = this.cache.get(key)

    if (!entry) {
      this.performanceMetrics.misses++
      return null
    }

    // Check if cache entry is still valid
    const now = Date.now()
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      this.performanceMetrics.misses++
      return null
    }

    // Update access statistics
    entry.lastAccessed = now
    entry.hitCount++
    this.performanceMetrics.hits++

    return { ...entry.response }
  }

  /**
   * Set dialogue in cache
   */
  async set(request: DialogueRequest, response: DialogueResponse): Promise<void> {
    const key = this.generateCacheKey(request)
    const now = Date.now()

    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupOldEntries()
    }

    const entry: DialogueCacheEntry = {
      key,
      response,
      timestamp: now,
      hitCount: 0,
      lastAccessed: now
    }

    this.cache.set(key, entry)
  }

  /**
   * Add personality template pre-compilation for faster response times
   */
  precompilePersonalityTemplates(personality: Personality): void {
    if (this.personalityTemplates.has(personality)) {
      return // Already precompiled
    }

    const templates = this.generatePersonalityTemplates(personality)
    this.personalityTemplates.set(personality, templates)

    console.log(`Precompiled ${templates.length} templates for ${personality} personality`)
  }

  /**
   * Get precompiled personality template
   */
  getPrecompiledTemplate(personality: Personality, contextType: string): string | null {
    const templates = this.personalityTemplates.get(personality)
    if (!templates) {
      return null
    }

    // Simple template selection based on context type
    const matchingTemplates = templates.filter(template =>
      template.includes(contextType.toLowerCase())
    )

    return matchingTemplates.length > 0 ? matchingTemplates[0] : templates[0] || null
  }

  /**
   * Create batch dialogue generation for multiple NPC responses
   */
  async batchGenerate(
    requests: DialogueRequest[],
    batchGenerationCallback: (request: DialogueRequest) => Promise<DialogueResponse>
  ): Promise<DialogueResponse[]> {
    // Check cache for all requests first
    const cachedResponses: DialogueResponse[] = []
    const uncachedRequests: DialogueRequest[] = []

    for (const request of requests) {
      const cached = await this.get(request)
      if (cached) {
        cachedResponses.push(cached)
      } else {
        uncachedRequests.push(request)
      }
    }

    // Generate responses for uncached requests in parallel
    if (uncachedRequests.length > 0) {
      const batchSize = 5 // Process in batches to avoid overwhelming the AI service
      const batches: DialogueRequest[][] = []

      for (let i = 0; i < uncachedRequests.length; i += batchSize) {
        batches.push(uncachedRequests.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const batchPromises = batch.map(request => batchGenerationCallback(request))
        const batchResults = await Promise.all(batchPromises)

        // Cache the newly generated responses
        for (let i = 0; i < batch.length; i++) {
          await this.set(batch[i], batchResults[i])
        }

        cachedResponses.push(...batchResults)
      }
    }

    return cachedResponses
  }

  /**
   * Add dialogue performance monitoring and optimization
   */
  recordPerformanceMetrics(responseTime: number, cacheHit: boolean): void {
    this.performanceMetrics.totalRequests++

    // Update average response time
    const currentAvg = this.performanceMetrics.averageResponseTime
    const newAvg = (currentAvg * (this.performanceMetrics.totalRequests - 1) + responseTime) / this.performanceMetrics.totalRequests
    this.performanceMetrics.averageResponseTime = newAvg

    // Log performance metrics periodically
    if (this.performanceMetrics.totalRequests % 100 === 0) {
      console.log('Dialogue Cache Performance:', {
        totalRequests: this.performanceMetrics.totalRequests,
        hitRate: this.getHitRate(),
        averageResponseTime: `${this.performanceMetrics.averageResponseTime.toFixed(2)}ms`,
        cacheSize: this.cache.size
      })
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    averageResponseTime: number
    totalRequests: number
    memoryUsage: number
  } {
    return {
      size: this.cache.size,
      hitRate: this.getHitRate(),
      averageResponseTime: this.performanceMetrics.averageResponseTime,
      totalRequests: this.performanceMetrics.totalRequests,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * Clear cache (for testing or maintenance)
   */
  clearCache(): void {
    this.cache.clear()
    this.performanceMetrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageResponseTime: 0
    }
  }

  /**
   * Warm up cache with common dialogue scenarios
   */
  async warmupCache(characterIds: string[], personalities: Personality[]): Promise<void> {
    console.log('Warming up dialogue cache...')

    // Precompile templates for all personalities
    personalities.forEach(personality => {
      this.precompilePersonalityTemplates(personality)
    })

    // Generate common dialogue scenarios
    const commonScenarios = [
      { context: 'Hello', emotionalContext: 'neutral' },
      { context: 'How are you?', emotionalContext: 'positive' },
      { context: 'Goodbye', emotionalContext: 'neutral' },
      { context: 'Thank you', emotionalContext: 'positive' }
    ]

    for (const characterId of characterIds.slice(0, 5)) { // Limit to 5 characters
      for (const personality of personalities.slice(0, 3)) { // Limit to 3 personalities
        for (const scenario of commonScenarios) {
          const request: DialogueRequest = {
            characterId,
            playerId: 'warmup_player',
            context: scenario.context,
            emotionalContext: scenario.emotionalContext as any
          }

          // Generate and cache the response
          try {
            // This would use the actual dialogue generation service
            const response = await this.generateWarmupResponse(request, personality)
            await this.set(request, response)
          } catch (error) {
            console.warn(`Failed to generate warmup response: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    }

    console.log('Dialogue cache warmed up successfully')
  }

  // Private helper methods

  private generateCacheKey(request: DialogueRequest): string {
    const keyComponents = [
      request.characterId,
      request.playerId,
      request.context.toLowerCase(),
      request.conversationTopic?.toLowerCase() || '',
      request.dialogueType || 'response',
      request.emotionalContext || 'neutral'
    ]

    return keyComponents.join('|')
  }

  private cleanupOldEntries(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())

    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    // Remove oldest 20% of entries
    const removeCount = Math.floor(entries.length * 0.2)
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  private generatePersonalityTemplates(personality: Personality): string[] {
    const baseTemplates = {
      [Personality.FRIENDLY]: [
        'Hello friend! How are you doing today?',
        'That\'s wonderful! I\'m so glad to see you.',
        'I\'d be happy to help you with that!',
        'Thank you for being so kind to me.'
      ],
      [Personality.AGGRESSIVE]: [
        'What do you want? Make it quick.',
        'Get to the point. I don\'t have time for games.',
        'Face the consequences of your actions.',
        'This ends now.'
      ],
      [Personality.CAUTIOUS]: [
        'Let me think about this carefully.',
        'We should consider all the possibilities first.',
        'I\'m not sure that\'s a good idea.',
        'Perhaps we should proceed slowly.'
      ],
      [Personality.CURIOUS]: [
        'That\'s fascinating! Tell me more about it.',
        'I\'ve never seen anything like that before.',
        'I wonder how that works exactly?',
        'What happens if we try something different?'
      ],
      [Personality.WISE]: [
        'In my experience, patience is a virtue.',
        'Wisdom comes from careful consideration.',
        'Let me share what I\'ve learned over the years.',
        'There\'s a lesson in every experience.'
      ],
      [Personality.MISCHIEVOUS]: [
        'I have a fun idea if you\'re interested!',
        'Want to hear something clever?',
        'Watch this! It\'s going to be good.',
        'Let\'s play a little game, shall we?'
      ],
      [Personality.LOYAL]: [
        'I\'ll always be there for you.',
        'We stand together, no matter what.',
        'Trust is the foundation of true friendship.',
        'I\'ve got your back, always.'
      ],
      [Personality.GUARDED]: [
        'That\'s private information.',
        'I don\'t discuss such matters.',
        'We should be careful with what we share.',
        'Some things are better left unsaid.'
      ]
    }

    return baseTemplates[personality] || ['Hello.']
  }

  private getHitRate(): number {
    const total = this.performanceMetrics.hits + this.performanceMetrics.misses
    return total > 0 ? this.performanceMetrics.hits / total : 0
  }

  private estimateMemoryUsage(): number {
    // Rough estimation: each cache entry ~500 bytes
    return this.cache.size * 500
  }

  private async generateWarmupResponse(request: DialogueRequest, personality: Personality): Promise<DialogueResponse> {
    const templates = this.generatePersonalityTemplates(personality)
    const template = templates[Math.floor(Math.random() * templates.length)]

    return {
      dialogue: template,
      emotionalTone: this.getDefaultEmotionalTone(personality),
      referencedMemories: [],
      worldEvents: [],
      personalityScore: 0.9,
      generationTime: 50,
      characterId: request.characterId,
      playerId: request.playerId
    }
  }

  private getDefaultEmotionalTone(personality: Personality): 'friendly' | 'hostile' | 'neutral' {
    switch (personality) {
      case Personality.FRIENDLY:
      case Personality.CURIOUS:
      case Personality.WISE:
      case Personality.LOYAL:
      case Personality.MISCHIEVOUS:
        return 'friendly'
      case Personality.AGGRESSIVE:
        return 'hostile'
      default:
        return 'neutral'
    }
  }
}