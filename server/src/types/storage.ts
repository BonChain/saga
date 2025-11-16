/**
 * Core storage interfaces for SuiSaga 3-Layer Walrus Architecture
 *
 * Layer 1 (Blueprint): Immutable world rules and butterfly effect logic
 * Layer 2 (Queue): Individual action files in append-only format
 * Layer 3 (State): Versioned world state shards
 */

export interface WorldRules {
  version: string
  lastModified: string
  rules: {
    physics: Record<string, any>
    characterBehavior: Record<string, any>
    actionConstraints: Record<string, any>
    butterflyEffects: ButterflyEffect[]
  }
  metadata: {
    description: string
    author: string
    checksum: string
  }
}

export interface ButterflyEffect {
  id: string
  trigger: string
  effects: Effect[]
  probability: number
  description: string
}

export interface Effect {
  type: 'character' | 'environment' | 'relationship' | 'economic'
  target: string
  change: Record<string, any>
  duration?: number
  cascading?: boolean
  permanent?: boolean
}

export interface Action {
  id: string
  playerId: string
  intent: string
  originalInput: string
  timestamp: string
  status: 'received' | 'pending' | 'processing' | 'completed' | 'failed'
  consequences?: Consequence[]
  metadata: {
    confidence: number
    parsedIntent?: ParsedIntent
    walrusUrl?: string
    verificationHash?: string
  }
}

export interface ParsedIntent {
  actionType: 'combat' | 'social' | 'exploration' | 'economic' | 'creative' | 'other'
  target?: string
  method?: string
  objects?: string[]
  location?: string
  urgency: 'low' | 'medium' | 'high'
}

export interface Consequence {
  id: string
  actionId: string
  description: string
  impact: 'minor' | 'moderate' | 'major' | 'critical'
  affectedSystems: string[]
  timestamp: string
  duration?: number
  permanent: boolean
  butterflyEffects?: string[]
}

export interface WorldState {
  version: number
  timestamp: string
  previousVersion?: number
  regions: Record<string, RegionState>
  characters: Record<string, CharacterState>
  relationships: Record<string, RelationshipState>
  economy: EconomicState
  environment: EnvironmentalState
  metadata: {
    checksum: string
    actionCount: number
    lastActionId?: string
    walrusUrl?: string
    description?: string
  }
}

export interface RegionState {
  id: string
  name: string
  type: 'village' | 'lair' | 'forest' | 'mountain' | 'water' | 'other'
  status: 'peaceful' | 'tense' | 'conflict' | 'celebrating' | 'recovering'
  population: number
  economy: {
    prosperity: number
    resources: Record<string, number>
    tradeRoutes: string[]
  }
  events: WorldEvent[]
  properties: Record<string, any>
}

export interface CharacterState {
  id: string
  name: string
  type: 'player' | 'npc' | 'dragon' | 'creature'
  location: {
    regionId: string
    coordinates?: { x: number, y: number }
  }
  status: 'active' | 'inactive' | 'dead' | 'transformed'
  attributes: {
    health: number
    maxHealth: number
    relationships: Record<string, number>
    reputation: Record<string, number>
    inventory: Record<string, number>
  }
  memories: Memory[]
  properties: Record<string, any>
}

export interface RelationshipState {
  id: string
  character1Id: string
  character2Id: string
  type: 'friendship' | 'hostility' | 'loyalty' | 'romance' | 'family' | 'professional'
  strength: number // -100 to 100
  status: 'active' | 'dormant' | 'broken' | 'developing'
  history: RelationshipEvent[]
  properties: Record<string, any>
}

export interface EconomicState {
  currency: string
  exchangeRates: Record<string, number>
  marketStatus: 'stable' | 'volatile' | 'depressed' | 'booming'
  resources: Record<string, {
    supply: number
    demand: number
    price: number
    trend: 'rising' | 'falling' | 'stable'
  }>
}

export interface EnvironmentalState {
  timeOfDay: number // 0-24
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'magical'
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  magicalEnergy: number
  phenomena: EnvironmentalPhenomenon[]
}

export interface Memory {
  id: string
  timestamp: string
  type: 'action' | 'conversation' | 'observation' | 'emotion'
  content: string
  participants?: string[]
  emotionalImpact: number // -100 to 100
  importance: number // 0-100
}

export interface WorldEvent {
  id: string
  type: 'combat' | 'social' | 'economic' | 'environmental' | 'magical'
  description: string
  timestamp: string
  participants: string[]
  location: string
  impact: 'minor' | 'moderate' | 'major' | 'critical'
  status: 'ongoing' | 'completed'
}

export interface RelationshipEvent {
  id: string
  timestamp: string
  type: 'meeting' | 'conflict' | 'cooperation' | 'betrayal' | 'support'
  description: string
  impactChange: number
  context?: Record<string, any>
}

export interface EnvironmentalPhenomenon {
  id: string
  type: string
  location: string
  intensity: number
  duration: number
  effects: string[]
}

// Storage interfaces
export interface StorageLayer<T> {
  write(data: T): Promise<StorageResult<T>>
  read(id: string): Promise<StorageResult<T | null>>
  list(options?: ListOptions): Promise<StorageResult<T[]>>
  delete(id: string): Promise<StorageResult<boolean>>
  validate(data: T): boolean
  backup?(): Promise<void>
}

export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    checksum?: string
    url?: string
    timestamp?: string
    attempts?: number
  }
}

export interface ListOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, any>
}

// Walrus-specific interfaces
export interface WalrusConfig {
  endpoint: string // Sui fullnode URL
  network: string // 'testnet' | 'mainnet'
  maxRetries: number
  timeout: number
  useBackup: boolean
  backupPath: string
  // Sponsored transaction properties
  sponsoredTransactions: boolean
  developerPrivateKey: string // From environment variable, not file
  storageEpochs: number
}

// Configuration interfaces
export interface BackupConfig {
  enabled: boolean
  basePath: string
  maxBackups: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
  encryptionKey?: string
}

export interface ValidationConfig {
  strictMode: boolean
  maxActionLength: number
  maxWorldStateSize: number
  allowedActionTypes: string[]
  requiredWorldRules: string[]
  checksumAlgorithm: string
  enableCrossLayerValidation: boolean
}

export interface LoggerConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  logToFile: boolean
  logToConsole: boolean
  logDirectory: string
  maxLogFileSize: number
  maxLogFiles: number
  structuredLogging: boolean
  includeMetadata: boolean
}

export interface WalrusStorageResult {
  success: boolean
  blobId?: string
  url?: string
  checksum?: string
  timestamp?: string
  error?: string
  // Sponsored transaction properties
  sponsored?: boolean
  developerAddress?: string
  blobObjectId?: string
  data?: any
}

// Logging interfaces
export interface StorageLog {
  timestamp: string
  layer: 'blueprint' | 'queue' | 'state'
  operation: 'write' | 'read' | 'delete' | 'validate' | 'backup' | 'list'
  id?: string
  success: boolean
  duration: number
  error?: string
  metadata?: Record<string, any>
}

// Data integrity interfaces
export interface IntegrityCheck {
  layer: string
  id: string
  checksum: string
  timestamp: string
  valid: boolean
  errors?: string[]
}

export interface StorageStats {
  layer: string
  totalOperations: number
  successRate: number
  averageLatency: number
  lastOperation: string
  errorCount: number
  lastBackup?: string
}