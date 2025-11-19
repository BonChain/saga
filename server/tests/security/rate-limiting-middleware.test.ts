/**
 * Rate Limiting Middleware Security Tests
 *
 * Comprehensive security testing for rate limiting implementation
 * Tests rate limiting per IP, proper headers, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { CharacterRoutes } from '../../src/routes/api/characters'
import { CharacterService } from '../../src/services/character-service'
import { Logger } from 'winston'

describe('Security: Rate Limiting Middleware', () => {
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

    // Clear rate limit store before each test
    if ((characterRoutes as any).rateLimitStore) {
      (characterRoutes as any).rateLimitStore.clear()
    }
  })

  afterEach(() => {
    // Clean up rate limit store after each test
    if ((characterRoutes as any).rateLimitStore) {
      (characterRoutes as any).rateLimitStore.clear()
    }
  })

  describe('Rate Limiting Logic', () => {
    it('should allow requests within rate limit', () => {
      const mockReq = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.1' },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)

      // First request should pass
      rateLimitMiddleware(mockReq, mockRes, mockNext)
      expect(mockNext).toHaveBeenCalled()

      // Second request should also pass (within limits)
      const mockReq2 = { ...mockReq }
      const mockRes2 = {} as Response
      const mockNext2 = jest.fn()

      rateLimitMiddleware(mockReq2, mockRes2, mockNext2)
      expect(mockNext2).toHaveBeenCalled()
    })

    it('should set proper rate limit headers', () => {
      const mockReq = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.1' },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '99')
      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String))
    })

    it('should block requests when rate limit exceeded', () => {
      const ip = '192.168.1.1'

      // Simulate hitting rate limit by directly setting the store
      if ((characterRoutes as any).rateLimitStore) {
        const now = Date.now()
        (characterRoutes as any).rateLimitStore.set(ip, {
          count: 100, // At the limit
          resetTime: now + 60000 // 1 minute from now
        })
      }

      const mockReq = {
        ip: ip,
        socket: { remoteAddress: ip },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
          limit: 100,
          windowMs: 60000,
          retryAfter: expect.any(Number)
        })
      )
    })

    it('should set proper retry-after headers when rate limited', () => {
      const ip = '192.168.1.1'

      // Simulate hitting rate limit
      if ((characterRoutes as any).rateLimitStore) {
        const now = Date.now()
        const resetTime = now + 30000 // 30 seconds from now
        (characterRoutes as any).rateLimitStore.set(ip, {
          count: 100,
          resetTime: resetTime
        })
      }

      const mockReq = {
        ip: ip,
        socket: { remoteAddress: ip },
        headers: {}
      } as Request

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockRes.set).toHaveBeenCalledWith('Retry-After', expect.any(String))
      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String))
    })
  })

  describe('IP Address Detection', () => {
    it('should use IP address from req.ip when available', () => {
      const mockReq = {
        ip: '203.0.113.42',
        socket: { remoteAddress: undefined },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Check that the IP was used
      const store = (characterRoutes as any).rateLimitStore
      expect(store.has('203.0.113.42')).toBe(true)
    })

    it('should use socket.remoteAddress as fallback', () => {
      const mockReq = {
        ip: undefined,
        socket: { remoteAddress: '198.51.100.10' },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Check that the IP was used
      const store = (characterRoutes as any).rateLimitStore
      expect(store.has('198.51.100.10')).toBe(true)
    })

    it('should use x-forwarded-for header when available', () => {
      const mockReq = {
        ip: undefined,
        socket: { remoteAddress: undefined },
        headers: {
          'x-forwarded-for': '192.168.2.100'
        }
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Check that the forwarded IP was used
      const store = (characterRoutes as any).rateLimitStore
      expect(store.has('192.168.2.100')).toBe(true)
    })

    it('should handle array of forwarded IPs', () => {
      const mockReq = {
        ip: undefined,
        socket: { remoteAddress: undefined },
        headers: {
          'x-forwarded-for': ['203.0.113.42', '192.168.2.100', '10.0.0.1']
        }
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Check that the first forwarded IP was used
      const store = (characterRoutes as any).rateLimitStore
      expect(store.has('203.0.113.42')).toBe(true)
    })

    it('should use unknown when no IP info available', () => {
      const mockReq = {
        ip: undefined,
        socket: { remoteAddress: undefined },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Check that 'unknown' was used
      const store = (characterRoutes as any).rateLimitStore
      expect(store.has('unknown')).toBe(true)
    })
  })

  describe('Window Reset Logic', () => {
    it('should reset counter after time window expires', () => {
      const ip = '192.168.1.1'
      const now = Date.now()
      const pastResetTime = now - 1000 // 1 second ago (in the past)

      // Set up expired rate limit entry
      if ((characterRoutes as any).rateLimitStore) {
        (characterRoutes as any).rateLimitStore.set(ip, {
          count: 50,
          resetTime: pastResetTime
        })
      }

      const mockReq = {
        ip: ip,
        socket: { remoteAddress: ip },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Should have reset to 1
      const store = (characterRoutes as any).rateLimitStore
      const clientData = store.get(ip)
      expect(clientData.count).toBe(1)
    })

    it('should increment counter within time window', () => {
      const ip = '192.168.1.1'
      const now = Date.now()
      const futureResetTime = now + 60000 // 1 minute in the future

      // Set up existing rate limit entry
      if ((characterRoutes as any).rateLimitStore) {
        (characterRoutes as any).rateLimitStore.set(ip, {
          count: 5,
          resetTime: futureResetTime
        })
      }

      const mockReq = {
        ip: ip,
        socket: { remoteAddress: ip },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
      rateLimitMiddleware(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()

      // Should have incremented to 6
      const store = (characterRoutes as any).rateLimitStore
      const clientData = store.get(ip)
      expect(clientData.count).toBe(6)
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle multiple requests from different IPs independently', () => {
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3']

      ips.forEach(ip => {
        const mockReq = {
          ip: ip,
          socket: { remoteAddress: ip },
          headers: {}
        } as Request

        const mockRes = {} as Response
        const mockNext = jest.fn()

        const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)
        rateLimitMiddleware(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      // Each IP should have its own counter
      const store = (characterRoutes as any).rateLimitStore
      expect(store.size).toBe(3)

      ips.forEach(ip => {
        expect(store.has(ip)).toBe(true)
        expect(store.get(ip).count).toBe(1)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed request gracefully', () => {
      const mockReq = {} as Request
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any as Response

      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)

      expect(() => rateLimitMiddleware(mockReq, mockRes, mockNext)).not.toThrow()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle very long IP addresses', () => {
      const longIp = 'a'.repeat(255)

      const mockReq = {
        ip: longIp,
        socket: { remoteAddress: longIp },
        headers: {}
      } as Request

      const mockRes = {} as Response
      const mockNext = jest.fn()

      const rateLimitMiddleware = (characterRoutes as any).rateLimitMiddleware.bind(characterRoutes)

      expect(() => rateLimitMiddleware(mockReq, mockRes, mockNext)).not.toThrow()
      expect(mockNext).toHaveBeenCalled()
    })
  })
})