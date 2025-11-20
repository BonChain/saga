/**
 * Consequence Validator Service - Story 3.2: Consequence Generation & World Changes
 *
 * This service validates that consequences are logically consistent with world rules
 * and current world state. It provides rule-based validation and conflict detection.
 *
 * Purpose: Ensure all generated consequences follow world logic and maintain consistency.
 */

import {
  AIConsequence,
  ConsequenceType,
  WorldRule,
  RuleType,
  ValidationResult,
  ImpactLevel
} from '../types/ai'
import { Layer1Blueprint } from '../storage/layer1-blueprint'
import { Layer3State } from '../storage/layer3-state'

export interface ValidationRule {
  id: string
  name: string
  description: string
  type: RuleType
  validate: (consequence: AIConsequence, context: ValidationContext) => ValidationResult
}

export interface ValidationContext {
  worldRules: WorldRule[]
  currentWorldState?: any
  relatedConsequences?: AIConsequence[]
  actionContext?: any
}

export interface ConflictResolution {
  type: 'merge' | 'remove_one' | 'prioritize' | 'modify'
  consequence1: AIConsequence
  consequence2: AIConsequence
  resolution?: AIConsequence[]
}

export class ConsequenceValidator {
  private layer1Blueprint: Layer1Blueprint
  private layer3State: Layer3State
  private validationRules: ValidationRule[]
  private logger: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void

  constructor(layer1Blueprint: Layer1Blueprint, layer3State: Layer3State) {
    this.layer1Blueprint = layer1Blueprint
    this.layer3State = layer3State
    this.validationRules = this.initializeValidationRules()
    this.logger = this.createLogger()
  }

  /**
   * Validate a consequence against world rules and logical consistency
   */
  async validateConsequence(
    consequence: AIConsequence,
    options: {
      currentWorldState?: any
      existingConsequences?: AIConsequence[]
      actionContext?: any
    } = {}
  ): Promise<ValidationResult> {
    this.logger('info', 'Validating consequence', {
      consequenceId: consequence.id,
      type: consequence.type,
      description: consequence.description.substring(0, 50)
    })

    try {
      // Load validation context
      const context: ValidationContext = {
        worldRules: await this.layer1Blueprint.getWorldRules(),
        currentWorldState: options.currentWorldState || await this.layer3State.getCurrentState(),
        relatedConsequences: options.existingConsequences || [],
        actionContext: options.actionContext
      }

      // Run all validation rules
      const results = await Promise.all(
        this.validationRules.map(rule => this.executeValidationRule(rule, consequence, context))
      )

      // Aggregate results
      const aggregatedResult = this.aggregateValidationResults(results)

      this.logger('info', 'Consequence validation completed', {
        isValid: aggregatedResult.isValid,
        warnings: aggregatedResult.warnings.length,
        errors: aggregatedResult.errors.length
      })

      return aggregatedResult
    } catch (error) {
      this.logger('error', 'Consequence validation failed', { error })

      return {
        isValid: false,
        warnings: [],
        errors: [`Validation failed: ${(error as Error).message}`],
        details: { error: (error as Error).message }
      }
    }
  }

  /**
   * Validate multiple consequences and check for conflicts
   */
  async validateConsequences(
    consequences: AIConsequence[],
    options: {
      currentWorldState?: any
      actionContext?: any
    } = {}
  ): Promise<{
    validConsequences: AIConsequence[]
    invalidConsequences: AIConsequence[]
    conflicts: ConflictResolution[]
    validationResults: Map<string, ValidationResult>
  }> {
    this.logger('info', 'Validating multiple consequences', { count: consequences.length })

    const validationResults = new Map<string, ValidationResult>()
    const validConsequences: AIConsequence[] = []
    const invalidConsequences: AIConsequence[] = []

    // Validate each consequence individually
    for (const consequence of consequences) {
      const result = await this.validateConsequence(consequence, {
        currentWorldState: options.currentWorldState,
        existingConsequences: validConsequences,
        actionContext: options.actionContext
      })

      validationResults.set(consequence.id, result)

      if (result.isValid) {
        validConsequences.push(consequence)
      } else {
        invalidConsequences.push(consequence)
      }
    }

    // Check for conflicts between valid consequences
    const conflicts = await this.detectConsequenceConflicts(validConsequences)

    // Resolve conflicts
    const resolvedConsequences = await this.resolveConflicts(validConsequences, conflicts)

    this.logger('info', 'Multiple consequences validation completed', {
      total: consequences.length,
      valid: resolvedConsequences.length,
      invalid: invalidConsequences.length,
      conflicts: conflicts.length
    })

    return {
      validConsequences: resolvedConsequences,
      invalidConsequences,
      conflicts,
      validationResults
    }
  }

  /**
   * Execute a single validation rule
   */
  private async executeValidationRule(
    rule: ValidationRule,
    consequence: AIConsequence,
    context: ValidationContext
  ): Promise<ValidationResult> {
    try {
      return rule.validate(consequence, context)
    } catch (error) {
      this.logger('error', `Validation rule failed: ${rule.name}`, { error })

      return {
        isValid: false,
        warnings: [],
        errors: [`Rule '${rule.name}' failed: ${(error as Error).message}`],
        details: { rule: rule.name, error: (error as Error).message }
      }
    }
  }

  /**
   * Aggregate multiple validation results
   */
  private aggregateValidationResults(results: ValidationResult[]): ValidationResult {
    const allWarnings: string[] = []
    const allErrors: string[] = []
    const allDetails: any[] = []

    for (const result of results) {
      if (!result.isValid) {
        allErrors.push(...result.errors)
      }
      allWarnings.push(...result.warnings)
      if (result.details) {
        allDetails.push(result.details)
      }
    }

    return {
      isValid: allErrors.length === 0,
      warnings: allWarnings,
      errors: allErrors,
      details: allDetails
    }
  }

  /**
   * Detect conflicts between consequences
   */
  private async detectConsequenceConflicts(consequences: AIConsequence[]): Promise<ConflictResolution[]> {
    const conflicts: ConflictResolution[] = []

    for (let i = 0; i < consequences.length; i++) {
      for (let j = i + 1; j < consequences.length; j++) {
        const c1 = consequences[i]
        const c2 = consequences[j]

        const conflict = await this.detectConflict(c1, c2)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  /**
   * Detect conflict between two consequences
   */
  private async detectConflict(c1: AIConsequence, c2: AIConsequence): Promise<ConflictResolution | null> {
    // Check for direct contradictions
    if (this.areDirectlyConflicting(c1, c2)) {
      return {
        type: 'remove_one',
        consequence1: c1,
        consequence2: c2
      }
    }

    // Check for redundant consequences
    if (this.areRedundant(c1, c2)) {
      return {
        type: 'merge',
        consequence1: c1,
        consequence2: c2
      }
    }

    // Check for priority conflicts
    if (this.haveConflictingPriorities(c1, c2)) {
      return {
        type: 'prioritize',
        consequence1: c1,
        consequence2: c2
      }
    }

    return null
  }

  /**
   * Check if two consequences are directly conflicting
   */
  private areDirectlyConflicting(c1: AIConsequence, c2: AIConsequence): boolean {
    const desc1 = c1.description.toLowerCase()
    const desc2 = c2.description.toLowerCase()

    // Check for opposite actions
    const oppositePairs = [
      ['increase', 'decrease'],
      ['improve', 'worsen'],
      ['ally', 'enemy'],
      ['friendly', 'hostile'],
      ['peaceful', 'violent'],
      ['open', 'close'],
      ['enable', 'disable'],
      ['create', 'destroy']
    ]

    for (const [word1, word2] of oppositePairs) {
      if ((desc1.includes(word1) && desc2.includes(word2)) ||
          (desc1.includes(word2) && desc2.includes(word1))) {
        // Check if they're referring to the same subject
        if (this.shareCommonSubject(c1, c2)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Check if two consequences are redundant
   */
  private areRedundant(c1: AIConsequence, c2: AIConsequence): boolean {
    // Same type and similar description
    if (c1.type === c2.type) {
      const similarity = this.calculateTextSimilarity(c1.description, c2.description)
      if (similarity > 0.8) {
        return true
      }
    }

    // Same affected systems and similar impact
    const systems1 = c1.impact.affectedSystems.sort().join(',')
    const systems2 = c2.impact.affectedSystems.sort().join(',')

    if (systems1 === systems2 &&
        Math.abs(c1.impact.magnitude - c2.impact.magnitude) < 2) {
      const similarity = this.calculateTextSimilarity(c1.description, c2.description)
      if (similarity > 0.6) {
        return true
      }
    }

    return false
  }

  /**
   * Check if consequences have conflicting priorities
   */
  private haveConflictingPriorities(c1: AIConsequence, c2: AIConsequence): boolean {
    // High impact consequences that affect the same system with opposite approaches
    if (c1.impact.level === 'critical' && c2.impact.level === 'critical' &&
        c1.impact.magnitude > 7 && c2.impact.magnitude > 7) {
      const sharedSystems = c1.impact.affectedSystems.filter(s =>
        c2.impact.affectedSystems.includes(s)
      )

      if (sharedSystems.length > 0 && this.areDirectlyConflicting(c1, c2)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if consequences share a common subject
   */
  private shareCommonSubject(c1: AIConsequence, c2: AIConsequence): boolean {
    const subjects1 = this.extractSubjects(c1.description)
    const subjects2 = this.extractSubjects(c2.description)

    const commonSubjects = subjects1.filter(s => subjects2.includes(s))
    return commonSubjects.length > 0
  }

  /**
   * Extract subjects from consequence description
   */
  private extractSubjects(description: string): string[] {
    // Simple subject extraction - could be made more sophisticated
    const commonSubjects = [
      'village', 'forest', 'dragon', 'player', 'character', 'npc',
      'economy', 'trade', 'market', 'relationship', 'environment',
      'weather', 'combat', 'magic', 'resources', 'buildings'
    ]

    const descLower = description.toLowerCase()
    return commonSubjects.filter(subject => descLower.includes(subject))
  }

  /**
   * Calculate text similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)

    const intersection = words1.filter(word => words2.includes(word))
    const unionSet = new Set([...words1, ...words2])
    const union = Array.from(unionSet)

    return union.length > 0 ? intersection.length / union.length : 0
  }

  /**
   * Resolve conflicts between consequences
   */
  private async resolveConflicts(
    consequences: AIConsequence[],
    conflicts: ConflictResolution[]
  ): Promise<AIConsequence[]> {
    let resolvedConsequences = [...consequences]

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'remove_one':
          resolvedConsequences = this.handleRemoveOneConflict(resolvedConsequences, conflict)
          break
        case 'merge':
          resolvedConsequences = await this.handleMergeConflict(resolvedConsequences, conflict)
          break
        case 'prioritize':
          resolvedConsequences = this.handlePrioritizeConflict(resolvedConsequences, conflict)
          break
        case 'modify':
          resolvedConsequences = await this.handleModifyConflict(resolvedConsequences, conflict)
          break
      }
    }

    return resolvedConsequences
  }

  /**
   * Handle remove_one conflict resolution
   */
  private handleRemoveOneConflict(
    consequences: AIConsequence[],
    conflict: ConflictResolution
  ): AIConsequence[] {
    // Remove the consequence with lower confidence or lower impact
    const c1Index = consequences.findIndex(c => c.id === conflict.consequence1.id)
    const c2Index = consequences.findIndex(c => c.id === conflict.consequence2.id)

    if (c1Index === -1 || c2Index === -1) return consequences

    const c1 = conflict.consequence1
    const c2 = conflict.consequence2

    const removeC1 = c1.confidence < c2.confidence ||
      (c1.confidence === c2.confidence && c1.impact.magnitude < c2.impact.magnitude)

    const removeIndex = removeC1 ? c1Index : c2Index
    consequences.splice(removeIndex, 1)

    return consequences
  }

  /**
   * Handle merge conflict resolution
   */
  private async handleMergeConflict(
    consequences: AIConsequence[],
    conflict: ConflictResolution
  ): Promise<AIConsequence[]> {
    const c1Index = consequences.findIndex(c => c.id === conflict.consequence1.id)
    const c2Index = consequences.findIndex(c => c.id === conflict.consequence2.id)

    if (c1Index === -1 || c2Index === -1) return consequences

    const c1 = conflict.consequence1
    const c2 = conflict.consequence2

    // Create merged consequence
    const merged: AIConsequence = {
      id: c1.id, // Keep first consequence's ID
      actionId: c1.actionId,
      type: c1.type,
      description: `${c1.description} and ${c2.description}`,
      impact: {
        level: c1.impact.magnitude > c2.impact.magnitude ? c1.impact.level : c2.impact.level,
        affectedSystems: Array.from(new Set([...c1.impact.affectedSystems, ...c2.impact.affectedSystems])),
        magnitude: Math.max(c1.impact.magnitude, c2.impact.magnitude),
        duration: c1.impact.duration === 'permanent' || c2.impact.duration === 'permanent'
          ? 'permanent' as any
          : c1.impact.duration,
        affectedCharacters: Array.from(new Set([...(c1.impact.affectedCharacters || []), ...(c2.impact.affectedCharacters || [])])),
        affectedLocations: Array.from(new Set([...(c1.impact.affectedLocations || []), ...(c2.impact.affectedLocations || [])]))
      },
      cascadingEffects: [...c1.cascadingEffects, ...c2.cascadingEffects],
      timestamp: new Date().toISOString(),
      confidence: Math.max(c1.confidence, c2.confidence)
    }

    // Replace both consequences with merged one
    consequences.splice(Math.max(c1Index, c2Index), 1)
    consequences.splice(Math.min(c1Index, c2Index), 1, merged)

    return consequences
  }

  /**
   * Handle prioritize conflict resolution
   */
  private handlePrioritizeConflict(
    consequences: AIConsequence[],
    conflict: ConflictResolution
  ): AIConsequence[] {
    return this.handleRemoveOneConflict(consequences, conflict)
  }

  /**
   * Handle modify conflict resolution
   */
  private async handleModifyConflict(
    consequences: AIConsequence[],
    conflict: ConflictResolution
  ): Promise<AIConsequence[]> {
    // For now, use prioritize - could be enhanced with actual modification logic
    return this.handlePrioritizeConflict(consequences, conflict)
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): ValidationRule[] {
    return [
      {
        id: 'basic-structure',
        name: 'Basic Structure Validation',
        description: 'Validates that consequence has required fields',
        type: RuleType.PHYSICS,
        validate: this.validateBasicStructure.bind(this)
      },
      {
        id: 'type-consistency',
        name: 'Type Consistency Validation',
        description: 'Validates that consequence type matches content',
        type: RuleType.SOCIAL,
        validate: this.validateTypeConsistency.bind(this)
      },
      {
        id: 'impact-logic',
        name: 'Impact Logic Validation',
        description: 'Validates that impact levels make sense',
        type: RuleType.ECONOMIC,
        validate: this.validateImpactLogic.bind(this)
      },
      {
        id: 'world-coherence',
        name: 'World Coherence Validation',
        description: 'Validates consequence against world rules',
        type: RuleType.ENVIRONMENTAL,
        validate: this.validateWorldCoherence.bind(this)
      },
      {
        id: 'temporal-logic',
        name: 'Temporal Logic Validation',
        description: 'Validates that timing and duration make sense',
        type: RuleType.MAGICAL,
        validate: this.validateTemporalLogic.bind(this)
      }
    ]
  }

  /**
   * Validate basic structure of consequence
   */
  private validateBasicStructure(consequence: AIConsequence, context: ValidationContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!consequence.description || consequence.description.trim().length < 10) {
      errors.push('Consequence description must be at least 10 characters')
    }

    if (!Object.values(ConsequenceType).includes(consequence.type as ConsequenceType)) {
      errors.push(`Invalid consequence type: ${consequence.type}`)
    }

    if (!consequence.impact) {
      errors.push('Consequence must have impact information')
    } else {
      if (consequence.impact.magnitude < 1 || consequence.impact.magnitude > 10) {
        errors.push('Impact magnitude must be between 1 and 10')
      }

      if (!Object.values(ImpactLevel).includes(consequence.impact.level as ImpactLevel)) {
        errors.push(`Invalid impact level: ${consequence.impact.level}`)
      }
    }

    if (consequence.confidence < 0 || consequence.confidence > 1) {
      errors.push('Confidence must be between 0 and 1')
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      details: { rule: 'basic-structure' }
    }
  }

  /**
   * Validate type consistency
   */
  private validateTypeConsistency(consequence: AIConsequence, context: ValidationContext): ValidationResult {
    const warnings: string[] = []
    const errors: string[] = []

    const descLower = consequence.description.toLowerCase()

    // Check if description matches the declared type
    const typeKeywords = {
      [ConsequenceType.RELATIONSHIP]: ['friend', 'enemy', 'ally', 'relationship', 'social', 'trust'],
      [ConsequenceType.ENVIRONMENT]: ['weather', 'environment', 'forest', 'village', 'location', 'nature'],
      [ConsequenceType.CHARACTER]: ['character', 'person', 'npc', 'individual', 'people'],
      [ConsequenceType.WORLD_STATE]: ['world', 'state', 'system', 'global', 'universal'],
      [ConsequenceType.ECONOMIC]: ['economy', 'trade', 'money', 'price', 'market', 'resources'],
      [ConsequenceType.COMBAT]: ['fight', 'battle', 'combat', 'attack', 'defend', 'war'],
      [ConsequenceType.EXPLORATION]: ['discover', 'explore', 'find', 'map', 'area', 'region']
    }

    const keywords = typeKeywords[consequence.type as ConsequenceType] || []
    const hasKeyword = keywords.some(keyword => descLower.includes(keyword))

    if (!hasKeyword) {
      warnings.push(`Description may not match declared type: ${consequence.type}`)
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      details: { rule: 'type-consistency', detectedKeywords: keywords.filter(k => descLower.includes(k)) }
    }
  }

  /**
   * Validate impact logic
   */
  private validateImpactLogic(consequence: AIConsequence, context: ValidationContext): ValidationResult {
    const warnings: string[] = []
    const errors: string[] = []

    // Check impact level vs magnitude consistency
    const levelMagnitudeMap = {
      [ImpactLevel.MINOR]: [1, 2, 3],
      [ImpactLevel.MODERATE]: [4, 5, 6],
      [ImpactLevel.MAJOR]: [7, 8],
      [ImpactLevel.SIGNIFICANT]: [9],
      [ImpactLevel.CRITICAL]: [10]
    }

    const expectedMagnitudes = levelMagnitudeMap[consequence.impact.level as ImpactLevel]
    if (expectedMagnitudes && !expectedMagnitudes.includes(consequence.impact.magnitude)) {
      warnings.push(`Impact magnitude ${consequence.impact.magnitude} may not match level ${consequence.impact.level}`)
    }

    // Check if affected systems make sense for the type
    const validSystemTypes = {
      [ConsequenceType.RELATIONSHIP]: ['social', 'relationship', 'character'],
      [ConsequenceType.ENVIRONMENT]: ['environment', 'nature', 'location'],
      [ConsequenceType.CHARACTER]: ['character', 'social', 'relationship'],
      [ConsequenceType.WORLD_STATE]: ['world_state', 'environment', 'social', 'economic'],
      [ConsequenceType.ECONOMIC]: ['economic', 'social', 'world_state'],
      [ConsequenceType.COMBAT]: ['combat', 'character', 'relationship'],
      [ConsequenceType.EXPLORATION]: ['world_state', 'environment', 'economic']
    }

    const validSystems = validSystemTypes[consequence.type as ConsequenceType] || []
    const hasValidSystem = consequence.impact.affectedSystems.some(system =>
      validSystems.includes(system)
    )

    if (!hasValidSystem) {
      warnings.push(`Affected systems may not be appropriate for consequence type: ${consequence.type}`)
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      details: { rule: 'impact-logic' }
    }
  }

  /**
   * Validate world coherence
   */
  private validateWorldCoherence(consequence: AIConsequence, context: ValidationContext): ValidationResult {
    const warnings: string[] = []
    const errors: string[] = []

    // Check against world rules
    for (const rule of context.worldRules) {
      const violation = this.checkRuleViolation(consequence, rule)
      if (violation) {
        errors.push(`Violates world rule: ${rule.name} - ${violation}`)
      }
    }

    // Check for logical impossibilities
    if (this.isLogicallyImpossible(consequence)) {
      errors.push('Consequence appears logically impossible')
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      details: { rule: 'world-coherence' }
    }
  }

  /**
   * Validate temporal logic
   */
  private validateTemporalLogic(consequence: AIConsequence, context: ValidationContext): ValidationResult {
    const warnings: string[] = []
    const errors: string[] = []

    // Check cascading effects timing
    for (const effect of consequence.cascadingEffects) {
      if (effect.delay < 0) {
        errors.push('Cascading effect delay cannot be negative')
      }

      if (effect.probability < 0 || effect.probability > 1) {
        errors.push('Cascading effect probability must be between 0 and 1')
      }

      if (effect.delay > 300000) { // 5 minutes
        warnings.push('Very long cascading effect delay may not be practical')
      }
    }

    // Check duration vs impact consistency
    const permanentHighImpact = consequence.impact.duration === 'permanent' &&
                                consequence.impact.magnitude > 8

    if (permanentHighImpact) {
      warnings.push('Permanent consequences with high impact should be carefully considered')
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      details: { rule: 'temporal-logic' }
    }
  }

  /**
   * Check if consequence violates a specific world rule
   */
  private checkRuleViolation(consequence: AIConsequence, rule: WorldRule): string | null {
    const descLower = consequence.description.toLowerCase()
    const ruleDescLower = rule.description.toLowerCase()

    // Simple rule violation detection - could be enhanced
    if (ruleDescLower.includes('cannot') || ruleDescLower.includes('impossible')) {
      // Check if consequence contradicts the rule
      if (this.contradictsRule(consequence, rule)) {
        return rule.description
      }
    }

    return null
  }

  /**
   * Check if consequence contradicts a rule
   */
  private contradictsRule(consequence: AIConsequence, rule: WorldRule): boolean {
    // Simple contradiction detection - could be enhanced with more sophisticated logic
    const ruleKeywords = rule.description.toLowerCase().split(/\s+/)
    const consequenceKeywords = consequence.description.toLowerCase().split(/\s+/)

    // Look for opposing concepts
    const opposites = [
      ['cannot', 'can'],
      ['impossible', 'possible'],
      ['never', 'always'],
      ['forbidden', 'allowed']
    ]

    for (const [opposite1, opposite2] of opposites) {
      if (ruleKeywords.includes(opposite1) && consequenceKeywords.includes(opposite2)) {
        return true
      }
      if (ruleKeywords.includes(opposite2) && consequenceKeywords.includes(opposite1)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if consequence is logically impossible
   */
  private isLogicallyImpossible(consequence: AIConsequence): boolean {
    const descLower = consequence.description.toLowerCase()

    // Check for obvious impossibilities
    const impossibilityIndicators = [
      'immediately and permanently',
      'instantly and forever',
      'completely and instantly',
      'zero time infinite effect',
      'immediate permanent total'
    ]

    return impossibilityIndicators.some(indicator => descLower.includes(indicator))
  }

  /**
   * Create logger function
   */
  private createLogger() {
    return (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [ConsequenceValidator] [${level.toUpperCase()}] ${message}`, data || '')
    }
  }
}

export default ConsequenceValidator