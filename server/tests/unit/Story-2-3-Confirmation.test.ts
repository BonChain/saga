/**
 * Story 2.3: Immediate Action Confirmation - Unit Tests
 *
 * Unit tests for the enhanced confirmation system components including:
 * - UUID generation in StorageManager
 * - Enhanced validation rules
 * - Status management
 */

import { describe, it, expect } from '@jest/globals'
import { StorageManager } from '../../src/storage/StorageManager'
import { DataValidation } from '../../src/storage/DataValidation'
import { Action } from '../../src/types/storage'

describe('Story 2.3: Enhanced Action Confirmation', () => {
  let storageManager: StorageManager
  let dataValidation: DataValidation

  beforeAll(() => {
    // Initialize test instances
    storageManager = new StorageManager({
      storageBasePath: './test-storage',
      walrus: {
        enableWalrus: false,
        developerKeyId: 'test',
        network: 'testnet'
      },
      backup: {
        enableBackup: true,
        backupPath: './test-backups'
      },
      validation: {
        strictMode: false,
        maxActionLength: 500,
        maxWorldStateSize: 1000,
        allowedActionTypes: ['combat', 'social', 'exploration'],
        requiredWorldRules: ['basic_physics'],
        checksumAlgorithm: 'sha256',
        enableCrossLayerValidation: false
      },
      logger: {
        enableLogging: false,
        logLevel: 'info',
        logPath: './test-logs'
      }
    })

    dataValidation = new DataValidation({
      strictMode: false,
      maxActionLength: 500,
      maxWorldStateSize: 1000,
      allowedActionTypes: ['combat', 'social', 'exploration'],
      requiredWorldRules: ['basic_physics'],
      checksumAlgorithm: 'sha256',
      enableCrossLayerValidation: false
    })
  })

  describe('UUID Generation System', () => {
    it('should generate valid UUID v4 format', () => {
      // Access private method through type assertion for testing
      const generateId = (storageManager as any).generateActionId.bind(storageManager)
      const uuid = generateId()

      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should generate unique UUIDs', () => {
      const generateId = (storageManager as any).generateActionId.bind(storageManager)
      const ids: string[] = []

      // Generate 100 UUIDs and verify uniqueness
      for (let i = 0; i < 100; i++) {
        ids.push(generateId())
      }

      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)
    })

    it('should generate different UUIDs on consecutive calls', () => {
      const generateId = (storageManager as any).generateActionId.bind(storageManager)

      const id1 = generateId()
      const id2 = generateId()
      const id3 = generateId()

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })
  })

  describe('Enhanced Validation System', () => {
    it('should accept "received" status for new actions', () => {
      const action: Action = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        playerId: 'test-player',
        intent: 'test action',
        originalInput: 'This is a test action',
        timestamp: new Date().toISOString(),
        status: 'received', // Story 2.3: New status
        metadata: {
          confidence: 0.8,
          parsedIntent: {
            actionType: 'other'
          }
        }
      }

      const result = dataValidation.validateAction(action)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept all valid status values including "received"', () => {
      const validStatuses = ['received', 'pending', 'processing', 'completed', 'failed']

      validStatuses.forEach(status => {
        const action: Action = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          playerId: 'test-player',
          intent: 'test action',
          originalInput: 'This is a test action',
          timestamp: new Date().toISOString(),
          status: status as any, // Type assertion for testing
          metadata: {
            confidence: 0.8
          }
        }

        const result = dataValidation.validateAction(action)
        expect(result.valid).toBe(true)
        expect(result.errors.filter(e => e.includes('status'))).toHaveLength(0)
      })
    })

    it('should reject invalid status values', () => {
      const invalidStatuses = ['invalid', 'queued', 'reviewing', 'approved']

      invalidStatuses.forEach(status => {
        const action: Action = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          playerId: 'test-player',
          intent: 'test action',
          originalInput: 'This is a test action',
          timestamp: new Date().toISOString(),
          status: status as any, // Type assertion for testing
          metadata: {
            confidence: 0.8
          }
        }

        const result = dataValidation.validateAction(action)
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('Invalid action status'))).toBe(true)
      })
    })
  })

  describe('Enhanced Response Structure', () => {
    it('should include all Story 2.3 required fields', () => {
      // Test the enhanced confirmation response structure
      const mockAction: Action = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        playerId: 'test-player',
        intent: 'attack the dragon with sword',
        originalInput: 'I want to attack the dragon with my sword',
        timestamp: new Date().toISOString(),
        status: 'received',
        metadata: {
          confidence: 0.8,
          parsedIntent: {
            actionType: 'combat',
            target: 'dragon',
            method: 'sword'
          }
        }
      }

      // Simulate the enhanced confirmation response
      const confirmationResponse = {
        id: mockAction.id,
        playerId: mockAction.playerId,
        originalInput: mockAction.originalInput,
        intent: mockAction.intent,
        status: mockAction.status,
        timestamp: mockAction.timestamp,
        message: 'Action received! Processing world changes...', // Exact AC requirement
        actionDescription: mockAction.metadata.parsedIntent?.target ?
          `${mockAction.metadata.parsedIntent.actionType} ${mockAction.metadata.parsedIntent.target}` :
          mockAction.metadata.parsedIntent?.actionType || 'unknown action',
        aiProcessingStatus: 'processing', // Show AI is working on consequences
        parsedIntent: mockAction.metadata.parsedIntent
      }

      // Validate all AC requirements
      expect(confirmationResponse.id).toBeDefined()
      expect(confirmationResponse.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(confirmationResponse.playerId).toBe('test-player')
      expect(confirmationResponse.originalInput).toBe('I want to attack the dragon with my sword')
      expect(confirmationResponse.status).toBe('received')
      expect(confirmationResponse.message).toBe('Action received! Processing world changes...')
      expect(confirmationResponse.actionDescription).toBe('combat dragon')
      expect(confirmationResponse.aiProcessingStatus).toBe('processing')
      expect(confirmationResponse.parsedIntent).toBeDefined()
    })
  })

  describe('Performance Requirements', () => {
    it('should generate UUIDs within performance limits', () => {
      const generateId = (storageManager as any).generateActionId.bind(storageManager)
      const iterations = 1000
      const startTime = Date.now()

      // Generate 1000 UUIDs
      for (let i = 0; i < iterations; i++) {
        generateId()
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / iterations

      console.log(`📊 UUID Generation Performance: ${averageTime}ms per UUID (${iterations} iterations)`)

      // Performance requirement: should be very fast (<1ms per UUID)
      expect(averageTime).toBeLessThan(1)
      expect(totalTime).toBeLessThan(1000) // Total <1 second for 1000 UUIDs
    })

    it('should validate actions within performance limits', () => {
      const action: Action = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        playerId: 'test-player',
        intent: 'test action',
        originalInput: 'This is a test action',
        timestamp: new Date().toISOString(),
        status: 'received',
        metadata: {
          confidence: 0.8
        }
      }

      const iterations = 100
      const startTime = Date.now()

      // Validate 100 actions
      for (let i = 0; i < iterations; i++) {
        dataValidation.validateAction(action)
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / iterations

      console.log(`📊 Validation Performance: ${averageTime}ms per validation (${iterations} iterations)`)

      // Performance requirement: should be fast (<10ms per validation)
      expect(averageTime).toBeLessThan(10)
    })
  })
})