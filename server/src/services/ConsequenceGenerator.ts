/**
 * Consequence Generator Service - Story 3.2: Consequence Generation & World Changes
 *
 * This service provides robust consequence parsing from AI responses with validation,
 * logical consistency checking, and world rule compliance.
 *
 * Purpose: Convert AI text responses into structured AIConsequence objects that are
 * logically consistent with world rules and support cascading effects.
 */

import { v4 as uuidv4 } from 'uuid'
import {
  AIRequest,
  AIResponse,
  AIConsequence,
  ConsequenceType,
  ConsequenceImpact,
  CascadingEffect,
  ImpactLevel,
  DurationType,
  WorldRule,
  ValidationResult
} from '../types/ai'
import { Layer1Blueprint } from '../storage/Layer1Blueprint'

export interface ConsequenceParsingOptions {
  maxConsequences?: number
  requireLogicalConsistency?: boolean
  allowUnusualConsequences?: boolean
  minConfidence?: number
}

export interface ConsequenceParsingResult {
  consequences: AIConsequence[]
  parsingSuccess: boolean
  warnings: string[]
  errors: string[]
  metadata: {
    sourceFormat: 'json' | 'structured_text' | 'plain_text' | 'fallback'
    totalConsequences: number
    validConsequences: number
    processingTime: number
  }
}

export class ConsequenceGenerator {
  private layer1Blueprint: Layer1Blueprint
  private logger: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void

  constructor(layer1Blueprint: Layer1Blueprint) {
    this.layer1Blueprint = layer1Blueprint
    this.logger = this.createLogger()
  }

  /**
   * Main entry point for generating consequences from AI response
   */
  async generateConsequences(
    aiResponse: string,
    request: AIRequest,
    options: ConsequenceParsingOptions = {}
  ): Promise<ConsequenceParsingResult> {
    const startTime = Date.now()
    this.logger('info', 'Starting consequence generation', {
      actionId: request.actionId,
      responseLength: aiResponse.length,
      options
    })

    const defaultOptions: Required<ConsequenceParsingOptions> = {
      maxConsequences: 4,
      requireLogicalConsistency: true,
      allowUnusualConsequences: true,
      minConfidence: 0.6
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      // Step 1: Parse consequences from AI response
      const parsedConsequences = await this.parseAIResponse(aiResponse, request, finalOptions)

      // Step 2: Validate consequences against world rules
      const validatedConsequences = await this.validateConsequences(parsedConsequences, request)

      // Step 3: Apply logical consistency checks
      const consistentConsequences = await this.ensureLogicalConsistency(validatedConsequences, request)

      // Step 4: Limit to max consequences and sort by priority
      const finalConsequences = this.prioritizeAndLimitConsequences(consistentConsequences, finalOptions.maxConsequences)

      const processingTime = Date.now() - startTime
      this.logger('info', 'Consequence generation completed', {
        totalConsequences: finalConsequences.length,
        processingTime
      })

      return {
        consequences: finalConsequences,
        parsingSuccess: finalConsequences.length > 0,
        warnings: this.collectWarnings(finalConsequences),
        errors: [],
        metadata: {
          sourceFormat: this.detectSourceFormat(aiResponse),
          totalConsequences: parsedConsequences.length,
          validConsequences: finalConsequences.length,
          processingTime
        }
      }
    } catch (error) {
      this.logger('error', 'Consequence generation failed', { error })

      return {
        consequences: [this.createFallbackConsequence(request)],
        parsingSuccess: false,
        warnings: [],
        errors: [`Parsing failed: ${(error as Error).message}`],
        metadata: {
          sourceFormat: 'fallback',
          totalConsequences: 0,
          validConsequences: 1,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Parse AI response text into structured consequence objects
   */
  private async parseAIResponse(
    content: string,
    request: AIRequest,
    options: Required<ConsequenceParsingOptions>
  ): Promise<AIConsequence[]> {
    this.logger('info', 'Parsing AI response', { contentLength: content.length })

    // Try different parsing strategies in order of preference
    const strategies = [
      () => this.parseAsJSON(content, request),
      () => this.parseAsStructuredList(content, request),
      () => this.parseAsNarrativeText(content, request)
    ]

    for (const strategy of strategies) {
      try {
        const consequences = await strategy()
        if (consequences.length > 0) {
          this.logger('info', 'Successfully parsed consequences', { count: consequences.length })
          return consequences
        }
      } catch (error) {
        this.logger('warn', 'Parsing strategy failed', { error })
        continue
      }
    }

    this.logger('warn', 'All parsing strategies failed, creating fallback consequence')
    return [this.createFallbackConsequence(request)]
  }

  /**
   * Try to parse consequences as JSON array
   */
  private async parseAsJSON(content: string, request: AIRequest): Promise<AIConsequence[]> {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      // Try to find JSON without code blocks
      const bracketMatch = content.match(/\[[\s\S]*\]/)
      if (!bracketMatch) return []
      jsonMatch[1] = bracketMatch[0]
    }

    try {
      const parsed = JSON.parse(jsonMatch[1])
      const consequences = Array.isArray(parsed) ? parsed : [parsed]

      return consequences.map(data => this.formatConsequenceFromJSON(data, request))
    } catch (error) {
      throw new Error(`JSON parsing failed: ${(error as Error).message}`)
    }
  }

  /**
   * Try to parse consequences as numbered or bulleted lists
   */
  private async parseAsStructuredList(content: string, request: AIRequest): Promise<AIConsequence[]> {
    const lines = content.split('\n').filter(line => line.trim())
    const consequences: AIConsequence[] = []

    for (const line of lines) {
      if (line.match(/^\d+\./) || line.match(/^[-*•]/) || line.match(/^[A-Z]\./)) {
        const description = line.replace(/^[\d\.\-\*\•A-Za-z\.]+/, '').trim()
        if (description.length > 10) {
          consequences.push(this.createConsequenceFromDescription(description, request))
        }
      }
    }

    return consequences
  }

  /**
   * Try to parse consequences from narrative text
   */
  private async parseAsNarrativeText(content: string, request: AIRequest): Promise<AIConsequence[]> {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const consequences: AIConsequence[] = []

    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length > 15 && this.looksLikeConsequence(trimmed)) {
        consequences.push(this.createConsequenceFromDescription(trimmed, request))
      }
    }

    return consequences.slice(0, 4) // Limit narrative parsing
  }

  /**
   * Validate consequences against world rules
   */
  private async validateConsequences(
    consequences: AIConsequence[],
    request: AIRequest
  ): Promise<AIConsequence[]> {
    try {
      const worldRules = await this.layer1Blueprint.getWorldRules()

      return consequences.filter(consequence => {
        const isValid = this.validateConsequenceAgainstRules(consequence, worldRules, request)
        if (!isValid) {
          this.logger('warn', 'Consequence failed validation', {
            consequenceId: consequence.id,
            description: consequence.description.substring(0, 50)
          })
        }
        return isValid
      })
    } catch (error) {
      this.logger('error', 'Failed to load world rules for validation', { error })
      return consequences // Return consequences if validation fails
    }
  }

  /**
   * Ensure logical consistency between consequences
   */
  private async ensureLogicalConsistency(
    consequences: AIConsequence[],
    request: AIRequest
  ): Promise<AIConsequence[]> {
    const consistent: AIConsequence[] = []

    for (const consequence of consequences) {
      const isConsistent = this.checkLogicalConsistency(consequence, consistent, request)
      if (isConsistent) {
        consistent.push(consequence)
      } else {
        this.logger('warn', 'Consequence failed logical consistency check', {
          consequenceId: consequence.id
        })
      }
    }

    return consistent
  }

  /**
   * Validate individual consequence against world rules
   */
  private validateConsequenceAgainstRules(
    consequence: AIConsequence,
    worldRules: WorldRule[],
    request: AIRequest
  ): boolean {
    // Basic validation rules
    if (!consequence.description || consequence.description.length < 10) {
      return false
    }

    if (!consequence.type || !Object.values(ConsequenceType).includes(consequence.type as ConsequenceType)) {
      return false
    }

    // Validate impact structure
    if (!consequence.impact) {
      return false
    }

    // Check for obvious contradictions
    if (consequence.description.toLowerCase().includes('impossible') ||
        consequence.description.toLowerCase().includes('cannot')) {
      return false
    }

    // More sophisticated world rule validation could go here
    // For now, we do basic validation
    return true
  }

  /**
   * Check logical consistency with existing consequences
   */
  private checkLogicalConsistency(
    consequence: AIConsequence,
    existingConsequences: AIConsequence[],
    request: AIRequest
  ): boolean {
    // Check for direct contradictions
    for (const existing of existingConsequences) {
      if (this.areConsequencesConflicting(consequence, existing)) {
        return false
      }
    }

    return true
  }

  /**
   * Check if two consequences conflict with each other
   */
  private areConsequencesConflicting(c1: AIConsequence, c2: AIConsequence): boolean {
    // Simple conflict detection - could be made more sophisticated
    const desc1 = c1.description.toLowerCase()
    const desc2 = c2.description.toLowerCase()

    // Opposite actions
    const opposites = [
      ['increase', 'decrease'],
      ['improve', 'worsen'],
      ['ally', 'enemy'],
      ['friendly', 'hostile'],
      ['peaceful', 'violent']
    ]

    for (const [word1, word2] of opposites) {
      if ((desc1.includes(word1) && desc2.includes(word2)) ||
          (desc1.includes(word2) && desc2.includes(word1))) {
        return true
      }
    }

    return false
  }

  /**
   * Prioritize consequences and limit to maximum count
   */
  private prioritizeAndLimitConsequences(
    consequences: AIConsequence[],
    maxConsequences: number
  ): AIConsequence[] {
    // Sort by impact magnitude and confidence
    const sorted = consequences.sort((a, b) => {
      const scoreA = (a.impact.magnitude * a.confidence) +
        (a.cascadingEffects.length * 2) // Bonus for cascading effects
      const scoreB = (b.impact.magnitude * b.confidence) +
        (b.cascadingEffects.length * 2)

      return scoreB - scoreA
    })

    return sorted.slice(0, maxConsequences)
  }

  /**
   * Format consequence from JSON data
   */
  private formatConsequenceFromJSON(data: any, request: AIRequest): AIConsequence {
    return {
      id: data.id || uuidv4(),
      actionId: request.actionId,
      type: this.parseConsequenceType(data.type),
      description: data.description || 'Unknown consequence',
      impact: {
        level: this.parseImpactLevel(data.impact?.level),
        affectedSystems: data.impact?.affectedSystems || ['world_state'],
        magnitude: data.impact?.magnitude || 5,
        duration: this.parseDurationType(data.impact?.duration),
        affectedCharacters: data.impact?.affectedCharacters,
        affectedLocations: data.impact?.affectedLocations
      },
      cascadingEffects: (data.cascadingEffects || []).map((effect: any) => ({
        ...effect,
        id: effect.id || uuidv4(),
        parentConsequenceId: data.id || uuidv4()
      })),
      timestamp: new Date().toISOString(),
      confidence: data.confidence || 0.8
    }
  }

  /**
   * Create consequence from description text
   */
  private createConsequenceFromDescription(description: string, request: AIRequest): AIConsequence {
    const type = this.inferConsequenceType(description)
    const impact = this.inferImpact(description, type)

    return {
      id: uuidv4(),
      actionId: request.actionId,
      type,
      description: description.substring(0, 200),
      impact,
      cascadingEffects: this.generateCascadingEffects(description, type),
      timestamp: new Date().toISOString(),
      confidence: 0.7
    }
  }

  /**
   * Create fallback consequence when parsing fails
   */
  private createFallbackConsequence(request: AIRequest): AIConsequence {
    return {
      id: uuidv4(),
      actionId: request.actionId,
      type: ConsequenceType.WORLD_STATE,
      description: 'Action processed successfully',
      impact: {
        level: ImpactLevel.MINOR,
        affectedSystems: ['world_state'],
        magnitude: 2,
        duration: DurationType.TEMPORARY
      },
      cascadingEffects: [],
      timestamp: new Date().toISOString(),
      confidence: 0.5
    }
  }

  /**
   * Parse consequence type from string
   */
  private parseConsequenceType(type: string): ConsequenceType {
    const typeLower = (type || '').toLowerCase()

    if (typeLower.includes('relationship') || typeLower.includes('social')) {
      return ConsequenceType.RELATIONSHIP
    }
    if (typeLower.includes('environment') || typeLower.includes('weather') || typeLower.includes('location')) {
      return ConsequenceType.ENVIRONMENT
    }
    if (typeLower.includes('character') || typeLower.includes('npc') || typeLower.includes('person')) {
      return ConsequenceType.CHARACTER
    }
    if (typeLower.includes('economic') || typeLower.includes('trade') || typeLower.includes('money')) {
      return ConsequenceType.ECONOMIC
    }
    if (typeLower.includes('combat') || typeLower.includes('fight') || typeLower.includes('battle')) {
      return ConsequenceType.COMBAT
    }
    if (typeLower.includes('exploration') || typeLower.includes('discover') || typeLower.includes('explore')) {
      return ConsequenceType.EXPLORATION
    }

    return ConsequenceType.WORLD_STATE
  }

  /**
   * Parse impact level from string
   */
  private parseImpactLevel(level: string): ImpactLevel {
    const levelLower = (level || '').toLowerCase()

    if (levelLower.includes('critical')) return ImpactLevel.CRITICAL
    if (levelLower.includes('significant')) return ImpactLevel.SIGNIFICANT
    if (levelLower.includes('major')) return ImpactLevel.MAJOR
    if (levelLower.includes('moderate')) return ImpactLevel.MODERATE

    return ImpactLevel.MINOR
  }

  /**
   * Parse duration type from string
   */
  private parseDurationType(duration: string): DurationType {
    const durationLower = (duration || '').toLowerCase()

    if (durationLower.includes('permanent')) return DurationType.PERMANENT
    if (durationLower.includes('long') || durationLower.includes('extended')) return DurationType.LONG_TERM
    if (durationLower.includes('medium')) return DurationType.MEDIUM_TERM
    if (durationLower.includes('short')) return DurationType.SHORT_TERM

    return DurationType.TEMPORARY
  }

  /**
   * Infer consequence type from description
   */
  private inferConsequenceType(description: string): ConsequenceType {
    const descLower = description.toLowerCase()

    if (descLower.includes('relationship') || descLower.includes('friend') || descLower.includes('enemy') || descLower.includes('alliance')) {
      return ConsequenceType.RELATIONSHIP
    }
    if (descLower.includes('weather') || descLower.includes('environment') || descLower.includes('forest') || descLower.includes('village')) {
      return ConsequenceType.ENVIRONMENT
    }
    if (descLower.includes('character') || descLower.includes('person') || descLower.includes('npc')) {
      return ConsequenceType.CHARACTER
    }
    if (descLower.includes('economy') || descLower.includes('trade') || descLower.includes('market') || descLower.includes('price')) {
      return ConsequenceType.ECONOMIC
    }
    if (descLower.includes('combat') || descLower.includes('fight') || descLower.includes('battle') || descLower.includes('attack')) {
      return ConsequenceType.COMBAT
    }
    if (descLower.includes('discover') || descLower.includes('explore') || descLower.includes('find') || descLower.includes('new')) {
      return ConsequenceType.EXPLORATION
    }

    return ConsequenceType.WORLD_STATE
  }

  /**
   * Infer impact from description
   */
  private inferImpact(description: string, type: ConsequenceType): ConsequenceImpact {
    const descLower = description.toLowerCase()

    let level = ImpactLevel.MODERATE
    let magnitude = 5

    // Determine impact level from keywords
    if (descLower.includes('destroy') || descLower.includes('massive') || descLower.includes('catastrophic')) {
      level = ImpactLevel.CRITICAL
      magnitude = 9
    } else if (descLower.includes('major') || descLower.includes('significant') || descLower.includes('dramatic')) {
      level = ImpactLevel.SIGNIFICANT
      magnitude = 7
    } else if (descLower.includes('small') || descLower.includes('minor') || descLower.includes('slight')) {
      level = ImpactLevel.MINOR
      magnitude = 2
    }

    // Determine affected systems
    const affectedSystems: string[] = [type]
    if (descLower.includes('village') || descLower.includes('town')) affectedSystems.push(ConsequenceType.ECONOMIC)
    if (descLower.includes('forest') || descLower.includes('environment')) affectedSystems.push(ConsequenceType.ENVIRONMENT)
    if (descLower.includes('character') || descLower.includes('people')) affectedSystems.push(ConsequenceType.RELATIONSHIP)

    return {
      level,
      affectedSystems,
      magnitude,
      duration: DurationType.SHORT_TERM
    }
  }

  /**
   * Generate cascading effects for a consequence
   */
  private generateCascadingEffects(description: string, type: ConsequenceType): CascadingEffect[] {
    // Simple cascading effect generation based on type
    const effects: CascadingEffect[] = []

    if (Math.random() > 0.5 && (type === ConsequenceType.RELATIONSHIP || type === ConsequenceType.COMBAT)) {
      effects.push({
        id: uuidv4(),
        parentConsequenceId: '', // Will be set later
        description: this.generateCascadingDescription(description, type),
        delay: Math.random() * 10000 + 2000, // 2-12 seconds
        probability: Math.random() * 0.5 + 0.3, // 0.3-0.8
        impact: {
          level: ImpactLevel.MINOR,
          affectedSystems: [type],
          magnitude: 3,
          duration: DurationType.TEMPORARY
        }
      })
    }

    return effects
  }

  /**
   * Generate cascading effect description
   */
  private generateCascadingDescription(parentDescription: string, type: ConsequenceType): string {
    const templates = {
      [ConsequenceType.RELATIONSHIP]: [
        'Nearby characters notice the change in relationships',
        'Local community reacts to the relationship shift',
        'Other characters adjust their behavior based on this'
      ],
      [ConsequenceType.ENVIRONMENT]: [
        'Wildlife responds to the environmental change',
        'Nearby areas experience related effects',
        'Local resources are affected by this change'
      ],
      [ConsequenceType.CHARACTER]: [
        'Other characters learn about this development',
        'Local rumors spread about the character',
        'Character\'s reputation is affected'
      ],
      [ConsequenceType.COMBAT]: [
        'Nearby characters react to the combat outcome',
        'Local area security is impacted',
        'Combatants\' allies take notice'
      ],
      [ConsequenceType.WORLD_STATE]: [
        'Connected systems experience related changes',
        'Local equilibrium is affected',
        'Future actions are influenced by this change'
      ]
    }

    const typeTemplates = templates[type] || templates[ConsequenceType.WORLD_STATE]
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)]
  }

  /**
   * Check if text looks like a consequence
   */
  private looksLikeConsequence(text: string): boolean {
    const consequenceIndicators = [
      'result', 'effect', 'impact', 'cause', 'lead', 'change', 'alter',
      'affect', 'influence', 'trigger', 'create', 'destroy', 'improve',
      'worsen', 'increase', 'decrease', 'become', 'transform'
    ]

    const textLower = text.toLowerCase()
    return consequenceIndicators.some(indicator => textLower.includes(indicator))
  }

  /**
   * Detect the source format of the AI response
   */
  private detectSourceFormat(content: string): 'json' | 'structured_text' | 'plain_text' | 'fallback' {
    if (content.includes('```json') || content.match(/\[[\s\S]*\]/)) {
      return 'json'
    }
    if (content.match(/^\d+\./m) || content.match(/^[-*•]/m)) {
      return 'structured_text'
    }
    if (content.trim().length > 20) {
      return 'plain_text'
    }
    return 'fallback'
  }

  /**
   * Collect warnings from consequences
   */
  private collectWarnings(consequences: AIConsequence[]): string[] {
    const warnings: string[] = []

    for (const consequence of consequences) {
      if (consequence.confidence < 0.7) {
        warnings.push(`Low confidence consequence: ${consequence.id}`)
      }
      if (consequence.description.length < 20) {
        warnings.push(`Very short consequence description: ${consequence.id}`)
      }
      if (consequence.cascadingEffects.length === 0) {
        warnings.push(`No cascading effects: ${consequence.id}`)
      }
    }

    return warnings
  }

  /**
   * Create logger function
   */
  private createLogger() {
    return (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [ConsequenceGenerator] [${level.toUpperCase()}] ${message}`, data || '')
    }
  }
}

export default ConsequenceGenerator