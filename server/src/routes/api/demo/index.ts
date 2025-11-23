/**
 * Demo Reliability API Routes
 *
 * Provides endpoints for demo status, fallback systems, and emergency mode
 * Ensures hackathon demo success even when external services fail
 */

import { Router } from 'express'
import { demoReliabilityService } from '../../../services/DemoReliabilityService'

const router = Router()

/**
 * GET /api/demo/status
 * Returns current demo mode and service status
 */
router.get('/status', (req, res) => {
  try {
    const config = demoReliabilityService.getDemoConfig()
    const demoReady = demoReliabilityService.isDemoReady()

    res.json({
      success: true,
      data: {
        ...config,
        ...demoReady,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Demo status check failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get demo status'
    })
  }
})

/**
 * GET /api/demo/health
 * Detailed health check for demo systems
 */
router.get('/health', async (req, res) => {
  try {
    await demoReliabilityService.triggerHealthCheck()
    const serviceStatus = demoReliabilityService.getServiceStatus()
    const demoReady = demoReliabilityService.isDemoReady()

    res.json({
      success: true,
      data: {
        serviceStatus,
        ...demoReady,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Demo health check failed:', error)
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    })
  }
})

/**
 * GET /api/demo/emergency
 * Enter emergency mode and get demo fallback data
 */
router.get('/emergency', (req, res) => {
  try {
    const emergencyData = demoReliabilityService.enterEmergencyMode()

    if (!emergencyData) {
      return res.status(500).json({
        success: false,
        error: 'Emergency data not available'
      })
    }

    res.json({
      success: true,
      data: {
        emergency: true,
        mode: 'emergency',
        demoData: emergencyData,
        timestamp: new Date().toISOString(),
        message: 'Emergency mode activated - using fallback demo data'
      }
    })
  } catch (error) {
    console.error('Emergency mode activation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to activate emergency mode'
    })
  }
})

/**
 * POST /api/demo/cache
 * Manually cache a response for future fallbacks
 */
router.post('/cache', (req, res) => {
  try {
    const { actionId, actionInput, actionType, consequences, verificationLink } = req.body

    if (!actionInput || !actionType || !consequences) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: actionInput, actionType, consequences'
      })
    }

    demoReliabilityService.cacheResponse(
      actionId || 'manual',
      actionInput,
      actionType,
      consequences,
      verificationLink
    )

    res.json({
      success: true,
      message: 'Response cached successfully for future fallbacks'
    })
  } catch (error) {
    console.error('Manual caching failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to cache response'
    })
  }
})

/**
 * GET /api/demo/config
 * Get demo configuration for frontend
 */
router.get('/config', (req, res) => {
  try {
    const config = demoReliabilityService.getDemoConfig()

    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Demo config failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get demo configuration'
    })
  }
})

export default router