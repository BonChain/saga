/**
 * Action Verification API Endpoint
 *
 * Provides verification endpoints for blockchain-stored actions
 * Integrates with Walrus Gateway for data retrieval and integrity checking
 */

import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { verificationService } from '../../../services/VerificationService'
import { CryptographicService } from '../../../services/CryptographicService'
import { Action } from '../../../types/storage'

export interface VerificationRequest {
  actionId: string
  includeActionData?: boolean
  checkIntegrity?: boolean
}

export interface BatchVerificationRequest {
  actionIds: string[]
  includeActionData?: boolean
  checkIntegrity?: boolean
}

/**
 * Verify a single action from blockchain storage
 */
export async function verifyAction(req: Request, res: Response): Promise<void> {
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

    const { actionId } = req.params
    const { includeActionData = true, checkIntegrity = true } = req.body as VerificationRequest

    if (!actionId) {
      res.status(400).json({
        success: false,
        error: 'Action ID is required'
      })
      return
    }

    // Get verification status first
    const verificationStatus = verificationService.getVerificationStatus(actionId)

    // Perform verification through Walrus Gateway
    const verificationResult = await verificationService.verifyAction(actionId)

    if (verificationResult.success) {
      let integrityCheck = null

      // Perform additional integrity check if requested and action data is available
      if (checkIntegrity && verificationResult.actionData) {
        integrityCheck = await performIntegrityCheck(verificationResult.actionData, actionId)
      }

      // Get verification history
      const verificationHistory = verificationService.getVerificationHistory(actionId)

      res.status(200).json({
        success: true,
        actionId,
        verificationLink: verificationResult.verificationLink,
        isTamperProof: verificationResult.isTamperProof,
        verificationStatus: verificationStatus?.status || 'verified',
        lastVerified: verificationStatus?.timestamp,
        verificationAttempts: verificationStatus?.attempts || 0,
        actionData: includeActionData ? verificationResult.actionData : undefined,
        integrityCheck,
        verificationHistory: verificationHistory ? {
          totalVerifications: verificationHistory.totalVerifications,
          successfulVerifications: verificationHistory.successfulVerifications,
          recentVerifications: verificationHistory.verifications.slice(-5) // Last 5 verifications
        } : undefined,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        actionId,
        error: verificationResult.error,
        verificationLink: verificationResult.verificationLink,
        verificationStatus: verificationStatus?.status || 'failed',
        verificationAttempts: verificationStatus?.attempts || 0
      })
    }

  } catch (error) {
    console.error('Action verification error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during action verification',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    })
  }
}

/**
 * Batch verify multiple actions
 */
export async function batchVerifyActions(req: Request, res: Response): Promise<void> {
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

    const { actionIds, includeActionData = false, checkIntegrity = false } = req.body as BatchVerificationRequest

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Action IDs array is required and cannot be empty'
      })
      return
    }

    if (actionIds.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum batch size is 100 actions'
      })
      return
    }

    // Perform batch verification
    const batchResults = await verificationService.batchVerifyActions(actionIds)

    // Enhance results with additional information if requested
    const enhancedResults = await Promise.all(
      batchResults.map(async (result: any) => {
        if (result.success && includeActionData) {
          try {
            const verificationStatus = verificationService.getVerificationStatus(result.actionId)
            const verificationHistory = verificationService.getVerificationHistory(result.actionId)

            let integrityCheck = null
            if (checkIntegrity) {
              // Note: This would require fetching the action data from Walrus
              // For now, we'll provide a placeholder
              integrityCheck = {
                checked: false,
                reason: 'Action data not included in batch verification'
              }
            }

            return {
              ...result,
              verificationStatus: verificationStatus?.status,
              verificationAttempts: verificationStatus?.attempts || 0,
              verificationHistory: verificationHistory ? {
                totalVerifications: verificationHistory.totalVerifications,
                successfulVerifications: verificationHistory.successfulVerifications
              } : undefined,
              integrityCheck
            }
          } catch (error) {
            return {
              ...result,
              verificationError: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
        return result
      })
    )

    const successfulVerifications = enhancedResults.filter(r => r.success)
    const failedVerifications = enhancedResults.filter(r => !r.success)

    // Get cache statistics
    const cacheStats = verificationService.getCacheStats()

    res.status(200).json({
      success: true,
      total: actionIds.length,
      successful: successfulVerifications.length,
      failed: failedVerifications.length,
      results: enhancedResults,
      summary: {
        verifiedSuccessfully: successfulVerifications.length,
        tamperProof: successfulVerifications.filter(r => r.isTamperProof).length,
        verificationFailed: failedVerifications.length,
        averageVerificationAttempts: enhancedResults.reduce((sum, r) =>
          sum + (r.verificationAttempts || 0), 0) / enhancedResults.length
      },
      cacheStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Batch verification error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error during batch verification',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    })
  }
}

/**
 * Get verification link for an action
 */
export async function getVerificationLink(req: Request, res: Response): Promise<void> {
  try {
    const { actionId } = req.params

    if (!actionId) {
      res.status(400).json({
        success: false,
        error: 'Action ID is required'
      })
      return
    }

    try {
      const verificationLink = verificationService.getVerificationLink(actionId)

      res.status(200).json({
        success: true,
        actionId,
        verificationLink,
        gatewayInfo: {
          baseUrl: verificationLink.split('/verify/')[0],
          path: `/verify/${actionId}`
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate verification link',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Verification link error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error while generating verification link'
    })
  }
}

/**
 * Get verification history for an action
 */
export async function getVerificationHistory(req: Request, res: Response): Promise<void> {
  try {
    const { actionId } = req.params

    if (!actionId) {
      res.status(400).json({
        success: false,
        error: 'Action ID is required'
      })
      return
    }

    const verificationHistory = verificationService.getVerificationHistory(actionId)

    if (verificationHistory) {
      res.status(200).json({
        success: true,
        actionId,
        playerId: verificationHistory.playerId,
        totalVerifications: verificationHistory.totalVerifications,
        successfulVerifications: verificationHistory.successfulVerifications,
        successRate: verificationHistory.totalVerifications > 0 ?
          (verificationHistory.successfulVerifications / verificationHistory.totalVerifications) * 100 : 0,
        verifications: verificationHistory.verifications,
        summary: {
          firstVerification: verificationHistory.verifications[0]?.timestamp,
          lastVerification: verificationHistory.verifications[verificationHistory.verifications.length - 1]?.timestamp,
          averageTimeBetweenVerifications: calculateAverageTime(verificationHistory.verifications)
        }
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'No verification history found for action',
        actionId
      })
    }

  } catch (error) {
    console.error('Verification history error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving verification history'
    })
  }
}

/**
 * Get verification system statistics
 */
export async function getVerificationStats(req: Request, res: Response): Promise<void> {
  try {
    const cacheStats = verificationService.getCacheStats()

    res.status(200).json({
      success: true,
      cacheStats,
      systemInfo: {
        gatewayUrl: process.env.WALRUS_GATEWAY_URL || 'https://walrus-gateway.testnet.walrus.ai',
        cacheTtl: 300000, // 5 minutes
        maxBatchSize: 100
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Verification stats error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving verification statistics'
    })
  }
}

// Helper functions

async function performIntegrityCheck(actionData: Action, actionId: string): Promise<{
  checked: boolean
  isValid: boolean
  hashValid?: boolean
  tamperDetected?: boolean
  error?: string
}> {
  try {
    // Generate hash from retrieved action data
    const computedHash = CryptographicService.generateActionHash(actionData)

    // Get expected hash from action metadata
    const expectedHash = actionData.metadata.verificationHash

    if (!expectedHash) {
      return {
        checked: true,
        isValid: false,
        error: 'No verification hash found in action metadata'
      }
    }

    const hashValid = computedHash === expectedHash
    const tamperDetected = !hashValid

    return {
      checked: true,
      isValid: hashValid,
      hashValid,
      tamperDetected
    }

  } catch (error) {
    return {
      checked: true,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function calculateAverageTime(verifications: Array<{
  timestamp: string
  status: string
  link: string
  success: boolean
  error?: string
}>): number | null {
  if (verifications.length < 2) {
    return null
  }

  const times = verifications
    .map(v => new Date(v.timestamp).getTime())
    .sort((a, b) => a - b)

  const intervals = []
  for (let i = 1; i < times.length; i++) {
    intervals.push(times[i] - times[i - 1])
  }

  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  return Math.round(averageInterval / 1000) // Convert to seconds
}