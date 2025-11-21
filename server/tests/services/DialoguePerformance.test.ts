/**
 * Dialogue Performance Tests - Story 4.2: Dynamic Dialogue Generation
 *
 * Performance validation tests ensuring sub-2 second generation times
 * for hackathon demo requirements and scalability testing.
 */

import { DialogueService } from '../../src/services/DialogueService'
import { DialogueCacheService } from '../../src/services/DialogueCache'
import { DialogueRequest } from '../../src/types/dialogue'

// Mock AI Service Adapter
class MockAIServiceAdapter {
  async generateResponse(request: unknown): Promise<{ content: string }> {
    return {
      content: 'Mock AI response for performance testing.',
    }
  }
}

describe('Dialogue Performance Tests', () => {
  let dialogueService: DialogueService
  let cacheService: DialogueCacheService

  beforeEach(() => {
    dialogueService = new DialogueService(new MockAIServiceAdapter())
    cacheService = new DialogueCacheService()
  })

  describe('Hackathon Demo Performance Requirements', () => {
    const performanceThresholds = {
      singleRequest: 2000, // 2 seconds
      batchRequest: 5000,  // 5 seconds for 10 requests
      cacheHit: 100        // 100ms for cached requests
    }

    it('should generate single dialogue request under 2 seconds', async () => {
      const request: DialogueRequest = {
        characterId: 'performance_npc_001',
        playerId: 'player_demo',
        context: 'Hello! I need to test your response time.',
        dialogueType: 'response'
      }

      const startTime = Date.now()
      const response = await dialogueService.generateDialogue(request)
      const endTime = Date.now()

      const generationTime = endTime - startTime

      expect(response).toBeDefined()
      expect(generationTime).toBeLessThan(performanceThresholds.singleRequest)
      expect(response.generationTime).toBeLessThan(performanceThresholds.singleRequest)

      console.log(`Single request generation time: ${generationTime}ms`)
    })

    it('should handle 10 concurrent requests under 5 seconds', async () => {
      const requests: DialogueRequest[] = Array.from({ length: 10 }, (_, i) => ({
        characterId: `perf_npc_${i + 1}`,
        playerId: 'demo_player',
        context: `Performance test request ${i + 1}`,
        dialogueType: 'greeting'
      }))

      const startTime = Date.now()
      const promises = requests.map(request => dialogueService.generateDialogue(request))
      const responses = await Promise.all(promises)
      const endTime = Date.now()

      const totalTime = endTime - startTime

      expect(responses).toHaveLength(10)
      expect(totalTime).toBeLessThan(performanceThresholds.batchRequest)

      // All responses should be complete
      responses.forEach((response, index) => {
        expect(response.dialogue).toBeDefined()
        expect(response.characterId).toBe(`perf_npc_${index + 1}`)
        expect(response.generationTime).toBeLessThan(performanceThresholds.singleRequest)
      })

      const avgTimePerRequest = totalTime / 10
      console.log(`Average time per request: ${avgTimePerRequest.toFixed(2)}ms`)
      console.log(`Total batch time: ${totalTime}ms`)
    })

    it('should maintain performance under sustained load', async () => {
      const sustainedLoadTest = {
        rounds: 5,
        requestsPerRound: 10,
        maxAverageTime: 2000,
        maxTotalTime: 10000 // 10 seconds for entire sustained test
      }

      const allTimings: number[] = []

      for (let round = 0; round < sustainedLoadTest.rounds; round++) {
        const requests: DialogueRequest[] = Array.from({ length: sustainedLoadTest.requestsPerRound }, (_, i) => ({
          characterId: `sustain_npc_${round}_${i}`,
          playerId: 'sustain_player',
          context: `Sustained load test round ${round + 1}, request ${i + 1}`,
          dialogueType: 'response'
        }))

        const roundStartTime = Date.now()
        const promises = requests.map(req => dialogueService.generateDialogue(req))
        await Promise.all(promises)
        const roundEndTime = Date.now()

        const roundTime = roundEndTime - roundStartTime
        const avgTimePerRequest = roundTime / sustainedLoadTest.requestsPerRound

        allTimings.push(avgTimePerRequest)
        console.log(`Round ${round + 1}: ${avgTimePerRequest.toFixed(2)}ms avg per request`)

        expect(avgTimePerRequest).toBeLessThan(sustainedLoadTest.maxAverageTime)
      }

      const overallAvgTime = allTimings.reduce((sum, time) => sum + time, 0) / allTimings.length
      expect(overallAvgTime).toBeLessThan(sustainedLoadTest.maxAverageTime)

      console.log(`Overall average time: ${overallAvgTime.toFixed(2)}ms per request`)
    })

    it('should demonstrate significant performance improvement with caching', async () => {
      const request: DialogueRequest = {
        characterId: 'cache_performance_npc',
        playerId: 'demo_player',
        context: 'Cache performance test request',
        dialogueType: 'greeting'
      }

      // First request (no cache)
      const uncachedStartTime = Date.now()
      const uncachedResponse = await dialogueService.generateDialogue(request)
      const uncachedTime = Date.now() - uncachedStartTime

      // Cache the response
      await cacheService.set(request, uncachedResponse)

      // Second request (from cache)
      const cachedStartTime = Date.now()
      const cachedResponse = await cacheService.get(request)
      const cachedTime = Date.now() - cachedStartTime

      expect(cachedResponse).toBeDefined()
      expect(cachedTime).toBeLessThan(uncachedTime)
      expect(cachedTime).toBeLessThan(performanceThresholds.cacheHit)

      const performanceImprovement = (uncachedTime - cachedTime) / uncachedTime
      console.log(`Uncached: ${uncachedTime}ms, Cached: ${cachedTime}ms`)
      console.log(`Performance improvement: ${(performanceImprovement * 100).toFixed(1)}%`)

      expect(performanceImprovement).toBeGreaterThan(0.5) // At least 50% improvement
    })

    it('should handle memory usage efficiently during large batch operations', async () => {
      const largeBatchSize = 100
      const requests: DialogueRequest[] = Array.from({ length: largeBatchSize }, (_, i) => ({
        characterId: `memory_npc_${i}`,
        playerId: 'memory_test_player',
        context: `Memory efficiency test ${i}`,
        dialogueType: 'response'
      }))

      const initialMemory = process.memoryUsage()

      // Process in smaller batches to prevent memory issues
      const batchSize = 20
      const batches: DialogueRequest[][] = []

      for (let i = 0; i < requests.length; i += batchSize) {
        batches.push(requests.slice(i, i + batchSize))
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const promises = batch.map(req => dialogueService.generateDialogue(req))
        await Promise.all(promises)

        // Allow garbage collection between batches
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 100MB for 100 requests)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)

      console.log(`Memory increase for ${largeBatchSize} requests: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })
  })

  describe('Scalability Tests', () => {
    it('should scale linearly with request count', async () => {
      const scalabilityTests = [5, 10, 20]
      const results: { requests: number; time: number }[] = []

      for (const requestCount of scalabilityTests) {
        const requests: DialogueRequest[] = Array.from({ length: requestCount }, (_, i) => ({
          characterId: `scale_npc_${i}`,
          playerId: 'scale_player',
          context: `Scalability test ${i}`,
          dialogueType: 'greeting'
        }))

        const startTime = Date.now()
        const promises = requests.map(req => dialogueService.generateDialogue(req))
        await Promise.all(promises)
        const endTime = Date.now()

        const totalTime = endTime - startTime
        const avgTimePerRequest = totalTime / requestCount

        results.push({ requests: requestCount, time: avgTimePerRequest })
        console.log(`${requestCount} requests: ${avgTimePerRequest.toFixed(2)}ms avg per request`)

        // Average time per request shouldn't increase significantly
        if (results.length > 1) {
          const previousAvg = results[results.length - 2].time
          const currentAvg = results[results.length - 1].time
          const increaseRatio = currentAvg / previousAvg

          // Should not increase by more than 50%
          expect(increaseRatio).toBeLessThan(1.5)
        }
      }

      // Verify linear scaling
      const maxAvgTime = Math.max(...results.map(r => r.time))
      expect(maxAvgTime).toBeLessThan(3000) // Even for 20 requests, avg should be under 3s
    })

    it('should handle different request patterns efficiently', async () => {
      const requestPatterns = {
        sequential: 'One request at a time',
        parallel: 'All requests at once',
        mixed: 'Mix of sequential and parallel'
      }

      const requests: DialogueRequest[] = Array.from({ length: 15 }, (_, i) => ({
        characterId: `pattern_npc_${i}`,
        playerId: 'pattern_player',
        context: `Pattern test ${i}`,
        dialogueType: 'response'
      }))

      // Sequential pattern
      const sequentialStart = Date.now()
      for (const request of requests) {
        await dialogueService.generateDialogue(request)
      }
      const sequentialTime = Date.now() - sequentialStart

      // Parallel pattern
      const parallelStart = Date.now()
      const parallelPromises = requests.map(req => dialogueService.generateDialogue(req))
      await Promise.all(parallelPromises)
      const parallelTime = Date.now() - parallelStart

      // Mixed pattern (3 batches of 5)
      const mixedStart = Date.now()
      for (let i = 0; i < 3; i++) {
        const batch = requests.slice(i * 5, (i + 1) * 5)
        const batchPromises = batch.map(req => dialogueService.generateDialogue(req))
        await Promise.all(batchPromises)
      }
      const mixedTime = Date.now() - mixedStart

      console.log(`Sequential: ${sequentialTime}ms`)
      console.log(`Parallel: ${parallelTime}ms`)
      console.log(`Mixed: ${mixedTime}ms`)

      // Parallel should be fastest
      expect(parallelTime).toBeLessThan(sequentialTime)
      expect(parallelTime).toBeLessThan(mixedTime)
    })
  })

  describe('Cache Performance Validation', () => {
    it('should achieve high cache hit rates for repeated requests', async () => {
      const cacheTestRounds = 20
      const uniqueRequests = 5 // Reuse same 5 requests multiple times

      const requests: DialogueRequest[] = Array.from({ length: uniqueRequests }, (_, i) => ({
        characterId: `cache_npc_${i}`,
        playerId: 'cache_player',
        context: `Cache test request ${i}`,
        dialogueType: 'greeting'
      }))

      // First pass to populate cache
      for (const request of requests) {
        const response = await dialogueService.generateDialogue(request)
        await cacheService.set(request, response)
      }

      // Multiple passes to test cache hits
      let totalCacheHits = 0

      for (let round = 0; round < cacheTestRounds; round++) {
        for (const request of requests) {
          const cached = await cacheService.get(request)
          if (cached) {
            totalCacheHits++
          } else {
            // Regenerate and cache
            const response = await dialogueService.generateDialogue(request)
            await cacheService.set(request, response)
          }
        }
      }

      const totalRequests = cacheTestRounds * uniqueRequests
      const hitRate = totalCacheHits / totalRequests

      expect(hitRate).toBeGreaterThan(0.9) // Should achieve >90% hit rate

      const stats = cacheService.getCacheStats()
      expect(stats.hitRate).toBeGreaterThan(0.9)

      console.log(`Cache hit rate: ${(hitRate * 100).toFixed(1)}%`)
      console.log(`Total cache hits: ${totalCacheHits} / ${totalRequests}`)
    })

    it('should maintain cache performance under load', async () => {
      const cacheLoadTest = {
        totalRequests: 100,
        uniqueRequests: 10,
        expectedHitRate: 0.8
      }

      const uniqueRequests: DialogueRequest[] = Array.from({ length: cacheLoadTest.uniqueRequests }, (_, i) => ({
        characterId: `load_cache_npc_${i}`,
        playerId: 'load_player',
        context: `Load cache test ${i}`,
        dialogueType: 'greeting'
      }))

      // Populate cache
      for (const request of uniqueRequests) {
        const response = await dialogueService.generateDialogue(request)
        await cacheService.set(request, response)
      }

      // Load test with repeated requests
      const startTime = Date.now()
      let cacheHits = 0

      for (let i = 0; i < cacheLoadTest.totalRequests; i++) {
        const request = uniqueRequests[i % cacheLoadTest.uniqueRequests]
        const cached = await cacheService.get(request)

        if (cached) {
          cacheHits++
        } else {
          await dialogueService.generateDialogue(request)
        }
      }

      const totalTime = Date.now() - startTime
      const hitRate = cacheHits / cacheLoadTest.totalRequests
      const avgTimePerRequest = totalTime / cacheLoadTest.totalRequests

      expect(hitRate).toBeGreaterThan(cacheLoadTest.expectedHitRate)
      expect(avgTimePerRequest).toBeLessThan(500) // Should be very fast with cache hits

      console.log(`Load test hit rate: ${(hitRate * 100).toFixed(1)}%`)
      console.log(`Average time per request: ${avgTimePerRequest.toFixed(2)}ms`)
      console.log(`Total time: ${totalTime}ms`)
    })
  })

  afterAll(() => {
    // Clean up cache
    cacheService.clearCache()
  })
})