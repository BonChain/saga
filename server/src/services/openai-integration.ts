/**
 * OpenAI Integration Service for Story 3.1: OpenAI Integration & Prompt Templates
 *
 * This service provides comprehensive OpenAI GPT-3.5-turbo integration with
 * proper error handling, rate limiting, retry logic, and safety mechanisms.
 */

import { v4 as uuidv4 } from 'uuid'
import { AuditLogger, AuditCategory } from './AuditLogger'
import {
  AIRequest,
  AIResponse,
  AIConsequence,
  PromptContext,
  TokenUsage,
  AIError,
  ErrorType,
  LogLevel,
  UsageMetrics,
  PromptType
} from '../types/ai'
import { AIServiceAdapter, aiServiceAdapter } from './ai/ai-service-adapter'

export class OpenAIIntegration {
  private auditLogger: AuditLogger
  private logger: (level: LogLevel, message: string, data?: any) => void

  constructor() {
    this.auditLogger = new AuditLogger()
    this.logger = this.createLogger()

    this.logger(LogLevel.INFO, 'OpenAI Integration initialized via AI Service Adapter', {
      provider: aiServiceAdapter.getCurrentProvider(),
      model: aiServiceAdapter.model,
      availableProviders: aiServiceAdapter.getAvailableProviders()
    })

    // Initialize the AI service adapter
    aiServiceAdapter.initialize().catch(error => {
      this.logger(LogLevel.ERROR, 'Failed to initialize AI Service Adapter', { error })
    })
  }

  /**
   * Process an AI request for consequence generation using AI Service Adapter
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    const responseId = uuidv4()

    // Log the incoming request
    this.auditLogger.logRequest(request, {
      processingStartTime: startTime
    })

    this.logger(LogLevel.INFO, 'Processing AI request via AI Service Adapter', {
      requestId: request.id,
      promptType: request.promptType,
      actionId: request.actionId,
      provider: aiServiceAdapter.getCurrentProvider()
    })

    try {
      // Use the AI Service Adapter to process the request
      const response = await aiServiceAdapter.processAction(request)

      // Log performance metrics
      this.auditLogger.logPerformanceMetrics(aiServiceAdapter.getMetrics(), {
        request: request.id
      })

      // Log the successful response
      this.auditLogger.logResponse(response, request, {
        completionTime: Date.now()
      })

      this.logger(LogLevel.INFO, 'AI request processed successfully via AI Service Adapter', {
        responseId: response.id,
        processingTime: response.processingTime,
        tokenUsage: response.tokenUsage.totalTokens,
        consequencesCount: response.consequences.length,
        provider: response.model
      })

      return response

    } catch (error) {
      const processingTime = Date.now() - startTime
      const aiError = error as AIError

      // Log error with audit logger
      this.auditLogger.logSecurityEvent({
        type: 'AI_REQUEST_ERROR',
        severity: aiError?.type === ErrorType.AUTHENTICATION ? 'high' : 'medium',
        description: `AI request failed: ${aiError?.message || 'Unknown error'}`,
        source: 'OpenAIIntegration',
        timestamp: new Date().toISOString(),
        details: {
          errorType: aiError?.type,
          errorCode: aiError?.code,
          retryable: aiError?.retryable || false,
          processingTime,
          requestId: request.id,
          provider: aiServiceAdapter.getCurrentProvider()
        }
      })

      this.logger(LogLevel.ERROR, 'AI request failed via AI Service Adapter', {
        requestId: request.id,
        error: aiError?.message || 'Unknown error',
        processingTime,
        provider: aiServiceAdapter.getCurrentProvider()
      })

      return {
        id: responseId,
        requestId: request.id,
        content: '',
        consequences: [],
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
        processingTime,
        timestamp: new Date().toISOString(),
        model: aiServiceAdapter.model,
        success: false,
        error: aiError
      }
    }
  }

  
  
  /**
   * Create logger function
   */
  private createLogger(): (level: LogLevel, message: string, data?: any) => void {
    return (level: LogLevel, message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level,
        message,
        service: 'OpenAIIntegration',
        ...data
      }

      // In production, this would use a proper logging library
      console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`, data || '')
    }
  }

  /**
   * Get current usage metrics from AI Service Adapter
   */
  public getMetrics(): UsageMetrics {
    return aiServiceAdapter.getMetrics()
  }

  /**
   * Get available providers from AI Service Adapter
   */
  public getAvailableProviders(): string[] {
    return aiServiceAdapter.getAvailableProviders()
  }

  /**
   * Get current provider from AI Service Adapter
   */
  public getCurrentProvider(): string {
    return aiServiceAdapter.getCurrentProvider()
  }

  /**
   * Get circuit breaker state from AI Service Adapter
   */
  public getCircuitBreakerState(): { isOpen: boolean; failureCount: number; lastFailureTime?: string; nextAttemptTime?: string } {
    const state = aiServiceAdapter.getCircuitBreakerState()
    if (!state) {
      return {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: undefined,
        nextAttemptTime: undefined
      }
    }

    return {
      isOpen: state.isOpen,
      failureCount: state.failureCount,
      lastFailureTime: state.lastFailureTime ? new Date(state.lastFailureTime).toISOString() : undefined,
      nextAttemptTime: state.nextAttemptTime ? new Date(state.nextAttemptTime).toISOString() : undefined
    }
  }

  /**
   * Get rate limit information from AI Service Adapter
   */
  public getRateLimitInfo(): {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    currentUsage: {
      requestsThisMinute: number;
      requestsThisHour: number;
      requestsThisDay: number;
    };
    enabled: boolean;
  } {
    const config = aiServiceAdapter.getModelConfig()
    const rateLimitState = aiServiceAdapter.getRateLimitState()

    return {
      requestsPerMinute: config?.rateLimit.requestsPerMinute || 10,
      requestsPerHour: config?.rateLimit.requestsPerHour || 600,
      requestsPerDay: config?.rateLimit.requestsPerDay || 1000,
      enabled: config?.rateLimit.enabled || false,
      currentUsage: {
        requestsThisMinute: rateLimitState?.requestsThisMinute || 0,
        requestsThisHour: rateLimitState?.requestsThisHour || 0,
        requestsThisDay: rateLimitState?.requestsThisDay || 0
      }
    }
  }

  /**
   * Health check for the service using AI Service Adapter
   */
  public async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const adapterHealth = await aiServiceAdapter.healthCheck()

      const details = {
        adapter: adapterHealth,
        currentProvider: aiServiceAdapter.getCurrentProvider(),
        availableProviders: aiServiceAdapter.getAvailableProviders(),
        metrics: aiServiceAdapter.getMetrics()
      }

      return {
        healthy: adapterHealth.healthy,
        details
      }
    } catch (error) {
      return {
        healthy: false,
        details: { error: (error as Error).message }
      }
    }
  }
}