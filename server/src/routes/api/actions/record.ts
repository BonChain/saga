/**
 * Action Recording API Endpoint
 *
 * Records player actions on blockchain storage with verification
 * Handles single and batch action recording with error handling
 */

import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { walrusStorageService } from '../../../services/WalrusStorageService'
import { verificationService } from '../../../services/VerificationService'
import { ActionSerializer } from '../../../services/ActionSerializer'
import { CryptographicService } from '../../../services/CryptographicService'
import { Action } from '../../../types/storage'
import {
  ValidationError,
  ServiceUnavailableError,
  BlockchainError,
  ExternalServiceError,
  ErrorFactory,
  toAppError
} from '../../../utils/errors'

export interface ActionRecordRequest {
  action: Action
  worldStateVersion?: number
  generateVerificationLink?: boolean
}

export interface BatchActionRecordRequest {
  actions: Action[]
  worldStateVersion?: number
  generateVerificationLinks?: boolean
}

/**
 * Record a single action on blockchain storage
 */
export async function recordAction(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const validationError = ErrorFactory.fromValidationResult(errors.array(), {
        actionId: req.body.action?.id,
        endpoint: '/api/actions/record'
      })

      res.status(validationError.statusCode).json({
        success: false,
        error: validationError.message,
        code: validationError.code,
        details: errors.array()
      })
      return
    }

    const { action, worldStateVersion = 1, generateVerificationLink = true } = req.body as ActionRecordRequest

    // Validate action data completeness
    const validation = ActionSerializer.validateAction(action)
    if (!validation.isValid) {
      const actionValidationError = new ValidationError(
        `Invalid action data: ${validation.errors?.join(', ') || 'Unknown validation error'}`,
        {
          actionId: action.id,
          missingFields: validation.missingFields,
          validationErrors: validation.errors
        }
      )

      res.status(actionValidationError.statusCode).json({
        success: false,
        error: actionValidationError.message,
        code: actionValidationError.code,
        details: {
          missingFields: validation.missingFields,
          errors: validation.errors
        }
      })
      return
    }

    // Generate cryptographic proof
    const blockchainProof = CryptographicService.generateBlockchainProof(action, worldStateVersion)

    // Serialize action for blockchain storage
    const serializedAction = ActionSerializer.serializeForBlockchain(action, worldStateVersion)
    const _enhancedSerializedAction = ActionSerializer.addCryptographicMetadata(
      serializedAction,
      blockchainProof.actionHash,
      blockchainProof.proof.signature
    )

    // Create action with blockchain metadata
    const actionWithMetadata: Action = {
      ...action,
      metadata: {
        ...action.metadata,
        walrusUrl: undefined, // Will be set after storage
        verificationHash: blockchainProof.actionHash
      }
    }

    // Store on Walrus blockchain
    const storageResult = await walrusStorageService.storeAction(actionWithMetadata)

    if (storageResult.success) {
      let verificationLink = null

      // Generate verification link if requested
      if (generateVerificationLink) {
        verificationLink = await verificationService.generateVerificationLink(action.id)
      }

      // Update action metadata with storage results
      action.metadata.walrusUrl = storageResult.walrusUrl

      res.status(200).json({
        success: true,
        actionId: action.id,
        walrusUrl: storageResult.walrusUrl,
        verificationLink,
        verificationHash: blockchainProof.actionHash,
        timestamp: storageResult.timestamp,
        blockchainProof: {
          hash: blockchainProof.proof.hash,
          algorithm: blockchainProof.proof.algorithm,
          timestamp: blockchainProof.proof.timestamp
        }
      })
    } else {
      const blockchainError = new BlockchainError(
        storageResult.error || 'Blockchain storage failed',
        {
          actionId: action.id,
          retryAttempt: storageResult.retryAttempt,
          service: 'walrus-storage'
        }
      )

      res.status(blockchainError.statusCode).json({
        success: false,
        actionId: action.id,
        error: blockchainError.message,
        code: blockchainError.code,
        retryAttempt: storageResult.retryAttempt
      })
    }

  } catch (error) {
    const appError = toAppError(error, {
      actionId: req.body.action?.id,
      endpoint: '/api/actions/record',
      timestamp: Date.now()
    })

    // Log error appropriately
    if (appError.isOperational) {
      console.warn('Action recording operational error:', appError.message)
    } else {
      console.error('Action recording error:', appError)
    }

    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code,
      details: process.env.NODE_ENV === 'development' ? appError.context : undefined
    })
  }
}

/**
 * Record multiple actions in batch
 */
export async function recordBatchActions(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
      return
    }

    const { actions, worldStateVersion = 1, generateVerificationLinks = true } = req.body as BatchActionRecordRequest

    if (!Array.isArray(actions) || actions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Actions array is required and cannot be empty'
      })
      return
    }

    if (actions.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Maximum batch size is 50 actions'
      })
      return
    }

    // Validate all actions before processing
    const validationResults = actions.map((action, index) => ({
      index,
      actionId: action.id,
      validation: ActionSerializer.validateAction(action)
    }))

    const invalidActions = validationResults.filter(result => !result.validation.isValid)
    if (invalidActions.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Some actions failed validation',
        details: invalidActions
      })
      return
    }

    // Process actions in parallel with concurrency limit
    const concurrencyLimit = 10
    const results: Array<{
      actionId: string
      success: boolean
      walrusUrl?: string
      verificationLink?: string
      verificationHash?: string
      error?: string
    }> = []

    for (let i = 0; i < actions.length; i += concurrencyLimit) {
      const batch = actions.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map(async (action) => {
        try {
          // Generate cryptographic proof
          const blockchainProof = CryptographicService.generateBlockchainProof(action, worldStateVersion)

          // Serialize and enhance with cryptographic metadata
          const serializedAction = ActionSerializer.serializeForBlockchain(action, worldStateVersion)
          const _enhancedSerializedAction = ActionSerializer.addCryptographicMetadata(
            serializedAction,
            blockchainProof.actionHash,
            blockchainProof.proof.signature
          )

          // Create action with blockchain metadata
          const actionWithMetadata: Action = {
            ...action,
            metadata: {
              ...action.metadata,
              walrusUrl: undefined,
              verificationHash: blockchainProof.actionHash
            }
          }

          // Store on blockchain
          const storageResult = await walrusStorageService.storeAction(actionWithMetadata)

          if (storageResult.success) {
            let verificationLink = null
            if (generateVerificationLinks) {
              verificationLink = await verificationService.generateVerificationLink(action.id)
            }

            return {
              actionId: action.id,
              success: true,
              walrusUrl: storageResult.walrusUrl,
              verificationLink,
              verificationHash: blockchainProof.actionHash
            }
          } else {
            return {
              actionId: action.id,
              success: false,
              error: storageResult.error,
              retryAttempt: storageResult.retryAttempt
            }
          }

        } catch (error) {
          return {
            actionId: action.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    const successfulActions = results.filter(r => r.success)
    const failedActions = results.filter(r => !r.success)

    res.status(200).json({
      success: true,
      total: actions.length,
      successful: successfulActions.length,
      failed: failedActions.length,
      results,
      summary: {
        processed: results.length,
        storedOnBlockchain: successfulActions.length,
        verificationLinksGenerated: results.filter(r => r.verificationLink).length
      }
    })

  } catch (error) {
    console.error('Batch action recording error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during batch action recording',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    })
  }
}

/**
 * Get recording status for an action
 */
export async function getRecordingStatus(req: Request, res: Response): Promise<void> {
  try {
    const { actionId } = req.params

    if (!actionId) {
      res.status(400).json({
        success: false,
        error: 'Action ID is required'
      })
      return
    }

    // Get verification status
    const verificationStatus = verificationService.getVerificationStatus(actionId)

    // Get circuit breaker status
    const circuitBreakerStatus = walrusStorageService.getCircuitBreakerStatus()

    if (verificationStatus) {
      res.status(200).json({
        success: true,
        actionId,
        status: verificationStatus.status,
        verificationLink: verificationStatus.verificationLink,
        attempts: verificationStatus.attempts,
        lastAttempt: verificationStatus.lastAttempt,
        error: verificationStatus.error,
        systemStatus: {
          circuitBreakerOpen: circuitBreakerStatus.isOpen,
          failureCount: circuitBreakerStatus.failureCount,
          nextAttemptTime: circuitBreakerStatus.nextAttemptTime
        }
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Recording status not found for action',
        actionId
      })
    }

  } catch (error) {
    console.error('Recording status error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving recording status',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    })
  }
}