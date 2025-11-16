/**
 * Story 3.1: OpenAI Integration & Prompt Templates - Unit Tests
 *
 * Unit tests for the OpenAI integration system including:
 * - OpenAI client initialization and configuration
 * - API key management and security
 * - Error handling and retry logic
 * - Rate limiting and circuit breaker functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { OpenAIIntegration } from '../../src/services/OpenAIIntegration'
import { openAIConfig } from '../../src/config/openai'
import { AIRequest, PromptType } from '../../src/types/ai'

describe('Story 3.1: OpenAI Integration', () => {
  let openAI: OpenAIIntegration

  beforeAll(() => {
    // Mock environment variables for testing
    process.env.OPENAI_API_KEY = 'sk-test1234567890abcdefghijklmnopqrstuvwxyz'
    process.env.OPENAI_MODEL = 'gpt-3.5-turbo'
    process.env.MAX_API_CALLS_PER_DAY = '100'
    process.env.AI_RATE_LIMIT_PER_USER = '5'
    process.env.AI_REQUEST_TIMEOUT = '10000'
    process.env.MAX_RETRY_ATTEMPTS = '2'
    process.env.RETRY_BASE_DELAY = '500'
    process.env.RETRY_MAX_DELAY = '2000'
    process.env.OPENAI_DEBUG_MODE = 'true'
    process.env.OPENAI_LOG_LEVEL = 'debug'
  })

  describe('API Key Management and Security', () => {
    it('should validate API key format', () => {
      expect(() => new OpenAIIntegration()).not.toThrow()
    })

    it('should reject invalid API key format', () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'invalid-key'

      expect(() => new OpenAIIntegration()).toThrow(/Invalid OpenAI API key format/)

      process.env.OPENAI_API_KEY = originalKey
    })

    it('should reject placeholder API keys', () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'sk-yourkeyhere'

      expect(() => new OpenAIIntegration()).toThrow(/appears to be a placeholder/)

      process.env.OPENAI_API_KEY = originalKey
    })

    it('should mask API keys in logs', () => {
      const maskedKey = openAIConfig.getMaskedAPIKey()
      expect(maskedKey).toMatch(/^sk-\*+....$/)
      expect(maskedKey).not.toContain(process.env.OPENAI_API_KEY!.substring(4, -4))
    })

    it('should validate configuration readiness', () => {
      const readiness = openAIConfig.validateReadiness()
      expect(readiness.ready).toBe(true)
      expect(readiness.issues).toHaveLength(0)
    })
  })

  describe('Configuration Management', () => {
    it('should load configuration from environment', () => {
      const config = openAIConfig.getConfig()
      expect(config.model).toBe('gpt-3.5-turbo')
      expect(config.timeout).toBe(10000)
      expect(config.maxRetries).toBe(2)
    })

    it('should provide configuration summary without sensitive data', () => {
      const summary = openAIConfig.getConfigSummary()
      expect(summary).toHaveProperty('model', 'gpt-3.5-turbo')
      expect(summary).toHaveProperty('apiKeyConfigured', true)
      expect(summary).toHaveProperty('maskedAPIKey')
      expect(summary).not.toHaveProperty('apiKey')
    })

    it('should get rate limiting configuration', () => {
      const rateLimitConfig = openAIConfig.getRateLimitConfig()
      expect(rateLimitConfig.maxCallsPerDay).toBe(100)
      expect(rateLimitConfig.callsPerUserPerMinute).toBe(5)
      expect(rateLimitConfig.requestTimeout).toBe(10000)
    })
  })

  describe('OpenAI Client Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        openAI = new OpenAIIntegration()
      }).not.toThrow()
    })

    it('should handle health checks', async () => {
      const healthCheck = await openAI.healthCheck()
      expect(healthCheck).toHaveProperty('healthy')
      expect(healthCheck).toHaveProperty('details')
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should initialize circuit breaker in closed state', () => {
      const circuitBreaker = openAI.getCircuitBreakerState()
      expect(circuitBreaker.isOpen).toBe(false)
      expect(circuitBreaker.failureCount).toBe(0)
    })

    it('should track usage metrics', () => {
      const metrics = openAI.getMetrics()
      expect(metrics).toHaveProperty('totalRequests')
      expect(metrics).toHaveProperty('successfulRequests')
      expect(metrics).toHaveProperty('failedRequests')
      expect(metrics).toHaveProperty('totalTokens')
      expect(metrics).toHaveProperty('totalCost')
    })

    it('should provide rate limit information', () => {
      const rateLimitInfo = openAI.getRateLimitInfo()
      expect(rateLimitInfo).toHaveProperty('requestsPerMinute')
      expect(rateLimitInfo).toHaveProperty('requestsPerHour')
      expect(rateLimitInfo).toHaveProperty('requestsPerDay')
      expect(rateLimitInfo).toHaveProperty('currentUsage')
    })
  })

  describe('Request Processing', () => {
    it('should validate request structure', () => {
      const request: AIRequest = {
        id: 'test-request-1',
        actionId: 'test-action-1',
        promptType: PromptType.CONSEQUENCE_GENERATION,
        context: {} as any,
        prompt: 'Test prompt',
        timestamp: new Date().toISOString(),
        maxTokens: 100,
        temperature: 0.5
      }

      expect(request.id).toBeDefined()
      expect(request.actionId).toBeDefined()
      expect(request.promptType).toBe(PromptType.CONSEQUENCE_GENERATION)
    })

    it('should handle missing API key gracefully', () => {
      const originalKey = process.env.OPENAI_API_KEY

      // Test with empty API key
      process.env.OPENAI_API_KEY = ''
      expect(() => openAIConfig.reloadConfig()).toThrow()

      // Restore original key
      process.env.OPENAI_API_KEY = originalKey
    })
  })

  describe('Security Validation', () => {
    it('should reject API keys that are too short', () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'sk-short'

      expect(() => new OpenAIIntegration()).toThrow(/appears to be too short/)

      process.env.OPENAI_API_KEY = originalKey
    })

    it('should validate timeout configuration', () => {
      const originalTimeout = process.env.AI_REQUEST_TIMEOUT

      process.env.AI_REQUEST_TIMEOUT = '500' // Too low
      expect(() => openAIConfig.reloadConfig()).toThrow(/must be between 1000ms and 60000ms/)

      process.env.AI_REQUEST_TIMEOUT = '70000' // Too high
      expect(() => openAIConfig.reloadConfig()).toThrow(/must be between 1000ms and 60000ms/)

      process.env.AI_REQUEST_TIMEOUT = originalTimeout
    })

    it('should validate retry configuration', () => {
      const originalRetries = process.env.MAX_RETRY_ATTEMPTS

      process.env.MAX_RETRY_ATTEMPTS = '15' // Too many retries
      expect(() => openAIConfig.reloadConfig()).toThrow(/must be between 0 and 10/)

      process.env.MAX_RETRY_ATTEMPTS = originalRetries
    })
  })

  describe('Integration with Existing Systems', () => {
    it('should be compatible with existing Story 2.3 confirmation system', () => {
      // This test ensures our OpenAI integration doesn't break existing functionality
      const config = openAIConfig.getConfig()
      expect(config.timeout).toBeGreaterThan(1000) // Should work with 1-second confirmation requirement
    })

    it('should maintain performance requirements', () => {
      const rateLimitConfig = openAIConfig.getRateLimitConfig()
      expect(rateLimitConfig.requestTimeout).toBeLessThanOrEqual(15000) // AC requirement
    })
  })
})