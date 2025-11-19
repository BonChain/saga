/**
 * Action-Character Integration - Story 4.1: Character Memory & Relationship Tracking
 *
 * Integrates character memory and relationship tracking with existing action processing.
 * Hooks into the existing action submission pipeline to automatically create character memories
 * and update relationships when actions affect NPCs.
 */

import { Logger } from 'winston'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'

import {
  Character,
  Personality,
  EmotionalImpact,
  MemoryCreateParams,
  RelationshipScores
} from '../models/character'
import { CharacterService } from './character-service'
import { RelationshipManager } from './relationship-manager'

export interface ActionData {
  playerId: string
  intent: string
  originalInput: string
  parsedIntent?: {
    actionType?: string
    target?: string
    method?: string
    confidence?: number
  }
  actionId?: string
  timestamp?: number
}

export interface ConsequenceData {
  id: string
  actionId: string
  consequences: Array<{
    id: string
    actionId: string
    type: string
    description: string
    impact: 'positive' | 'negative' | 'neutral'
    affectedCharacters?: string[]
    affectedRegions?: string[]
    changes?: Record<string, any>
  }>
  timestamp: number
}

export interface CharacterMemoryAction {
  characterId: string
  memory: MemoryCreateParams
  relationshipUpdates: Array<{
    targetId: string
    changes: Partial<RelationshipScores>
  }>
}

export interface ActionCharacterIntegrationConfig {
  logger: Logger
  characterService: CharacterService
  relationshipManager: RelationshipManager
  enableAutoMemoryCreation?: boolean
  enableAutoRelationshipUpdates?: boolean
  memoryCreationDelay?: number  // Delay in ms to allow consequence processing
}

export class ActionCharacterIntegration {
  public config: ActionCharacterIntegrationConfig
  private logger: Logger

  constructor(config: ActionCharacterIntegrationConfig) {
    this.config = config
    this.logger = config.logger
  }

  /**
   * Process action and create character memories and relationship updates
   * This method should be called after action submission and consequence generation
   */
  async processActionForCharacters(
    actionData: ActionData,
    consequences?: ConsequenceData[]
  ): Promise<void> {
    this.logger.info(`Processing action for character memory creation`, {
      actionId: actionData.actionId,
      playerId: actionData.playerId,
      intent: actionData.intent
    })

    try {
      // Extract characters affected by this action
      const affectedCharacters = await this.extractAffectedCharacters(actionData, consequences)

      // Create memories for each affected character
      const memoryActions = await this.createMemoryActions(actionData, affectedCharacters)

      // Process each memory action
      for (const memoryAction of memoryActions) {
        await this.processMemoryAction(memoryAction)
      }

      this.logger.info(`Action processed for characters`, {
        actionId: actionData.actionId,
        memoriesCreated: memoryActions.length,
        affectedCharacters: affectedCharacters.length
      })

    } catch (error) {
      this.logger.error(`Failed to process action for characters`, {
        actionId: actionData.actionId,
        error: (error instanceof Error ? error.message : String(error))
      })
      // Don't throw error - character memory creation shouldn't break action processing
    }
  }

  /**
   * Process consequences and create additional character memories
   */
  async processConsequencesForCharacters(
    actionData: ActionData,
    consequenceData: ConsequenceData[]
  ): Promise<void> {
    this.logger.info(`Processing consequences for character memory creation`, {
      actionId: actionData.actionId,
      consequenceCount: consequenceData.length
    })

    try {
      for (const consequence of consequenceData) {
        await this.processSingleConsequence(actionData, consequence)
      }

      this.logger.info(`Consequences processed for characters`, {
        actionId: actionData.actionId,
        consequenceCount: consequenceData.length
      })

    } catch (error) {
      this.logger.error(`Failed to process consequences for characters`, {
        actionId: actionData.actionId,
        error: (error instanceof Error ? error.message : String(error))
      })
    }
  }

  /**
   * Extract characters affected by an action
   */
  private async extractAffectedCharacters(
    actionData: ActionData,
    consequences?: ConsequenceData[]
  ): Promise<string[]> {
    const affectedCharacters = new Set<string>()

    // Extract target from parsed intent
    if (actionData.parsedIntent?.target) {
      const target = actionData.parsedIntent.target.toLowerCase()

      // Look for characters that match the target
      // In a full implementation, this would query the character database
      const possibleCharacters = await this.findCharactersByName(target)
      possibleCharacters.forEach(char => affectedCharacters.add(char))
    }

    // Extract affected characters from consequences
    if (consequences) {
      for (const consequenceData of consequences) {
        if (consequenceData.consequences) {
          for (const consequence of consequenceData.consequences) {
            if (consequence.affectedCharacters) {
              consequence.affectedCharacters.forEach(char => affectedCharacters.add(char))
            }
          }
        }
      }
    }

    // Extract character mentions from original input
    const mentions = await this.extractCharacterMentions(actionData.originalInput)
    mentions.forEach(char => affectedCharacters.add(char))

    return Array.from(affectedCharacters)
  }

  /**
   * Create memory actions for each affected character
   */
  private async createMemoryActions(
    actionData: ActionData,
    affectedCharacters: string[]
  ): Promise<CharacterMemoryAction[]> {
    const memoryActions: CharacterMemoryAction[] = []

    for (const characterId of affectedCharacters) {
      const character = await this.config.characterService.getCharacter(characterId)
      if (!character) {
        continue
      }

      // Create memory for this character
      const memoryParams: MemoryCreateParams = {
        characterId,
        playerId: actionData.playerId,
        action: actionData.intent,
        actionType: this.mapActionType(actionData.parsedIntent?.actionType),
        location: 'unknown', // Would be extracted from action or character state
        description: this.generateMemoryDescription(actionData, character),
        emotionalImpact: this.calculateEmotionalImpact(actionData, character),
        context: {
          otherCharactersPresent: affectedCharacters.filter(id => id !== characterId),
          environmentalConditions: 'unknown',
          worldStateSnapshot: undefined // Would be captured from current world state
        }
      }

      // Calculate relationship updates
      const relationshipUpdates = await this.calculateRelationshipUpdates(
        character,
        actionData
      )

      memoryActions.push({
        characterId,
        memory: memoryParams,
        relationshipUpdates
      })
    }

    return memoryActions
  }

  /**
   * Process a single memory action
   */
  private async processMemoryAction(memoryAction: CharacterMemoryAction): Promise<void> {
    this.logger.debug(`Processing memory action`, {
      characterId: memoryAction.characterId,
      memoryType: memoryAction.memory.actionType
    })

    try {
      // Create the memory
      if (this.config.enableAutoMemoryCreation !== false) {
        await this.config.characterService.addMemory(memoryAction.memory)
      }

      // Apply relationship updates
      if (this.config.enableAutoRelationshipUpdates !== false) {
        for (const update of memoryAction.relationshipUpdates) {
          await this.config.characterService.updateRelationshipScore(
            memoryAction.characterId,
            update.targetId,
            update.changes
          )
        }
      }

    } catch (error) {
      this.logger.error(`Failed to process memory action`, {
        characterId: memoryAction.characterId,
        error: (error instanceof Error ? error.message : String(error))
      })
    }
  }

  /**
   * Process a single consequence
   */
  private async processSingleConsequence(
    actionData: ActionData,
    consequenceData: ConsequenceData
  ): Promise<void> {
    if (!consequenceData.consequences || consequenceData.consequences.length === 0) {
      return
    }

    for (const consequence of consequenceData.consequences) {
      if (!consequence.affectedCharacters || consequence.affectedCharacters.length === 0) {
        continue
      }

      for (const characterId of consequence.affectedCharacters) {
      const character = await this.config.characterService.getCharacter(characterId)
      if (!character) {
        continue
      }

      // Create memory about the consequence
      const memoryParams: MemoryCreateParams = {
        characterId,
        playerId: actionData.playerId,
        action: `Experienced: ${consequence.description}`,
        actionType: 'other',
        location: 'unknown',
        description: `Witnessed/Experienced consequence: ${consequence.description}`,
        emotionalImpact: this.mapConsequenceImpact(consequence.impact),
        context: {
          otherCharactersPresent: consequence.affectedCharacters.filter(id => id !== characterId),
          environmentalConditions: 'unknown',
          worldStateSnapshot: {
            consequenceId: consequence.id,
            actionId: consequenceData.actionId
          }
        }
      }

      try {
        await this.config.characterService.addMemory(memoryParams)
      } catch (error) {
        this.logger.error(`Failed to create consequence memory`, {
          characterId,
          consequenceId: consequence.id,
          error: (error instanceof Error ? error.message : String(error))
        })
      }
      }
    }
  }

  /**
   * Helper methods
   */

  private async findCharactersByName(_name: string): Promise<string[]> {
    // In a full implementation, this would search the character database
    // For now, return empty array to be implemented later
    return []
  }

  private async extractCharacterMentions(_text: string): Promise<string[]> {
    // In a full implementation, this would use NLP to extract character mentions
    // For now, return empty array to be implemented later
    return []
  }

  private mapActionType(actionType?: string): MemoryCreateParams['actionType'] {
    const typeMap: Record<string, MemoryCreateParams['actionType']> = {
      'combat': 'combat',
      'attack': 'combat',
      'fight': 'combat',
      'social': 'social',
      'talk': 'social',
      'speak': 'social',
      'trade': 'trade',
      'buy': 'trade',
      'sell': 'trade',
      'help': 'help',
      'assist': 'help',
      'give': 'gift',
      'betray': 'betrayal',
      'steal': 'betrayal'
    }

    if (!actionType) {
      return 'other'
    }

    const lowerType = actionType.toLowerCase()
    return typeMap[lowerType] || 'other'
  }

  private generateMemoryDescription(actionData: ActionData, character: Character): string {
    const action = (actionData.parsedIntent as { action?: string; method?: string } | undefined)?.action || 'interacted with'
    const method = (actionData.parsedIntent as { action?: string; method?: string } | undefined)?.method || ''

    if (method) {
      return `${actionData.playerId} ${action} ${character.name} using ${method}`
    } else {
      return `${actionData.playerId} ${action} ${character.name}`
    }
  }

  private calculateEmotionalImpact(actionData: ActionData, character: Character): EmotionalImpact {
    // Base impact on character personality and action type
    const actionType = actionData.parsedIntent?.actionType?.toLowerCase() || ''
    const personality = character.personality

    // Personality-based reaction patterns
    switch (personality) {
      case Personality.AGGRESSIVE:
        if (actionType.includes('combat') || actionType.includes('attack')) {
          return EmotionalImpact.POSITIVE
        }
        if (actionType.includes('help') || actionType.includes('gift')) {
          return EmotionalImpact.NEUTRAL
        }
        return EmotionalImpact.NEGATIVE

      case Personality.FRIENDLY:
        if (actionType.includes('help') || actionType.includes('gift')) {
          return EmotionalImpact.VERY_POSITIVE
        }
        if (actionType.includes('combat') || actionType.includes('attack')) {
          return EmotionalImpact.NEGATIVE
        }
        return EmotionalImpact.POSITIVE

      case Personality.CAUTIOUS:
        if (actionType.includes('combat') || actionType.includes('attack')) {
          return EmotionalImpact.VERY_NEGATIVE
        }
        return EmotionalImpact.NEUTRAL

      default:
        return EmotionalImpact.NEUTRAL
    }
  }

  private mapConsequenceImpact(impact: string): EmotionalImpact {
    switch (impact) {
      case 'positive':
        return EmotionalImpact.POSITIVE
      case 'negative':
        return EmotionalImpact.NEGATIVE
      case 'neutral':
      default:
        return EmotionalImpact.NEUTRAL
    }
  }

  private async calculateRelationshipUpdates(
    character: Character,
    actionData: ActionData
  ): Promise<Array<{ targetId: string; changes: Partial<RelationshipScores> }>> {
    const updates: Array<{ targetId: string; changes: Partial<RelationshipScores> }> = []

    if (!actionData.playerId) {
      return updates
    }

    // Calculate relationship change with player
    const changes = await this.config.relationshipManager.calculateScoreChangesFromMemory({
      id: uuidv4(),
      characterId: character.id,
      playerId: actionData.playerId,
      action: actionData.intent,
      actionType: this.mapActionType(actionData.parsedIntent?.actionType),
      timestamp: Date.now(),
      location: 'unknown',
      description: actionData.originalInput,
      emotionalImpact: this.calculateEmotionalImpact(actionData, character),
      context: {},
      isActive: true
    })

    updates.push({
      targetId: actionData.playerId,
      changes
    })

    return updates
  }
}

/**
 * Middleware function to integrate with existing action endpoints
 */
export function createActionCharacterMiddleware(integration: ActionCharacterIntegration) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original data for character processing
    res.locals.originalActionData = {
      playerId: req.body.playerId,
      intent: req.body.intent,
      originalInput: req.body.originalInput,
      parsedIntent: req.body.parsedIntent,
      actionId: uuidv4(),
      timestamp: Date.now()
    }

    // Hook into the response
    const originalSend = res.send
    res.send = function(data: unknown) {
      // Process character integration after successful response
      if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.originalActionData) {
        // Delay processing to allow consequences to be generated
        setTimeout(() => {
          integration.processActionForCharacters(res.locals.originalActionData)
            .catch(error => {
              // Log but don't affect the response
              console.error('Character integration error:', error)
            })
        }, integration.config.memoryCreationDelay || 1000)
      }

      return originalSend.call(this, data)
    }

    next()
  }
}