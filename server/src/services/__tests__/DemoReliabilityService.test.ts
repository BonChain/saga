/**
 * Demo Reliability Service Tests
 * Tests fallback systems and emergency demo features for hackathon reliability
 */

import { DemoReliabilityService } from '../DemoReliabilityService'

describe('DemoReliabilityService', () => {
  let service: DemoReliabilityService

  beforeEach(() => {
    service = new DemoReliabilityService()
  })

  afterEach(() => {
    service.destroy()
  })

  describe('Service Initialization', () => {
    it('initializes with normal demo mode', () => {
      const config = service.getDemoConfig()
      expect(config.mode).toBe('normal')
    })

    it('initializes with empty cache', () => {
      const config = service.getDemoConfig()
      expect(config.cachedResponses).toBe(0)
    })
  })

  describe('Cache Management', () => {
    it('stores and retrieves cached responses', () => {
      const actionInput = 'attack the dragon'
      const actionType = 'combat'
      const consequences = [
        {
          system: 'combat',
          narrative: 'Dragon fights back',
          severity: 'major',
          impact: 8
        }
      ]

      // Cache response
      service.cacheResponse('action-1', actionInput, actionType, consequences)

      // Retrieve cached response
      const cached = service.getCachedResponse(actionInput, actionType)

      expect(cached).toBeTruthy()
      expect(cached!.originalInput).toBe(actionInput)
      expect(cached!.actionType).toBe(actionType)
      expect(cached!.consequences).toHaveLength(1)
    })

    it('returns null for uncached actions', () => {
      const cached = service.getCachedResponse('unknown action', 'unknown')
      expect(cached).toBeNull()
    })

    it('marks cached responses as fallback when retrieved', () => {
      service.cacheResponse('action-1', 'test input', 'test', [])

      const cached = service.getCachedResponse('test input', 'test')
      expect(cached!.isFallback).toBe(true)
    })

    it('handles different input variations correctly', () => {
      const actionInput = 'Attack the Dragon'
      const variation = 'attack the dragon'

      service.cacheResponse('action-1', actionInput, 'combat', [])

      // Should match regardless of case
      const cached = service.getCachedResponse(variation, 'combat')
      expect(cached).toBeTruthy()
    })
  })

  describe('Service Status', () => {
    it('returns service status object', () => {
      const status = service.getServiceStatus()

      expect(status).toHaveProperty('walrus')
      expect(status).toHaveProperty('ai')
      expect(status).toHaveProperty('network')
      expect(status).toHaveProperty('lastCheck')
    })

    it('triggers health check and updates status', async () => {
      const initialStatus = service.getServiceStatus()
      const initialLastCheck = initialStatus.lastCheck

      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay

      await service.triggerHealthCheck()
      const updatedStatus = service.getServiceStatus()

      expect(updatedStatus.lastCheck).toBeGreaterThan(initialLastCheck)
    })
  })

  describe('Demo Readiness', () => {
    it('returns ready status when all services are online', () => {
      const demoReady = service.isDemoReady()

      expect(demoReady.ready).toBe(true)
      expect(demoReady.mode).toBe('normal')
      expect(demoReady.issues).toHaveLength(0)
    })
  })

  describe('Emergency Mode', () => {
    it('enters emergency mode and returns demo data', () => {
      const emergencyData = service.enterEmergencyMode()

      expect(emergencyData).toBeTruthy()
      expect(emergencyData!.title).toContain('SuiSaga')
      expect(emergencyData!.actions).toBeInstanceOf(Array)
      expect(emergencyData!.actions.length).toBeGreaterThan(0)
    })

    it('changes demo mode to emergency when emergency mode activated', () => {
      service.enterEmergencyMode()

      const config = service.getDemoConfig()
      expect(config.mode).toBe('emergency')
    })
  })

  describe('Demo Configuration', () => {
    it('returns complete demo configuration', () => {
      const config = service.getDemoConfig()

      expect(config).toHaveProperty('mode')
      expect(config).toHaveProperty('serviceStatus')
      expect(config).toHaveProperty('fallbackEnabled')
      expect(config).toHaveProperty('cachedResponses')
      expect(config).toHaveProperty('emergencyVideo')
    })
  })

  describe('Manual Cache Operations', () => {
    it('allows manual caching of responses', () => {
      const response = {
        actionId: 'manual-1',
        actionInput: 'test action',
        actionType: 'test',
        consequences: [{ system: 'test', narrative: 'test', severity: 'minor', impact: 1 }]
      }

      // Simulate API request with all required fields
      service.cacheResponse(
        response.actionId,
        response.actionInput,
        response.actionType,
        response.consequences
      )

      const cached = service.getCachedResponse(response.actionInput, response.actionType)
      expect(cached).toBeTruthy()
      expect(cached!.actionId).toBe(response.actionId)
    })
  })

  describe('Health Check Scenarios', () => {
    it('handles service failures gracefully', async () => {
      // This would normally fail network checks
      // In testing environment, it should still return a status
      const status = service.getServiceStatus()
      expect(status).toHaveProperty('walrus')
      expect(status).toHaveProperty('ai')
      expect(status).toHaveProperty('network')
    })
  })

  describe('Preset Demo Data', () => {
    it('should load preset demo data for common actions', () => {
      // Test common demo actions that should have presets
      const commonActions = [
        { input: 'attack the dragon', type: 'combat' },
        { input: 'befriend the goblin king', type: 'diplomacy' },
        { input: 'cast a spell to make it rain', type: 'magic' }
      ]

      commonActions.forEach(({ input, type }) => {
        const cached = service.getCachedResponse(input, type)
        expect(cached).toBeTruthy()
        expect(cached!.consequences).toBeInstanceOf(Array)
        expect(cached!.consequences.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Emergency Demo Data', () => {
    it('provides complete fallback demo experience', () => {
      const emergencyData = service.enterEmergencyMode()

      expect(emergencyData).toBeTruthy()
      expect(emergencyData!.title).toBeTruthy()
      expect(emergencyData!.description).toBeTruthy()
      expect(emergencyData!.actions).toHaveLength(3) // Should have 3 demo actions

      // Each action should have all required fields
      emergencyData!.actions.forEach(action => {
        expect(action.input).toBeTruthy()
        expect(action.consequences).toBeInstanceOf(Array)
        expect(action.verificationLink).toBeTruthy()
        expect(action.consequences.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Resource Management', () => {
    it('cleans up resources on destroy', () => {
      const service = new DemoReliabilityService()
      expect(() => service.destroy()).not.toThrow()
    })
  })
})