/**
 * Test Z.ai API integration specifically
 */

import { aiServiceAdapter } from '../../src/services/ai/AIServiceAdapter'

async function testZaiAPI() {
  console.log('🤖 Testing Z.ai API Integration\n')

  try {
    // Test a simple AI request
    const request = {
      id: 'test-zai-request-' + Date.now(),
      actionId: 'test-action',
      promptType: 'consequence_generation' as any,
      prompt: 'Hello! This is a test message to verify Z.ai API connectivity.',
      maxTokens: 100,
      temperature: 0.7
    }

    console.log('📤 Sending test request to Z.ai...')
    const response = await aiServiceAdapter.processAction(request)

    console.log('✅ Z.ai API Response Received:')
    console.log(`  - Success: ${response.success}`)
    console.log(`  - Model: ${response.model}`)
    console.log(`  - Processing Time: ${response.processingTime}ms`)
    console.log(`  - Content Length: ${response.content?.length || 0} characters`)
    console.log(`  - Token Usage: ${response.tokenUsage?.totalTokens || 0} tokens`)

    if (response.consequences && response.consequences.length > 0) {
      console.log(`  - Consequences Generated: ${response.consequences.length}`)
      response.consequences.forEach((conseq, i) => {
        console.log(`    ${i + 1}. ${conseq.description}`)
      })
    }

    if (response.success) {
      console.log('\n🎉 Z.ai API integration is working perfectly!')
    } else {
      console.log('\n⚠️ Z.ai API request completed but with errors:')
      console.log(`  Error: ${response.error?.message}`)
    }

  } catch (error) {
    console.error('❌ Z.ai API integration test failed:', error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testZaiAPI()
}

export { testZaiAPI }