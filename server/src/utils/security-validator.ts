/**
 * Security Configuration Validator
 *
 * Validates environment variables and security configurations
 * to ensure production-safe deployment configurations.
 */

export interface SecurityValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
}

export interface SecurityConfig {
  nodeEnv: string
  isProduction: boolean
  isDevelopment: boolean
  jwtSecret: string | undefined
  apiKeys: Record<string, string | undefined>
  rateLimiting: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
  logging: {
    level: string
    logSecrets: boolean
    verboseLogging: boolean
  }
  cors: {
    enabled: boolean
    origins: string[]
  }
}

export class SecurityValidator {
  private config: SecurityConfig

  constructor() {
    this.config = this.buildSecurityConfig()
  }

  /**
   * Build security configuration from environment variables
   */
  private buildSecurityConfig(): SecurityConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
      jwtSecret: process.env.JWT_SECRET,
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        suiRpc: process.env.SUI_RPC_URL,
        suiFullNode: process.env.SUI_FULLNODE_URL,
        walrusToken: process.env.WALRUS_AUTH_TOKEN,
      },
      rateLimiting: {
        enabled: process.env.RATE_LIMITING_DISABLED !== 'true',
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        logSecrets: process.env.LOG_SECRETS === 'true',
        verboseLogging: process.env.VERBOSE_LOGGING === 'true',
      },
      cors: {
        enabled: process.env.CORS_DISABLED !== 'true',
        origins: (process.env.CORS_ORIGINS || '*').split(',').map(o => o.trim()),
      }
    }
  }

  /**
   * Comprehensive security validation
   */
  public validate(): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      recommendations: []
    }

    this.validateEnvironment(result)
    this.validateAuthentication(result)
    this.validateApiKeys(result)
    this.validateRateLimiting(result)
    this.validateLogging(result)
    this.validateCors(result)

    result.isValid = result.errors.length === 0
    return result
  }

  /**
   * Validate environment configuration
   */
  private validateEnvironment(result: SecurityValidationResult): void {
    if (!this.config.nodeEnv) {
      result.errors.push('NODE_ENV not set - should be "development", "staging", or "production"')
      return
    }

    const validEnvs = ['development', 'staging', 'production', 'test']
    if (!validEnvs.includes(this.config.nodeEnv)) {
      result.errors.push(`Invalid NODE_ENV: "${this.config.nodeEnv}". Must be one of: ${validEnvs.join(', ')}`)
    }

    if (this.config.isProduction) {
      // Production-specific validations
      if (this.config.logging.verboseLogging) {
        result.warnings.push('Verbose logging enabled in production - may expose sensitive information')
      }

      if (this.config.logging.logSecrets) {
        result.errors.push('LOG_SECRETS is enabled in production - secrets may be logged')
      }
    }

    if (this.config.isDevelopment && !this.config.jwtSecret) {
      result.warnings.push('Using generated JWT secret in development - set JWT_SECRET for consistency')
    }
  }

  /**
   * Validate authentication configuration
   */
  private validateAuthentication(result: SecurityValidationResult): void {
    if (!this.config.jwtSecret) {
      if (this.config.isProduction) {
        result.errors.push('JWT_SECRET not set - authentication insecure in production')
      } else {
        result.warnings.push('JWT_SECRET not set - using generated secret')
      }
    } else if (this.config.jwtSecret.length < 32) {
      result.errors.push('JWT_SECRET too short - should be at least 32 characters')
    }

    // Check for weak secrets
    const weakPatterns = [
      /password/i,
      /secret/i,
      /12345/,
      /abcde/,
      /qwerty/i,
      /letmein/i,
      /admin/i,
      /test/i,
    ]

    if (this.config.jwtSecret && weakPatterns.some(pattern => pattern.test(this.config.jwtSecret!))) {
      result.errors.push('JWT_SECRET contains common weak patterns - use a strong random secret')
    }
  }

  /**
   * Validate API key configurations
   */
  private validateApiKeys(result: SecurityValidationResult): void {
    for (const [service, apiKey] of Object.entries(this.config.apiKeys)) {
      if (!apiKey) {
        if (this.config.isProduction) {
          result.warnings.push(`${service.toUpperCase()}_API_KEY not configured`)
        }
        continue
      }

      // Check API key strength
      if (apiKey.length < 20) {
        result.warnings.push(`${service.toUpperCase()}_API_KEY seems too short (${apiKey.length} characters)`)
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /test/i,
        /demo/i,
        /example/i,
        /fake/i,
        /sk-/i,  // Stripe pattern warning
        /^1234/,
        /aaaaa/i,
      ]

      if (suspiciousPatterns.some(pattern => pattern.test(apiKey))) {
        result.warnings.push(`${service.toUpperCase()}_API_KEY contains suspicious test/demo patterns`)
      }

      // Production-specific checks
      if (this.config.isProduction) {
        const testPatterns = [
          /test/i,
          /demo/i,
          /sandbox/i,
          /dev/i,
          /staging/i,
        ]

        if (testPatterns.some(pattern => pattern.test(apiKey))) {
          result.errors.push(`${service.toUpperCase()}_API_KEY appears to be a test key in production`)
        }
      }
    }
  }

  /**
   * Validate rate limiting configuration
   */
  private validateRateLimiting(result: SecurityValidationResult): void {
    if (!this.config.rateLimiting.enabled) {
      result.warnings.push('Rate limiting disabled - API may be vulnerable to DoS attacks')
      return
    }

    if (this.config.rateLimiting.maxRequests > 1000) {
      result.warnings.push('Very high rate limit may allow abuse')
    }

    if (this.config.rateLimiting.windowMs < 60000) { // Less than 1 minute
      result.warnings.push('Very short rate limit window may be too restrictive')
    }

    // Production recommendations
    if (this.config.isProduction) {
      if (this.config.rateLimiting.maxRequests > 100) {
        result.recommendations.push('Consider lower rate limits for production (e.g., 100 requests/15min)')
      }

      if (this.config.rateLimiting.windowMs > 1800000) { // More than 30 minutes
        result.recommendations.push('Consider shorter rate limit windows for better protection')
      }
    }
  }

  /**
   * Validate logging configuration
   */
  private validateLogging(result: SecurityValidationResult): void {
    const validLevels = ['error', 'warn', 'info', 'debug']
    if (!validLevels.includes(this.config.logging.level)) {
      result.warnings.push(`Invalid LOG_LEVEL: "${this.config.logging.level}". Should be one of: ${validLevels.join(', ')}`)
    }

    if (this.config.logging.verboseLogging) {
      result.warnings.push('Verbose logging enabled - may impact performance and expose sensitive data')
    }

    if (this.config.logging.logSecrets) {
      result.warnings.push('Secret logging enabled - security risk')
    }

    // Production logging recommendations
    if (this.config.isProduction) {
      if (this.config.logging.level === 'debug') {
        result.recommendations.push('Consider using "info" or "warn" log level in production')
      }

      if (this.config.logging.verboseLogging || this.config.logging.logSecrets) {
        result.errors.push('Verbose/secret logging not recommended in production')
      }
    }
  }

  /**
   * Validate CORS configuration
   */
  private validateCors(result: SecurityValidationResult): void {
    if (!this.config.cors.enabled) {
      result.warnings.push('CORS disabled - may block legitimate requests')
      return
    }

    if (this.config.cors.origins.includes('*')) {
      if (this.config.isProduction) {
        result.errors.push('CORS origins set to "*" in production - security risk')
      } else {
        result.warnings.push('CORS origins set to "*" - be more specific in production')
      }
    }

    // Check for overly permissive origins
    const permissiveOrigins = [
      'http://localhost:*',
      'http://127.0.0.1:*',
      'http://0.0.0.0:*',
    ]

    for (const origin of this.config.cors.origins) {
      if (permissiveOrigins.includes(origin) && this.config.isProduction) {
        result.warnings.push(`Permissive CORS origin "${origin}" in production`)
      }
    }
  }

  /**
   * Get security configuration summary (excluding sensitive data)
   */
  public getConfigSummary(): {
    nodeEnv: string
    isProduction: boolean
    isDevelopment: boolean
    hasJwtSecret: boolean
    configuredApiKeys: string[]
    rateLimiting: SecurityConfig['rateLimiting']
    logging: SecurityConfig['logging']
    cors: SecurityConfig['cors']
  } {
    return {
      nodeEnv: this.config.nodeEnv,
      isProduction: this.config.isProduction,
      isDevelopment: this.config.isDevelopment,
      hasJwtSecret: !!this.config.jwtSecret,
      configuredApiKeys: Object.entries(this.config.apiKeys)
        .filter(([_, value]) => !!value)
        .map(([key, _]) => key),
      rateLimiting: this.config.rateLimiting,
      logging: this.config.logging,
      cors: this.config.cors
    }
  }

  /**
   * Generate security report
   */
  public generateReport(): string {
    const validation = this.validate()
    const summary = this.getConfigSummary()

    let report = '# Security Configuration Report\n\n'
    report += `Environment: ${summary.nodeEnv}\n`
    report += `Production: ${summary.isProduction ? 'Yes' : 'No'}\n`
    report += `JWT Secret: ${summary.hasJwtSecret ? 'Configured' : 'Missing'}\n`
    report += `API Keys: ${summary.configuredApiKeys.length} configured\n\n`

    if (validation.errors.length > 0) {
      report += '## 🚨 Security Errors\n\n'
      validation.errors.forEach(error => {
        report += `- ${error}\n`
      })
      report += '\n'
    }

    if (validation.warnings.length > 0) {
      report += '## ⚠️ Security Warnings\n\n'
      validation.warnings.forEach(warning => {
        report += `- ${warning}\n`
      })
      report += '\n'
    }

    if (validation.recommendations.length > 0) {
      report += '## 💡 Security Recommendations\n\n'
      validation.recommendations.forEach(rec => {
        report += `- ${rec}\n`
      })
    }

    report += '\n## 📊 Configuration Summary\n\n'
    report += `- Rate Limiting: ${summary.rateLimiting.enabled ? `${summary.rateLimiting.maxRequests}/${summary.rateLimiting.windowMs}ms` : 'Disabled'}\n`
    report += `- Log Level: ${summary.logging.level}\n`
    report += `- CORS Origins: ${summary.cors.origins.join(', ')}\n`

    return report
  }
}

/**
 * Quick security validation function
 */
export function validateSecurityConfiguration(): SecurityValidationResult {
  const validator = new SecurityValidator()
  return validator.validate()
}