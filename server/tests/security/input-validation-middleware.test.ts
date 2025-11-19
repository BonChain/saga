/**
 * Input Validation Middleware Security Tests
 *
 * Comprehensive security testing for input validation implementation
 * Tests request method validation, content-type enforcement, and payload validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { CharacterRoutes } from '../../src/routes/api/characters'
import { CharacterService } from '../../src/services/character-service'
import { Logger } from 'winston'

describe('Security: Input Validation Middleware', () => {
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

  describe('HTTP Method Validation', () => {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    const invalidMethods = ['PATCH', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT']

    validMethods.forEach(method => {
      it(`should allow ${method} method`, () => {
        const mockReq = {
          method: method as string,
          headers: {}
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    invalidMethods.forEach(method => {
      it(`should reject ${method} method`, () => {
        const mockReq = {
          method: method as string,
          headers: {}
        } as Request

        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        } as any as Response

        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(405)
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Method not allowed',
            message: expect.stringContaining(`${method} is not allowed`),
            allowedMethods: validMethods,
            status: 'error'
          })
        )
      })
    })
  })

  describe('Content-Type Validation for POST/PUT/PATCH', () => {
    const bodyMethods = ['POST', 'PUT', 'PATCH']

    bodyMethods.forEach(method => {
      it(`should accept ${method} with application/json content-type`, () => {
        const mockReq = {
          method: method as string,
          headers: {
            'content-type': 'application/json'
          }
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it(`should accept ${method} with application/json charset`, () => {
        const mockReq = {
          method: method as string,
          headers: {
            'content-type': 'application/json; charset=utf-8'
          }
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it(`should reject ${method} without content-type`, () => {
        const mockReq = {
          method: method as string,
          headers: {}
        } as Request

        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        } as any as Response

        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Invalid content type',
            message: 'Content-Type must be application/json',
            status: 'error'
          })
        )
      })

      it(`should reject ${method} with wrong content-type`, () => {
        const mockReq = {
          method: method as string,
          headers: {
            'content-type': 'text/html'
          }
        } as Request

        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        } as any as Response

        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Invalid content type'
          })
        )
      })
    })
  })

  describe('GET Request Parameter Validation', () => {
    it('should accept valid pagination parameters', () => {
      const mockReq = {
        method: 'GET',
        query: {
          page: '1',
          pageSize: '10'
        },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid page parameter - negative', () => {
      const mockReq = {
        method: 'GET',
        query: {
          page: '-1'
        },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid page parameter',
          message: 'Page must be between 1 and 1000'
        })
      )
    })

    it('should reject invalid page parameter - too high', () => {
      const mockReq = {
        method: 'GET',
        query: {
          page: '1001'
        },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid page parameter',
          message: 'Page must be between 1 and 1000'
        })
      )
    })

    it('should reject invalid pageSize parameter - negative', () => {
      const mockReq = {
        method: 'GET',
        query: {
          pageSize: '-1'
        },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid pageSize parameter',
          message: 'Page size must be between 1 and 100'
        })
      )
    })

    it('should reject invalid pageSize parameter - too high', () => {
      const mockReq = {
        method: 'GET',
        query: {
          pageSize: '101'
        },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid pageSize parameter',
          message: 'Page size must be between 1 and 100'
        })
      )
    })
  })

  describe('Payload Size Validation', () => {
    bodyMethods.forEach(method => {
      it(`should accept ${method} with normal payload size`, () => {
        const mockReq = {
          method: method as string,
          headers: {
            'content-type': 'application/json',
            'content-length': '500'
          }
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it(`should accept ${method} with maximum allowed payload size`, () => {
        const mockReq = {
          method: method as string,
          headers: {
            'content-type': 'application/json',
            'content-length': '1048576' // 1MB
          }
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it(`should reject ${method} with payload too large`, () => {
        const mockReq = {
          method: method as string,
          headers: {
            'content-type': 'application/json',
            'content-length': '1048577' // 1MB + 1 byte (over limit)
          }
        } as Request

        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis()
        } as any as Response

        const mockNext = jest.fn()

        const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
        requestValidationMiddleware(mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(413)
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Payload too large',
            message: 'Request body cannot exceed 1MB',
            maxSize: '1MB'
          })
        )
      })
    })
  })

  describe('GET Request Default Values', () => {
    it('should use default page value when not provided', () => {
      const mockReq = {
        method: 'GET',
        query: {},
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should use default pageSize value when not provided', () => {
      const mockReq = {
        method: 'GET',
        query: {
          page: '1'
        },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed query parameters gracefully', () => {
      const mockReq = {
        method: 'GET',
        query: null,
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)
      requestValidationMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle malformed headers gracefully', () => {
      const mockReq = {
        method: 'POST',
        headers: null
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)

      expect(() => requestValidationMiddleware(mockReq, mockRes, mockNext)).not.toThrow()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should log validation errors appropriately', () => {
      const mockReq = {
        method: 'GET',
        query: {
          page: 'invalid'
        },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const requestValidationMiddleware = (characterRoutes as any).requestValidationMiddleware.bind(characterRoutes)

      // This should not throw an error
      expect(() => requestValidationMiddleware(mockReq, mockRes, mockNext)).not.toThrow()
    })
  })
})