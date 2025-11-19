/**
 * OpenAI Configuration Management
 *
 * Handles secure API key management, configuration validation,
 * and security measures for OpenAI integration.
 */

import { OpenAIConfig, LogLevel } from '../types/ai'
import { APIKeyValidator } from '../utils/api-key-validator'

export class OpenAIConfigManager {
  private config: OpenAIConfig
  private readonly requiredEnvVars = [
    'OPENAI_API_KEY'
  ]



  constructor() {
    this.config = this.loadAndValidateConfig()
    this.validateSecurityRequirements()
  }

  /**
   * Load and validate configuration from environment variables
   */
  private loadAndValidateConfig(): OpenAIConfig {
    // Check required environment variables
    const missingRequired = this.requiredEnvVars.filter(envVar => !process.env[envVar])
    if (missingRequired.length > 0) {
      throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`)
    }

    // Validate API key format and security
    const apiKey = process.env.OPENAI_API_KEY!
    this.validateAPIKey(apiKey)

    // Load and parse configuration
    const config: OpenAIConfig = {
      apiKey,
      model: this.parseString(process.env.OPENAI_MODEL, 'gpt-3.5-turbo'),
      maxTokens: this.parseInt(process.env.MAX_TOKENS, '1000'),
      temperature: this.parseFloat(process.env.TEMPERATURE, '0.7'),
      timeout: this.parseInt(process.env.AI_REQUEST_TIMEOUT, '15000'),
      maxRetries: this.parseInt(process.env.MAX_RETRY_ATTEMPTS, '3'),
      retryDelay: this.parseInt(process.env.RETRY_BASE_DELAY, '1000'),
      maxRetryDelay: this.parseInt(process.env.RETRY_MAX_DELAY, '10000'),
      debugMode: this.parseBoolean(process.env.OPENAI_DEBUG_MODE, 'false'),
      logLevel: this.parseLogLevel(process.env.OPENAI_LOG_LEVEL, 'info')
    }

    // Validate configuration values
    this.validateConfigValues(config)

    return config
  }

  /**
   * Validate API key format and security requirements
   */
  private validateAPIKey(apiKey: string): void {
    const validation = APIKeyValidator.validateOpenAIKey(apiKey);
    if (!validation.valid) {
      throw new Error(validation.error || 'OpenAI API key validation failed');
    }
  }

  /**
   * Validate security requirements
   */
  private validateSecurityRequirements(): void {
    // Ensure we're not in development mode with exposed keys
    if (process.env.NODE_ENV === 'production') {
      // In production, ensure API key is properly set
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length < 20) {
        throw new Error('Production environment requires a valid OpenAI API key')
      }
    }

    // Check for potential security issues
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && this.isPotentiallyExposed(apiKey)) {
      console.warn('⚠️  Security Warning: API key may be exposed in logs or environment')
    }
  }

  /**
   * Check if API key might be exposed in unsafe locations
   */
  private isPotentiallyExposed(apiKey: string): boolean {
    // Check if API key is in common unsafe locations
    const unsafePatterns = [
      /localhost/i,
      /127\.0\.0\.1/i,
      /0\.0\.0\.0/i,
      /\.env$/i,
      /config\.json$/i,
      /debug/i
    ]

    // This is a basic check - in production, you'd want more sophisticated validation
    return false // Placeholder for actual security checks
  }

  /**
   * Validate configuration values
   */
  private validateConfigValues(config: OpenAIConfig): void {
    // Validate timeout
    if (config.timeout < 1000 || config.timeout > 60000) {
      throw new Error('AI_REQUEST_TIMEOUT must be between 1000ms and 60000ms')
    }

    // Validate retry settings
    if (config.maxRetries < 0 || config.maxRetries > 10) {
      throw new Error('MAX_RETRY_ATTEMPTS must be between 0 and 10')
    }

    if (config.retryDelay < 100 || config.retryDelay > 30000) {
      throw new Error('RETRY_BASE_DELAY must be between 100ms and 30000ms')
    }

    // Validate temperature
    if (config.temperature < 0 || config.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2')
    }

    // Validate max tokens
    if (config.maxTokens < 1 || config.maxTokens > 4096) {
      throw new Error('Max tokens must be between 1 and 4096')
    }
  }

  /**
   * Parse string value with fallback
   */
  private parseString(value: string | undefined, fallback: string): string {
    return value?.trim() || fallback
  }

  /**
   * Parse integer value with fallback
   */
  private parseInt(value: string | undefined, fallback: string): number {
    const parsed = parseInt(value || fallback, 10)
    return isNaN(parsed) ? parseInt(fallback, 10) : parsed
  }

  /**
   * Parse float value with fallback
   */
  private parseFloat(value: string | undefined, fallback: string): number {
    const parsed = parseFloat(value || fallback)
    return isNaN(parsed) ? parseFloat(fallback) : parsed
  }

  /**
   * Parse boolean value with fallback
   */
  private parseBoolean(value: string | undefined, fallback: string): boolean {
    const lowerValue = value?.toLowerCase()
    if (lowerValue === 'true' || lowerValue === '1') return true
    if (lowerValue === 'false' || lowerValue === '0') return false
    return fallback === 'true'
  }

  /**
   * Parse log level with fallback
   */
  private parseLogLevel(value: string | undefined, fallback: string): LogLevel {
    const validLevels = ['error', 'warn', 'info', 'debug'] as const
    const level = value?.toLowerCase()
    return validLevels.includes(level as any) ? level as LogLevel : fallback as LogLevel
  }

  /**
   * Get current configuration
   */
  public getConfig(): OpenAIConfig {
    // Return a copy to prevent modification
    return { ...this.config }
  }

  /**
   * Get masked API key for logging (security)
   */
  public getMaskedAPIKey(): string {
    if (!this.config.apiKey) return 'Not configured'

    const key = this.config.apiKey
    if (key.length <= 8) return '***'

    // Show first 3 and last 4 characters, mask the rest
    return `${key.substring(0, 3)}${'*'.repeat(key.length - 7)}${key.substring(key.length - 4)}`
  }

  /**
   * Validate configuration is ready for use
   */
  public validateReadiness(): { ready: boolean; issues: string[] } {
    const issues: string[] = []

    // Check API key
    if (!this.config.apiKey) {
      issues.push('OpenAI API key not configured')
    }

    // Check timeout value
    if (this.config.timeout < 5000) {
      issues.push('Request timeout may be too low (< 5000ms)')
    }

    // Check retry configuration
    if (this.config.maxRetries === 0 && this.config.retryDelay === 0) {
      issues.push('No retry logic configured')
    }

    // Check debug mode in production
    if (process.env.NODE_ENV === 'production' && this.config.debugMode) {
      issues.push('Debug mode should be disabled in production')
    }

    return {
      ready: issues.length === 0,
      issues
    }
  }

  /**
   * Get configuration summary (excluding sensitive data)
   */
  public getConfigSummary(): any {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      maxRetryDelay: this.config.maxRetryDelay,
      debugMode: this.config.debugMode,
      logLevel: this.config.logLevel,
      apiKeyConfigured: !!this.config.apiKey,
      maskedAPIKey: this.getMaskedAPIKey(),
      environment: process.env.NODE_ENV || 'development'
    }
  }

  /**
   * Reload configuration from environment
   */
  public reloadConfig(): OpenAIConfig {
    try {
      this.config = this.loadAndValidateConfig()
      return this.config
    } catch (error) {
      throw new Error(`Failed to reload configuration: ${(error as Error).message}`)
    }
  }

  /**
   * Get rate limiting configuration
   */
  public getRateLimitConfig(): {
    maxCallsPerDay: number
    callsPerUserPerMinute: number
    requestTimeout: number
    circuitBreakerThreshold: number
    circuitBreakerRecoveryTimeout: number
  } {
    return {
      maxCallsPerDay: parseInt(process.env.MAX_API_CALLS_PER_DAY || '1000'),
      callsPerUserPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_USER || '10'),
      requestTimeout: this.config.timeout,
      circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
      circuitBreakerRecoveryTimeout: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT || '30000')
    }
  }
}

// Export factory function instead of singleton to avoid import-time initialization
export function createOpenAIConfig(): OpenAIConfigManager {
  return new OpenAIConfigManager()
}

// Export a default instance for convenience
export const openAIConfig = createOpenAIConfig()