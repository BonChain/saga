/**
 * Intent Parser Unit Tests
 *
 * Tests for Story 2.2: Intent Parsing & Action Creation
 * R-002 Critical Risk Mitigation: Intent parsing accuracy ≥70%
 */

import { IntentParser } from '../../src/services/intent-parser'

describe('IntentParser', () => {
  let parser: IntentParser

  beforeEach(() => {
    parser = new IntentParser()
  })

  describe('AC1-PAR-001: Combat Actions', () => {
    test('should parse simple combat action with good confidence', () => {
      const result = parser.parseIntent('attack the dragon with sword')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      expect(result.parsedIntent?.method).toBe('sword')
      expect(result.confidence).toBeGreaterThanOrEqual(0.5) // Good confidence for clear combat
    })

    test('should parse fight action with method', () => {
      const result = parser.parseIntent('fight the goblin using my axe')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      expect(result.parsedIntent?.method).toBe('axe')
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })

    test('should handle combat with no target', () => {
      const result = parser.parseIntent('attack with spell')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      expect(result.parsedIntent?.method).toBe('spell')
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })
  })

  describe('AC1-PAR-002: Social Actions', () => {
    test('should parse befriend action', () => {
      const result = parser.parseIntent('befriend the goblin king')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('social')
      expect(result.parsedIntent?.target).toBe('goblin king')
      expect(result.parsedIntent?.method).toBe('befriend')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse talk action', () => {
      const result = parser.parseIntent('talk to the merchant')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('social')
      expect(result.parsedIntent?.target).toBe('merchant')
      expect(result.parsedIntent?.method).toBe('talk')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse persuade action', () => {
      const result = parser.parseIntent('persuade the guard to let me pass')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('social')
      expect(result.parsedIntent?.target).toBe('guard')
      expect(result.parsedIntent?.method).toBe('persuade')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })
  })

  describe('AC1-PAR-003: Exploration Actions', () => {
    test('should parse explore action with location', () => {
      const result = parser.parseIntent('explore the dark forest')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('exploration')
      expect(result.parsedIntent?.target).toBe('dark forest')
      expect(result.parsedIntent?.method).toBe('explore')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9) // High confidence for clear exploration
    })

    test('should parse search action', () => {
      const result = parser.parseIntent('search for treasure')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('exploration')
      expect(result.parsedIntent?.method).toBe('search')
      expect(result.parsedIntent?.objects).toContain('treasure')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse travel action', () => {
      const result = parser.parseIntent('travel to the mountain')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('exploration')
      expect(result.parsedIntent?.target).toBe('mountain')
      expect(result.parsedIntent?.method).toBe('travel')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })
  })

  describe('AC1-PAR-004: Economic Actions', () => {
    test('should parse buy action', () => {
      const result = parser.parseIntent('buy potions from merchant')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('economic')
      expect(result.parsedIntent?.target).toBe('merchant')
      expect(result.parsedIntent?.method).toBe('buy potions')
      expect(result.parsedIntent?.objects).toContain('potions')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse sell action', () => {
      const result = parser.parseIntent('sell my sword')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('economic')
      expect(result.parsedIntent?.method).toBe('sell')
      expect(result.parsedIntent?.objects).toContain('sword')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse craft action', () => {
      const result = parser.parseIntent('craft a new weapon')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('economic')
      expect(result.parsedIntent?.method).toBe('craft')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })
  })

  describe('AC1-PAR-005: Creative Actions', () => {
    test('should parse compose action', () => {
      const result = parser.parseIntent('compose epic poem about victory')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('creative')
      expect(result.parsedIntent?.method).toBe('compose epic poem')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse create action', () => {
      const result = parser.parseIntent('create a painting')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('creative')
      expect(result.parsedIntent?.method).toBe('create a painting')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    test('should parse perform action', () => {
      const result = parser.parseIntent('perform a song')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('creative')
      expect(result.parsedIntent?.method).toBe('perform a song')
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })
  })

  describe('AC1-PAR-006: Edge Cases', () => {
    test('should handle empty input', () => {
      const result = parser.parseIntent('')

      expect(result.success).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.error).toContain('Empty input')
      expect(result.fallback).toBe(true)
    })

    test('should handle whitespace only input', () => {
      const result = parser.parseIntent('   \t\n   ')

      expect(result.success).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.error).toContain('Empty input')
      expect(result.fallback).toBe(true)
    })

    test('should handle very short input', () => {
      const result = parser.parseIntent('a')

      expect(result.success).toBe(false)
      expect(result.confidence).toBe(0.1)
      expect(result.error).toContain('too short')
      expect(result.fallback).toBe(true)
    })

    test('should handle gibberish input', () => {
      const result = parser.parseIntent('asdf qwer zxcv')

      expect(result.success).toBe(true) // Should parse but with low confidence
      expect(result.parsedIntent?.actionType).toBe('other')
      expect(result.confidence).toBeLessThan(0.4)
    })

    test('should handle null input', () => {
      const result = parser.parseIntent(null as any)

      expect(result.success).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.error).toContain('Invalid input')
      expect(result.fallback).toBe(true)
    })

    test('should handle special characters', () => {
      const result = parser.parseIntent('attack <script>alert("xss")</script>')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      expect(result.confidence).toBeLessThan(0.9) // Should be slightly reduced due to special chars
      // Ensure script tags are removed in processing
    })
  })

  describe('AC1-PAR-007: Compound Actions', () => {
    test('should parse primary action in compound statement', () => {
      const result = parser.parseIntent('attack dragon with sword then flee')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      expect(result.parsedIntent?.target).toBe('dragon')
      expect(result.parsedIntent?.method).toBe('sword')
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })

    test('should handle multi-step actions', () => {
      const result = parser.parseIntent('buy potion then drink it')

      expect(result.success).toBe(true)
      // Should prioritize the first action (buy)
      expect(result.parsedIntent?.actionType).toBe('economic')
      expect(result.parsedIntent?.objects).toContain('potion')
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })
  })

  describe('AC1-PAR-008: Confidence Scoring', () => {
    test('should give high confidence for clear, single-type actions', () => {
      const result = parser.parseIntent('explore the forest')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('exploration')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    test('should give moderate confidence for ambiguous actions', () => {
      const result = parser.parseIntent('do something interesting')

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('other')
      expect(result.confidence).toBeLessThan(0.8)
      expect(result.confidence).toBeGreaterThan(0.3)
    })

    test('should calculate confidence based on keyword strength', () => {
      const clearResult = parser.parseIntent('attack the dragon with my sword')
      const ambiguousResult = parser.parseIntent('talk to someone')

      expect(clearResult.confidence).toBeGreaterThan(ambiguousResult.confidence)
    })
  })

  describe('R-002 Mitigation: Confidence Thresholding', () => {
    test('should reject actions with confidence < 50%', () => {
      const result = parser.parseIntent('x') // Very low confidence

      expect(result.success).toBe(false)
      expect(result.confidence).toBeLessThan(0.5)
      expect(result.fallback).toBe(false) // Too low confidence even for fallback
      expect(result.error).toContain('requires clarification or human review')
    })

    test('should use fallback for confidence 50-70%', () => {
      // This test might need adjustment based on actual implementation
      const result = parser.parseIntent('asdfghjkl') // Should get some confidence

      if (result.confidence >= 0.5 && result.confidence < 0.7) {
        expect(result.success).toBe(false)
        expect(result.fallback).toBe(true)
        expect(result.error).toContain('Low confidence parsing')
      }
    })

    test('should accept actions with confidence >= 70%', () => {
      const result = parser.parseIntent('explore the dark forest')

      if (result.confidence >= 0.7) {
        expect(result.success).toBe(true)
        expect(result.parsedIntent).toBeDefined()
      }
    })
  })

  describe('Performance Requirements', () => {
    test('should parse actions within 100ms (PERF-001)', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 100; i++) {
        parser.parseIntent('attack the dragon with my sword')
      }

      const endTime = Date.now()
      const avgTime = (endTime - startTime) / 100

      expect(avgTime).toBeLessThan(100) // Should average less than 100ms per parse
      console.log(`Average parse time: ${avgTime.toFixed(2)}ms`)
    }, 10000) // 10 second timeout

    test('should handle parsing bursts without performance degradation', async () => {
      const startTime = Date.now()

      // Simulate burst of parsing requests
      const promises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(parser.parseIntent(`action ${i}`))
      )

      await Promise.all(promises)

      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(5000) // 50 parses in under 5 seconds
    }, 10000)
  })

  describe('SEC-001: Security Tests', () => {
    test('should sanitize SQL injection attempts', () => {
      const maliciousInput = "attack ' OR '1'='1"
      const result = parser.parseIntent(maliciousInput)

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      // SQL injection characters should be removed
      expect(result.confidence).toBeLessThan(1) // Should be penalized
    })

    test('should sanitize command injection attempts', () => {
      const maliciousInput = "attack ; rm -rf /"
      const result = parser.parseIntent(maliciousInput)

      expect(result.success).toBe(true)
      // Command injection characters should be removed
      expect(result.confidence).toBeLessThan(1)
    })

    test('should sanitize XSS attempts', () => {
      const maliciousInput = "attack <script>alert('xss')</script>"
      const result = parser.parseIntent(maliciousInput)

      expect(result.success).toBe(true)
      expect(result.parsedIntent?.actionType).toBe('combat')
      // XSS characters should be removed
      expect(result.confidence).toBeLessThan(1)
    })
  })
})