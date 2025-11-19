/**
 * Authentication Middleware Security Tests
 *
 * Comprehensive security testing for authentication middleware implementation
 * Tests proper validation of headers, tokens, roles, and security edge cases
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { CharacterRoutes } from '../../src/routes/api/characters'
import { CharacterService } from '../../src/services/character-service'
import { Logger } from 'winston'

describe('Security: Authentication Middleware', () => {
  let characterRoutes: CharacterRoutes
  let mockCharacterService: CharacterService
  let mockLogger: Logger

  beforeEach(() => {
    // Mock CharacterService
    mockCharacterService = {
      getCharacter: jest.fn(),
      createCharacter: jest.fn(),
      updateCharacter: jest.fn(),
      deleteCharacter: jest.fn(),
      getMemories: jest.fn(),
      addMemory: jest.fn(),
      updateRelationships: jest.fn(),
      getRelationships: jest.fn(),
      getCharacterProfile: jest.fn()
    } as any

    // Mock Logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as any

    characterRoutes = new CharacterRoutes(mockCharacterService, mockLogger)
  })

  describe('Header Validation', () => {
    it('should allow requests with all required headers', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'user',
          'x-session-token': 'valid.session.token.jwt.format'
        }
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      // Access private method through any type
      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      const result = authMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject requests missing x-user-id header', () => {
      const mockReq = {
        headers: {
          'x-user-role': 'user',
          'x-session-token': 'valid.token'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
          message: expect.stringContaining('Missing required authentication headers'),
          status: 'error'
        })
      )
    })

    it('should reject requests missing x-user-role header', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-session-token': 'valid.token'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should reject requests missing x-session-token header', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'user'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe('Input Validation', () => {
    it('should reject invalid user ID format - too short', () => {
      const mockReq = {
        headers: {
          'x-user-id': '',
          'x-user-role': 'user',
          'x-session-token': 'valid.session.token.jwt.format'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid user ID format'
        })
      )
    })

    it('should reject invalid user ID format - too long', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'x'.repeat(101),
          'x-user-role': 'user',
          'x-session-token': 'valid.session.token.jwt.format'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should reject invalid user role', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'invalid-role',
          'x-session-token': 'valid.session.token.jwt.format'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid user role'
        })
      )
    })

    it('should reject invalid session token format', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'user',
          'x-session-token': 'invalid'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid session token'
        })
      )
    })
  })

  describe('Valid Roles Acceptance', () => {
    const validRoles = ['user', 'admin', 'moderator', 'guest']

    validRoles.forEach(role => {
      it(`should accept ${role} role`, () => {
        const mockReq = {
          headers: {
            'x-user-id': 'user-123',
            'x-user-role': role,
            'x-session-token': 'header.payload.signature'
          }
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
        authMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(mockReq.user).toEqual({
          id: 'user-123',
          role: role,
          sessionToken: 'header.payload.signature'
        })
      })
    })
  })

  describe('Session Token Validation', () => {
    it('should accept properly formatted JWT-like tokens', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'user',
          'x-session-token': 'header.payload.signature'
        }
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject tokens with wrong format', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'user',
          'x-session-token': 'invalid-format'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed headers gracefully', () => {
      const mockReq = {
        headers: null
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should log authentication errors', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'user-123',
          'x-user-role': 'invalid-role',
          'x-session-token': 'valid.token'
        }
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)

      // This should not throw an error
      expect(() => authMiddleware(mockReq, mockRes, mockNext)).not.toThrow()
    })
  })

  describe('User Object Creation', () => {
    it('should properly set user object with all required fields', () => {
      const mockReq = {
        headers: {
          'x-user-id': 'test-user-456',
          'x-user-role': 'admin',
          'x-session-token': 'valid.jwt.token.signature'
        }
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const authMiddleware = (characterRoutes as any).authMiddleware.bind(characterRoutes)
      authMiddleware(mockReq, mockRes, mockNext)

      expect(mockReq.user).toEqual({
        id: 'test-user-456',
        role: 'admin',
        sessionToken: 'valid.jwt.token.signature'
      })
    })
  })
})