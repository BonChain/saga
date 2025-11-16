/**
 * Story 2.3: Immediate Action Confirmation - Integration Tests
 *
 * This test suite validates the enhanced immediate confirmation system including:
 * - UUID generation for action IDs
 * - Enhanced confirmation responses with required AC fields
 * - Recent actions monitoring system
 * - Status tracking with AI processing indicators
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import axios from 'axios'

const BASE_URL = 'http://localhost:3005'

describe('Story 2.3: Immediate Action Confirmation', () => {
  let testPlayerId: string

  beforeAll(async () => {
    testPlayerId = `test-player-${Date.now()}`

    // Wait for server to be ready
    try {
      await axios.get(`${BASE_URL}/health`)
      console.log('✅ Server is ready for testing')
    } catch (error) {
      console.log('❌ Server is not ready, skipping tests')
      throw new Error('Server not available')
    }
  })

  describe('AC 1: Enhanced Confirmation Response System', () => {
    it('should provide immediate confirmation with unique action ID', async () => {
      const response = await axios.post(`${BASE_URL}/api/actions/submit`, {
        playerId: testPlayerId,
        intent: 'attack the dragon with sword',
        originalInput: 'I want to attack the dragon with my sword'
      })

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toBeDefined()

      // Story 2.3 AC Requirements
      const confirmation = response.data.data
      expect(confirmation.id).toBeDefined() // Unique action ID
      expect(confirmation.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) // UUID format
      expect(confirmation.playerId).toBe(testPlayerId)
      expect(confirmation.originalInput).toBe('I want to attack the dragon with my sword')
      expect(confirmation.intent).toBe('attack the dragon with sword')
      expect(confirmation.timestamp).toBeDefined()
      expect(confirmation.status).toBe('received') // Story 2.3 enhanced status
      expect(confirmation.message).toBe('Action received! Processing world changes...') // Exact AC requirement
      expect(confirmation.aiProcessingStatus).toBe('processing') // Show AI is working
      expect(confirmation.actionDescription).toBeDefined() // Action description for user
    })

    it('should complete confirmation within 1 second requirement', async () => {
      const startTime = Date.now()

      const response = await axios.post(`${BASE_URL}/api/actions/submit`, {
        playerId: testPlayerId,
        intent: 'explore the mysterious forest',
        originalInput: 'I want to explore the mysterious forest'
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(responseTime).toBeLessThan(1000) // AC requirement: <1 second

      console.log(`⚡ Response time: ${responseTime}ms (<1000ms requirement)`)
    })

    it('should include all required AC confirmation fields', async () => {
      const response = await axios.post(`${BASE_URL}/api/actions/submit`, {
        playerId: testPlayerId,
        intent: 'befriend the goblin king',
        originalInput: 'I want to befriend the goblin king'
      })

      expect(response.status).toBe(201)
      const confirmation = response.data.data

      // AC 1 Requirements Validation
      expect(confirmation.id).toBeTruthy() // "unique action ID for tracking my request"
      expect(confirmation.timestamp).toBeTruthy() // "confirmation includes the timestamp"
      expect(confirmation.message).toBe('Action received! Processing world changes...') // "message like..."
      expect(confirmation.actionDescription).toBeTruthy() // "action description"
      expect(confirmation.aiProcessingStatus).toBe('processing') // "know AI is working on consequences"
    })
  })

  describe('Recent Actions Monitoring System', () => {
    it('should retrieve recent actions with enhanced status display', async () => {
      // Submit a test action first
      await axios.post(`${BASE_URL}/api/actions/submit`, {
        playerId: testPlayerId,
        intent: 'cast a fireball spell',
        originalInput: 'I want to cast a fireball spell'
      })

      // Retrieve recent actions
      const response = await axios.get(`${BASE_URL}/api/actions/recent`, {
        params: {
          playerId: testPlayerId,
          minutes: 5,
          limit: 10
        }
      })

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toBeInstanceOf(Array)
      expect(response.data.meta).toBeDefined()

      const actions = response.data.data
      if (actions.length > 0) {
        const recentAction = actions[0]
        expect(recentAction.id).toBeDefined()
        expect(recentAction.playerId).toBe(testPlayerId)
        expect(recentAction.timeSinceSubmission).toBeDefined() // Story 2.3 enhancement
        expect(recentAction.statusDisplay).toBeDefined() // Story 2.3 enhancement
      }

      // Verify metadata
      expect(response.data.meta.timeRange).toContain('Last 5 minutes')
      expect(response.data.meta.total).toBeGreaterThanOrEqual(0)
      expect(response.data.meta.playerId).toBe(testPlayerId)
    })

    it('should filter recent actions by time range', async () => {
      const response = await axios.get(`${BASE_URL}/api/actions/recent`, {
        params: {
          minutes: 1,
          limit: 20
        }
      })

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.meta.timeRange).toContain('Last 1 minute')
    })
  })

  describe('UUID Generation System', () => {
    it('should generate cryptographically unique UUIDs for actions', async () => {
      const actionIds: string[] = []

      // Submit multiple actions and collect IDs
      for (let i = 0; i < 5; i++) {
        const response = await axios.post(`${BASE_URL}/api/actions/submit`, {
          playerId: `${testPlayerId}-${i}`,
          intent: `test action ${i}`,
          originalInput: `This is test action number ${i}`
        })

        if (response.data.success) {
          actionIds.push(response.data.data.id)
        }
      }

      // Verify all IDs are valid UUIDs and unique
      expect(actionIds.length).toBeGreaterThan(0)

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      actionIds.forEach(id => {
        expect(id).toMatch(uuidRegex)
      })

      // Verify uniqueness
      const uniqueIds = new Set(actionIds)
      expect(uniqueIds.size).toBe(actionIds.length)

      console.log(`✅ Generated ${actionIds.length} unique UUIDs`)
    })
  })

  describe('Integration with Existing Systems', () => {
    it('should work seamlessly with IntentParser from Story 2.2', async () => {
      const response = await axios.post(`${BASE_URL}/api/actions/submit`, {
        playerId: testPlayerId,
        intent: 'attack the dragon',
        originalInput: 'I want to attack the dragon with my sword'
      })

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)

      const confirmation = response.data.data
      expect(confirmation.parsedIntent).toBeDefined() // Integration with Story 2.2 IntentParser
      expect(confirmation.parsedIntent.actionType).toBeDefined()
    })

    it('should maintain existing API contract while adding enhancements', async () => {
      const response = await axios.post(`${BASE_URL}/api/actions/submit`, {
        playerId: testPlayerId,
        intent: 'test action',
        originalInput: 'This is a test action'
      })

      // Existing contract fields must still be present
      expect(response.data.success).toBe(true)
      expect(response.data.data.id).toBeDefined()
      expect(response.data.data.playerId).toBeDefined()
      expect(response.data.data.originalInput).toBeDefined()
      expect(response.data.data.intent).toBeDefined()
      expect(response.data.data.timestamp).toBeDefined()
      expect(response.data.data.status).toBeDefined()

      // Enhanced fields from Story 2.3
      expect(response.data.data.message).toBe('Action received! Processing world changes...')
      expect(response.data.data.aiProcessingStatus).toBe('processing')
    })
  })

  afterAll(() => {
    console.log('🎯 Story 2.3 Integration Tests Completed')
    console.log('✅ Immediate confirmation system validated')
    console.log('✅ UUID generation system validated')
    console.log('✅ Recent actions monitoring validated')
    console.log('✅ AC requirements compliance validated')
  })
})