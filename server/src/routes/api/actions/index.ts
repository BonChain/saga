/**
 * Actions API Router
 *
 * Main router for blockchain action recording and verification endpoints
 * Integrates Walrus storage, cryptographic services, and verification systems
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { recordAction, recordBatchActions, getRecordingStatus } from './record'
import { verifyAction, batchVerifyActions, getVerificationLink, getVerificationHistory, getVerificationStats } from './verify'

const router = Router()

/**
 * Validation schemas
 */
const actionValidation = [
  body('action').isObject().withMessage('Action must be an object'),
  body('action.id').isString().isLength({ min: 1, max: 100 }).withMessage('Action ID is required and must be 1-100 characters'),
  body('action.playerId').isString().isLength({ min: 1, max: 100 }).withMessage('Player ID is required and must be 1-100 characters'),
  body('action.intent').isString().isLength({ min: 1, max: 500 }).withMessage('Intent is required and must be 1-500 characters'),
  body('action.originalInput').isString().isLength({ min: 1, max: 500 }).withMessage('Original input is required and must be 1-500 characters'),
  body('action.timestamp').isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
  body('action.status').isIn(['received', 'pending', 'processing', 'completed', 'failed']).withMessage('Invalid action status'),
  body('action.metadata.confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be a number between 0 and 1'),
  body('worldStateVersion').optional().isInt({ min: 1 }).withMessage('World state version must be a positive integer'),
  body('generateVerificationLink').optional().isBoolean().withMessage('Generate verification link must be a boolean')
]

const batchActionValidation = [
  body('actions').isArray({ min: 1, max: 50 }).withMessage('Actions array is required and must contain 1-50 items'),
  body('worldStateVersion').optional().isInt({ min: 1 }).withMessage('World state version must be a positive integer'),
  body('generateVerificationLinks').optional().isBoolean().withMessage('Generate verification links must be a boolean')
]

const actionIdValidation = [
  param('actionId').isString().isLength({ min: 1, max: 100 }).withMessage('Action ID must be 1-100 characters')
]

const verificationRequestValidation = [
  body('includeActionData').optional().isBoolean().withMessage('Include action data must be a boolean'),
  body('checkIntegrity').optional().isBoolean().withMessage('Check integrity must be a boolean')
]

const batchVerificationValidation = [
  body('actionIds').isArray({ min: 1, max: 100 }).withMessage('Action IDs array is required and must contain 1-100 items'),
  body('actionIds.*').isString().isLength({ min: 1, max: 100 }).withMessage('Each action ID must be 1-100 characters'),
  body('includeActionData').optional().isBoolean().withMessage('Include action data must be a boolean'),
  body('checkIntegrity').optional().isBoolean().withMessage('Check integrity must be a boolean')
]

/**
 * Routes
 */

// Single action recording
router.post('/record', actionValidation, recordAction)
router.post('/record/batch', batchActionValidation, recordBatchActions)

// Single action verification
router.get('/:actionId/verify', actionIdValidation, verifyAction)
router.post('/verify/batch', batchVerificationValidation, batchVerifyActions)

// Action status and links
router.get('/:actionId/status', actionIdValidation, getRecordingStatus)
router.get('/:actionId/link', actionIdValidation, getVerificationLink)
router.get('/:actionId/history', actionIdValidation, getVerificationHistory)

// Verification with additional options
router.post('/:actionId/verify', [...actionIdValidation, ...verificationRequestValidation], verifyAction)

// System statistics and health
router.get('/stats', getVerificationStats)

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Actions API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      recording: {
        single: 'POST /record',
        batch: 'POST /record/batch'
      },
      verification: {
        single: 'GET /:actionId/verify',
        batch: 'POST /verify/batch',
        withOptions: 'POST /:actionId/verify'
      },
      status: {
        recordingStatus: 'GET /:actionId/status',
        verificationLink: 'GET /:actionId/link',
        verificationHistory: 'GET /:actionId/history'
      },
      system: {
        stats: 'GET /stats',
        health: 'GET /health'
      }
    }
  })
})

/**
 * Error handling middleware
 */
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Actions API error:', error)

  // Handle validation errors
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format',
      details: error.message
    })
  }

  // Handle express-validator errors
  if (error.array) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.array()
    })
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  })
})

/**
 * Request logging middleware
 */
router.use((req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`Actions API: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })

  next()
})

export default router