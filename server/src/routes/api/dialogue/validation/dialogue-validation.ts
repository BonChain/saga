/**
 * Dialogue Request Validation - Story 4.2: Dynamic Dialogue Generation
 *
 * Validation schema and functions for dialogue generation requests.
 */

import { DialogueRequest } from '../../../../types/dialogue'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate dialogue generation request
 */
export function validateDialogueRequest(request: unknown): ValidationResult {
  const errors: string[] = []

  if (!request) {
    errors.push('Request body is required')
    return { isValid: false, errors }
  }

  const req = request as Record<string, unknown>

  if (!req.characterId || typeof req.characterId !== 'string') {
    errors.push('characterId is required and must be a string')
  }

  if (!req.playerId || typeof req.playerId !== 'string') {
    errors.push('playerId is required and must be a string')
  }

  if (!req.context || typeof req.context !== 'string') {
    errors.push('context is required and must be a string')
  }

  if (req.conversationTopic && typeof req.conversationTopic !== 'string') {
    errors.push('conversationTopic must be a string')
  }

  if (req.emotionalContext && typeof req.emotionalContext !== 'string') {
    errors.push('emotionalContext must be a string')
  }

  if (req.dialogueType && typeof req.dialogueType !== 'string') {
    errors.push('dialogueType must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Batch dialogue request interface
 */
interface BatchDialogueRequest {
  requests: unknown[]
}

/**
 * Validate batch dialogue generation request
 */
export function validateBatchRequest(request: unknown): ValidationResult {
  const errors: string[] = []

  if (!request) {
    errors.push('Request body is required')
    return { isValid: false, errors }
  }

  const batchReq = request as BatchDialogueRequest

  if (!batchReq.requests || !Array.isArray(batchReq.requests)) {
    errors.push('requests must be an array')
    return { isValid: false, errors }
  }

  if (batchReq.requests.length === 0) {
    errors.push('requests array cannot be empty')
  }

  if (batchReq.requests.length > 10) {
    errors.push('maximum 10 requests allowed per batch')
  }

  batchReq.requests.forEach((req: unknown, index: number) => {
    const validation = validateDialogueRequest(req)
    if (!validation.isValid) {
      errors.push(`Request ${index}: ${validation.errors.join(', ')}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}