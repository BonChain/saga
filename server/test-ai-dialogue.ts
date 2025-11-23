/**
 * Test AI Dialogue Integration
 * Quick test to verify Z.ai integration is working
 */

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config()

import { aiServiceAdapter } from './src/services/ai/ai-service-adapter'

async function testAIDialogue() {
  console.log('🧪 Testing AI Dialogue Integration with Z.ai')
  console.log('=====================================')

  try {
    // Initialize the AI service
    console.log('Initializing AI service adapter...')

    // Test basic AI request
    const testRequest = {
      id: 'test-dialogue-1',
      actionId: 'test-action-1',
      promptType: 'character_response' as any,
      context: {
        actionId: 'test-action-1',
        playerIntent: 'dialogue',
        originalInput: 'Hello, how are you?',
        worldState: {
          timestamp: new Date().toISOString(),
          regions: [],
          characters: [],
          economy: { prosperity: 50, stability: 50 },
          environment: { weather: 'clear', timeOfDay: 'day' },
          events: []
        },
        characterRelationships: [],
        locationContext: {
          currentLocation: 'tavern',
          nearbyCharacters: [],
          environmentalFactors: []
        },
        recentActions: [],
        worldRules: []
      },
      prompt: 'You are a friendly tavern keeper. A player walks in and says "Hello, how are you?". Respond as the character, keeping in character with your personality.',
      timestamp: new Date().toISOString(),
      maxTokens: 100,
      temperature: 0.7
    }

    console.log('Sending test request to AI service...')
    const response = await aiServiceAdapter.processAction(testRequest as any)

    console.log('✅ AI Response received:')
    console.log(`   Content: ${response.content}`)
    console.log(`   Model: ${response.model}`)
    console.log(`   Processing Time: ${response.processingTime}ms`)

    if (response.consequences && response.consequences.length > 0) {
      console.log(`   Consequences: ${response.consequences.length} generated`)
    }

    console.log('\n🎉 AI Dialogue Integration Test PASSED!')
    return true

  } catch (error) {
    console.error('❌ AI Dialogue Integration Test FAILED:')
    console.error('   Error:', error instanceof Error ? error.message : error)
    return false
  }
}

// Run the test
testAIDialogue().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test execution error:', error)
  process.exit(1)
})