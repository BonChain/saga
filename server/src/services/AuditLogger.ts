/**
 * AI Audit Logger Service for Story 3.1: OpenAI Integration & Prompt Templates
 *
 * This service provides comprehensive logging and audit trail functionality for all AI interactions,
 * including request/response tracking, usage metrics, security monitoring, and compliance.
 */

import { v4 as uuidv4 } from 'uuid'
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  AIRequest,
  AIResponse,
  TokenUsage,
  LogLevel,
  UsageMetrics,
  RateLimitInfo
} from '../types/ai'

export interface AuditLogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: AuditCategory
  action: string
  playerId?: string
  actionId?: string
  requestId?: string
  messageId?: string
  details: any
  metadata: AuditMetadata
  sensitive?: boolean
}

export enum AuditCategory {
  REQUEST = 'request',
  RESPONSE = 'response',
  ERROR = 'error',
  SECURITY = 'security',
  RATE_LIMIT = 'rate_limit',
  USAGE = 'usage',
  CONFIGURATION = 'configuration',
  PERFORMANCE = 'performance',
  COMPLIANCE = 'compliance'
}

export interface AuditMetadata {
  sessionId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  requestId?: string
  correlationId?: string
  environment: string
  version: string
  serviceName: string
  podName?: string
  timestamp?: string
}

export interface AuditConfiguration {
  enabled: boolean
  logLevel: LogLevel
  logToFile: boolean
  logToConsole: boolean
  auditRetentionDays: number
  maxLogFileSize: number
  logDirectory: string
  enableSensitiveDataLogging: boolean
  enablePerformanceTracking: boolean
  enableComplianceLogging: boolean
  enableAnonymization: boolean
}

export interface SecurityEvent {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  source: string
  timestamp: string
  details: any
}

export class AuditLogger {
  private config: AuditConfiguration
  private sessionId: string
  private auditFilePath: string
  private currentLogFile: string
  private logBuffer: AuditLogEntry[] = []
  private readonly bufferFlushInterval: number = 5000 // 5 seconds
  private bufferFlushTimer?: NodeJS.Timeout

  constructor(config: Partial<AuditConfiguration> = {}) {
    this.config = this.loadConfiguration(config)
    this.sessionId = this.generateSessionId()
    this.auditFilePath = this.config.logDirectory
    this.currentLogFile = this.getCurrentLogFileName()

    this.initializeLogging()
    this.startBufferFlushTimer()

    this.writeEntry({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: AuditCategory.CONFIGURATION,
      action: 'audit_logger_initialized',
      details: {
        sessionId: this.sessionId,
        config: this.getConfigSummary()
      },
      metadata: this.createMetadata()
    })
  }

  /**
   * Log AI request with full details
   */
  public logRequest(request: AIRequest, additionalData?: any): void {
    if (!this.config.enabled) return

    const sanitizedRequest = this.sanitizeRequest(request)

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: AuditCategory.REQUEST,
      action: 'ai_request_initiated',
      playerId: this.extractPlayerId(request),
      actionId: request.actionId,
      requestId: request.id,
      messageId: uuidv4(),
      details: {
        promptType: request.promptType,
        promptLength: request.prompt.length,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
        contextSize: this.getContextSize(request.context),
        ...additionalData
      },
      metadata: this.createMetadata(request.id),
      sensitive: true // Contains potentially sensitive user data
    }

    this.writeEntry(entry)
  }

  /**
   * Log AI response with full details
   */
  public logResponse(response: AIResponse, request: AIRequest, additionalData?: any): void {
    if (!this.config.enabled) return

    const sanitizedResponse = this.sanitizeResponse(response)

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: response.success ? LogLevel.INFO : LogLevel.ERROR,
      category: response.success ? AuditCategory.RESPONSE : AuditCategory.ERROR,
      action: response.success ? 'ai_request_completed' : 'ai_request_failed',
      playerId: this.extractPlayerId(request),
      actionId: request.actionId,
      requestId: request.id,
      messageId: response.id,
      details: {
        success: response.success,
        processingTime: response.processingTime,
        model: response.model,
        consequencesCount: response.consequences.length,
        tokenUsage: response.tokenUsage,
        estimatedCost: response.tokenUsage.estimatedCost,
        error: response.error ? {
          code: response.error.code,
          type: response.error.type,
          retryable: response.error.retryable
        } : undefined,
        ...additionalData
      },
      metadata: this.createMetadata(request.id),
      sensitive: false // Response data is less sensitive
    }

    this.writeEntry(entry)
  }

  /**
   * Log security events
   */
  public logSecurityEvent(event: SecurityEvent): void {
    if (!this.config.enabled || !this.config.enableComplianceLogging) return

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: event.timestamp,
      level: this.getLogLevelFromSeverity(event.severity),
      category: AuditCategory.SECURITY,
      action: 'security_event',
      details: {
        eventType: event.type,
        severity: event.severity,
        description: event.description,
        source: event.source,
        eventData: event.details
      },
      metadata: this.createMetadata(),
      sensitive: false
    }

    this.writeEntry(entry)

    // Critical security events should be logged immediately
    if (event.severity === 'critical') {
      this.flushBuffer()
    }
  }

  /**
   * Log rate limit events
   */
  public logRateLimitEvent(playerId: string, type: string, limit: number, current: number): void {
    if (!this.config.enabled) return

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category: AuditCategory.RATE_LIMIT,
      action: 'rate_limit_exceeded',
      playerId,
      details: {
        limitType: type,
        limit,
        current,
        percentage: (current / limit) * 100
      },
      metadata: this.createMetadata(),
      sensitive: false
    }

    this.writeEntry(entry)
  }

  /**
   * Log performance metrics
   */
  public logPerformanceMetrics(metrics: UsageMetrics, additionalData?: any): void {
    if (!this.config.enabled || !this.config.enablePerformanceTracking) return

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: AuditCategory.PERFORMANCE,
      action: 'performance_metrics',
      details: {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        errorRate: metrics.errorRate,
        averageResponseTime: metrics.averageResponseTime,
        totalTokens: metrics.totalTokens,
        totalCost: metrics.totalCost,
        dailyUsage: metrics.dailyUsage?.slice(-7), // Last 7 days
        ...additionalData
      },
      metadata: this.createMetadata(),
      sensitive: false
    }

    this.writeEntry(entry)
  }

  /**
   * Log configuration changes
   */
  public logConfigurationChange(change: string, oldValue?: any, newValue?: any): void {
    if (!this.config.enabled || !this.config.enableComplianceLogging) return

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: AuditCategory.CONFIGURATION,
      action: 'configuration_change',
      details: {
        change,
        oldValue: oldValue ? this.sanitizeConfigValue(oldValue) : undefined,
        newValue: newValue ? this.sanitizeConfigValue(newValue) : undefined
      },
      metadata: this.createMetadata(),
      sensitive: true // Configuration values can be sensitive
    }

    this.writeEntry(entry)
  }

  /**
   * Write audit entry to buffer and optionally to file
   */
  private writeEntry(entry: AuditLogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry)

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logToConsole(entry)
    }

    // Write to file if enabled and not sensitive or sensitive logging is allowed
    if (this.config.logToFile && (!entry.sensitive || this.config.enableSensitiveDataLogging)) {
      this.writeToFile(entry)
    }

    // Flush buffer if it's getting large
    if (this.logBuffer.length >= 100) {
      this.flushBuffer()
    }
  }

  /**
   * Flush buffer to file
   */
  public flushBuffer(): void {
    if (this.logBuffer.length === 0) return

    const entriesToWrite = [...this.logBuffer]
    this.logBuffer = []

    if (this.config.logToFile) {
      const logContent = entriesToWrite
        .filter(entry => !entry.sensitive || this.config.enableSensitiveDataLogging)
        .map(entry => JSON.stringify(entry))
        .join('\n') + '\n'

      try {
        appendFileSync(this.currentLogFile, logContent)
      } catch (error) {
        console.error('Failed to write audit log to file:', error)
      }
    }
  }

  /**
   * Write single entry to file immediately
   */
  private writeToFile(entry: AuditLogEntry): void {
    if (!this.config.logToFile) return

    const logContent = JSON.stringify(entry) + '\n'

    try {
      appendFileSync(this.currentLogFile, logContent)
    } catch (error) {
      console.error('Failed to write audit log entry to file:', error)
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: AuditLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${entry.level.toUpperCase()}] [${entry.category}] [${timestamp}]`

    if (entry.sensitive) {
      console.log(`${prefix} ${entry.action} (sensitive data masked)`)
    } else {
      console.log(`${prefix} ${entry.action}`, {
        id: entry.id,
        playerId: entry.playerId,
        actionId: entry.actionId,
        details: entry.details
      })
    }
  }

  /**
   * Sanitize request data to remove sensitive information
   */
  private sanitizeRequest(request: AIRequest): Partial<AIRequest> {
    const sanitized = { ...request }

    if (sanitized.prompt && this.config.enableAnonymization) {
      // Truncate prompt for logging
      sanitized.prompt = sanitized.prompt.substring(0, 100) + '...'
    }

    if (sanitized.context && this.config.enableAnonymization) {
      // Remove potentially sensitive context data
      sanitized.context = {
        ...sanitized.context,
        worldState: undefined,
        characterRelationships: undefined,
        recentActions: sanitized.context.recentActions?.map(action => ({
          ...action,
          originalInput: '***MASKED***'
        }))
      }
    }

    return sanitized
  }

  /**
   * Sanitize response data
   */
  private sanitizeResponse(response: AIResponse): Partial<AIResponse> {
    const sanitized = { ...response }

    if (sanitized.content && this.config.enableAnonymization) {
      // Truncate content for logging
      sanitized.content = sanitized.content.substring(0, 100) + '...'
    }

    return sanitized
  }

  /**
   * Sanitize configuration values
   */
  private sanitizeConfigValue(value: any): any {
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...'
    }

    if (typeof value === 'object' && value !== null) {
      if (value.apiKey) {
        return { ...value, apiKey: '***MASKED***' }
      }
    }

    return value
  }

  /**
   * Extract player ID from request or context
   */
  private extractPlayerId(request: AIRequest): string | undefined {
    // Try to get player ID from context first
    // In Story 3.1, player ID might be in the context's recentActions
    if (request.context?.recentActions && request.context.recentActions.length > 0) {
      const lastAction = request.context.recentActions[0]
      // Try to extract player ID from recent action metadata if available
      if (lastAction.playerId) {
        return lastAction.playerId
      }
    }

    // Fallback to 'anonymous' if no player ID found
    return 'anonymous'
  }

  /**
   * Get context size for logging
   */
  private getContextSize(context: any): number {
    if (!context) return 0
    return JSON.stringify(context).length
  }

  /**
   * Create metadata for audit entries
   */
  private createMetadata(correlationId?: string): AuditMetadata {
    return {
      sessionId: this.sessionId,
      requestId: correlationId,
      correlationId,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0', // Should be dynamic in production
      serviceName: 'openai-integration',
      podName: process.env.POD_NAME,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get log level from security event severity
   */
  private getLogLevelFromSeverity(severity: string): LogLevel {
    switch (severity) {
      case 'critical': return LogLevel.ERROR
      case 'high': return LogLevel.ERROR
      case 'medium': return LogLevel.WARN
      case 'low': return LogLevel.INFO
      default: return LogLevel.INFO
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current log file name
   */
  private getCurrentLogFileName(): string {
    const date = new Date().toISOString().split('T')[0]
    return join(this.auditFilePath, `ai-audit-${date}.jsonl`)
  }

  /**
   * Initialize logging directory and file
   */
  private initializeLogging(): void {
    if (!this.config.logToFile) return

    try {
      if (!existsSync(this.auditFilePath)) {
        mkdirSync(this.auditFilePath, { recursive: true })
      }

      // Create header for new log file
      if (!existsSync(this.currentLogFile)) {
        const header = {
          fileType: 'ai-audit-log',
          version: '1.0',
          created: new Date().toISOString(),
          sessionId: this.sessionId,
          environment: process.env.NODE_ENV || 'development'
        }

        writeFileSync(this.currentLogFile, `# ${JSON.stringify(header)}\n`)
      }
    } catch (error) {
      console.error('Failed to initialize audit logging:', error)
    }
  }

  /**
   * Start buffer flush timer
   */
  private startBufferFlushTimer(): void {
    if (this.bufferFlushInterval > 0) {
      this.bufferFlushTimer = setInterval(() => {
        this.flushBuffer()
      }, this.bufferFlushInterval)
    }
  }

  /**
   * Load configuration
   */
  private loadConfiguration(userConfig: Partial<AuditConfiguration>): AuditConfiguration {
    const defaultConfig: AuditConfiguration = {
      enabled: process.env.AI_AUDIT_ENABLED !== 'false',
      logLevel: (process.env.AI_AUDIT_LOG_LEVEL as LogLevel) || LogLevel.INFO,
      logToFile: process.env.AI_AUDIT_LOG_TO_FILE !== 'false',
      logToConsole: process.env.AI_AUDIT_LOG_TO_CONSOLE !== 'false',
      auditRetentionDays: parseInt(process.env.AI_AUDIT_RETENTION_DAYS || '30'),
      maxLogFileSize: parseInt(process.env.AI_AUDIT_MAX_LOG_SIZE || '104857600'), // 100MB
      logDirectory: process.env.AI_AUDIT_LOG_DIR || './logs/ai-audit',
      enableSensitiveDataLogging: process.env.AI_AUDIT_LOG_SENSITIVE === 'true',
      enablePerformanceTracking: process.env.AI_AUDIT_PERFORMANCE_TRACKING !== 'false',
      enableComplianceLogging: process.env.AI_AUDIT_COMPLIANCE_LOGGING !== 'false',
      enableAnonymization: process.env.AI_AUDIT_ANONYMIZE !== 'false'
    }

    return { ...defaultConfig, ...userConfig }
  }

  /**
   * Get configuration summary (excluding sensitive data)
   */
  public getConfigSummary(): any {
    return {
      enabled: this.config.enabled,
      logLevel: this.config.logLevel,
      logToFile: this.config.logToFile,
      logToConsole: this.config.logToConsole,
      auditRetentionDays: this.config.auditRetentionDays,
      enableSensitiveDataLogging: this.config.enableSensitiveDataLogging,
      enablePerformanceTracking: this.config.enablePerformanceTracking,
      enableComplianceLogging: this.config.enableComplianceLogging,
      enableAnonymization: this.config.enableAnonymization,
      sessionId: this.sessionId
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): any {
    return {
      bufferedEntries: this.logBuffer.length,
      currentLogFile: this.currentLogFile,
      sessionId: this.sessionId,
      uptime: Date.now() - parseInt(this.sessionId.split('_')[1])
    }
  }

  /**
   * Graceful shutdown
   */
  public shutdown(): void {
    if (this.bufferFlushTimer) {
      clearInterval(this.bufferFlushTimer)
    }

    this.flushBuffer()

    this.writeEntry({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: AuditCategory.CONFIGURATION,
      action: 'audit_logger_shutdown',
      details: {
        sessionId: this.sessionId,
        finalMetrics: this.getMetrics()
      },
      metadata: this.createMetadata()
    })
  }
}