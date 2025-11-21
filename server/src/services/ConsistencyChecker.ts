/**
 * Dialogue Consistency Checker Service - Story 4.2: Dynamic Dialogue Generation
 *
 * Validates dialogue against character personality and prevents contradictions.
 * Ensures AI-generated responses maintain character consistency across conversations.
 */

import { Personality, EmotionalImpact } from '../models/character'
import { DialogueValidationResult } from '../types/dialogue'

/**
 * Service for validating dialogue consistency and preventing character violations
 */
interface PersonalityTemplate {
  personality: Personality
  keyTraits: string[]
  dialoguePatterns: string[]
  vocabularyStyle: string[]
  emotionalRange: {
    minTone: 'friendly' | 'neutral' | 'hostile'
    maxTone: 'friendly' | 'neutral' | 'hostile'
  }
  samplePhrases: string[]
}

export class ConsistencyChecker {
  private personalityTemplates: Map<Personality, PersonalityTemplate>
  private contradictionCache: Map<string, boolean> = new Map()

  constructor() {
    this.personalityTemplates = this.initializePersonalityTemplates()
  }

  /**
   * Create ConsistencyChecker service to validate dialogue against character personality
   * AC4: Dialogue stays consistent with established personality
   */
  async validateDialogueConsistency(
    dialogue: string,
    personality: Personality,
    dialogueHistory: string[] = []
  ): Promise<DialogueValidationResult> {
    // Check personality consistency
    const personalityScore = this.calculatePersonalityScore(dialogue, personality)

    // Check for contradictions with dialogue history
    const contradictions = this.findContradictions(dialogue, dialogueHistory)

    // Check emotional tone consistency
    const rawEmotionalTone = this.analyzeEmotionalTone(dialogue)
    const emotionalTone = this.mapToDialogueEmotionalTone(rawEmotionalTone)
    const toneConsistency = this.validateToneConsistency(emotionalTone, personality, dialogueHistory)

    // Generate improvement suggestions
    const suggestions = this.generateImprovementSuggestions(
      dialogue,
      personality,
      personalityScore,
      contradictions,
      toneConsistency
    )

    const isValid = personalityScore >= 0.6 && contradictions.length === 0

    return {
      isValid,
      personalityScore,
      emotionalTone,
      consistencyIssues: [...contradictions, ...(!toneConsistency ? ['Emotional tone inconsistent with personality'] : [])],
      suggestedImprovements: suggestions
    }
  }

  /**
   * Implement personality trait scoring for generated dialogue
   */
  calculatePersonalityScore(dialogue: string, personality: Personality): number {
    const template = this.personalityTemplates.get(personality)
    if (!template) return 0.5

    const dialogueWords = this.normalizeText(dialogue).split(/\s+/)
    let totalScore = 0
    let wordCount = 0

    // Score based on vocabulary choice
    for (const keyword of template.vocabularyStyle) {
      const normalizedKeyword = keyword.toLowerCase()
      const matches = dialogueWords.filter((word: string) => word.includes(normalizedKeyword)).length
      totalScore += matches * 2
      wordCount += 1
    }

    // Score based on dialogue patterns
    template.dialoguePatterns.forEach(pattern => {
      const normalizedPattern = pattern.toLowerCase()
      const patternWords = normalizedPattern.split(/\s+/)
      let patternScore = 0

      for (let i = 0; i < dialogueWords.length - patternWords.length + 1; i++) {
        const window = dialogueWords.slice(i, i + patternWords.length).join(' ')
        if (window.includes(normalizedPattern)) {
          patternScore += 3
        }
      }
      totalScore += patternScore
      wordCount += 1
    })

    // Score based on emotional range
    const rawEmotionalTone = this.analyzeEmotionalTone(dialogue)
    const emotionalTone = this.mapToDialogueEmotionalTone(rawEmotionalTone)
    if (this.isEmotionalToneInRange(emotionalTone, template.emotionalRange)) {
      totalScore += 10
    }
    wordCount += 1

    // Calculate final score
    const baseScore = wordCount > 0 ? totalScore / (wordCount * 10) : 0.5
    return Math.min(1.0, Math.max(0.0, baseScore))
  }

  /**
   * Add dialogue history tracking to prevent contradictions
   */
  async trackDialogueHistory(
    characterId: string,
    dialogue: string,
    emotionalTone: 'positive' | 'negative' | 'neutral',
    topics: string[]
  ): Promise<{
      previousStatements: string[]
      emotionalTrend: 'improving' | 'stable' | 'declining'
      topicConsistency: number
      contradictionRisks: string[]
  }> {
    // This would integrate with existing CharacterService from Story 4.1
    // For now, we'll simulate dialogue history tracking

    const historyKey = `${characterId}_history`
    const previousStatements = this.getDialogueHistory(historyKey)

    // Add new dialogue to history
    previousStatements.push(dialogue)
    this.saveDialogueHistory(historyKey, previousStatements.slice(-20)) // Keep last 20 statements

    // Analyze emotional trend
    const emotionalTrend = this.analyzeEmotionalTrend(characterId, emotionalTone)

    // Check topic consistency
    const topicConsistency = this.calculateTopicConsistency(characterId, topics)

    // Identify potential contradiction risks
    const contradictionRisks = this.identifyContradictionRisks(dialogue, previousStatements)

    return {
      previousStatements,
      emotionalTrend,
      topicConsistency,
      contradictionRisks
    }
  }

  /**
   * Create automatic dialogue correction for personality violations
   */
  async correctPersonalityViolations(
    dialogue: string,
    personality: Personality,
    violations: string[]
  ): Promise<{
      correctedDialogue: string
      changes: string[]
      confidence: number
  }> {
    const template = this.personalityTemplates.get(personality)
    if (!template) {
      return { correctedDialogue: dialogue, changes: [], confidence: 0 }
    }

    let correctedDialogue = dialogue
    const changes: string[] = []

    // Replace inappropriate vocabulary
    const words = correctedDialogue.split(/\s+/)
    const correctedWords = words.map(word => {
      const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '')

      if (this.isWordInappropriateForPersonality(normalizedWord, personality)) {
        const replacement = this.getPersonalityAppropriateReplacement(normalizedWord, personality)
        if (replacement && replacement !== normalizedWord) {
          changes.push(`Replaced "${word}" with "${replacement}"`)
          return replacement
        }
      }
      return word
    })

    correctedDialogue = correctedWords.join(' ')

    // Adjust sentence structure if needed
    if (violations.includes('Sentence structure too complex for personality')) {
      const simplifiedDialogue = this.simplifySentenceStructure(correctedDialogue, personality)
      if (simplifiedDialogue !== correctedDialogue) {
        correctedDialogue = simplifiedDialogue
        changes.push('Simplified sentence structure for personality')
      }
    }

    // Add personality-appropriate emotional indicators
    if (violations.includes('Missing emotional indicators')) {
      const enhancedDialogue = this.addEmotionalIndicators(correctedDialogue, personality)
      if (enhancedDialogue !== correctedDialogue) {
        correctedDialogue = enhancedDialogue
        changes.push('Added personality-appropriate emotional indicators')
      }
    }

    const confidence = this.calculatePersonalityScore(correctedDialogue, personality)

    return {
      correctedDialogue,
      changes,
      confidence
    }
  }

  // Private helper methods

  private initializePersonalityTemplates(): Map<Personality, PersonalityTemplate> {
    const templates = new Map<Personality, PersonalityTemplate>()

    templates.set(Personality.AGGRESSIVE, {
      personality: Personality.AGGRESSIVE,
      keyTraits: ['tough', 'direct', 'confrontational', 'powerful'],
      dialoguePatterns: ['I will', 'We must', 'Attack', 'Destroy', 'Power', 'Strength'],
      vocabularyStyle: ['fight', 'battle', 'strong', 'force', 'attack', 'enemy'],
      emotionalRange: { minTone: 'neutral', maxTone: 'hostile' },
      samplePhrases: ['Get to the point', 'No time for games', 'Face the consequences']
    })

    templates.set(Personality.FRIENDLY, {
      personality: Personality.FRIENDLY,
      keyTraits: ['warm', 'helpful', 'kind', 'welcoming'],
      dialoguePatterns: ['Hello friend', 'How can I help', 'Wonderful', 'Thank you', 'Please'],
      vocabularyStyle: ['friend', 'help', 'kind', 'happy', 'welcome', 'together'],
      emotionalRange: { minTone: 'neutral', maxTone: 'friendly' },
      samplePhrases: ['So good to see you', 'How wonderful!', 'Let me help with that']
    })

    templates.set(Personality.CAUTIOUS, {
      personality: Personality.CAUTIOUS,
      keyTraits: ['careful', 'thoughtful', 'reserved', 'deliberate'],
      dialoguePatterns: ['Perhaps we should', 'Be careful', 'Let me think', 'I\'m not sure'],
      vocabularyStyle: ['careful', 'slow', 'think', 'wait', 'consider', 'plan'],
      emotionalRange: { minTone: 'neutral', maxTone: 'neutral' },
      samplePhrases: ['We should be cautious', 'Let\'s think this through', 'Safety first']
    })

    templates.set(Personality.CURIOUS, {
      personality: Personality.CURIOUS,
      keyTraits: ['inquisitive', 'adventurous', 'exploring', 'learning'],
      dialoguePatterns: ['Tell me more', 'I wonder why', 'Interesting', 'How does that work'],
      vocabularyStyle: ['wonder', 'explore', 'discover', 'learn', 'question', 'interesting'],
      emotionalRange: { minTone: 'neutral', maxTone: 'friendly' },
      samplePhrases: ['That\'s fascinating!', 'I\'ve never seen that before', 'What happens if?']
    })

    templates.set(Personality.WISE, {
      personality: Personality.WISE,
      keyTraits: ['knowledgeable', 'patient', 'thoughtful', 'experienced'],
      dialoguePatterns: ['In my experience', 'Wisdom teaches us', 'Patience is key'],
      vocabularyStyle: ['wisdom', 'experience', 'understand', 'teach', 'learn', 'knowledge'],
      emotionalRange: { minTone: 'neutral', maxTone: 'friendly' },
      samplePhrases: ['Patience is a virtue', 'Experience has taught me', 'Let me share some wisdom']
    })

    templates.set(Personality.MISCHIEVOUS, {
      personality: Personality.MISCHIEVOUS,
      keyTraits: ['playful', 'clever', 'tricky', 'fun'],
      dialoguePatterns: ['Wouldn\'t it be fun if', 'Let\'s play a trick', 'You won\'t believe what happened'],
      vocabularyStyle: ['trick', 'joke', 'play', 'fun', 'surprise', 'clever'],
      emotionalRange: { minTone: 'neutral', maxTone: 'friendly' },
      samplePhrases: ['I have a fun idea', 'Want to hear a joke?', 'Watch this!']
    })

    templates.set(Personality.LOYAL, {
      personality: Personality.LOYAL,
      keyTraits: ['devoted', 'protective', 'faithful', 'honorable'],
      dialoguePatterns: ['I will always', 'We must protect', 'Honor demands', 'Trust is everything'],
      vocabularyStyle: ['loyal', 'protect', 'defend', 'honor', 'promise', 'trust'],
      emotionalRange: { minTone: 'neutral', maxTone: 'friendly' },
      samplePhrases: ['I\'ve got your back', 'We stand together', 'Honor above all']
    })

    templates.set(Personality.GUARDED, {
      personality: Personality.GUARDED,
      keyTraits: ['reserved', 'protective', 'private', 'careful'],
      dialoguePatterns: ['I don\'t discuss', 'That\'s private', 'Be careful with information'],
      vocabularyStyle: ['careful', 'private', 'secret', 'protect', 'defend', 'wary'],
      emotionalRange: { minTone: 'neutral', maxTone: 'neutral' },
      samplePhrases: ['That\'s not something I share', 'We should be careful', 'I need to protect this information']
    })

    return templates
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  private analyzeEmotionalTone(dialogue: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'wonderful', 'happy', 'love', 'friend', 'help', 'kind', 'beautiful', 'amazing']
    const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'sad', 'enemy', 'destroy', 'kill', 'pain', 'fear']
    const dialogueWords = this.normalizeText(dialogue).split(/\s+/)

    let positiveScore = 0
    let negativeScore = 0

    dialogueWords.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++
      if (negativeWords.includes(word)) negativeScore++
    })

    if (positiveScore > negativeScore) return 'positive'
    if (negativeScore > positiveScore) return 'negative'
    return 'neutral'
  }

  private mapToDialogueEmotionalTone(
    rawTone: 'positive' | 'negative' | 'neutral'
  ): 'friendly' | 'hostile' | 'neutral' {
    switch (rawTone) {
      case 'positive':
        return 'friendly'
      case 'negative':
        return 'hostile'
      case 'neutral':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  private validateToneConsistency(
    emotionalTone: 'friendly' | 'hostile' | 'neutral',
    personality: Personality,
    dialogueHistory: string[]
  ): boolean {
    // Check if current emotional tone is consistent with personality and history
    const personalityTendencies = {
      [Personality.FRIENDLY]: ['positive', 'neutral'],
      [Personality.AGGRESSIVE]: ['negative', 'neutral'],
      [Personality.CAUTIOUS]: ['neutral'],
      [Personality.CURIOUS]: ['positive', 'neutral'],
      [Personality.WISE]: ['neutral', 'positive'],
      [Personality.MISCHIEVOUS]: ['positive', 'neutral'],
      [Personality.LOYAL]: ['positive', 'neutral'],
      [Personality.GUARDED]: ['neutral']
    }

    const allowedTones = personalityTendencies[personality] || ['neutral']
    return allowedTones.includes(emotionalTone)
  }

  private findContradictions(currentDialogue: string, dialogueHistory: string[]): string[] {
    const contradictions: string[] = []

    dialogueHistory.forEach(historicalDialogue => {
      if (this.isContradiction(currentDialogue, historicalDialogue)) {
        contradictions.push(`Contradicts previous statement: "${historicalDialogue.substring(0, 50)}..."`)
      }
    })

    return contradictions
  }

  private isContradiction(dialogue1: string, dialogue2: string): boolean {
    // Simple contradiction detection - could be made more sophisticated
    const contradictions = [
      ['yes', 'no'],
      ['always', 'never'],
      ['good', 'bad'],
      ['like', 'hate'],
      ['agree', 'disagree']
    ]

    const text1 = this.normalizeText(dialogue1)
    const text2 = this.normalizeText(dialogue2)

    return contradictions.some(([word1, word2]) =>
      (text1.includes(word1) && text2.includes(word2)) ||
      (text1.includes(word2) && text2.includes(word1))
    )
  }

  private generateImprovementSuggestions(
    dialogue: string,
    personality: Personality,
    personalityScore: number,
    contradictions: string[],
    toneConsistency: boolean
  ): string[] {
    const suggestions: string[] = []

    if (personalityScore < 0.6) {
      suggestions.push(`Consider using more ${personality}-appropriate language`)
      const template = this.personalityTemplates.get(personality)
      if (template) {
        suggestions.push(`Try using words like: ${template.vocabularyStyle.slice(0, 3).join(', ')}`)
      }
    }

    if (contradictions.length > 0) {
      suggestions.push('Review dialogue for contradictions with previous statements')
    }

    if (!toneConsistency) {
      suggestions.push('Adjust emotional tone to match character personality')
    }

    if (dialogue.length > 200) {
      suggestions.push('Consider shortening dialogue for better personality expression')
    }

    return suggestions
  }

  private isEmotionalToneInRange(
    tone: 'friendly' | 'hostile' | 'neutral',
    range: { minTone: 'friendly' | 'neutral' | 'hostile', maxTone: 'friendly' | 'neutral' | 'hostile' }
  ): boolean {
    // Simple check - for now just ensure it's a valid tone
    return true
  }

  private getDialogueHistory(historyKey: string): string[] {
    // This would integrate with existing CharacterService memory system
    return []
  }

  private saveDialogueHistory(historyKey: string, statements: string[]): void {
    // This would integrate with existing CharacterService memory system
  }

  private analyzeEmotionalTrend(characterId: string, currentTone: 'positive' | 'negative' | 'neutral'): 'improving' | 'stable' | 'declining' {
    // This would analyze emotional trends in dialogue history
    return 'stable'
  }

  private calculateTopicConsistency(characterId: string, topics: string[]): number {
    // This would calculate how consistent topics are with character interests
    return 0.8
  }

  private identifyContradictionRisks(dialogue: string, history: string[]): string[] {
    const risks: string[] = []

    // Check for absolute statements that might be contradicted later
    if (dialogue.includes('always') || dialogue.includes('never')) {
      risks.push('Absolute statement may lead to future contradictions')
    }

    if (dialogue.includes('I promise') || dialogue.includes('I swear')) {
      risks.push('Promise creates high expectation for consistency')
    }

    return risks
  }

  private isWordInappropriateForPersonality(word: string, personality: Personality): boolean {
    const inappropriateWords = {
      [Personality.AGGRESSIVE]: ['friend', 'love', 'gentle', 'kind'],
      [Personality.FRIENDLY]: ['enemy', 'destroy', 'kill', 'hate'],
      [Personality.CAUTIOUS]: ['quick', 'rash', 'impulsive', 'reckless'],
      [Personality.CURIOUS]: ['boring', 'uninteresting', 'obvious'],
      [Personality.WISE]: ['foolish', 'childish', 'silly'],
      [Personality.MISCHIEVOUS]: ['serious', 'formal', 'boring'],
      [Personality.LOYAL]: ['betray', 'abandon', 'dishonest'],
      [Personality.GUARDED]: ['share', 'reveal', 'trust', 'open']
    }

    return inappropriateWords[personality]?.includes(word) || false
  }

  private getPersonalityAppropriateReplacement(word: string, personality: Personality): string | null {
    const replacements = {
      [Personality.AGGRESSIVE]: {
        'friend': 'ally',
        'love': 'respect',
        'gentle': 'strong',
        'kind': 'fair'
      },
      [Personality.FRIENDLY]: {
        'enemy': 'opponent',
        'destroy': 'change',
        'kill': 'defeat',
        'hate': 'dislike'
      }
    }

    const personalityReplacements = replacements[personality]
    return personalityReplacements?.[word] || null
  }

  private simplifySentenceStructure(dialogue: string, personality: Personality): string {
    // Basic sentence simplification - could be more sophisticated
    const sentences = dialogue.split(/[.!?]+/)
    return sentences.map(sentence => sentence.trim()).filter(s => s.length > 0).join('. ')
  }

  private addEmotionalIndicators(dialogue: string, personality: Personality): string {
    const indicators = {
      [Personality.FRIENDLY]: ['!', 'warmly', 'happily'],
      [Personality.AGGRESSIVE]: ['!', 'firmly', 'decisively'],
      [Personality.MISCHIEVOUS]: ['?', 'playfully', 'cleverly']
    }

    const personalityIndicators = indicators[personality] || []
    if (personalityIndicators.length > 0 && !dialogue.includes('!') && !dialogue.includes('?')) {
      return dialogue + personalityIndicators[0]
    }

    return dialogue
  }
}