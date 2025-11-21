/**
 * Dialogue Request Validation - Story 4.2: Dynamic Dialogue Generation
 *
 * Validation middleware for dialogue generation requests
 */

import { DialogueRequest } from '../../../types/dialogue'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate dialogue generation request
 */
export function validateDialogueRequest(request: any): ValidationResult {
  const errors: string[] = []

  // Required fields validation
  if (!request.characterId || typeof request.characterId !== 'string') {
    errors.push('characterId is required and must be a string')
  }

  if (!request.playerId || typeof request.playerId !== 'string') {
    errors.push('playerId is required and must be a string')
  }

  if (!request.context || typeof request.context !== 'string') {
    errors.push('context is required and must be a string')
  }

  // Optional fields validation
  if (request.conversationTopic && typeof request.conversationTopic !== 'string') {
    errors.push('conversationTopic must be a string if provided')
  }

  if (request.dialogueType) {
    const validTypes = ['greeting', 'response', 'question', 'farewell']
    if (!validTypes.includes(request.dialogueType)) {
      errors.push(`dialogueType must be one of: ${validTypes.join(', ')}`)
    }
  }

  if (request.emotionalContext) {
    const validContexts = ['positive', 'negative', 'neutral']
    if (!validContexts.includes(request.emotionalContext)) {
      errors.push(`emotionalContext must be one of: ${validContexts.join(', ')}`)
    }
  }

  // Length validations
  if (request.context && request.context.length > 1000) {
    errors.push('context must be less than 1000 characters')
  }

  if (request.conversationTopic && request.conversationTopic.length > 200) {
    errors.push('conversationTopic must be less than 200 characters')
  }

  // Character ID format validation
  if (request.characterId && !/^[a-zA-Z0-9_-]+$/.test(request.characterId)) {
    errors.push('characterId contains invalid characters')
  }

  if (request.playerId && !/^[a-zA-Z0-9_-]+$/.test(request.playerId)) {
    errors.push('playerId contains invalid characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate batch dialogue request
 */
export function validateBatchRequest(request: any): ValidationResult {
  const errors: string[] = []

  if (!Array.isArray(request.requests)) {
    errors.push('requests must be an array')
    return { isValid: false, errors }
  }

  if (request.requests.length === 0) {
    errors.push('requests array cannot be empty')
  }

  if (request.requests.length > 10) {
    errors.push('maximum 10 requests allowed per batch')
  }

  // Validate each request in the batch
  request.requests.forEach((req: any, index: number) => {
    const reqErrors = validateDialogueRequest(req)
    if (!reqErrors.isValid) {
      errors.push(`Request ${index + 1}: ${reqErrors.errors.join(', ')}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize dialogue text input
 */
export function sanitizeDialogueText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 1000) // Limit length
}

/**
 * Validate feedback request
 */
export function validateFeedbackRequest(request: any): ValidationResult {
  const errors: string[] = []

  // Required fields
  if (!request.dialogueId || typeof request.dialogueId !== 'string') {
    errors.push('dialogueId is required and must be a string')
  }

  if (!request.characterId || typeof request.characterId !== 'string') {
    errors.push('characterId is required and must be a string')
  }

  if (!request.playerId || typeof request.playerId !== 'string') {
    errors.push('playerId is required and must be a string')
  }

  if (!request.dialogue || typeof request.dialogue !== 'string') {
    errors.push('dialogue is required and must be a string')
  }

  if (typeof request.rating !== 'number' || request.rating < 1 || request.rating > 5) {
    errors.push('rating is required and must be a number between 1 and 5')
  }

  // Optional fields validation
  if (request.feedback && typeof request.feedback !== 'string') {
    errors.push('feedback must be a string if provided')
  }

  if (request.issues && !Array.isArray(request.issues)) {
    errors.push('issues must be an array if provided')
  }

  // Length validations
  if (request.dialogue && request.dialogue.length > 2000) {
    errors.push('dialogue must be less than 2000 characters')
  }

  if (request.feedback && request.feedback.length > 1000) {
    errors.push('feedback must be less than 1000 characters')
  }

  // ID format validations
  if (request.dialogueId && !/^[a-zA-Z0-9_-]+$/.test(request.dialogueId)) {
    errors.push('dialogueId contains invalid characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}