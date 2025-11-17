/**
 * AI Integration Types for Story 3.1: OpenAI Integration & Prompt Templates
 *
 * This file contains TypeScript interfaces and types for OpenAI integration,
 * consequence processing, and AI-driven world logic.
 */

export interface AIConsequence {
  id: string
  actionId: string
  type: ConsequenceType
  description: string
  impact: ConsequenceImpact
  cascadingEffects: CascadingEffect[]
  timestamp: string
  confidence: number
}

export enum ConsequenceType {
  RELATIONSHIP = 'relationship',
  ENVIRONMENT = 'environment',
  CHARACTER = 'character',
  WORLD_STATE = 'world_state',
  ECONOMIC = 'economic',
  SOCIAL = 'social',
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  OTHER = 'other'
}

export interface ConsequenceImpact {
  level: ImpactLevel
  affectedSystems: string[]
  magnitude: number // 1-10 scale
  duration: DurationType
  affectedCharacters?: string[]
  affectedLocations?: string[]
}

export enum ImpactLevel {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SIGNIFICANT = 'significant',
  CRITICAL = 'critical'
}

export enum DurationType {
  TEMPORARY = 'temporary',
  SHORT_TERM = 'short_term',
  MEDIUM_TERM = 'medium_term',
  LONG_TERM = 'long_term',
  PERMANENT = 'permanent'
}

export interface CascadingEffect {
  id: string
  parentConsequenceId: string
  description: string
  delay: number // milliseconds before this effect triggers
  probability: number // 0-1 chance of occurring
  impact: ConsequenceImpact
}

export interface PromptContext {
  actionId: string
  playerIntent: string
  originalInput: string
  worldState: WorldStateSnapshot
  characterRelationships: CharacterRelationship[]
  locationContext: LocationContext
  recentActions: RecentAction[]
  worldRules: WorldRule[]
}

export interface WorldStateSnapshot {
  timestamp: string
  regions: RegionState[]
  characters: CharacterState[]
  economy: EconomyState
  environment: EnvironmentState
  events: WorldEvent[]
}

export interface RegionState {
  id: string
  name: string
  status: string
  prosperity: number
  safety: number
  notableFeatures: string[]
  currentConditions: string
}

export interface CharacterState {
  id: string
  name: string
  location: string
  health: number
  status: string
  relationships: CharacterRelationship[]
  currentActivity: string
  mood: string
}

export interface CharacterRelationship {
  characterId: string
  relationshipType: RelationshipType
  strength: number // 1-100
  history: string[]
  lastInteraction: string
  sentiment: number // -100 to 100
}

export enum RelationshipType {
  FRIEND = 'friend',
  ENEMY = 'enemy',
  NEUTRAL = 'neutral',
  ALLY = 'ally',
  RIVAL = 'rival',
  MENTOR = 'mentor',
  STUDENT = 'student',
  FAMILY = 'family',
  ROMANTIC = 'romantic',
  BUSINESS = 'business'
}

export interface LocationContext {
  currentLocation: string
  nearbyLocations: string[]
  environmentConditions: string[]
  availableResources: string[]
  dangers: string[]
  opportunities: string[]
}

export interface RecentAction {
  id: string
  playerId: string
  intent: string
  timestamp: string
  outcome: string
  location: string
  relatedCharacters: string[]
}

export interface WorldRule {
  id: string
  name: string
  description: string
  type: RuleType
  constraints: string[]
  exceptions: string[]
}

export enum RuleType {
  PHYSICS = 'physics',
  SOCIAL = 'social',
  MAGICAL = 'magical',
  ECONOMIC = 'economic',
  COMBAT = 'combat',
  ENVIRONMENTAL = 'environmental'
}

export interface EconomyState {
  resources: ResourceState[]
  tradeRoutes: TradeRoute[]
  markets: MarketState[]
}

export interface ResourceState {
  id: string
  name: string
  quantity: number
  location: string
  rarity: string
  demand: number
}

export interface TradeRoute {
  id: string
  from: string
  to: string
  resources: string[]
  danger: number
  activity: number
}

export interface MarketState {
  location: string
  resources: MarketResource[]
  prosperity: number
}

export interface MarketResource {
  name: string
  price: number
  supply: number
  demand: number
}

export interface EnvironmentState {
  weather: string
  timeOfDay: string
  season: string
  magicalConditions: string[]
  naturalDisasters: string[]
}

export interface WorldEvent {
  id: string
  name: string
  description: string
  type: EventType
  impact: ConsequenceImpact
  timestamp: string
  duration: DurationType
  affectedRegions: string[]
}

export enum EventType {
  NATURAL = 'natural',
  POLITICAL = 'political',
  MAGICAL = 'magical',
  ECONOMIC = 'economic',
  SOCIAL = 'social',
  COMBAT = 'combat',
  DISCOVERY = 'discovery'
}

// AI Request/Response Types
export interface AIRequest {
  id: string
  actionId: string
  promptType: PromptType
  context: PromptContext
  prompt: string
  timestamp: string
  maxTokens?: number
  temperature?: number
}

export enum PromptType {
  CONSEQUENCE_GENERATION = 'consequence_generation',
  WORLD_LOGIC_ANALYSIS = 'world_logic_analysis',
  CHARACTER_RESPONSE = 'character_response',
  ENVIRONMENTAL_EFFECT = 'environmental_effect',
  RELATIONSHIP_CHANGE = 'relationship_change'
}

export interface AIResponse {
  id: string
  requestId: string
  content: string
  consequences: AIConsequence[]
  tokenUsage: TokenUsage
  processingTime: number
  timestamp: string
  model: string
  success: boolean
  error?: AIError
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
}

export interface AIError {
  code: string
  message: string
  type: ErrorType
  retryable: boolean
  details?: any
}

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  INVALID_RESPONSE = 'invalid_response',
  PARSING_ERROR = 'parsing_error',
  CONTEXT_TOO_LARGE = 'context_too_large',
  MODEL_UNAVAILABLE = 'model_unavailable'
}

// Configuration Types
export interface OpenAIConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number
  maxRetries: number
  retryDelay: number
  maxRetryDelay: number
  debugMode: boolean
  logLevel: LogLevel
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Rate Limiting Types
export interface RateLimitInfo {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  currentUsage: CurrentUsage
  resetTimes: ResetTimes
}

export interface CurrentUsage {
  minute: number
  hour: number
  day: number
  lastReset: {
    minute: string
    hour: string
    day: string
  }
}

export interface ResetTimes {
  nextMinute: string
  nextHour: string
  nextDay: string
}

// Circuit Breaker Types
export interface CircuitBreakerState {
  isOpen: boolean
  failureCount: number
  lastFailureTime?: string
  nextAttemptTime?: string
}

// Usage Tracking Types
export interface UsageMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  errorRate: number
  dailyUsage: DailyUsage[]
}

export interface DailyUsage {
  date: string
  requests: number
  tokens: number
  cost: number
  errors: number
}

// Prompt Template Types
export interface PromptTemplate {
  id: string
  name: string
  type: PromptType
  template: string
  variables: TemplateVariable[]
  examples: TemplateExample[]
  version: string
}

export interface TemplateVariable {
  name: string
  type: VariableType
  required: boolean
  description: string
  defaultValue?: any
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object'
}

export interface TemplateExample {
  name: string
  context: Partial<PromptContext>
  expectedOutput: string
}

// Validation Types
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  details?: any
}