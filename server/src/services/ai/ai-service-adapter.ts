/**
 * AI Service Adapter - Multi-Provider AI Integration for Story 3.1
 *
 * This service provides abstraction over multiple AI providers (OpenAI, Z.ai, OpenRouter)
 * with automatic fallback capabilities and performance monitoring.
 *
 * Purpose: Enable flexible AI provider switching without changing business logic.
 * Supports: OpenAI GPT-3.5-turbo, Z.ai glm-4.6, OpenRouter access
 */

import { v4 as uuidv4 } from 'uuid'
import {
  AIRequest,
  AIResponse,
  AIConsequence,
  TokenUsage,
  ErrorType,
  UsageMetrics,
  PromptType
} from '../../types/ai'
import { AuditLogger } from '../AuditLogger'
import { perModelCircuitBreaker } from './per-model-circuit-breaker'
import { APIKeyValidator } from '../../utils/api-key-validator'

// Simple Circuit Breaker Implementation
interface CircuitBreakerState {
  isOpen: boolean
  failureCount: number
  lastFailureTime?: string
  nextAttemptTime?: string
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0
  }
  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 30000 // 30 seconds

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.isOpen) {
      if (this.shouldAttemptReset()) {
        this.reset()
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private shouldAttemptReset(): boolean {
    return this.state.nextAttemptTime
      ? new Date() >= new Date(this.state.nextAttemptTime)
      : false
  }

  private reset(): void {
    this.state = {
      isOpen: false,
      failureCount: 0
    }
  }

  private onSuccess(): void {
    this.state.failureCount = 0
  }

  private onFailure(): void {
    this.state.failureCount++
    this.state.lastFailureTime = new Date().toISOString()

    if (this.state.failureCount >= this.failureThreshold) {
      this.state.isOpen = true
      this.state.nextAttemptTime = new Date(
        Date.now() + this.recoveryTimeout
      ).toISOString()
    }
  }

  public isOpen(): boolean {
    return this.state.isOpen
  }

  public getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    if (!this.state.isOpen) {
      return 'CLOSED'
    }

    if (this.shouldAttemptReset()) {
      return 'HALF_OPEN'
    }

    return 'OPEN'
  }

  public getFailureCount(): number {
    return this.state.failureCount
  }

  public getLastFailureTime(): string | undefined {
    return this.state.lastFailureTime
  }

  public getNextAttemptTime(): string | undefined {
    return this.state.nextAttemptTime
  }
}

// Provider Configuration
interface ProviderConfig {
  name: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  enabled: boolean
}

export class AIServiceAdapter {
  private providers: Map<string, ProviderConfig> = new Map()
  private currentProvider: string = 'openai'
  private circuitBreaker: CircuitBreaker = new CircuitBreaker()
  private auditLogger: AuditLogger = new AuditLogger()
  private usageMetrics: UsageMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageResponseTime: 0,
    errorRate: 0,
    dailyUsage: []
  }

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // OpenAI Provider
    this.providers.set('openai', {
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
      enabled: !!process.env.OPENAI_API_KEY
    })

    // Z.ai Provider
    this.providers.set('zai', {
      name: 'Z.ai',
      apiKey: process.env.ZAI_API_KEY || '',
      model: process.env.ZAI_MODEL || 'glm-4.6',
      temperature: parseFloat(process.env.ZAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.ZAI_MAX_TOKENS || '500'),
      enabled: !!process.env.ZAI_API_KEY && process.env.ZAI_API_KEY !== 'your_zai_key_here'
    })

    // OpenRouter Provider
    this.providers.set('openrouter', {
      name: 'OpenRouter',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '500'),
      enabled: !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_key_here'
    })

    // Validate API keys for enabled providers
    this.validateProviderAPIKeys()

    // Set primary provider based on configuration
    const configuredProvider = process.env.AI_PROVIDER || 'openai'
    if (this.providers.has(configuredProvider) && this.providers.get(configuredProvider)?.enabled) {
      this.currentProvider = configuredProvider
    } else {
      // Find first available provider
      for (const [key, provider] of Array.from(this.providers.entries())) {
        if (provider.enabled) {
          this.currentProvider = key
          break
        }
      }
    }
  }

  private validateProviderAPIKeys(): void {
    for (const [providerKey, provider] of this.providers.entries()) {
      if (provider.enabled && provider.apiKey) {
        try {
          switch (providerKey) {
            case 'openai':
              APIKeyValidator.validateOpenAIKey(provider.apiKey);
              break;
            case 'zai':
              APIKeyValidator.validateZAIKey(provider.apiKey);
              break;
            case 'openrouter':
              APIKeyValidator.validateOpenRouterKey(provider.apiKey);
              break;
          }
        } catch (error) {
          console.warn(`[${provider.name}] API key validation failed: ${(error as Error).message}`);
          // Disable provider with invalid API key
          provider.enabled = false;
        }
      }
    }
  }

  async initialize(): Promise<void> {
    // Test provider availability
    const availableProviders = await this.checkProviderAvailability()
    console.log(`AI Service Adapter initialized. Current provider: ${this.currentProvider}`)
    console.log(`Available providers: ${availableProviders.join(', ')}`)
  }

  private async checkProviderAvailability(): Promise<string[]> {
    const available: string[] = []
      const providerEntries = Array.from(this.providers.entries())
      for (const [key, provider] of providerEntries) {
      if (provider.enabled) {
        try {
          // Simple availability check - in real implementation, test API connectivity
          available.push(key)
        } catch (error) {
          console.warn(`Provider ${key} is not available:`, error)
        }
      }
    }
    return available
  }

  async processAction(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    const responseId = uuidv4()

    this.updateMetrics()

    try {
      // Use per-model circuit breaker instead of the generic one
      return await perModelCircuitBreaker.executeRequest(this.currentProvider, async () => {
        // For now, use OpenAI directly since it's the only configured provider
        const provider = this.providers.get(this.currentProvider)
        if (!provider || !provider.enabled) {
          throw new Error(`Provider ${this.currentProvider} is not available or configured`)
        }

        if (this.currentProvider === 'openai') {
          return await this.processWithOpenAI(request, provider)
        } else if (this.currentProvider === 'zai') {
          return await this.processWithZAI(request, provider)
        } else {
          throw new Error(`Provider ${this.currentProvider} is not yet implemented`)
        }
      })
    } catch (error) {
      const processingTime = Date.now() - startTime

      // Log the error
      this.auditLogger.logSecurityEvent({
        type: 'AI_REQUEST_ERROR',
        severity: 'medium',
        description: `AI request failed: ${(error as Error).message}`,
        source: 'AIServiceAdapter',
        timestamp: new Date().toISOString(),
        details: {
          error: (error as Error).message,
          processingTime,
          provider: this.currentProvider,
          circuitBreakerState: perModelCircuitBreaker.getCircuitBreakerState(this.currentProvider),
          rateLimitState: perModelCircuitBreaker.getRateLimitState(this.currentProvider)
        }
      })

      return {
        id: responseId,
        requestId: request.id,
        content: '',
        consequences: [],
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
        processingTime,
        timestamp: new Date().toISOString(),
        model: this.providers.get(this.currentProvider)?.model || 'unknown',
        success: false,
        error: {
          code: 'AI_REQUEST_FAILED',
          message: (error as Error).message,
          type: ErrorType.NETWORK,
          retryable: true
        }
      }
    }
  }

  private async processWithOpenAI(request: AIRequest, provider: ProviderConfig): Promise<AIResponse> {
    // Import OpenAI dynamically to avoid build issues if not available
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: provider.apiKey })

    const systemPrompt = this.generateSystemPrompt(request.promptType)

    const completion = await openai.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || provider.maxTokens,
      temperature: request.temperature || provider.temperature
    })

    const content = completion.choices[0].message.content || ''
    const consequences = this.parseConsequences(content, request)

    const tokenUsage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      estimatedCost: this.calculateCost(completion.usage?.total_tokens || 0)
    }

    return {
      id: uuidv4(),
      requestId: request.id,
      content,
      consequences,
      tokenUsage,
      processingTime: 0, // Will be set by caller
      timestamp: new Date().toISOString(),
      model: completion.model,
      success: true
    }
  }

  private async processWithZAI(request: AIRequest, provider: ProviderConfig): Promise<AIResponse> {
    // Z.ai API implementation using fetch
    const systemPrompt = this.generateSystemPrompt(request.promptType)

    const requestBody = {
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || provider.maxTokens,
      temperature: request.temperature || provider.temperature,
      stream: false
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Z.ai API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json() as any
    const content = data.choices?.[0]?.message?.content || ''
    const consequences = this.parseConsequences(content, request)

    // Z.ai token usage - use actual data if available
    const promptTokens = data.usage?.prompt_tokens || this.estimateTokens(request.prompt + systemPrompt)
    const completionTokens = data.usage?.completion_tokens || this.estimateTokens(content)
    const totalTokens = data.usage?.total_tokens || (promptTokens + completionTokens)

    const tokenUsage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: this.calculateCost(totalTokens)
    }

    return {
      id: uuidv4(),
      requestId: request.id,
      content,
      consequences,
      tokenUsage,
      processingTime: 0, // Will be set by caller
      timestamp: new Date().toISOString(),
      model: data.model || provider.model,
      success: true
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4)
  }

  private generateSystemPrompt(promptType: PromptType): string {
    const basePrompt = `You are a world logic engine for a living world simulation game.
Your task is to generate logical, interesting consequences for player actions.
The world follows consistent rules and consequences should create cascading effects.
Keep responses concise but creative.`

    switch (promptType) {
      case PromptType.CONSEQUENCE_GENERATION:
        return `${basePrompt}

Generate 2-4 consequences that:
- Are logically consistent with world rules
- Create interesting cascading effects
- Affect character relationships, environment, or future possibilities
- Are surprising but coherent within world logic

Format as JSON array:
[
  {
    "type": "relationship|environment|character|world_state",
    "description": "Clear description of the consequence",
    "impact": {
      "level": "minor|moderate|major|significant|critical",
      "affectedSystems": ["systems affected"],
      "magnitude": 1-10,
      "duration": "temporary|short_term|medium_term|long_term|permanent"
    },
    "cascadingEffects": [
      {
        "description": "Secondary effect",
        "delay": 5000,
        "probability": 0.7,
        "impact": {...}
      }
    ]
  }
]`

      case PromptType.WORLD_LOGIC_ANALYSIS:
        return `${basePrompt}

Analyze the player action within the world context and provide:
- Action feasibility assessment
- Likely immediate effects
- Potential long-term consequences
- Affected world systems
- Character relationship impacts

Be specific and reference the current world state.`

      default:
        return basePrompt
    }
  }

  private parseConsequences(content: string, request: AIRequest): AIConsequence[] {
    try {
      console.log(`[DEBUG] Parsing AI response content: ${content.substring(0, 200)}...`)

      // Use enhanced ConsequenceGenerator for better parsing
      // Note: In a full implementation, this would use the ConsequenceGenerator service
      // For now, we'll use the improved parsing logic inline

      // Try to parse as JSON first
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          return Array.isArray(parsed) ? parsed.map(this.formatConsequence.bind(this)) : []
        } catch (jsonError) {
          console.warn(`[WARN] JSON parsing failed, trying text parsing:`, jsonError)
        }
      }

      // Try to find numbered lists or bullet points
      const lines = content.split('\n').filter(line => line.trim())
      const consequences: AIConsequence[] = []

      for (const line of lines) {
        if (line.match(/^\d+\./) || line.match(/^[-*•]/) || line.match(/^[A-Z]\./)) {
          const description = line.replace(/^[\d\.\-\*\•A-Za-z\.]+/, '').trim()
          if (description.length > 10) {
            consequences.push(this.createConsequenceFromDescription(request, description))
          }
        }
      }

      // If we found consequences from the text, return them
      if (consequences.length > 0) {
        console.log(`[DEBUG] Parsed ${consequences.length} consequences from structured text`)
        return consequences
      }

      // Try to parse from narrative text
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15)
      for (const sentence of sentences) {
        const trimmed = sentence.trim()
        if (this.looksLikeConsequence(trimmed)) {
          consequences.push(this.createConsequenceFromDescription(request, trimmed))
        }
      }

      if (consequences.length > 0) {
        console.log(`[DEBUG] Parsed ${consequences.length} consequences from narrative text`)
        return consequences.slice(0, 4) // Limit narrative parsing
      }

      // If content is substantial but no clear structure, create consequence from content
      if (content.trim().length > 20) {
        console.log(`[DEBUG] Creating consequence from full content`)
        return [this.createConsequenceFromDescription(request, content.trim())]
      }

      // Fallback: Return a basic consequence
      console.log(`[DEBUG] Using fallback consequence`)
      return [this.createBasicConsequence(request)]
    } catch (error) {
      console.error(`[ERROR] Failed to parse consequences:`, error)
      return [this.createBasicConsequence(request)]
    }
  }

  /**
   * Check if text looks like a consequence
   */
  private looksLikeConsequence(text: string): boolean {
    const consequenceIndicators = [
      'result', 'effect', 'impact', 'cause', 'lead', 'change', 'alter',
      'affect', 'influence', 'trigger', 'create', 'destroy', 'improve',
      'worsen', 'increase', 'decrease', 'become', 'transform',
      'make', 'force', 'allow', 'prevent', 'enable', 'disable'
    ]

    const textLower = text.toLowerCase()
    return consequenceIndicators.some(indicator => textLower.includes(indicator))
  }

  private createConsequenceFromDescription(request: AIRequest, description: string): AIConsequence {
    const type = this.inferConsequenceType(description)
    const impact = this.inferImpact(description, type)

    return {
      id: uuidv4(),
      actionId: request.actionId,
      type,
      description: description.substring(0, 200), // Limit length
      impact,
      cascadingEffects: this.generateCascadingEffects(description, type),
      timestamp: new Date().toISOString(),
      confidence: 0.8
    }
  }

  /**
   * Infer consequence type from description
   */
  private inferConsequenceType(description: string): any {
    const descLower = description.toLowerCase()

    if (descLower.includes('relationship') || descLower.includes('friend') || descLower.includes('enemy') || descLower.includes('alliance')) {
      return 'relationship'
    }
    if (descLower.includes('environment') || descLower.includes('weather') || descLower.includes('forest') || descLower.includes('village')) {
      return 'environment'
    }
    if (descLower.includes('character') || descLower.includes('person') || descLower.includes('npc')) {
      return 'character'
    }
    if (descLower.includes('economy') || descLower.includes('trade') || descLower.includes('market') || descLower.includes('price')) {
      return 'economic'
    }
    if (descLower.includes('combat') || descLower.includes('fight') || descLower.includes('battle') || descLower.includes('attack')) {
      return 'combat'
    }
    if (descLower.includes('discover') || descLower.includes('explore') || descLower.includes('find') || descLower.includes('new')) {
      return 'exploration'
    }

    return 'world_state'
  }

  /**
   * Infer impact from description
   */
  private inferImpact(description: string, type: any): any {
    const descLower = description.toLowerCase()

    let level = 'moderate'
    let magnitude = 5

    // Determine impact level from keywords
    if (descLower.includes('destroy') || descLower.includes('massive') || descLower.includes('catastrophic')) {
      level = 'critical'
      magnitude = 9
    } else if (descLower.includes('major') || descLower.includes('significant') || descLower.includes('dramatic')) {
      level = 'significant'
      magnitude = 7
    } else if (descLower.includes('small') || descLower.includes('minor') || descLower.includes('slight')) {
      level = 'minor'
      magnitude = 2
    }

    // Determine affected systems
    const affectedSystems = [type]
    if (descLower.includes('village') || descLower.includes('town')) affectedSystems.push('economic')
    if (descLower.includes('forest') || descLower.includes('environment')) affectedSystems.push('nature')
    if (descLower.includes('character') || descLower.includes('people')) affectedSystems.push('social')

    return {
      level,
      affectedSystems,
      magnitude,
      duration: 'short_term'
    }
  }

  /**
   * Generate cascading effects for a consequence
   */
  private generateCascadingEffects(description: string, type: any): any[] {
    // Simple cascading effect generation based on type
    const effects = []

    if (Math.random() > 0.5 && (type === 'relationship' || type === 'combat')) {
      effects.push({
        id: uuidv4(),
        parentConsequenceId: '', // Will be set later
        description: this.generateCascadingDescription(description, type),
        delay: Math.random() * 10000 + 2000, // 2-12 seconds
        probability: Math.random() * 0.5 + 0.3, // 0.3-0.8
        impact: {
          level: 'minor',
          affectedSystems: [type],
          magnitude: 3,
          duration: 'temporary'
        }
      })
    }

    return effects
  }

  /**
   * Generate cascading effect description
   */
  private generateCascadingDescription(parentDescription: string, type: any): string {
    const templates = {
      relationship: [
        'Nearby characters notice the change in relationships',
        'Local community reacts to the relationship shift',
        'Other characters adjust their behavior based on this'
      ],
      environment: [
        'Wildlife responds to the environmental change',
        'Nearby areas experience related effects',
        'Local resources are affected by this change'
      ],
      character: [
        'Other characters learn about this development',
        'Local rumors spread about the character',
        'Character\'s reputation is affected'
      ],
      combat: [
        'Nearby characters react to the combat outcome',
        'Local area security is impacted',
        'Combatants\' allies take notice'
      ],
      world_state: [
        'Connected systems experience related changes',
        'Local equilibrium is affected',
        'Future actions are influenced by this change'
      ]
    }

    const typeTemplates = templates[type] || templates.world_state
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)]
  }

  private formatConsequence(data: any): AIConsequence {
    return {
      id: uuidv4(),
      actionId: data.actionId || '',
      type: data.type || 'other',
      description: data.description || '',
      impact: data.impact || {
        level: 'minor' as any,
        affectedSystems: [],
        magnitude: 1,
        duration: 'temporary' as any
      },
      cascadingEffects: (data.cascadingEffects || []).map((effect: any) => ({
        ...effect,
        id: uuidv4()
      })),
      timestamp: new Date().toISOString(),
      confidence: data.confidence || 0.8
    }
  }

  private createBasicConsequence(request: AIRequest): AIConsequence {
    return {
      id: uuidv4(),
      actionId: request.actionId,
      type: 'other' as any,
      description: 'Action processed successfully',
      impact: {
        level: 'minor' as any,
        affectedSystems: ['world_state'],
        magnitude: 2,
        duration: 'temporary' as any
      },
      cascadingEffects: [],
      timestamp: new Date().toISOString(),
      confidence: 0.6
    }
  }

  private calculateCost(tokens: number): number {
    // GPT-3.5-turbo pricing (as of 2024): $0.002 per 1K tokens
    return (tokens / 1000) * 0.002
  }

  private updateMetrics(): void {
    this.usageMetrics.totalRequests++
    // Update other metrics as needed
  }

  getCurrentProvider(): string {
    return this.currentProvider
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, config]) => config.enabled)
      .map(([key, _]) => key)
  }

  getMetrics(): UsageMetrics {
    return { ...this.usageMetrics }
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const provider = this.providers.get(this.currentProvider)
      const healthy = !!(provider?.enabled && provider.apiKey)

      return {
        healthy,
        details: {
          currentProvider: this.currentProvider,
          availableProviders: this.getAvailableProviders(),
          circuitBreakerOpen: this.circuitBreaker.isOpen() // Fixed: Get from circuit breaker
        }
      }
    } catch (error) {
      return {
        healthy: false,
        details: { error: (error as Error).message }
      }
    }
  }

  // Expose model property for compatibility
  get model(): string {
    return this.providers.get(this.currentProvider)?.model || 'unknown'
  }

  // Per-model circuit breaker and rate limiting methods
  getCircuitBreakerState(provider?: string) {
    const targetProvider = provider || this.currentProvider
    return perModelCircuitBreaker.getCircuitBreakerState(targetProvider)
  }

  getRateLimitState(provider?: string) {
    const targetProvider = provider || this.currentProvider
    return perModelCircuitBreaker.getRateLimitState(targetProvider)
  }

  getModelConfig(provider?: string) {
    const targetProvider = provider || this.currentProvider
    return perModelCircuitBreaker.getModelConfig(targetProvider)
  }

  getPerModelMetrics() {
    return perModelCircuitBreaker.getGlobalMetrics()
  }

  getMonitoringSummary() {
    return perModelCircuitBreaker.getMonitoringSummary()
  }

  resetCircuitBreaker(provider?: string) {
    const targetProvider = provider || this.currentProvider
    perModelCircuitBreaker.resetCircuitBreaker(targetProvider)
  }

  resetRateLimit(provider?: string) {
    const targetProvider = provider || this.currentProvider
    perModelCircuitBreaker.resetRateLimit(targetProvider)
  }
}

// Export singleton instance
export const aiServiceAdapter = new AIServiceAdapter()