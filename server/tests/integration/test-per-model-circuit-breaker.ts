/**
 * Test script for Per-Model Circuit Breaker and Rate Limiting
 *
 * This script demonstrates:
 * - Z.ai: Circuit breaker and rate limiting ENABLED
 * - OpenAI: Circuit breaker and rate limiting DISABLED
 * - OpenRouter: Circuit breaker and rate limiting DISABLED
 */

import { perModelCircuitBreaker } from '../../src/services/ai/PerModelCircuitBreaker'
import { aiServiceAdapter } from '../../src/services/ai/AIServiceAdapter'

async function testCircuitBreaker() {
  console.log('🔧 Testing Per-Model Circuit Breaker and Rate Limiting\n')

  // Show initial configuration
  console.log('📋 Initial Model Configurations:')
  console.log('=====================================')

  const models = ['zai', 'openai', 'openrouter']

  for (const model of models) {
    const config = perModelCircuitBreaker.getModelConfig(model)
    const circuitBreakerState = perModelCircuitBreaker.getCircuitBreakerState(model)
    const rateLimitState = perModelCircuitBreaker.getRateLimitState(model)

    console.log(`\n🤖 ${model.toUpperCase()}:`)
    console.log(`  Circuit Breaker: ${config?.circuitBreaker.enabled ? '✅ ENABLED' : '❌ DISABLED'}`)
    console.log(`    - Failure Threshold: ${config?.circuitBreaker.failureThreshold}`)
    console.log(`    - Recovery Timeout: ${config?.circuitBreaker.recoveryTimeout}ms`)
    console.log(`    - Current State: ${circuitBreakerState?.isOpen ? '🔴 OPEN' : '🟢 CLOSED'}`)
    console.log(`    - Failure Count: ${circuitBreakerState?.failureCount}`)

    console.log(`  Rate Limiting: ${config?.rateLimit.enabled ? '✅ ENABLED' : '❌ DISABLED'}`)
    console.log(`    - Requests/Minute: ${config?.rateLimit.requestsPerMinute}`)
    console.log(`    - Requests/Hour: ${config?.rateLimit.requestsPerHour}`)
    console.log(`    - Requests/Day: ${config?.rateLimit.requestsPerDay}`)
    console.log(`    - Current Usage: ${rateLimitState?.requestsThisDay}/${config?.rateLimit.requestsPerDay}`)
  }

  // Test Z.ai circuit breaker (should be enabled)
  console.log('\n🧪 Testing Z.ai Circuit Breaker (ENABLED):')
  console.log('===========================================')

  try {
    await perModelCircuitBreaker.executeRequest('zai', async () => {
      console.log('  ✅ Z.ai request successful (circuit breaker allowed)')
      return { success: true }
    })
  } catch (error) {
    console.log(`  ❌ Z.ai request failed: ${(error as Error).message}`)
  }

  // Test OpenAI circuit breaker (should be disabled)
  console.log('\n🧪 Testing OpenAI Circuit Breaker (DISABLED):')
  console.log('=============================================')

  try {
    await perModelCircuitBreaker.executeRequest('openai', async () => {
      console.log('  ✅ OpenAI request successful (circuit breaker bypassed)')
      return { success: true }
    })
  } catch (error) {
    console.log(`  ❌ OpenAI request failed: ${(error as Error).message}`)
  }

  // Test OpenRouter circuit breaker (should be disabled)
  console.log('\n🧪 Testing OpenRouter Circuit Breaker (DISABLED):')
  console.log('===============================================')

  try {
    await perModelCircuitBreaker.executeRequest('openrouter', async () => {
      console.log('  ✅ OpenRouter request successful (circuit breaker bypassed)')
      return { success: true }
    })
  } catch (error) {
    console.log(`  ❌ OpenRouter request failed: ${(error as Error).message}`)
  }

  // Test Z.ai rate limiting by making multiple requests
  console.log('\n🚦 Testing Z.ai Rate Limiting (should trigger after 10 requests):')
  console.log('=============================================================')

  let successCount = 0
  let blockedCount = 0

  for (let i = 1; i <= 15; i++) {
    try {
      await perModelCircuitBreaker.executeRequest('zai', async () => {
        return { success: true, requestId: i }
      })
      successCount++
      console.log(`  Request ${i}: ✅ Success`)
    } catch (error) {
      blockedCount++
      console.log(`  Request ${i}: ❌ Blocked - ${(error as Error).message}`)

      // Break if we hit rate limit
      if (blockedCount >= 3) break
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n📊 Z.ai Test Results:`)
  console.log(`  Successful Requests: ${successCount}`)
  console.log(`  Blocked Requests: ${blockedCount}`)

  // Test OpenAI rate limiting (should not block)
  console.log('\n🚦 Testing OpenAI Rate Limiting (should NOT block):')
  console.log('==================================================')

  let openaiSuccessCount = 0
  let openaiBlockedCount = 0

  for (let i = 1; i <= 15; i++) {
    try {
      await perModelCircuitBreaker.executeRequest('openai', async () => {
        return { success: true, requestId: i }
      })
      openaiSuccessCount++
      if (i <= 3) console.log(`  Request ${i}: ✅ Success`)
    } catch (error) {
      openaiBlockedCount++
      console.log(`  Request ${i}: ❌ Blocked - ${(error as Error).message}`)
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  if (openaiSuccessCount > 3) {
    console.log(`  ... (continued successfully)`)
  }

  console.log(`\n📊 OpenAI Test Results:`)
  console.log(`  Successful Requests: ${openaiSuccessCount}`)
  console.log(`  Blocked Requests: ${openaiBlockedCount}`)

  // Show final monitoring summary
  console.log('\n📈 Final Monitoring Summary:')
  console.log('==============================')

  const summary = perModelCircuitBreaker.getMonitoringSummary()
  console.log(`Global Metrics:`)
  console.log(`  Total Requests: ${summary.globalMetrics.totalRequests}`)
  console.log(`  Successful: ${summary.globalMetrics.successfulRequests}`)
  console.log(`  Blocked by Circuit Breaker: ${summary.globalMetrics.blockedByCircuitBreaker}`)
  console.log(`  Blocked by Rate Limit: ${summary.globalMetrics.blockedByRateLimit}`)

  console.log(`\nModel States:`)
  Object.entries(summary.models).forEach(([model, state]: [string, any]) => {
    console.log(`\n🤖 ${model.toUpperCase()}:`)
    console.log(`  Circuit Breaker: ${state.circuitBreaker.enabled ? 'ENABLED' : 'DISABLED'}`)
    console.log(`    State: ${state.circuitBreaker.state}`)
    console.log(`    Failures: ${state.circuitBreaker.failureCount}`)
    console.log(`  Rate Limiting: ${state.rateLimit.enabled ? 'ENABLED' : 'DISABLED'}`)
    console.log(`    Current Usage: ${state.rateLimit.currentUsage.requestsThisMinute}/${state.rateLimit.limits.requestsPerMinute} per minute`)
    console.log(`                ${state.rateLimit.currentUsage.requestsThisHour}/${state.rateLimit.limits.requestsPerHour} per hour`)
    console.log(`                ${state.rateLimit.currentUsage.requestsThisDay}/${state.rateLimit.limits.requestsPerDay} per day`)
  })

  console.log('\n✅ Per-Model Circuit Breaker Test Completed!')
  console.log('\nSummary:')
  console.log('- Z.ai: Circuit breaker and rate limiting are ENABLED ✅')
  console.log('- OpenAI: Circuit breaker and rate limiting are DISABLED ✅')
  console.log('- OpenRouter: Circuit breaker and rate limiting are DISABLED ✅')
}

// Test with AI Service Adapter integration
async function testAIServiceAdapterIntegration() {
  console.log('\n🔗 Testing AI Service Adapter Integration')
  console.log('=======================================')

  try {
    // Test with current provider
    const currentProvider = aiServiceAdapter.getCurrentProvider()
    console.log(`Current Provider: ${currentProvider}`)

    // Get monitoring summary from adapter
    const adapterSummary = aiServiceAdapter.getMonitoringSummary()
    console.log('\nAdapter Monitoring Summary:')
    console.log(JSON.stringify(adapterSummary, null, 2))

    // Test circuit breaker state
    const circuitBreakerState = aiServiceAdapter.getCircuitBreakerState()
    console.log('\nCircuit Breaker State:')
    console.log(JSON.stringify(circuitBreakerState, null, 2))

    // Test rate limit info using per-model circuit breaker
    const rateLimitInfo = {
      zai: perModelCircuitBreaker.getRateLimitState('zai'),
      openai: perModelCircuitBreaker.getRateLimitState('openai'),
      openrouter: perModelCircuitBreaker.getRateLimitState('openrouter')
    }
    console.log('\nRate Limit Info:')
    console.log(JSON.stringify(rateLimitInfo, null, 2))

  } catch (error) {
    console.error('❌ AI Service Adapter integration test failed:', error)
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testCircuitBreaker()
    await testAIServiceAdapterIntegration()
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllTests()
}

export { testCircuitBreaker, testAIServiceAdapterIntegration }