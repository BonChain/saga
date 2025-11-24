/**
 * Demo Reliability Service
 *
 * Provides fallback systems ensuring demo works even if blockchain or AI services fail
 * Implements cached responses, offline mode, and emergency demo features for hackathon success
 */

import { createHash } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import * as path from 'path'

export type DemoMode = 'normal' | 'offline' | 'emergency'

export interface ServiceStatus {
  walrus: 'online' | 'offline' | 'error'
  ai: 'online' | 'offline' | 'error'
  network: 'online' | 'offline' | 'error'
  lastCheck: number
}

export interface CachedResponse {
  actionId: string
  actionType: string
  originalInput: string
  consequences: Array<{
    system: string
    narrative: string
    severity: 'minor' | 'major' | 'critical'
    impact: number
  }>
  verificationLink?: string
  timestamp: string
  isFallback: boolean
}

export interface EmergencyDemoData {
  title: string
  description: string
  actions: Array<{
    input: string
    consequences: string[]
    verificationLink: string
  }>
  videoUrl?: string
  screenshotUrl?: string
}

export class DemoReliabilityService {
  private serviceStatus: ServiceStatus
  private demoMode: DemoMode
  private cache: Map<string, CachedResponse>
  private healthCheckInterval: NodeJS.Timeout | null
  private readonly cacheFile: string
  private readonly emergencyDataFile: string

  constructor() {
    this.demoMode = 'normal'
    this.cache = new Map()
    this.cacheFile = path.join(__dirname, '../../storage/demo-cache.json')
    this.emergencyDataFile = path.join(__dirname, '../../storage/emergency-demo-data.json')

    this.serviceStatus = {
      walrus: 'online',
      ai: 'online',
      network: 'online',
      lastCheck: Date.now()
    }

    console.log('🛡️ DemoReliabilityService initialized')
    console.log('   Cache file:', this.cacheFile)
    console.log('   Emergency data:', this.emergencyDataFile)
    console.log('   Starting health monitoring...')

    this.loadCache()
    this.startHealthMonitoring()
  }

  /**
   * Get cached response for action (fallback when AI fails)
   */
  getCachedResponse(actionInput: string, actionType: string): CachedResponse | null {
    const inputHash = this.hashInput(actionInput)
    const cached = this.cache.get(inputHash)

    if (cached) {
      console.log(`📦 Using cached response for: ${actionInput.substring(0, 50)}...`)
      return {
        ...cached,
        isFallback: true
      }
    }

    return null
  }

  /**
   * Cache successful AI response for future fallbacks
   */
  cacheResponse(
    actionId: string,
    actionInput: string,
    actionType: string,
    consequences: any[],
    verificationLink?: string
  ): void {
    const inputHash = this.hashInput(actionInput)

    const cachedResponse: CachedResponse = {
      actionId,
      actionType,
      originalInput: actionInput,
      consequences: consequences.map(c => ({
        system: c.system || 'unknown',
        narrative: c.narrative || c.description || 'Consequence occurred',
        severity: c.severity || 'minor',
        impact: c.impact || Math.floor(Math.random() * 10) + 1
      })),
      verificationLink,
      timestamp: new Date().toISOString(),
      isFallback: false
    }

    this.cache.set(inputHash, cachedResponse)
    this.saveCache()

    console.log(`💾 Cached response for: ${actionInput.substring(0, 50)}...`)
  }

  /**
   * Get current demo mode
   */
  getDemoMode(): DemoMode {
    return this.demoMode
  }

  /**
   * Get service status for UI display
   */
  getServiceStatus(): ServiceStatus {
    return { ...this.serviceStatus }
  }

  /**
   * Enter emergency mode (demo failure recovery)
   */
  enterEmergencyMode(): EmergencyDemoData | null {
    console.warn('🚨 ENTERING EMERGENCY MODE')

    this.demoMode = 'emergency'

    try {
      if (existsSync(this.emergencyDataFile)) {
        const emergencyData = JSON.parse(readFileSync(this.emergencyDataFile, 'utf8'))
        console.log('✅ Emergency demo data loaded')
        return emergencyData
      } else {
        console.log('📝 Creating default emergency data...')
        return this.createDefaultEmergencyData()
      }
    } catch (error) {
      console.error('❌ Failed to load emergency data:', error)
      return this.createDefaultEmergencyData()
    }
  }

  /**
   * Check if system is in demo-friendly state
   */
  isDemoReady(): {
    ready: boolean
    mode: DemoMode
    issues: string[]
  } {
    const issues: string[] = []

    if (this.serviceStatus.walrus !== 'online') {
      issues.push('Walrus storage offline')
    }

    if (this.serviceStatus.ai !== 'online') {
      issues.push('AI processing offline')
    }

    if (this.serviceStatus.network !== 'online') {
      issues.push('Network connectivity issues')
    }

    const ready = issues.length === 0 || this.demoMode === 'emergency'

    return {
      ready,
      mode: this.demoMode,
      issues
    }
  }

  /**
   * Get demo configuration for frontend
   */
  getDemoConfig(): {
    mode: DemoMode
    serviceStatus: ServiceStatus
    fallbackEnabled: boolean
    emergencyVideo?: string
    cachedResponses: number
  } {
    return {
      mode: this.demoMode,
      serviceStatus: this.serviceStatus,
      fallbackEnabled: this.cache.size > 0,
      cachedResponses: this.cache.size,
      emergencyVideo: this.getEmergencyVideoUrl()
    }
  }

  /**
   * Manually trigger health check
   */
  async triggerHealthCheck(): Promise<void> {
    console.log('🔍 Manual health check triggered...')
    await this.checkServiceHealth()
  }

  // Private Methods

  private hashInput(input: string): string {
    return createHash('sha256').update(input.toLowerCase().trim()).digest('hex').substring(0, 16)
  }

  private startHealthMonitoring(): void {
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.checkServiceHealth()
    }, 30000)

    // Initial check
    this.checkServiceHealth()
  }

  private async checkServiceHealth(): Promise<void> {
    try {
      // Check Walrus service health
      await this.checkWalrusHealth()

      // Check AI service health
      await this.checkAIHealth()

      // Check network connectivity
      await this.checkNetworkHealth()

      this.serviceStatus.lastCheck = Date.now()

      // Determine demo mode based on service status
      this.updateDemoMode()

    } catch (error) {
      console.error('❌ Health check failed:', error)
      this.serviceStatus.lastCheck = Date.now()
      this.demoMode = 'emergency'
    }
  }

  private async checkWalrusHealth(): Promise<void> {
    try {
      // Simple health check - try to read a known blob or check service
      const response = await fetch('https://api.testnet.sui.io/', {
        method: 'GET'
      })

      if (response.ok) {
        if (this.serviceStatus.walrus !== 'online') {
          console.log('✅ Walrus service back online')
        }
        this.serviceStatus.walrus = 'online'
      } else {
        this.serviceStatus.walrus = 'offline'
      }
    } catch (error) {
      if (this.serviceStatus.walrus !== 'offline') {
        console.warn('⚠️ Walrus service offline')
      }
      this.serviceStatus.walrus = 'offline'
    }
  }

  private async checkAIHealth(): Promise<void> {
    try {
      // Check if AI service is responding
      const testAction = {
        input: "test action",
        intent: "test",
        consequences: []
      }

      // This would normally call the AI service
      // For demo purposes, just check if we can process locally
      const hasCachedResponse = this.getCachedResponse("test action", "test")

      if (hasCachedResponse || process.env.AI_SERVICE_AVAILABLE === 'true') {
        if (this.serviceStatus.ai !== 'online') {
          console.log('✅ AI service online')
        }
        this.serviceStatus.ai = 'online'
      } else {
        this.serviceStatus.ai = 'error'
      }
    } catch (error) {
      if (this.serviceStatus.ai !== 'offline') {
        console.warn('⚠️ AI service offline')
      }
      this.serviceStatus.ai = 'offline'
    }
  }

  private async checkNetworkHealth(): Promise<void> {
    try {
      const response = await fetch('https://google.com', {
        method: 'HEAD'
      })

      if (response.ok) {
        if (this.serviceStatus.network !== 'online') {
          console.log('✅ Network connectivity restored')
        }
        this.serviceStatus.network = 'online'
      } else {
        this.serviceStatus.network = 'offline'
      }
    } catch (error) {
      if (this.serviceStatus.network !== 'offline') {
        console.warn('⚠️ Network connectivity lost')
      }
      this.serviceStatus.network = 'offline'
    }
  }

  private updateDemoMode(): void {
    const failedServices = [
      this.serviceStatus.walrus === 'offline' || this.serviceStatus.walrus === 'error',
      this.serviceStatus.ai === 'offline' || this.serviceStatus.ai === 'error',
      this.serviceStatus.network === 'offline' || this.serviceStatus.network === 'error'
    ].filter(Boolean).length

    if (failedServices >= 2 || this.serviceStatus.network === 'offline') {
      this.demoMode = 'emergency'
    } else if (failedServices >= 1) {
      this.demoMode = 'offline'
    } else {
      this.demoMode = 'normal'
    }

    if (this.demoMode !== 'normal') {
      console.warn(`📊 Demo mode: ${this.demoMode} (${failedServices} services down)`)
    }
  }

  private loadCache(): void {
    try {
      if (existsSync(this.cacheFile)) {
        const cacheData = JSON.parse(readFileSync(this.cacheFile, 'utf8'))
        this.cache = new Map(Object.entries(cacheData))
        console.log(`📦 Loaded ${this.cache.size} cached responses`)
      }
    } catch (error) {
      console.warn('⚠️ Could not load cache file, starting fresh:', error)
      this.cache = new Map()
    }
  }

  private saveCache(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache)
      writeFileSync(this.cacheFile, JSON.stringify(cacheObject, null, 2))
    } catch (error) {
      console.error('❌ Could not save cache file:', error)
    }
  }

  private createDefaultEmergencyData(): EmergencyDemoData {
    const emergencyData: EmergencyDemoData = {
      title: "SuiSaga Living World Demo",
      description: "Unlimited player agency with AI-generated consequences",
      actions: [
        {
          input: "attack the dragon with my sword",
          consequences: [
            "Dragon retaliates with fire breath",
            "Villagers celebrate your bravery",
            "Dragon drops valuable scales",
            "Nearby forest becomes dragon territory"
          ],
          verificationLink: "walrus-readblob://demo-dragon-action-123"
        },
        {
          input: "befriend the goblin king",
          consequences: [
            "Goblin tribe offers you tribute",
            "Human-goblin relations improve",
            "New trade routes opened",
            "Dragon becomes suspicious of alliance"
          ],
          verificationLink: "walrus-readblob://demo-diplomacy-action-456"
        },
        {
          input: "cast a spell to make it rain",
          consequences: [
            "Drought-stricken villages celebrate",
            "Crops begin to grow rapidly",
            "Magical energy affects local wildlife",
            "Nearby river swells dangerously"
          ],
          verificationLink: "walrus-readblob://demo-magic-action-789"
        }
      ]
    }

    // Save default data
    this.saveEmergencyData(emergencyData)
    return emergencyData
  }

  private saveEmergencyData(data: EmergencyDemoData): void {
    try {
      const dir = path.dirname(this.emergencyDataFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.emergencyDataFile, JSON.stringify(data, null, 2))
      console.log('💾 Emergency demo data saved')
    } catch (error) {
      console.error('❌ Could not save emergency data:', error)
    }
  }

  private getEmergencyVideoUrl(): string | undefined {
    // Could be configured via environment variable
    return process.env.DEMO_BACKUP_VIDEO_URL
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    console.log('🛡️ DemoReliabilityService destroyed')
  }
}

// Default instance for dependency injection
export const demoReliabilityService = new DemoReliabilityService()