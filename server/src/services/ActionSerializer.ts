/**
 * Action Serializer Service
 *
 * Converts action objects to blockchain-compatible format with metadata structure
 * Implements validation for action data completeness before storage
 */

import { Action, Consequence } from '../types/storage'

export interface SerializedAction {
  id: string
  playerId: string
  intent: string
  originalInput: string
  timestamp: string
  status: string
  consequences?: Consequence[]
  metadata: {
    confidence: number
    parsedIntent?: any
    serializedAt: string
    version: string
    worldStateVersion: number
    cryptographicHash?: string
    digitalSignature?: string
    previousActionId?: string
  }
}

export interface ValidationResult {
  isValid: boolean
  missingFields: string[]
  errors: string[]
}

export class ActionSerializer {
  private static readonly REQUIRED_FIELDS = [
    'id',
    'playerId',
    'intent',
    'originalInput',
    'timestamp',
    'status'
  ]

  /**
   * Convert Action object to blockchain-compatible format
   */
  static serializeForBlockchain(action: Action, worldStateVersion: number = 1): SerializedAction {
    return {
      id: action.id,
      playerId: action.playerId,
      intent: action.intent,
      originalInput: action.originalInput,
      timestamp: action.timestamp,
      status: action.status,
      consequences: action.consequences,
      metadata: {
        confidence: action.metadata.confidence,
        parsedIntent: action.metadata.parsedIntent,
        serializedAt: new Date().toISOString(),
        version: '1.0',
        worldStateVersion
      }
    }
  }

  /**
   * Validate action data completeness before storage
   */
  static validateAction(action: Action): ValidationResult {
    const missingFields: string[] = []
    const errors: string[] = []

    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!(field in action) || action[field as keyof Action] === undefined || action[field as keyof Action] === null) {
        missingFields.push(field)
      }
    }

    // Validate field formats
    if (action.id && typeof action.id !== 'string') {
      errors.push('Action ID must be a string')
    }

    if (action.playerId && typeof action.playerId !== 'string') {
      errors.push('Player ID must be a string')
    }

    if (action.timestamp && !this.isValidTimestamp(action.timestamp)) {
      errors.push('Timestamp must be a valid ISO 8601 date string')
    }

    if (action.status && !this.isValidStatus(action.status)) {
      errors.push('Status must be one of: received, pending, processing, completed, failed')
    }

    if (action.metadata && typeof action.metadata.confidence !== 'number') {
      errors.push('Metadata confidence must be a number')
    }

    // Validate consequences if present
    if (action.consequences && Array.isArray(action.consequences)) {
      action.consequences.forEach((consequence, index) => {
        if (!consequence.id) {
          errors.push(`Consequence at index ${index} missing required field: id`)
        }
        if (!consequence.actionId) {
          errors.push(`Consequence at index ${index} missing required field: actionId`)
        }
        if (!consequence.description) {
          errors.push(`Consequence at index ${index} missing required field: description`)
        }
        if (!consequence.impact || !this.isValidImpact(consequence.impact)) {
          errors.push(`Consequence at index ${index} has invalid impact level`)
        }
      })
    }

    return {
      isValid: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors
    }
  }

  /**
   * Add cryptographic metadata to serialized action
   */
  static addCryptographicMetadata(
    serializedAction: SerializedAction,
    cryptographicHash: string,
    digitalSignature?: string
  ): SerializedAction {
    return {
      ...serializedAction,
      metadata: {
        ...serializedAction.metadata,
        cryptographicHash,
        digitalSignature
      }
    }
  }

  /**
   * Extract action summary for quick verification
   */
  static extractSummary(action: Action): {
    id: string
    playerId: string
    intent: string
    timestamp: string
    consequenceCount: number
    hasWorldImpact: boolean
  } {
    const consequenceCount = action.consequences?.length || 0
    const hasWorldImpact = consequenceCount > 0 || action.intent.includes('world') || action.intent.includes('all')

    return {
      id: action.id,
      playerId: action.playerId,
      intent: action.intent,
      timestamp: action.timestamp,
      consequenceCount,
      hasWorldImpact
    }
  }

  /**
   * Create action metadata for blockchain storage
   */
  static createBlockchainMetadata(
    action: Action,
    worldStateVersion: number,
    previousActionId?: string
  ): SerializedAction['metadata'] {
    return {
      confidence: action.metadata.confidence,
      parsedIntent: action.metadata.parsedIntent,
      serializedAt: new Date().toISOString(),
      version: '1.0',
      worldStateVersion,
      previousActionId
    }
  }

  // Private helper methods

  private static isValidTimestamp(timestamp: string): boolean {
    try {
      const date = new Date(timestamp)
      return !isNaN(date.getTime()) && date.toISOString() === timestamp
    } catch {
      return false
    }
  }

  private static isValidStatus(status: string): boolean {
    const validStatuses = ['received', 'pending', 'processing', 'completed', 'failed']
    return validStatuses.includes(status)
  }

  private static isValidImpact(impact: string): boolean {
    const validImpacts = ['minor', 'moderate', 'major', 'critical']
    return validImpacts.includes(impact)
  }
}