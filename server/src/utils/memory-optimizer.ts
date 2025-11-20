/**
 * Memory Optimization Utilities for Butterfly Effect Visualization
 *
 * Implements object pooling, compact data structures, and lazy evaluation
 * to reduce memory allocation and improve performance for large cascades.
 */

import { ButterflyEffectNode, EffectConnection, CascadeVisualizationData } from '../types/ai'

// Configuration for memory optimization
const MEMORY_CONFIG = {
  MAX_POOL_SIZE: 1000,
  POOL_CLEANUP_THRESHOLD: 800,
  COMPRESS_SMALL_STRINGS: true,
  SMALL_STRING_THRESHOLD: 50,
  LAZY_EVALUATION_DELAY: 100 // ms
} as const

/**
 * Pooled object for butterfly effect visualization nodes
 */
export interface PooledVisualizationNode {
  id: string
  type: string
  title: string
  description: string
  level: number
  region: string
  impact: {
    magnitude: number
    significance: number
    affectedSystems: string[]
  }
  position: { x: number; y: number; layer?: number }
  metadata: {
    title: string
    description: string
    severity: any // Using any to avoid circular imports
    confidence: number
    affectedSystems: string[]
    affectedRegions: string[]
    duration: any
    magnitude: number
  }
  // Additional compact fields
  tags?: number[] // Bit flags instead of arrays
  color?: string // Pre-computed color
  size?: number // Node size for visualization
  visualProperties?: {
    color: string
    size: number
    opacity: number
    pulseSpeed: number
  }
}

/**
 * Compact connection representation
 */
interface CompactConnection {
  from: number // Node ID index instead of string
  to: number   // Node ID index instead of string
  strength: number
  type: number // Enum instead of string
  delay: number
  color?: string
}

/**
 * Compact world system influence representation
 * Uses typed arrays and enums instead of strings for memory efficiency
 */
export interface CompactWorldSystemInfluence {
  id: number // System ID as number instead of string
  nameOffset: number // Offset in string cache
  connectedSystemIds: Uint8Array // Array of system IDs
  influenceFactors: Float32Array // Compact array of influence factors
  systemType: number // Enum instead of string
  regionCount: number // Number of regions this system affects
}

/**
 * World system type enumeration for memory efficiency
 */
export enum WorldSystemType {
  SOCIAL = 1,
  ENVIRONMENT = 2,
  ECONOMIC = 3,
  WORLD_STATE = 4,
  RELATIONSHIP = 5,
  CHARACTER = 6,
  COMBAT = 7,
  EXPLORATION = 8
}

/**
 * String cache for compact string storage
 */
export class CompactStringCache {
  private static strings: string[] = [''] // Index 0 is empty string
  private static stringToIndex = new Map<string, number>()
  private static maxCacheSize = 10000

  static getOrAdd(str: string): number {
    if (!str) return 0 // Empty string index

    if (this.stringToIndex.has(str)) {
      return this.stringToIndex.get(str)!
    }

    if (this.strings.length >= this.maxCacheSize) {
      // Clear least used strings (simplified)
      const toRemove = Math.floor(this.maxCacheSize / 4)
      for (let i = 1; i <= toRemove; i++) {
        const removedStr = this.strings[i]
        if (removedStr) {
          this.stringToIndex.delete(removedStr)
        }
      }
      this.strings.splice(1, toRemove)
    }

    const index = this.strings.length
    this.strings.push(str)
    this.stringToIndex.set(str, index)
    return index
  }

  static getString(index: number): string {
    return this.strings[index] || ''
  }

  static clearCache(): void {
    this.strings = ['']
    this.stringToIndex.clear()
  }

  static getStats() {
    return {
      totalStrings: this.strings.length,
      cacheSize: this.stringToIndex.size,
      memoryUsage: this.strings.length * 50 // Rough estimate
    }
  }
}

/**
 * Object pool for visualization nodes
 */
export class VisualizationNodePool {
  private pool: PooledVisualizationNode[] = []
  private createdCount = 0
  private reusedCount = 0

  acquire(): PooledVisualizationNode {
    if (this.pool.length > 0) {
      this.reusedCount++
      const node = this.pool.pop()!
      this.resetNode(node)
      return node
    }

    this.createdCount++
    return this.createNewNode()
  }

  release(node: PooledVisualizationNode): void {
    if (this.pool.length < MEMORY_CONFIG.MAX_POOL_SIZE) {
      this.resetNode(node)
      this.pool.push(node)
    }
  }

  private resetNode(node: PooledVisualizationNode): void {
    // Reset to minimal state to save memory
    node.id = ''
    node.type = ''
    node.title = ''
    node.description = ''
    node.level = 0
    node.region = ''
    node.impact = { magnitude: 0, significance: 0, affectedSystems: [] }
    node.position = { x: 0, y: 0 }
    node.metadata = {
      title: '',
      description: '',
      severity: undefined,
      confidence: 0,
      affectedSystems: [],
      affectedRegions: [],
      duration: undefined,
      magnitude: 0
    }
    node.tags = undefined
    node.color = undefined
    node.size = undefined
    node.visualProperties = undefined
  }

  private createNewNode(): PooledVisualizationNode {
    return {
      id: '',
      type: '',
      title: '',
      description: '',
      level: 0,
      region: '',
      impact: { magnitude: 0, significance: 0, affectedSystems: [] },
      position: { x: 0, y: 0 },
      metadata: {
        title: '',
        description: '',
        severity: undefined,
        confidence: 0,
        affectedSystems: [],
        affectedRegions: [],
        duration: undefined,
        magnitude: 0
      }
    }
  }

  getStats() {
    return {
      created: this.createdCount,
      reused: this.reusedCount,
      poolSize: this.pool.length,
      reuseRate: this.createdCount > 0 ? (this.reusedCount / (this.createdCount + this.reusedCount)) * 100 : 0
    }
  }

  cleanup(): void {
    this.pool = []
    this.createdCount = 0
    this.reusedCount = 0
  }
}

/**
 * String compression utilities
 */
export class StringCompressor {
  private static stringCache = new Map<string, string>()
  private static maxCacheSize = 1000

  static compress(str: string): string {
    if (!str) return str
    if (str.length <= MEMORY_CONFIG.SMALL_STRING_THRESHOLD) return str

    if (this.stringCache.has(str)) {
      return this.stringCache.get(str)!
    }

    if (this.stringCache.size >= this.maxCacheSize) {
      // Clear half the cache
      const keys = Array.from(this.stringCache.keys())
      keys.slice(0, Math.floor(this.maxCacheSize / 2)).forEach(key => {
        this.stringCache.delete(key)
      })
    }

    this.stringCache.set(str, str)
    return str
  }

  static clearCache(): void {
    this.stringCache.clear()
  }
}

/**
 * Lazy evaluation container for expensive visualization data
 */
export class LazyVisualizationData {
  private _nodes: PooledVisualizationNode[] | null = null
  private _connections: CompactConnection[] | null = null
  private _metadata: any = null
  private _isDirty = true
  private _lastAccessTime = 0
  private nodePool: VisualizationNodePool

  constructor(nodePool: VisualizationNodePool) {
    this.nodePool = nodePool
  }

  get nodes(): PooledVisualizationNode[] {
    this._lastAccessTime = Date.now()
    if (this._isDirty || !this._nodes) {
      this._nodes = this.generateNodes()
      this._isDirty = false
    }
    return this._nodes
  }

  get connections(): CompactConnection[] {
    this._lastAccessTime = Date.now()
    if (this._isDirty || !this._connections) {
      this._connections = this.generateConnections()
      this._isDirty = false
    }
    return this._connections
  }

  get metadata(): any {
    this._lastAccessTime = Date.now()
    if (this._isDirty || !this._metadata) {
      this._metadata = this.generateMetadata()
      this._isDirty = false
    }
    return this._metadata
  }

  markDirty(): void {
    this._isDirty = true
  }

  clear(): void {
    // Return nodes to pool
    if (this._nodes) {
      this._nodes.forEach(node => this.nodePool.release(node))
    }
    this._nodes = null
    this._connections = null
    this._metadata = null
    this._isDirty = true
  }

  getLastAccessTime(): number {
    return this._lastAccessTime
  }

  private generateNodes(): PooledVisualizationNode[] {
    // Implementation depends on the specific data source
    return []
  }

  private generateConnections(): CompactConnection[] {
    // Implementation depends on the specific data source
    return []
  }

  private generateMetadata(): any {
    // Implementation depends on the specific data source
    return {}
  }
}

/**
 * Memory-optimized cascade processor
 */
export class MemoryOptimizedCascadeProcessor {
  private nodePool: VisualizationNodePool
  private visualizationCache = new Map<string, LazyVisualizationData>()
  private maxCacheSize = 100
  private cacheHits = 0
  private cacheMisses = 0
  private compactWorldSystems = new Map<number, CompactWorldSystemInfluence>()
  private systemNameToId = new Map<string, number>()
  private nextSystemId = 1

  constructor() {
    this.nodePool = new VisualizationNodePool()
  }

  /**
   * Create visualization node with memory optimization
   */
  createOptimizedNode(originalData: Partial<PooledVisualizationNode>): PooledVisualizationNode {
    const node = this.nodePool.acquire()

    // Copy data with optimization
    if (originalData.id) node.id = StringCompressor.compress(originalData.id)
    if (originalData.type) node.type = StringCompressor.compress(originalData.type)
    if (originalData.title) node.title = StringCompressor.compress(originalData.title)
    if (originalData.description) node.description = StringCompressor.compress(originalData.description)
    if (originalData.level !== undefined) node.level = originalData.level
    if (originalData.region) node.region = StringCompressor.compress(originalData.region)

    // Compact impact data
    if (originalData.impact) {
      node.impact = {
        magnitude: originalData.impact.magnitude || 0,
        significance: originalData.impact.significance || 0,
        affectedSystems: originalData.impact.affectedSystems || []
      }
    }

    // Compact position
    if (originalData.position) {
      node.position = {
        x: Math.round(originalData.position.x * 100) / 100, // Reduce precision
        y: Math.round(originalData.position.y * 100) / 100
      }
    }

    // Compact metadata
    if (originalData.metadata) {
      node.metadata = {
        title: StringCompressor.compress(originalData.metadata.title || ''),
        description: StringCompressor.compress(originalData.metadata.description || ''),
        severity: originalData.metadata.severity,
        confidence: originalData.metadata.confidence || 0,
        affectedSystems: (originalData.metadata.affectedSystems || [])
          .map(system => StringCompressor.compress(system)),
        affectedRegions: (originalData.metadata.affectedRegions || [])
          .map(region => StringCompressor.compress(region)),
        duration: originalData.metadata.duration,
        magnitude: originalData.metadata.magnitude || 0
      }
    }

    return node
  }

  /**
   * Create compact connection representation
   */
  createCompactConnection(
    fromIndex: number,
    toIndex: number,
    relationshipType: string,
    strength: number,
    delay: number
  ): CompactConnection {
    return {
      from: fromIndex,
      to: toIndex,
      strength: Math.round(strength * 100) / 100, // Reduce precision
      type: this.getRelationshipTypeId(relationshipType),
      delay: Math.round(delay),
      color: this.getConnectionColor(relationshipType, strength)
    }
  }

  private getRelationshipTypeId(type: string): number {
    const typeMap: Record<string, number> = {
      'direct': 1,
      'indirect': 2,
      'amplifying': 3,
      'mitigating': 4
    }
    return typeMap[type] || 0
  }

  private getConnectionColor(type: string, strength: number): string {
    if (strength > 0.8) return '#ff6b6b' // Red for strong
    if (strength > 0.5) return '#feca57' // Orange for medium
    if (strength > 0.2) return '#4ecdc4' // Blue for weak
    return '#95a5a6' // Gray for minimal
  }

  /**
   * Get or create cached lazy visualization data
   */
  getCachedVisualizationData(cacheKey: string): LazyVisualizationData {
    if (this.visualizationCache.has(cacheKey)) {
      this.cacheHits++
      return this.visualizationCache.get(cacheKey)!
    }

    this.cacheMisses++

    // Check cache size and clean if necessary
    if (this.visualizationCache.size >= this.maxCacheSize) {
      this.cleanupCache()
    }

    const lazyData = new LazyVisualizationData(this.nodePool)
    this.visualizationCache.set(cacheKey, lazyData)
    return lazyData
  }

  private cleanupCache(): void {
    const entries = Array.from(this.visualizationCache.entries())

    // Sort by last access time and remove oldest half
    entries.sort(([,a], [,b]) => a.getLastAccessTime() - b.getLastAccessTime())

    const toRemove = entries.slice(0, Math.floor(this.maxCacheSize / 2))
    toRemove.forEach(([key, data]) => {
      data.clear()
      this.visualizationCache.delete(key)
    })
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    const poolStats = this.nodePool.getStats()

    return {
      nodePool: poolStats,
      cache: {
        size: this.visualizationCache.size,
        maxSize: this.maxCacheSize,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.cacheHits + this.cacheMisses > 0
          ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
          : 0
      },
      compression: {
        stringCacheSize: CompactStringCache.getStats().totalStrings
      }
    }
  }

  /**
   * Convert world system influence to compact format
   */
  convertToCompactWorldSystem(worldSystem: any): CompactWorldSystemInfluence {
    const systemId = this.nextSystemId++
    this.systemNameToId.set(worldSystem.id, systemId)

    const nameOffset = CompactStringCache.getOrAdd(worldSystem.name)
    const connectedSystemIds = new Uint8Array(worldSystem.connectedSystems.length)
    const influenceFactors = new Float32Array(Object.keys(worldSystem.influenceFactors).length)

    // Convert connected systems to IDs
    for (let i = 0; i < worldSystem.connectedSystems.length; i++) {
      const connectedSystemName = worldSystem.connectedSystems[i]
      let connectedId = this.systemNameToId.get(connectedSystemName)
      if (!connectedId) {
        connectedId = this.nextSystemId++
        this.systemNameToId.set(connectedSystemName, connectedId)
      }
      connectedSystemIds[i] = connectedId
    }

    // Convert influence factors to compact array
    let factorIndex = 0
    for (const [systemName, factor] of Object.entries(worldSystem.influenceFactors)) {
      influenceFactors[factorIndex++] = factor as number
    }

    return {
      id: systemId,
      nameOffset,
      connectedSystemIds,
      influenceFactors,
      systemType: this.getSystemTypeId(worldSystem.id),
      regionCount: worldSystem.connectedSystems.length
    }
  }

  /**
   * Get compact system type ID
   */
  private getSystemTypeId(systemId: string): number {
    const typeMap: Record<string, WorldSystemType> = {
      'social': WorldSystemType.SOCIAL,
      'environment': WorldSystemType.ENVIRONMENT,
      'economic': WorldSystemType.ECONOMIC,
      'world_state': WorldSystemType.WORLD_STATE,
      'relationship': WorldSystemType.RELATIONSHIP,
      'character': WorldSystemType.CHARACTER,
      'combat': WorldSystemType.COMBAT,
      'exploration': WorldSystemType.EXPLORATION
    }
    return typeMap[systemId] || WorldSystemType.WORLD_STATE
  }

  /**
   * Process world systems in compact format
   */
  processWorldSystemInfluence(influences: any[]): void {
    for (const influence of influences) {
      const compactInfluence = this.convertToCompactWorldSystem(influence)
      this.compactWorldSystems.set(compactInfluence.id, compactInfluence)
    }
  }

  /**
   * Get compact world system by ID
   */
  getCompactWorldSystem(systemId: string | number): CompactWorldSystemInfluence | undefined {
    if (typeof systemId === 'string') {
      systemId = this.systemNameToId.get(systemId) || -1
    }
    return this.compactWorldSystems.get(systemId)
  }

  /**
   * Get memory statistics for compact world systems
   */
  getCompactWorldSystemStats() {
    return {
      totalSystems: this.compactWorldSystems.size,
      systemMappings: this.systemNameToId.size,
      memoryUsage: this.compactWorldSystems.size * 64, // Rough estimate
      stringCacheStats: CompactStringCache.getStats()
    }
  }

  /**
   * Clean up memory
   */
  cleanup(): void {
    this.nodePool.cleanup()
    this.visualizationCache.forEach(data => data.clear())
    this.visualizationCache.clear()
    StringCompressor.clearCache()
    CompactStringCache.clearCache()

    this.compactWorldSystems.clear()
    this.systemNameToId.clear()
    this.nextSystemId = 1

    this.cacheHits = 0
    this.cacheMisses = 0
  }
}

/**
 * Memory monitoring utilities
 */
export class MemoryMonitor {
  private static baseline: NodeJS.MemoryUsage
  private static measurements: NodeJS.MemoryUsage[] = []
  private static maxMeasurements = 100

  static recordMeasurement(): void {
    const current = process.memoryUsage()
    this.measurements.push({
      rss: current.rss,
      heapUsed: current.heapUsed,
      heapTotal: current.heapTotal,
      external: current.external,
      arrayBuffers: current.arrayBuffers
    })

    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift()
    }
  }

  static setBaseline(): void {
    this.baseline = process.memoryUsage()
  }

  static getMemoryDelta(): Partial<NodeJS.MemoryUsage> {
    if (!this.baseline) return {}

    const current = process.memoryUsage()
    return {
      rss: current.rss - this.baseline.rss,
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      external: current.external - this.baseline.external,
      arrayBuffers: current.arrayBuffers - this.baseline.arrayBuffers
    }
  }

  static getAverageMemoryUsage(): Partial<NodeJS.MemoryUsage> {
    if (this.measurements.length === 0) return {}

    const sum = this.measurements.reduce((acc, curr) => ({
      rss: acc.rss + curr.rss,
      heapUsed: acc.heapUsed + curr.heapUsed,
      heapTotal: acc.heapTotal + curr.heapTotal,
      external: acc.external + curr.external,
      arrayBuffers: acc.arrayBuffers + curr.arrayBuffers
    }))

    const count = this.measurements.length
    return {
      rss: Math.round(sum.rss / count),
      heapUsed: Math.round(sum.heapUsed / count),
      heapTotal: Math.round(sum.heapTotal / count),
      external: Math.round(sum.external / count),
      arrayBuffers: Math.round(sum.arrayBuffers / count)
    }
  }
}