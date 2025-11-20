/**
 * Cascade Processor Service - Story 3.2: Consequence Generation & World Changes
 *
 * This service calculates and processes cascading effects that propagate through
 * world systems. It implements butterfly effect calculation and relationship mapping.
 *
 * Purpose: Create secondary and tertiary effects that make the world feel alive
 * and interconnected.
 */

import { v4 as uuidv4 } from 'uuid'
import {
  AIConsequence,
  CascadingEffect,
  ConsequenceType,
  ConsequenceImpact,
  ImpactLevel,
  DurationType,
  ButterflyEffectNode,
  EffectConnection,
  CascadeVisualizationData,
  EffectHistory
} from '../types/ai'
import {
  MemoryOptimizedCascadeProcessor,
  MemoryMonitor,
  LazyVisualizationData,
  PooledVisualizationNode,
  CompactWorldSystemInfluence,
  CompactStringCache,
  WorldSystemType
} from '../utils/memory-optimizer'

/**
 * Configuration constants for cascade processing
 * Extracted magic numbers for better maintainability and configuration
 */
const CASCADE_CONFIG = {
  // Processing limits
  MAX_CASCADING_LEVELS: 3,
  MAX_EFFECTS_PER_LEVEL: 4,
  SIGNIFICANCE_THRESHOLD: 0.3,

  // Timing configurations (in milliseconds)
  TIMING: {
    BASE_DELAY: 2000,
    LEVEL_DELAY: 1000,
    RANDOM_DELAY_RANGE: 3000,
    BATCH_PROCESSING_DELAY: 500,
    INDIRECT_ADDITIONAL_DELAY: 5000,
    ANIMATION_DURATION: 2000,
    TIME_STEP_INCREMENT: 2000,
    TRAVEL_TIME_PER_DISTANCE_UNIT: 1000,
  },

  // Probability thresholds
  PROBABILITY: {
    MIN_PROBABILITY: 0.1,
    MAX_PROBABILITY: 0.8,
    SIGNIFICANT_INFLUENCE: 0.3,
    INDIRECT_EFFECT_STRENGTH_MULTIPLIER: 0.5,
    INDIRECT_EFFECT_PROBABILITY_MULTIPLIER: 0.4,
    BASE_PROBABILITY_MULTIPLIER: 0.6,
  },

  // Performance limits
  PERFORMANCE: {
    MAX_CONSEQUENCES_PER_BATCH: 10,
    MAX_CASCADE_TIME: 30000, // 30 seconds
  },

  // Effect modification factors
  EFFECTS: {
    INDIRECT_MAGNITUDE_REDUCTION: 2,
    MIN_MAGNITUDE: 1,
  }
} as const

export interface CascadeProcessingOptions {
  maxCascadingLevels?: number
  maxEffectsPerLevel?: number
  probabilityThreshold?: number
  includeIndirectEffects?: boolean
}

export interface CascadeNetwork {
  primaryConsequences: AIConsequence[]
  cascadingEffects: CascadingEffect[]
  relationships: EffectRelationship[]
  metadata: {
    totalEffects: number
    maxCascadeDepth: number
    processingTime: number
  }
}

export interface EffectRelationship {
  parentId: string
  childId: string
  relationshipType: 'direct' | 'indirect' | 'amplifying' | 'mitigating'
  strength: number // 0-1
  delay: number // milliseconds
}

export interface WorldSystemInfluence {
  id: string
  systemId: string
  name: string
  connectedSystems: string[]
  influenceFactors: Record<string, number>
}

export interface CrossRegionPropagation {
  sourceRegion: string
  targetRegions: Array<{
    region: string
    distance: number
    travelTime: number
    effectDecay: number
  }>
  regionalModifiers: Record<string, number> // How effects are modified by different regions
}

export class CascadeProcessor {
  private worldSystems: Map<string, WorldSystemInfluence>
  private compactWorldSystems: Map<number, CompactWorldSystemInfluence>
  private systemNameToId: Map<string, number>
  private logger: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void
  private memoryOptimizer: MemoryOptimizedCascadeProcessor

  constructor() {
    this.worldSystems = this.initializeWorldSystems()
    this.compactWorldSystems = new Map()
    this.systemNameToId = new Map()
    this.logger = this.createLogger()
    this.memoryOptimizer = new MemoryOptimizedCascadeProcessor()
    MemoryMonitor.setBaseline()

    // Initialize compact world systems for memory efficiency
    this.initializeCompactWorldSystems()
  }

  /**
   * Process cascading effects for a set of consequences
   */
  async processCascadingEffects(
    consequences: AIConsequence[],
    options: CascadeProcessingOptions = {}
  ): Promise<CascadeNetwork> {
    const startTime = Date.now()
    this.logger('info', 'Starting cascade processing', {
      primaryConsequences: consequences.length,
      options
    })

    const defaultOptions: Required<CascadeProcessingOptions> = {
      maxCascadingLevels: CASCADE_CONFIG.MAX_CASCADING_LEVELS,
      maxEffectsPerLevel: CASCADE_CONFIG.MAX_EFFECTS_PER_LEVEL,
      probabilityThreshold: CASCADE_CONFIG.SIGNIFICANCE_THRESHOLD,
      includeIndirectEffects: true
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      // Initialize cascade network
      const network: CascadeNetwork = {
        primaryConsequences: [...consequences],
        cascadingEffects: [],
        relationships: [],
        metadata: {
          totalEffects: 0,
          maxCascadeDepth: 0,
          processingTime: 0
        }
      }

      // Process cascading effects level by level
      let currentLevel = 1
      let parentEffects: (AIConsequence | CascadingEffect)[] = consequences

      while (currentLevel <= finalOptions.maxCascadingLevels && parentEffects.length > 0) {
        this.logger('info', `Processing cascade level ${currentLevel}`, {
          parentEffects: parentEffects.length
        })

        const levelEffects = await this.generateCascadeLevel(
          parentEffects,
          currentLevel,
          finalOptions,
          network
        )

        if (levelEffects.length === 0) {
          break
        }

        network.cascadingEffects.push(...levelEffects)
        parentEffects = levelEffects
        currentLevel++
      }

      // Calculate final metadata
      network.metadata.totalEffects = network.cascadingEffects.length
      network.metadata.maxCascadeDepth = currentLevel - 1
      network.metadata.processingTime = Date.now() - startTime

      this.logger('info', 'Cascade processing completed', {
        totalEffects: network.metadata.totalEffects,
        maxDepth: network.metadata.maxCascadeDepth,
        processingTime: network.metadata.processingTime
      })

      return network
    } catch (error) {
      this.logger('error', 'Cascade processing failed', { error })

      return {
        primaryConsequences: consequences,
        cascadingEffects: [],
        relationships: [],
        metadata: {
          totalEffects: 0,
          maxCascadeDepth: 0,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Generate cascading effects for a specific level
   */
  private async generateCascadeLevel(
    parentEffects: (AIConsequence | CascadingEffect)[],
    level: number,
    options: Required<CascadeProcessingOptions>,
    network: CascadeNetwork
  ): Promise<CascadingEffect[]> {
    const levelEffects: CascadingEffect[] = []

    for (const parent of parentEffects) {
      const parentId = parent.id

      // Generate cascading effects for this parent
      const parentEffects = await this.generateEffectsForParent(
        parent as AIConsequence | CascadingEffect,
        parentId,
        level,
        options
      )

      // Filter by probability threshold
      const validEffects = parentEffects.filter(effect =>
        effect.probability >= options.probabilityThreshold
      )

      // Limit effects per parent
      const limitedEffects = validEffects
        .sort((a, b) => b.probability - a.probability)
        .slice(0, options.maxEffectsPerLevel)

      levelEffects.push(...limitedEffects)

      // Add relationships to network
      for (const effect of limitedEffects) {
        network.relationships.push({
          parentId,
          childId: effect.id,
          relationshipType: 'direct',
          strength: effect.probability,
          delay: effect.delay
        })
      }

      // Generate indirect effects if enabled
      if (options.includeIndirectEffects && level < options.maxCascadingLevels) {
        const indirectEffects = await this.generateIndirectEffects(
          limitedEffects,
          parentId,
          level,
          options
        )

        levelEffects.push(...indirectEffects)

        // Add indirect relationships
        for (const effect of indirectEffects) {
          network.relationships.push({
            parentId,
            childId: effect.id,
            relationshipType: 'indirect',
            strength: effect.probability * CASCADE_CONFIG.PROBABILITY.INDIRECT_EFFECT_STRENGTH_MULTIPLIER, // Indirect effects are weaker
            delay: effect.delay
          })
        }
      }
    }

    return levelEffects
  }

  /**
   * Generate cascading effects for a specific parent
   */
  private async generateEffectsForParent(
    parent: AIConsequence | CascadingEffect,
    parentId: string,
    level: number,
    options: Required<CascadeProcessingOptions>
  ): Promise<CascadingEffect[]> {
    let parentType: ConsequenceType
    let parentImpact: ConsequenceImpact

    if ('type' in parent) {
      parentType = parent.type
      parentImpact = parent.impact
    } else {
      parentType = this.inferTypeFromDescription(parent.description)
      parentImpact = this.inferImpactFromDescription(parent.description)
    }

    // Get world systems influenced by this consequence type
    const influencedSystems = this.getInfluencedSystems(parentType, parentImpact)

    const effects: CascadingEffect[] = []

    for (const system of influencedSystems) {
      // Generate effects based on system connections
      const systemEffects = await this.generateSystemEffects(
        system,
        parentType,
        parentImpact,
        level,
        parentId
      )

      effects.push(...systemEffects)
    }

    return effects
  }

  /**
   * Generate indirect effects (system-to-system influence)
   */
  private async generateIndirectEffects(
    directEffects: CascadingEffect[],
    parentId: string,
    level: number,
    options: Required<CascadeProcessingOptions>
  ): Promise<CascadingEffect[]> {
    const indirectEffects: CascadingEffect[] = []

    for (const effect of directEffects) {
      const effectSystems = this.getInfluencedSystemsFromImpact(effect.impact)

      // Find connected systems that might be indirectly affected
      const connectedSystems = this.findConnectedSystems(effectSystems)

      for (const connectedSystem of connectedSystems) {
        // Generate indirect effect
        const indirectEffect: CascadingEffect = {
          id: uuidv4(),
          parentConsequenceId: effect.parentConsequenceId || parentId,
          description: this.generateIndirectEffectDescription(effect, connectedSystem),
          delay: effect.delay + Math.random() * CASCADE_CONFIG.TIMING.INDIRECT_ADDITIONAL_DELAY + CASCADE_CONFIG.TIMING.BASE_DELAY, // Additional delay for indirect
          probability: effect.probability * CASCADE_CONFIG.PROBABILITY.INDIRECT_EFFECT_PROBABILITY_MULTIPLIER, // Lower probability for indirect
          impact: {
            level: this.reduceImpactLevel(effect.impact.level),
            affectedSystems: [connectedSystem.id],
            magnitude: Math.max(CASCADE_CONFIG.EFFECTS.MIN_MAGNITUDE, effect.impact.magnitude - CASCADE_CONFIG.EFFECTS.INDIRECT_MAGNITUDE_REDUCTION),
            duration: this.reduceDuration(effect.impact.duration)
          }
        }

        indirectEffects.push(indirectEffect)
      }
    }

    return indirectEffects
  }

  /**
   * Generate effects for a specific world system
   */
  private async generateSystemEffects(
    system: WorldSystemInfluence,
    parentType: ConsequenceType,
    parentImpact: ConsequenceImpact,
    level: number,
    parentId: string
  ): Promise<CascadingEffect[]> {
    const effects: CascadingEffect[] = []

    // Generate effects based on system influence factors
    for (const [connectedSystemId, influenceFactor] of Object.entries(system.influenceFactors)) {
      if (influenceFactor > CASCADE_CONFIG.PROBABILITY.SIGNIFICANT_INFLUENCE) { // Only significant influences
        const effect = await this.createCascadingEffect(
          system.id,
          connectedSystemId,
          influenceFactor,
          parentType,
          parentImpact,
          level,
          parentId
        )

        if (effect) {
          effects.push(effect)
        }
      }
    }

    return effects
  }

  /**
   * Create a cascading effect
   */
  private async createCascadingEffect(
    sourceSystemId: string,
    targetSystemId: string,
    influenceFactor: number,
    parentType: ConsequenceType,
    parentImpact: ConsequenceImpact,
    level: number,
    parentId: string
  ): Promise<CascadingEffect | null> {
    // Generate appropriate delay and probability
    const baseDelay = CASCADE_CONFIG.TIMING.BASE_DELAY + (level * CASCADE_CONFIG.TIMING.LEVEL_DELAY) // Base delay + level multiplier
    const delay = baseDelay + Math.random() * CASCADE_CONFIG.TIMING.RANDOM_DELAY_RANGE // Add randomness

    const baseProbability = Math.min(CASCADE_CONFIG.PROBABILITY.MAX_PROBABILITY, influenceFactor * CASCADE_CONFIG.PROBABILITY.BASE_PROBABILITY_MULTIPLIER)
    const probability = baseProbability * (1 / level) // Decrease probability with level

    // Skip if probability is too low
    if (probability < CASCADE_CONFIG.PROBABILITY.MIN_PROBABILITY) {
      return null
    }

    // Generate impact
    const impact = this.calculateCascadingImpact(
      sourceSystemId,
      targetSystemId,
      influenceFactor,
      parentImpact,
      level
    )

    // Generate description
    const description = this.generateCascadingEffectDescription(
      sourceSystemId,
      targetSystemId,
      impact,
      parentType
    )

    return {
      id: uuidv4(),
      parentConsequenceId: parentId,
      description,
      delay,
      probability,
      impact
    }
  }

  /**
   * Calculate cascading impact
   */
  private calculateCascadingImpact(
    sourceSystemId: string,
    targetSystemId: string,
    influenceFactor: number,
    parentImpact: ConsequenceImpact,
    level: number
  ): ConsequenceImpact {
    const magnitudeReduction = 1 + (level * 0.5) // Reduce magnitude with each level
    const cascadingMagnitude = Math.max(
      1,
      Math.floor(parentImpact.magnitude * influenceFactor / magnitudeReduction)
    )

    const cascadingLevel = this.reduceImpactLevel(parentImpact.level)
    const cascadingDuration = this.reduceDuration(parentImpact.duration)

    return {
      level: cascadingLevel,
      affectedSystems: [targetSystemId],
      magnitude: cascadingMagnitude,
      duration: cascadingDuration
    }
  }

  /**
   * Generate cascading effect description
   */
  private generateCascadingEffectDescription(
    sourceSystemId: string,
    targetSystemId: string,
    impact: ConsequenceImpact,
    parentType: ConsequenceType
  ): string {
    const system = this.worldSystems.get(targetSystemId)
    const sourceSystem = this.worldSystems.get(sourceSystemId)

    const impactAdjectives = {
      minor: ['slightly', 'a little', 'marginally'],
      moderate: ['moderately', 'notably', 'significantly'],
      major: ['strongly', 'heavily', 'intensely'],
      significant: ['very', 'extremely', 'highly'],
      critical: ['critically', 'severely', 'dramatically']
    }

    const adjectives = impactAdjectives[impact.level] || impactAdjectives.moderate
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]

    const templates = [
      `${adjective} affects the ${system?.name || targetSystemId} system`,
      `The ${sourceSystem?.name || sourceSystemId} ${adjective} influences the ${system?.name || targetSystemId}`,
      `Creates ${adjective} changes in the ${system?.name || targetSystemId}`,
      `The ${system?.name || targetSystemId} responds ${adjective} to these changes`
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  /**
   * Generate indirect effect description
   */
  private generateIndirectEffectDescription(
    directEffect: CascadingEffect,
    connectedSystem: WorldSystemInfluence
  ): string {
    const templates = [
      `Indirectly affects the ${connectedSystem.name} through system connections`,
      `The ${connectedSystem.name} experiences secondary effects`,
      `System interconnections influence the ${connectedSystem.name}`,
      `Ripple effects reach the ${connectedSystem.name} system`
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  /**
   * Get systems influenced by a consequence type
   */
  private getInfluencedSystems(type: ConsequenceType, impact: ConsequenceImpact): WorldSystemInfluence[] {
    const systems: WorldSystemInfluence[] = []

    // Direct affected systems
    for (const systemId of impact.affectedSystems) {
      const system = this.worldSystems.get(systemId)
      if (system) {
        systems.push(system)
      }
    }

    // Related systems based on type
    const typeMappings: Record<ConsequenceType, string[]> = {
      [ConsequenceType.RELATIONSHIP]: ['social', 'character'],
      [ConsequenceType.ENVIRONMENT]: ['nature', 'weather', 'location'],
      [ConsequenceType.CHARACTER]: ['social', 'relationship'],
      [ConsequenceType.WORLD_STATE]: ['social', 'economic', 'environment'],
      [ConsequenceType.ECONOMIC]: ['social', 'trade', 'market'],
      [ConsequenceType.COMBAT]: ['character', 'relationship', 'social'],
      [ConsequenceType.EXPLORATION]: ['world_state', 'environment', 'economic'],
      [ConsequenceType.SOCIAL]: ['character', 'relationship', 'community'],
      [ConsequenceType.OTHER]: ['world_state', 'general']
    }

    const relatedSystemIds = typeMappings[type] || []
    for (const systemId of relatedSystemIds) {
      const system = this.worldSystems.get(systemId)
      if (system && !systems.find(s => s.id === system.id)) {
        systems.push(system)
      }
    }

    return systems
  }

  /**
   * Get influenced systems from impact
   */
  private getInfluencedSystemsFromImpact(impact: ConsequenceImpact): string[] {
    return Array.from(new Set(impact.affectedSystems))
  }

  /**
   * Find connected systems
   */
  private findConnectedSystems(systemIds: string[]): WorldSystemInfluence[] {
    const connected: WorldSystemInfluence[] = []
    const processed = new Set<string>()

    for (const systemId of systemIds) {
      const system = this.worldSystems.get(systemId)
      if (system && !processed.has(system.id)) {
        processed.add(system.id)
        connected.push(...system.connectedSystems.map(id => this.worldSystems.get(id)).filter(Boolean))
      }
    }

    return connected
  }

  /**
   * Infer consequence type from description
   */
  private inferTypeFromDescription(description: string): ConsequenceType {
    const descLower = description.toLowerCase()

    if (descLower.includes('relationship') || descLower.includes('friend') || descLower.includes('enemy')) {
      return ConsequenceType.RELATIONSHIP
    }
    if (descLower.includes('environment') || descLower.includes('weather') || descLower.includes('forest')) {
      return ConsequenceType.ENVIRONMENT
    }
    if (descLower.includes('character') || descLower.includes('person') || descLower.includes('npc')) {
      return ConsequenceType.CHARACTER
    }
    if (descLower.includes('economy') || descLower.includes('trade') || descLower.includes('market')) {
      return ConsequenceType.ECONOMIC
    }
    if (descLower.includes('combat') || descLower.includes('fight') || descLower.includes('battle')) {
      return ConsequenceType.COMBAT
    }
    if (descLower.includes('discover') || descLower.includes('explore') || descLower.includes('find')) {
      return ConsequenceType.EXPLORATION
    }

    return ConsequenceType.WORLD_STATE
  }

  /**
   * Infer impact from description
   */
  private inferImpactFromDescription(description: string): ConsequenceImpact {
    const descLower = description.toLowerCase()

    let level = ImpactLevel.MODERATE
    let magnitude = 5

    // Determine impact level
    if (descLower.includes('critical') || descLower.includes('severe') || descLower.includes('massive')) {
      level = ImpactLevel.CRITICAL
      magnitude = 9
    } else if (descLower.includes('significant') || descLower.includes('major') || descLower.includes('dramatic')) {
      level = ImpactLevel.SIGNIFICANT
      magnitude = 7
    } else if (descLower.includes('minor') || descLower.includes('small') || descLower.includes('slight')) {
      level = ImpactLevel.MINOR
      magnitude = 2
    }

    // Determine affected systems
    const affectedSystems = ['world_state']
    if (descLower.includes('village') || descLower.includes('town')) affectedSystems.push('economic')
    if (descLower.includes('forest') || descLower.includes('nature')) affectedSystems.push('environment')
    if (descLower.includes('character') || descLower.includes('people')) affectedSystems.push('social')

    return {
      level,
      affectedSystems,
      magnitude,
      duration: DurationType.SHORT_TERM
    }
  }

  /**
   * Reduce impact level for cascading effects
   */
  private reduceImpactLevel(level: ImpactLevel): ImpactLevel {
    const levels = Object.values(ImpactLevel)
    const currentIndex = levels.indexOf(level)

    if (currentIndex > 0) {
      return levels[currentIndex - 1]
    }

    return ImpactLevel.MINOR
  }

  /**
   * Reduce duration for cascading effects
   */
  private reduceDuration(duration: DurationType): DurationType {
    const durations = [DurationType.TEMPORARY, DurationType.SHORT_TERM, DurationType.MEDIUM_TERM, DurationType.LONG_TERM, DurationType.PERMANENT]
    const currentIndex = durations.indexOf(duration)

    if (currentIndex > 0 && currentIndex < durations.length - 1) {
      return durations[currentIndex - 1]
    }

    return DurationType.TEMPORARY
  }

  /**
   * Initialize compact world systems for memory efficiency
   */
  private initializeCompactWorldSystems(): void {
    const worldSystemsArray = Array.from(this.worldSystems.values())
    this.memoryOptimizer.processWorldSystemInfluence(worldSystemsArray)

    // Update local mappings for quick access
    this.systemNameToId = new Map()
    this.compactWorldSystems = new Map()

    for (const [systemName, system] of this.worldSystems) {
      const compactSystem = this.memoryOptimizer.getCompactWorldSystem(systemName)
      if (compactSystem) {
        this.systemNameToId.set(systemName, compactSystem.id)
        this.compactWorldSystems.set(compactSystem.id, compactSystem)
      }
    }
  }

  /**
   * Initialize world systems with their connections and influences
   */
  private initializeWorldSystems(): Map<string, WorldSystemInfluence> {
    const systems = new Map<string, WorldSystemInfluence>()

    // Define world systems and their relationships
    const systemDefinitions = [
      {
        id: 'social',
        name: 'Social System',
        connectedSystems: ['relationship', 'character', 'economic', 'political'],
        influenceFactors: {
          'relationship': 0.8,
          'character': 0.9,
          'economic': 0.6,
          'political': 0.7,
          'environment': 0.2
        }
      },
      {
        id: 'environment',
        name: 'Environment System',
        connectedSystems: ['nature', 'weather', 'location', 'resources'],
        influenceFactors: {
          'nature': 0.9,
          'weather': 0.7,
          'location': 0.8,
          'resources': 0.6,
          'social': 0.3
        }
      },
      {
        id: 'economic',
        name: 'Economic System',
        connectedSystems: ['trade', 'market', 'resources', 'social'],
        influenceFactors: {
          'trade': 0.8,
          'market': 0.7,
          'resources': 0.6,
          'social': 0.5,
          'political': 0.4
        }
      },
      {
        id: 'world_state',
        name: 'World State System',
        connectedSystems: ['social', 'economic', 'environment', 'political'],
        influenceFactors: {
          'social': 0.4,
          'economic': 0.3,
          'environment': 0.3,
          'political': 0.4,
          'character': 0.5
        }
      },
      {
        id: 'relationship',
        name: 'Relationship System',
        connectedSystems: ['social', 'character', 'family'],
        influenceFactors: {
          'social': 0.9,
          'character': 0.8,
          'family': 0.7,
          'economic': 0.3
        }
      },
      {
        id: 'character',
        name: 'Character System',
        connectedSystems: ['social', 'relationship', 'economic'],
        influenceFactors: {
          'social': 0.8,
          'relationship': 0.8,
          'economic': 0.4,
          'political': 0.3
        }
      },
      {
        id: 'combat',
        name: 'Combat System',
        connectedSystems: ['character', 'relationship', 'social', 'economic'],
        influenceFactors: {
          'character': 0.9,
          'relationship': 0.7,
          'social': 0.6,
          'economic': 0.4
        }
      },
      {
        id: 'exploration',
        name: 'Exploration System',
        connectedSystems: ['world_state', 'environment', 'economic'],
        influenceFactors: {
          'world_state': 0.6,
          'environment': 0.5,
          'economic': 0.4,
          'social': 0.3
        }
      }
    ]

    for (const def of systemDefinitions) {
      systems.set(def.id, {
        id: def.id,
        systemId: def.id,
        name: def.name,
        connectedSystems: def.connectedSystems,
        influenceFactors: def.influenceFactors
      })
    }

    return systems
  }

  /**
   * Generate Butterfly Effect Visualization Data (Story 3.3)
   *
   * Creates comprehensive visualization data for frontend consumption including
   * nodes, connections, temporal progression, and emergent opportunities.
   */
  async generateButterflyEffectVisualization(
    actionId: string,
    actionDescription: string,
    consequences: AIConsequence[],
    network?: CascadeNetwork
  ): Promise<CascadeVisualizationData> {
    this.logger('info', 'Generating butterfly effect visualization', {
      actionId,
      consequenceCount: consequences.length
    })

    const startTime = Date.now()
    MemoryMonitor.recordMeasurement() // Record baseline memory usage

    // Process cascading effects if not provided
    const cascadeNetwork = network || await this.processCascadingEffects(consequences)

    // Generate visualization nodes with memory optimization
    const nodes = await this.generateVisualizationNodes(actionId, actionDescription, cascadeNetwork)

    // Generate connections between nodes
    const connections = await this.generateVisualizationConnections(cascadeNetwork)

    // Create temporal progression data
    const temporalProgression = this.generateTemporalProgression(nodes, connections)

    // Calculate cross-region effects
    const crossRegionEffects = this.calculateCrossRegionEffects(nodes)

    // Generate emergent opportunities
    const emergentOpportunities = this.generateEmergentOpportunities(nodes, connections)

    // Record final memory usage and generate performance metrics
    MemoryMonitor.recordMeasurement()
    const memoryStats = this.memoryOptimizer.getMemoryStats()
    const compactSystemStats = this.memoryOptimizer.getCompactWorldSystemStats()
    const finalMemoryUsage = process.memoryUsage()

    const visualizationData: CascadeVisualizationData = {
      rootNode: nodes[0], // Action node is always first
      nodes,
      connections,
      temporalProgression,
      crossRegionEffects,
      emergentOpportunities,
      metadata: {
        totalNodes: nodes.length,
        totalConnections: connections.length,
        maxCascadeDepth: this.calculateMaxCascadeDepth(nodes),
        processingTime: Date.now() - startTime,
        lastUpdated: new Date().toISOString(),
        // Add memory usage and performance metrics
        performance: {
          memoryUsage: {
            initial: MemoryMonitor.getMemoryDelta(),
            final: {
              rss: finalMemoryUsage.rss,
              heapUsed: finalMemoryUsage.heapUsed,
              heapTotal: finalMemoryUsage.heapTotal,
              external: finalMemoryUsage.external,
              arrayBuffers: finalMemoryUsage.arrayBuffers
            },
            peak: MemoryMonitor.getAverageMemoryUsage(),
            optimization: {
              ...memoryStats,
              compactWorldSystems: compactSystemStats
            }
          },
          nodePoolStats: memoryStats.nodePool,
          cacheEfficiency: {
            hitRate: memoryStats.cache?.hitRate || 0,
            totalRequests: (memoryStats.cache?.hits || 0) + (memoryStats.cache?.misses || 0)
          }
        }
      }
    }

    this.logger('info', 'Butterfly effect visualization generated with memory optimization', {
      totalNodes: visualizationData.metadata.totalNodes,
      totalConnections: visualizationData.metadata.totalConnections,
      processingTime: visualizationData.metadata.processingTime,
      memoryOptimization: {
        nodeReuseRate: memoryStats.nodePool?.reuseRate || 0,
        cacheHitRate: memoryStats.cache?.hitRate || 0,
        finalMemoryUsage: finalMemoryUsage.heapUsed
      }
    })

    return visualizationData
  }

  /**
   * Generate visualization nodes from consequences and cascading effects
   */
  private async generateVisualizationNodes(
    actionId: string,
    actionDescription: string,
    network: CascadeNetwork
  ): Promise<ButterflyEffectNode[]> {
    const nodes: ButterflyEffectNode[] = []

    // Create root action node
    const rootNode: ButterflyEffectNode = {
      id: actionId,
      type: 'action',
      position: { x: 0, y: 0, layer: 0 },
      metadata: {
        title: 'Player Action',
        description: actionDescription,
        severity: ImpactLevel.MINOR,
        confidence: 1.0,
        affectedSystems: [],
        affectedRegions: [],
        duration: DurationType.TEMPORARY,
        magnitude: 1
      },
      visualProperties: {
        color: '#4CAF50', // Green for player actions
        size: 20,
        opacity: 1.0,
        pulseSpeed: 2.0
      }
    }
    nodes.push(rootNode)

    // Use memory-optimized node generation
    this.generateNodesWithOptimization(network, nodes)

    return nodes
  }

  /**
   * Enhanced memory-optimized node generation with compact data structures
   */
  private generateNodesWithOptimization(network: CascadeNetwork, nodes: ButterflyEffectNode[]): void {
    // Create nodes for primary consequences using enhanced object pooling
    for (let i = 0; i < network.primaryConsequences.length; i++) {
      const consequence = network.primaryConsequences[i]
      const angle = (2 * Math.PI * i) / network.primaryConsequences.length
      const distance = 150

      const node = this.createOptimizedConsequenceNode(consequence, {
        x: distance * Math.cos(angle),
        y: distance * Math.sin(angle),
        layer: 1 // Primary level
      })
      nodes.push(node)
    }

    // Create nodes for cascading effects with enhanced memory efficiency
    for (let i = 0; i < network.cascadingEffects.length; i++) {
      const effect = network.cascadingEffects[i]
      const parentIndex = nodes.findIndex(n => n.id === effect.parentConsequenceId)

      if (parentIndex >= 0) {
        const parentNode = nodes[parentIndex]
        const angle = (2 * Math.PI * i) / Math.max(1, network.cascadingEffects.length - 1)
        const distance = 100

        const node = this.createOptimizedCascadingEffectNode(effect, {
          x: parentNode.position.x + distance * Math.cos(angle),
          y: parentNode.position.y + distance * Math.sin(angle),
          layer: 2 // Secondary level
        })
        nodes.push(node)
      }
    }

    // Log memory optimization statistics
    const memoryStats = this.memoryOptimizer.getMemoryStats()
    this.logger('info', 'Generated optimized nodes with memory efficiency', {
      totalNodes: nodes.length,
      nodePoolReuseRate: memoryStats.nodePool.reuseRate,
      compactWorldSystems: this.compactWorldSystems.size,
      memoryDelta: MemoryMonitor.getMemoryDelta()
    })
  }

  /**
   * Create visualization connections between nodes
   */
  private async generateVisualizationConnections(
    network: CascadeNetwork
  ): Promise<EffectConnection[]> {
    const connections: EffectConnection[] = []

    // Create connections from action to primary consequences
    for (const relationship of network.relationships) {
      const connection: EffectConnection = {
        id: uuidv4(),
        sourceNodeId: relationship.parentId,
        targetNodeId: relationship.childId,
        relationshipType: relationship.relationshipType,
        strength: relationship.strength,
        delay: relationship.delay,
        probability: 0.8, // Default probability
        visualProperties: {
          color: this.getConnectionColor(relationship.relationshipType),
          thickness: Math.max(1, Math.floor(relationship.strength * 5)),
          dashPattern: this.getDashPattern(relationship.relationshipType),
          animationType: 'curved'
        },
        temporalData: {
          startTime: relationship.delay,
          endTime: relationship.delay + CASCADE_CONFIG.TIMING.ANIMATION_DURATION, // 2 second animation
          animationDuration: CASCADE_CONFIG.TIMING.ANIMATION_DURATION
        }
      }
      connections.push(connection)
    }

    return connections
  }

  /**
   * Generate temporal progression data for animations
   */
  private generateTemporalProgression(
    nodes: ButterflyEffectNode[],
    connections: EffectConnection[]
  ): CascadeVisualizationData['temporalProgression'] {
    const totalDuration = Math.max(
      ...connections.map(c => c.temporalData.endTime),
      15000 // Default 15 second total duration
    )

    const keyFrames: CascadeVisualizationData['temporalProgression']['keyFrames'] = []

    // Generate keyframes at 2-second intervals
    for (let time = 0; time <= totalDuration; time += CASCADE_CONFIG.TIMING.TIME_STEP_INCREMENT) {
      const activeNodes = nodes.filter(n => {
        // Nodes are active immediately (no delay for nodes)
        return true
      }).map(n => n.id)

      const activeConnections = connections
        .filter(c => time >= c.temporalData.startTime && time <= c.temporalData.endTime)
        .map(c => c.id)

      keyFrames.push({
        time,
        activeNodes,
        activeConnections
      })
    }

    return {
      totalDuration,
      keyFrames
    }
  }

  /**
   * Calculate cross-region effects for butterfly effect propagation
   */
  private calculateCrossRegionEffects(nodes: ButterflyEffectNode[]): CascadeVisualizationData['crossRegionEffects'] {
    const crossRegionEffects: CascadeVisualizationData['crossRegionEffects'] = []

    for (const node of nodes) {
      if (node.metadata.affectedRegions.length > 1) {
        const primaryRegion = node.metadata.affectedRegions[0]

        for (let i = 1; i < node.metadata.affectedRegions.length; i++) {
          const targetRegion = node.metadata.affectedRegions[i]
          const distance = this.calculateRegionalDistance(primaryRegion, targetRegion)
          const travelTime = distance * CASCADE_CONFIG.TIMING.TRAVEL_TIME_PER_DISTANCE_UNIT // 1 second per distance unit

          crossRegionEffects.push({
            nodeId: node.id,
            sourceRegion: primaryRegion,
            targetRegion,
            travelTime
          })
        }
      }
    }

    return crossRegionEffects
  }

  /**
   * Generate emergent gameplay opportunities from butterfly effects
   */
  private generateEmergentOpportunities(
    nodes: ButterflyEffectNode[],
    connections: EffectConnection[]
  ): CascadeVisualizationData['emergentOpportunities'] {
    const opportunities: CascadeVisualizationData['emergentOpportunities'] = []

    // Look for combinations that create new gameplay possibilities
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]

        // Check for interesting combinations
        if (this.createEmergentOpportunity(node1, node2)) {
          const opportunity = this.createEmergentOpportunity(node1, node2)
          if (opportunity) {
            opportunities.push(opportunity)
          }
        }
      }
    }

    return opportunities
  }

  /**
   * Create a visualization node from a consequence
   */
  private createConsequenceNode(
    consequence: AIConsequence,
    x: number,
    y: number,
    layer: number
  ): ButterflyEffectNode {
    return {
      id: consequence.id,
      type: 'consequence',
      position: { x, y, layer },
      metadata: {
        title: this.getConsequenceTitle(consequence.type),
        description: consequence.description,
        severity: consequence.impact.level,
        confidence: consequence.confidence,
        affectedSystems: [consequence.type],
        affectedRegions: consequence.impact.affectedLocations || [],
        duration: consequence.impact.duration,
        magnitude: consequence.impact.magnitude
      },
      visualProperties: {
        color: this.getConsequenceColor(consequence.type, consequence.impact.level),
        size: Math.max(10, consequence.impact.magnitude * 3),
        opacity: Math.max(0.3, consequence.confidence),
        pulseSpeed: consequence.impact.magnitude > 7 ? 3.0 : 1.5
      }
    }
  }

  /**
   * Create a visualization node from a cascading effect
   */
  private createCascadingEffectNode(
    effect: CascadingEffect,
    x: number,
    y: number,
    layer: number
  ): ButterflyEffectNode {
    return {
      id: effect.id,
      type: 'cascading_effect',
      position: { x, y, layer },
      metadata: {
        title: 'Secondary Effect',
        description: effect.description,
        severity: effect.impact.level,
        confidence: effect.probability,
        affectedSystems: effect.impact.affectedSystems as ConsequenceType[],
        affectedRegions: [],
        duration: effect.impact.duration,
        magnitude: effect.impact.magnitude
      },
      visualProperties: {
        color: this.getConsequenceColor(effect.impact.affectedSystems[0] as ConsequenceType, effect.impact.level),
        size: Math.max(8, effect.impact.magnitude * 2),
        opacity: Math.max(0.2, effect.probability),
        pulseSpeed: 1.0
      }
    }
  }

  /**
   * Helper methods for visualization properties
   */
  private getConsequenceTitle(type: ConsequenceType): string {
    const titles = {
      [ConsequenceType.RELATIONSHIP]: 'Relationship Change',
      [ConsequenceType.ENVIRONMENT]: 'Environmental Effect',
      [ConsequenceType.CHARACTER]: 'Character Impact',
      [ConsequenceType.WORLD_STATE]: 'World Change',
      [ConsequenceType.ECONOMIC]: 'Economic Impact',
      [ConsequenceType.SOCIAL]: 'Social Effect',
      [ConsequenceType.COMBAT]: 'Combat Outcome',
      [ConsequenceType.EXPLORATION]: 'Discovery',
      [ConsequenceType.OTHER]: 'Unknown Effect'
    }
    return titles[type] || 'Unknown Effect'
  }

  private getConsequenceColor(type: ConsequenceType, severity: ImpactLevel): string {
    const colors = {
      [ConsequenceType.RELATIONSHIP]: '#2196F3', // Blue
      [ConsequenceType.ENVIRONMENT]: '#4CAF50', // Green
      [ConsequenceType.CHARACTER]: '#9C27B0', // Purple
      [ConsequenceType.WORLD_STATE]: '#FF9800', // Orange
      [ConsequenceType.ECONOMIC]: '#F44336', // Red
      [ConsequenceType.SOCIAL]: '#00BCD4', // Cyan
      [ConsequenceType.COMBAT]: '#FF5722', // Deep Orange
      [ConsequenceType.EXPLORATION]: '#795548', // Brown
      [ConsequenceType.OTHER]: '#607D8B' // Blue Grey
    }

    const baseColor = colors[type] || colors[ConsequenceType.OTHER]

    // Adjust opacity based on severity
    const severityOpacity = {
      [ImpactLevel.MINOR]: 0.4,
      [ImpactLevel.MODERATE]: 0.6,
      [ImpactLevel.MAJOR]: 0.8,
      [ImpactLevel.SIGNIFICANT]: 0.9,
      [ImpactLevel.CRITICAL]: 1.0
    }

    return baseColor
  }

  private getConnectionColor(relationshipType: string): string {
    const colors = {
      'direct': '#4CAF50',
      'indirect': '#2196F3',
      'amplifying': '#FF9800',
      'mitigating': '#F44336',
      'delayed': '#9C27B0'
    }
    return colors[relationshipType as keyof typeof colors] || '#607D8B'
  }

  private getDashPattern(relationshipType: string): 'solid' | 'dashed' | 'dotted' {
    const patterns: Record<string, 'solid' | 'dashed' | 'dotted'> = {
      'direct': 'solid',
      'indirect': 'dashed',
      'amplifying': 'solid',
      'mitigating': 'dotted',
      'delayed': 'dashed'
    }
    return patterns[relationshipType] || 'solid'
  }

  private calculateMaxCascadeDepth(nodes: ButterflyEffectNode[]): number {
    return Math.max(...nodes.map(n => n.position.layer))
  }

  private calculateRegionalDistance(region1: string, region2: string): number {
    // Simplified distance calculation - could be enhanced with actual map data
    const regionCoordinates: Record<string, { x: number; y: number }> = {
      'village': { x: 0, y: 0 },
      'forest': { x: 5, y: 3 },
      'mountain': { x: -3, y: 7 },
      'river': { x: 4, y: -2 },
      'castle': { x: -2, y: 1 },
      'market': { x: 2, y: -1 },
      'town': { x: 3, y: 2 }
    }

    const coord1 = regionCoordinates[region1] || { x: 0, y: 0 }
    const coord2 = regionCoordinates[region2] || { x: 0, y: 0 }

    return Math.sqrt(
      Math.pow(coord2.x - coord1.x, 2) + Math.pow(coord2.y - coord1.y, 2)
    )
  }

  private createEmergentOpportunity(
    node1: ButterflyEffectNode,
    node2: ButterflyEffectNode
  ): CascadeVisualizationData['emergentOpportunities'][0] | null {
    // Simple emergent opportunity detection
    const systems1 = node1.metadata.affectedSystems
    const systems2 = node2.metadata.affectedSystems

    // Check for complementary systems
    if (
      (systems1.includes(ConsequenceType.ECONOMIC) && systems2.includes(ConsequenceType.SOCIAL)) ||
      (systems1.includes(ConsequenceType.SOCIAL) && systems2.includes(ConsequenceType.ECONOMIC))
    ) {
      return {
        id: uuidv4(),
        title: 'Market Social Event',
        description: 'Economic and social changes create opportunity for community gathering',
        requiredConditions: ['Economic stability', 'Social harmony'],
        potentialOutcomes: ['Increased prosperity', 'Improved relationships'],
        relatedNodes: [node1.id, node2.id]
      }
    }

    if (
      (systems1.includes(ConsequenceType.ENVIRONMENT) && systems2.includes(ConsequenceType.EXPLORATION)) ||
      (systems1.includes(ConsequenceType.EXPLORATION) && systems2.includes(ConsequenceType.ENVIRONMENT))
    ) {
      return {
        id: uuidv4(),
        title: 'Hidden Discovery',
        description: 'Environmental changes reveal new areas to explore',
        requiredConditions: ['Environmental change', 'Curiosity'],
        potentialOutcomes: ['New locations', 'Rare resources'],
        relatedNodes: [node1.id, node2.id]
      }
    }

    return null
  }

  /**
   * Memory-optimized consequence node creation
   */
  private createOptimizedConsequenceNode(
    consequence: AIConsequence | CascadingEffect,
    position: { x: number; y: number; layer?: number }
  ): ButterflyEffectNode {
    // Use memory-optimized node pool for basic structure
    const nodeType = 'type' in consequence ? consequence.type : this.inferTypeFromDescription(consequence.description)
    const pooledNode = this.memoryOptimizer.createOptimizedNode({
      id: consequence.id,
      type: nodeType,
      title: consequence.description.substring(0, 50), // Limit title length
      description: consequence.description,
      level: position.layer || 0,
      region: 'unknown'
    })

    // Set impact data separately to keep node small
    pooledNode.impact = {
      magnitude: consequence.impact.magnitude,
      significance: consequence.impact.magnitude / 10, // Use magnitude as significance proxy
      affectedSystems: consequence.impact.affectedSystems
    }

    // Set position data
    pooledNode.position = {
      x: Math.round(position.x * 100) / 100,
      y: Math.round(position.y * 100) / 100
    }

    // Add metadata
    const confidence = 'confidence' in consequence ? consequence.confidence : 0.5
    pooledNode.metadata = {
      title: consequence.description.substring(0, 50),
      description: consequence.description,
      severity: consequence.impact.level,
      confidence,
      affectedSystems: [nodeType],
      affectedRegions: consequence.impact.affectedLocations || [],
      duration: consequence.impact.duration,
      magnitude: consequence.impact.magnitude
    }

    // Add visual properties to complete ButterflyEffectNode interface
    pooledNode.visualProperties = {
      color: this.getConsequenceColor(nodeType, consequence.impact.level),
      size: Math.max(10, consequence.impact.magnitude * 3),
      opacity: Math.max(0.3, confidence),
      pulseSpeed: consequence.impact.magnitude > 7 ? 3.0 : 1.5
    }

    return pooledNode as ButterflyEffectNode
  }

  /**
   * Memory-optimized cascading effect node creation
   */
  private createOptimizedCascadingEffectNode(
    effect: CascadingEffect,
    position: { x: number; y: number; layer?: number }
  ): ButterflyEffectNode {
    const pooledNode = this.memoryOptimizer.createOptimizedNode({
      id: effect.id,
      type: 'cascading_effect',
      title: effect.description.substring(0, 30), // Shorter title for cascading effects
      description: effect.description,
      level: position.layer || 2,
      region: 'unknown'
    })

    // Compact impact data
    pooledNode.impact = {
      magnitude: effect.impact.magnitude,
      significance: effect.impact.magnitude / 10, // Use magnitude as significance proxy
      affectedSystems: effect.impact.affectedSystems
    }

    // Compact position data
    pooledNode.position = {
      x: Math.round(position.x * 100) / 100,
      y: Math.round(position.y * 100) / 100
    }

    // Add metadata
    pooledNode.metadata = {
      title: effect.description.substring(0, 30),
      description: effect.description,
      severity: effect.impact.level,
      confidence: effect.probability,
      affectedSystems: effect.impact.affectedSystems as ConsequenceType[],
      affectedRegions: [],
      duration: effect.impact.duration,
      magnitude: effect.impact.magnitude
    }

    // Add visual properties to complete ButterflyEffectNode interface
    const effectType = effect.impact.affectedSystems[0] as ConsequenceType
    pooledNode.visualProperties = {
      color: this.getConsequenceColor(effectType, effect.impact.level),
      size: Math.max(8, effect.impact.magnitude * 2),
      opacity: Math.max(0.2, effect.probability),
      pulseSpeed: 1.0
    }

    return pooledNode as ButterflyEffectNode
  }

  /**
   * Create logger function
   */
  private createLogger() {
    return (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [CascadeProcessor] [${level.toUpperCase()}] ${message}`, data || '')
    }
  }
}

export default CascadeProcessor