/**
 * Per-Model Circuit Breaker and Rate Limiter
 *
 * Provides individual circuit breaker and rate limiting for each AI model:
 * - Z.ai: Circuit breaker and rate limiting ENABLED
 * - OpenAI: Circuit breaker and rate limiting DISABLED
 * - OpenRouter: Circuit breaker and rate limiting DISABLED
 */

export interface CircuitBreakerConfig {
  enabled: boolean
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
}

export interface RateLimitConfig {
  enabled: boolean
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
}

export interface ModelConfig {
  circuitBreaker: CircuitBreakerConfig
  rateLimit: RateLimitConfig
}

export interface CircuitBreakerState {
  isOpen: boolean
  failureCount: number
  lastFailureTime?: number
  nextAttemptTime?: number
  stateHistory: Array<{
    timestamp: number
    state: 'closed' | 'open' | 'half-open'
    reason?: string
  }>
}

export interface RateLimitState {
  requestsThisMinute: number
  requestsThisHour: number
  requestsThisDay: number
  minuteWindowStart: number
  hourWindowStart: number
  dayWindowStart: number
  lastRequestTime: number
}

export interface ModelStates {
  circuitBreaker: CircuitBreakerState
  rateLimit: RateLimitState
}

export class PerModelCircuitBreaker {
  private modelConfigs: Map<string, ModelConfig> = new Map()
  private modelStates: Map<string, ModelStates> = new Map()
  private globalMetrics = {
    totalRequests: 0,
    blockedByCircuitBreaker: 0,
    blockedByRateLimit: 0,
    successfulRequests: 0
  }

  constructor() {
    this.initializeModelConfigs()
  }

  private initializeModelConfigs(): void {
    // Z.ai - Circuit breaker and rate limiting ENABLED
    this.modelConfigs.set('zai', {
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 300000 // 5 minutes
      },
      rateLimit: {
        enabled: true,
        requestsPerMinute: 10,
        requestsPerHour: 200,
        requestsPerDay: 1000
      }
    })

    // OpenAI - Circuit breaker and rate limiting DISABLED
    this.modelConfigs.set('openai', {
      circuitBreaker: {
        enabled: false,
        failureThreshold: 10,
        recoveryTimeout: 120000,
        monitoringPeriod: 600000
      },
      rateLimit: {
        enabled: false,
        requestsPerMinute: 100,
        requestsPerHour: 2000,
        requestsPerDay: 10000
      }
    })

    // OpenRouter - Circuit breaker and rate limiting DISABLED
    this.modelConfigs.set('openrouter', {
      circuitBreaker: {
        enabled: false,
        failureThreshold: 10,
        recoveryTimeout: 120000,
        monitoringPeriod: 600000
      },
      rateLimit: {
        enabled: false,
        requestsPerMinute: 100,
        requestsPerHour: 2000,
        requestsPerDay: 10000
      }
    })

    // Initialize states for all models
    this.modelConfigs.forEach((config, modelKey) => {
      this.modelStates.set(modelKey, {
        circuitBreaker: {
          isOpen: false,
          failureCount: 0,
          stateHistory: [{
            timestamp: Date.now(),
            state: 'closed',
            reason: 'Initialized'
          }]
        },
        rateLimit: {
          requestsThisMinute: 0,
          requestsThisHour: 0,
          requestsThisDay: 0,
          minuteWindowStart: Date.now(),
          hourWindowStart: Date.now(),
          dayWindowStart: Date.now(),
          lastRequestTime: 0
        }
      })
    })
  }

  async executeRequest<T>(
    modelKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const config = this.modelConfigs.get(modelKey)
    const state = this.modelStates.get(modelKey)

    if (!config || !state) {
      throw new Error(`Unknown model: ${modelKey}`)
    }

    this.globalMetrics.totalRequests++

    try {
      // Check circuit breaker (only if enabled)
      if (config.circuitBreaker.enabled) {
        await this.checkCircuitBreaker(modelKey, config, state)
      }

      // Check rate limit (only if enabled)
      if (config.rateLimit.enabled) {
        this.checkRateLimit(modelKey, config, state)
      }

      // Execute the operation
      const result = await operation()

      // Record success
      if (config.circuitBreaker.enabled) {
        this.recordCircuitBreakerSuccess(modelKey, state)
      }

      this.globalMetrics.successfulRequests++
      return result

    } catch (error) {
      // Record failure
      if (config.circuitBreaker.enabled) {
        this.recordCircuitBreakerFailure(modelKey, state, error as Error)
      }

      throw error
    }
  }

  private async checkCircuitBreaker(
    modelKey: string,
    config: ModelConfig,
    state: ModelStates
  ): Promise<void> {
    const { isOpen, nextAttemptTime } = state.circuitBreaker

    if (isOpen) {
      if (Date.now() >= (nextAttemptTime || 0)) {
        // Try to transition to half-open
        this.transitionCircuitBreaker(modelKey, 'half-open', 'Recovery timeout elapsed')
      } else {
        this.globalMetrics.blockedByCircuitBreaker++
        throw new Error(`Circuit breaker is open for ${modelKey}. Next attempt at ${new Date(nextAttemptTime || 0).toISOString()}`)
      }
    }
  }

  private checkRateLimit(
    modelKey: string,
    config: ModelConfig,
    state: ModelStates
  ): void {
    const now = Date.now()
    const rateLimit = state.rateLimit

    // Reset windows if needed
    this.resetRateLimitWindows(rateLimit, now)

    // Check limits
    if (rateLimit.requestsThisMinute >= config.rateLimit.requestsPerMinute) {
      this.globalMetrics.blockedByRateLimit++
      throw new Error(`Rate limit exceeded for ${modelKey}: ${config.rateLimit.requestsPerMinute} requests per minute`)
    }

    if (rateLimit.requestsThisHour >= config.rateLimit.requestsPerHour) {
      this.globalMetrics.blockedByRateLimit++
      throw new Error(`Rate limit exceeded for ${modelKey}: ${config.rateLimit.requestsPerHour} requests per hour`)
    }

    if (rateLimit.requestsThisDay >= config.rateLimit.requestsPerDay) {
      this.globalMetrics.blockedByRateLimit++
      throw new Error(`Rate limit exceeded for ${modelKey}: ${config.rateLimit.requestsPerDay} requests per day`)
    }

    // Increment counters
    rateLimit.requestsThisMinute++
    rateLimit.requestsThisHour++
    rateLimit.requestsThisDay++
    rateLimit.lastRequestTime = now
  }

  private resetRateLimitWindows(rateLimit: RateLimitState, now: number): void {
    // Reset minute window
    if (now - rateLimit.minuteWindowStart >= 60000) {
      rateLimit.requestsThisMinute = 0
      rateLimit.minuteWindowStart = now
    }

    // Reset hour window
    if (now - rateLimit.hourWindowStart >= 3600000) {
      rateLimit.requestsThisHour = 0
      rateLimit.hourWindowStart = now
    }

    // Reset day window
    if (now - rateLimit.dayWindowStart >= 86400000) {
      rateLimit.requestsThisDay = 0
      rateLimit.dayWindowStart = now
    }
  }

  private recordCircuitBreakerSuccess(modelKey: string, state: ModelStates): void {
    const circuitBreaker = state.circuitBreaker

    if (circuitBreaker.isOpen) {
      // Circuit breaker was half-open, now close it
      this.transitionCircuitBreaker(modelKey, 'closed', 'Successful request in half-open state')
    } else {
      // Reset failure count on success
      circuitBreaker.failureCount = 0
    }
  }

  private recordCircuitBreakerFailure(modelKey: string, state: ModelStates, error: Error): void {
    const circuitBreaker = state.circuitBreaker
    circuitBreaker.failureCount++
    circuitBreaker.lastFailureTime = Date.now()

    const config = this.modelConfigs.get(modelKey)
    if (!config) return

    // Check if we should open the circuit breaker
    if (circuitBreaker.failureCount >= config.circuitBreaker.failureThreshold) {
      this.transitionCircuitBreaker(modelKey, 'open', `Failure threshold reached: ${error.message}`)
    }
  }

  private transitionCircuitBreaker(modelKey: string, newState: 'closed' | 'open' | 'half-open', reason: string): void {
    const state = this.modelStates.get(modelKey)
    if (!state) return

    const circuitBreaker = state.circuitBreaker
    const now = Date.now()

    circuitBreaker.isOpen = newState === 'open'

    if (newState === 'open') {
      const config = this.modelConfigs.get(modelKey)
      circuitBreaker.nextAttemptTime = now + (config?.circuitBreaker.recoveryTimeout || 60000)
    }

    circuitBreaker.stateHistory.push({
      timestamp: now,
      state: newState,
      reason
    })

    // Keep only last 10 state changes
    if (circuitBreaker.stateHistory.length > 10) {
      circuitBreaker.stateHistory = circuitBreaker.stateHistory.slice(-10)
    }
  }

  // Public methods for monitoring and management
  getCircuitBreakerState(modelKey: string): CircuitBreakerState | null {
    return this.modelStates.get(modelKey)?.circuitBreaker || null
  }

  getRateLimitState(modelKey: string): RateLimitState | null {
    return this.modelStates.get(modelKey)?.rateLimit || null
  }

  getModelConfig(modelKey: string): ModelConfig | null {
    return this.modelConfigs.get(modelKey) || null
  }

  getGlobalMetrics() {
    return {
      ...this.globalMetrics,
      configuredModels: Array.from(this.modelConfigs.keys())
    }
  }

  resetCircuitBreaker(modelKey: string): void {
    const state = this.modelStates.get(modelKey)
    if (!state) return

    this.transitionCircuitBreaker(modelKey, 'closed', 'Manual reset')
    state.circuitBreaker.failureCount = 0
    state.circuitBreaker.lastFailureTime = undefined
    state.circuitBreaker.nextAttemptTime = undefined
  }

  resetRateLimit(modelKey: string): void {
    const state = this.modelStates.get(modelKey)
    if (!state) return

    const now = Date.now()
    state.rateLimit = {
      requestsThisMinute: 0,
      requestsThisHour: 0,
      requestsThisDay: 0,
      minuteWindowStart: now,
      hourWindowStart: now,
      dayWindowStart: now,
      lastRequestTime: 0
    }
  }

  // Get summary for logging/monitoring
  getMonitoringSummary(): any {
    const summary: any = {
      globalMetrics: this.getGlobalMetrics(),
      models: {}
    }

    this.modelStates.forEach((state, modelKey) => {
      const config = this.modelConfigs.get(modelKey)
      summary.models[modelKey] = {
        circuitBreaker: {
          enabled: config?.circuitBreaker.enabled || false,
          state: state.circuitBreaker.isOpen ? 'open' : 'closed',
          failureCount: state.circuitBreaker.failureCount,
          lastFailureTime: state.circuitBreaker.lastFailureTime ? new Date(state.circuitBreaker.lastFailureTime).toISOString() : null,
          nextAttemptTime: state.circuitBreaker.nextAttemptTime ? new Date(state.circuitBreaker.nextAttemptTime).toISOString() : null
        },
        rateLimit: {
          enabled: config?.rateLimit.enabled || false,
          currentUsage: {
            requestsThisMinute: state.rateLimit.requestsThisMinute,
            requestsThisHour: state.rateLimit.requestsThisHour,
            requestsThisDay: state.rateLimit.requestsThisDay
          },
          limits: config?.rateLimit || {}
        }
      }
    })

    return summary
  }
}

// Export singleton instance
export const perModelCircuitBreaker = new PerModelCircuitBreaker()