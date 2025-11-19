import { ParsedIntent } from '../types/storage'

/**
 * Intent Parser Service
 *
 * Extracts structured intent from natural language player input
 * Addresses R-002 critical risk (intent parsing accuracy <70%)
 * Implements confidence thresholding and fallback mechanisms
 */

export interface IntentParseResult {
  success: boolean
  parsedIntent?: ParsedIntent
  confidence: number
  error?: string
  fallback?: boolean
}

export interface ActionKeywords {
  combat: string[]
  social: string[]
  exploration: string[]
  economic: string[]
  creative: string[]
  other: string[]
}

export class IntentParser {
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.3 // Lower threshold for better user experience
  private readonly HUMAN_REVIEW_THRESHOLD = 0.1 // <10% requires human review
  private readonly actionKeywords: ActionKeywords

  constructor() {
    this.actionKeywords = {
      combat: [
        'attack', 'fight', 'battle', 'strike', 'hit', 'slay', 'kill', 'defeat',
        'destroy', 'damage', 'harm', 'wound', 'slash', 'stab', 'shoot', 'cast',
        'spell', 'burn', 'crush', 'smash', 'punch', 'kick', 'charge', 'assault'
      ],
      social: [
        'befriend', 'talk', 'speak', 'converse', 'chat', 'greet', 'meet', 'introduce',
        'help', 'assist', 'rescue', 'save', 'protect', 'defend', 'ally', 'join',
        'persuade', 'convince', 'negotiate', 'trade', 'barter', 'agree', 'promise',
        'marry', 'propose', 'love', 'like', 'respect', 'trust', 'follow', 'lead'
      ],
      exploration: [
        'explore', 'search', 'investigate', 'discover', 'find', 'locate', 'scout',
        'travel', 'journey', 'hike', 'climb', 'swim', 'dive', 'fly', 'wander', 'roam',
        'navigate', 'map', 'survey', 'examine', 'inspect', 'study', 'learn', 'research',
        'venture', 'quest', 'adventure', 'seek', 'hunt', 'track', 'follow', 'pursue'
      ],
      economic: [
        'buy', 'purchase', 'sell', 'trade', 'barter', 'acquire', 'obtain', 'get',
        'steal', 'rob', 'loot', 'harvest', 'gather', 'collect', 'mine', 'farm',
        'craft', 'create', 'build', 'make', 'forge', 'construct', 'manufacture',
        'sell', 'market', 'shop', 'store', 'bank', 'invest', 'loan', 'borrow', 'rent'
      ],
      creative: [
        'compose', 'write', 'draw', 'paint', 'sculpt', 'create', 'make', 'build',
        'design', 'invent', 'craft', 'forge', 'construct', 'compose', 'sing',
        'dance', 'perform', 'entertain', 'teach', 'train', 'learn', 'study',
        'record', 'document', 'share', 'storytelling', 'story', 'poem', 'song'
      ],
      other: [
        'wait', 'rest', 'sleep', 'eat', 'drink', 'think', 'remember', 'forget',
        'dream', 'imagine', 'wish', 'hope', 'pray', 'meditate', 'relax', 'play',
        'joke', 'laugh', 'cry', 'celebrate', 'mourn', 'grieve', 'plan', 'decide'
      ]
    }
  }

  /**
   * Parse natural language input into structured intent
   * @param input Player's natural language action
   * @returns Parse result with confidence and structured intent
   */
  public parseIntent(input: string): IntentParseResult {
    // Input validation (SECURITY - R-001)
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        confidence: 0,
        error: 'Invalid input: input must be a non-empty string',
        fallback: true
      }
    }

    const cleanedInput = this.sanitizeInput(input.trim())

    if (!cleanedInput) {
      return {
        success: false,
        confidence: 0,
        error: 'Empty input after sanitization',
        fallback: true
      }
    }

    // Edge case handling: very short input or gibberish
    if (cleanedInput.length < 2) {
      return {
        success: false,
        confidence: 0.1,
        error: 'Input too short for meaningful parsing',
        fallback: true
      }
    }

    // Main parsing logic
    const result = this.extractIntent(cleanedInput)

    // R-002 Mitigation: Confidence thresholding
    if (result.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return {
        success: false,
        confidence: result.confidence,
        error: `Low confidence parsing (${(result.confidence * 100).toFixed(0)}%). Requires clarification or human review.`,
        fallback: result.confidence >= this.HUMAN_REVIEW_THRESHOLD
      }
    }

    return result
  }

  /**
   * Core intent extraction algorithm
   */
  private extractIntent(input: string): IntentParseResult {
    const words = input.toLowerCase().split(/\s+/)
    const originalWords = input.split(/\s+/)

    // Determine action type with confidence
    const { actionType, confidence: actionConfidence } = this.determineActionType(words)

    // Extract target, method, and other components
    const { target, method, urgency, objects, location } = this.extractComponents(
      words,
      originalWords,
      actionType
    )

    // Calculate overall confidence (weighted average)
    const confidence = this.calculateOverallConfidence(
      actionConfidence,
      target ? this.calculateComponentConfidence(target, words) : 0.5,
      method ? this.calculateComponentConfidence(method, words) : 0.5
    )

    const parsedIntent: ParsedIntent = {
      actionType,
      target,
      method,
      urgency: urgency || 'medium',
      objects,
      location
    }

    return {
      success: true,
      parsedIntent,
      confidence
    }
  }

  /**
   * Determine action type from keywords
   */
  private determineActionType(words: string[]): { actionType: ParsedIntent['actionType'], confidence: number } {
    const scores = new Map<ParsedIntent['actionType'], number>()

    // Score each action type based on keyword matches
    Object.entries(this.actionKeywords).forEach(([type, keywords]) => {
      let score = 0
      let keywordCount = 0

      keywords.forEach(keyword => {
        if (words.includes(keyword)) {
          score += 1
          keywordCount++
        }
      })

      // Normalize score by keyword count to avoid bias
      const normalizedScore = keywordCount > 0 ? score / keywords.length : 0
      scores.set(type as ParsedIntent['actionType'], normalizedScore)
    })

    // Find the highest scoring action type
    let maxScore = 0
    let bestType: ParsedIntent['actionType'] = 'other'

    scores.forEach((score, type) => {
      if (score > maxScore) {
        maxScore = score
        bestType = type
      }
    })

    // Convert score to confidence (0.3 to 0.9 range)
    const confidence = Math.max(0.3, Math.min(0.9, 0.3 + (maxScore * 0.6)))

    return { actionType: bestType, confidence }
  }

  /**
   * Extract components like target, method, etc.
   */
  private extractComponents(
    words: string[],
    originalWords: string[],
    actionType: ParsedIntent['actionType']
  ): {
    target?: string
    method?: string
    urgency?: ParsedIntent['urgency']
    objects?: string[]
    location?: string
  } {
    const result: any = {}

    // Extract urgency
    const urgencyKeywords = ['urgent', 'quickly', 'fast', 'now', 'immediately', 'asap']
    const slowKeywords = ['slowly', 'carefully', 'later', 'eventually', 'soon']

    if (words.some(word => urgencyKeywords.includes(word))) {
      result.urgency = 'high'
    } else if (words.some(word => slowKeywords.includes(word))) {
      result.urgency = 'low'
    }

    // Extract target (common patterns for different action types)
    result.target = this.extractTarget(words, originalWords, actionType)

    // Extract method (tools, approaches, etc.)
    result.method = this.extractMethod(words, originalWords, actionType)

    // Extract location (prepositions + place names)
    result.location = this.extractLocation(words, originalWords)

    // Extract objects (items, people, etc.)
    result.objects = this.extractObjects(words, actionType)

    return result
  }

  /**
   * Extract action target based on action type
   */
  private extractTarget(words: string[], originalWords: string[], actionType: ParsedIntent['actionType']): string | undefined {
    const prepositions = ['the', 'a', 'an', 'at', 'to', 'in', 'on', 'with', 'by', 'from']

    // Find first noun/preposition pattern that looks like a target
    for (let i = 1; i < words.length; i++) {
      const prevWord = words[i - 1]
      const currentWord = words[i]
      const nextWord = words[i + 1]

      // Skip prepositions and common words
      if (prepositions.includes(prevWord) || prepositions.includes(currentWord)) {
        continue
      }

      // Look for multi-word targets
      let target = currentWord
      if (nextWord && !prepositions.includes(nextWord) &&
          !this.actionKeywords[actionType].includes(nextWord)) {
        target += ' ' + nextWord
      }

      // Clean up target (remove trailing punctuation)
      target = target.replace(/[.,!?;:]$/, '')

      if (target && target.length > 1) {
        return target
      }
    }

    return undefined
  }

  /**
   * Extract action method (how the action is performed)
   */
  private extractMethod(words: string[], originalWords: string[], actionType: ParsedIntent['actionType']): string | undefined {
    const methodWords = ['with', 'using', 'by', 'through', 'via']

    for (let i = 0; i < words.length - 1; i++) {
      if (methodWords.includes(words[i])) {
        const method = this.extractMultiWordPhrase(words.slice(i + 1), 3)
        if (method) {
          return method
        }
      }
    }

    return undefined
  }

  /**
   * Extract location from input
   */
  private extractLocation(words: string[], originalWords: string[]): string | undefined {
    const locationWords = ['in', 'at', 'to', 'from', 'near', 'by', 'through']
    const locationIndicators = ['forest', 'village', 'town', 'city', 'castle', 'mountain', 'river', 'cave', 'dungeon', 'shop', 'market']

    for (let i = 0; i < words.length - 1; i++) {
      if (locationWords.includes(words[i])) {
        const location = this.extractMultiWordPhrase(words.slice(i + 1), 3)
        if (location && locationIndicators.some(indicator => location.includes(indicator))) {
          return location
        }
      }
    }

    return undefined
  }

  /**
   * Extract objects mentioned in the action
   */
  private extractObjects(words: string[], actionType: ParsedIntent['actionType']): string[] {
    const objects: string[] = []
    const commonObjects = {
      combat: ['sword', 'shield', 'armor', 'spell', 'arrow', 'bow', 'axe', 'hammer', 'weapon'],
      economic: ['gold', 'coins', 'money', 'potion', 'item', 'scroll', 'map', 'gem', 'treasure'],
      social: ['friend', 'family', 'king', 'queen', 'merchant', 'guard', 'villager', 'child']
    }

    const relevantObjects = commonObjects[actionType as keyof typeof commonObjects] || []

    words.forEach(word => {
      const cleanWord = word.replace(/[.,!?;:]/, '')
      if (relevantObjects.includes(cleanWord) && !objects.includes(cleanWord)) {
        objects.push(cleanWord)
      }
    })

    return objects
  }

  /**
   * Extract multi-word phrase up to maxWords
   */
  private extractMultiWordPhrase(words: string[], maxWords: number): string | undefined {
    if (!words.length) return undefined

    let phrase = words[0]
    for (let i = 1; i < Math.min(maxWords, words.length); i++) {
      // Stop at action type keywords or common stop words
      const allActionTypes = Object.values(this.actionKeywords).flat()
      const stopWords = ['the', 'and', 'but', 'or', 'then', 'when', 'where', 'why', 'how']

      if (allActionTypes.includes(words[i]) || stopWords.includes(words[i])) {
        break
      }

      phrase += ' ' + words[i]
    }

    return phrase.replace(/[.,!?;:]/, '')
  }

  /**
   * Calculate overall confidence from component scores
   */
  private calculateOverallConfidence(
    actionConfidence: number,
    targetConfidence: number,
    methodConfidence: number
  ): number {
    // Weight action type most heavily, then target and method equally
    return (actionConfidence * 0.5) +
           (targetConfidence * 0.25) +
           (methodConfidence * 0.25)
  }

  /**
   * Calculate confidence for a specific component
   */
  private calculateComponentConfidence(component: string, words: string[]): number {
    if (!component) return 0

    const componentWords = component.toLowerCase().split(/\s+/)
    let matchScore = 0

    componentWords.forEach(compWord => {
      if (words.includes(compWord)) {
        matchScore += 1
      }
    })

    return Math.min(1, matchScore / componentWords.length)
  }

  /**
   * Sanitize input for security (R-001 mitigation)
   */
  private sanitizeInput(input: string): string {
    // Remove potential injection patterns
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML/JS injection attempts
      .replace(/[;`|\\$]/g, '') // Remove command injection attempts
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
}

// Export singleton instance
export const intentParser = new IntentParser()