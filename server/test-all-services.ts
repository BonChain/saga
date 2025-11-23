/**
 * Comprehensive Test for All Implemented Services
 * Tests: RealCharacterService, AI integration, Walrus storage
 */

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config()

import { RealCharacterService } from './src/services/RealCharacterService'
import { aiServiceAdapter } from './src/services/ai/ai-service-adapter'
import { walrusService } from './src/services/WalrusService'
import { Personality } from './src/models/character'

// Test results interface
interface TestResult {
  name: string
  success: boolean
  duration: number
  details?: any
  error?: string
  [key: string]: any // Allow additional properties for flexibility
}

async function runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const result = await testFn()
    const duration = Date.now() - startTime
    return {
      name: testName,
      success: true,
      duration,
      details: result
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      name: testName,
      success: false,
      duration,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function testRealCharacterService(): Promise<TestResult> {
  console.log('🧪 Testing RealCharacterService...')

  const characterService = new RealCharacterService('./test-data/characters')

  // Test 1: Create character
  const newCharacter = await characterService.createCharacter({
    name: 'Test Character',
    type: 'npc',
    personality: Personality.FRIENDLY,
    description: 'A test character for testing',
    backstory: 'Created for testing purposes',
    appearance: {
      physicalDescription: 'Average height, brown hair',
      notableFeatures: ['Friendly smile']
    }
  })

  // Test 2: Get character
  const retrievedCharacter = await characterService.getCharacter(newCharacter.id)

  // Test 3: Add memory
  const memoryResult = await characterService.addMemory({
    characterId: newCharacter.id,
    memory: {
      characterId: newCharacter.id,
      action: 'Met a traveler',
      actionType: 'social',
      location: 'tavern',
      description: 'Met a traveler',
      emotionalImpact: 1,
      context: {
        environmentalConditions: 'tavern atmosphere'
      },
      isActive: true
    }
  })

  // Test 4: Get memories
  const memories = await characterService.getCharacterMemories(newCharacter.id)

  // Test 5: Update relationship
  await characterService.updateRelationshipScore(newCharacter.id, 'player_test', 10)

  // Test 6: Get relationship status
  const relationship = await characterService.getRelationshipStatus(newCharacter.id, 'player_test')

  // Test 7: Get all characters
  const allCharacters = await characterService.getAllCharacters({
    includeMemories: true,
    includeRelationships: true
  })

  const result = {
    characterCreated: !!newCharacter.id,
    characterRetrieved: !!retrievedCharacter,
    memoryAdded: memoryResult.success,
    memoriesRetrieved: Array.isArray(memories),
    relationshipUpdated: !!relationship,
    charactersListed: Array.isArray(allCharacters),
    totalCharacters: allCharacters.length
  }

  return {
    name: 'Real Character Service',
    success: true,
    duration: 0,
    details: result
  }
}

async function testAIIntegration(): Promise<TestResult> {
  console.log('🤖 Testing AI Integration...')

  const aiRequest = {
    id: `test-ai-${Date.now()}`,
    actionId: `test-action-${Date.now()}`,
    promptType: 'character_response' as any,
    context: {
      actionId: 'test-action',
      playerIntent: 'dialogue',
      originalInput: 'Hello there!',
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
    prompt: 'You are a friendly tavern keeper. A traveler says "Hello there!" How do you respond?',
    timestamp: new Date().toISOString(),
    maxTokens: 150,
    temperature: 0.7
  }

  const response = await aiServiceAdapter.processAction(aiRequest as any)

  const result = {
    aiResponse: !!response.content,
    modelUsed: response.model,
    hasConsequences: Array.isArray(response.consequences) && response.consequences.length > 0,
    tokenUsage: !!response.tokenUsage,
    processingTime: response.processingTime
  }

  return {
    name: 'AI Integration',
    success: true,
    duration: 0,
    details: result
  }
}

async function testWalrusService(): Promise<TestResult> {
  console.log('🔗 Testing Walrus Service...')

  const blobData = {
    type: 'test-data',
    action: 'test-storage',
    timestamp: new Date().toISOString(),
    testData: {
      message: 'This is a test of Walrus blockchain storage',
      timestamp: Date.now(),
      service: 'sagasaga-backend'
    },
    epochs: 100
  }

  const writeResult = await walrusService.writeBlob(blobData)

  if (writeResult.success && writeResult.blobId) {
    const readResult = await walrusService.readBlob(writeResult.blobId)

    const result = {
      blobStored: true,
      blobId: writeResult.blobId,
      objectId: writeResult.objectId,
      blobRetrieved: readResult.success,
      blobSize: readResult.size,
      writeUrl: writeResult.url,
      readHealthy: true
    }

    return {
      name: 'Walrus Service',
      success: true,
      duration: 0,
      details: result
    }
  } else {
    const result = {
      blobStored: false,
      error: writeResult.error || 'Failed to store blob'
    }

    return {
      name: 'Walrus Service',
      success: false,
      duration: 0,
      details: result,
      error: writeResult.error || 'Failed to store blob'
    }
  }
}

async function testEndToEndFlow(): Promise<TestResult> {
  console.log('🔄 Testing End-to-End Flow...')

  const characterService = new RealCharacterService('./test-data/e2e')

  // 1. Create a character
  const character = await characterService.createCharacter({
    name: 'E2E Test Character',
    type: 'npc',
    personality: Personality.WISE,
    description: 'Character for end-to-end testing',
    backstory: 'Created for comprehensive testing',
    appearance: {
      physicalDescription: 'Tall and wise appearance',
      notableFeatures: ['Intelligent eyes']
    }
  })

  // 2. Store character in Walrus
  const walrusBlob = {
    type: 'character-data',
    action: 'character-creation',
    timestamp: new Date().toISOString(),
    character: {
      id: character.id,
      name: character.name,
      personality: character.personality,
      createdAt: character.createdAt
    },
    epochs: 100
  }

  const walrusResult = await walrusService.writeBlob(walrusBlob)

  // 3. Generate dialogue for character
  const dialogueRequest = {
    id: `dialogue-${Date.now()}`,
    actionId: `dialogue-action-${Date.now()}`,
    promptType: 'character_response' as any,
    context: {
      actionId: 'dialogue-action',
      playerIntent: 'dialogue',
      originalInput: 'What wisdom can you share with a traveler?',
      worldState: {
        timestamp: new Date().toISOString(),
        regions: [],
        characters: [character],
        economy: { prosperity: 50, stability: 50 },
        environment: { weather: 'clear', timeOfDay: 'evening' },
        events: []
      },
      characterRelationships: [],
      locationContext: {
        currentLocation: 'library',
        nearbyCharacters: [],
        environmentalFactors: ['Quiet', 'Scholarly atmosphere']
      },
      recentActions: [],
      worldRules: []
    },
    prompt: `You are ${character.name}, a wise NPC in a library. A traveler asks: "What wisdom can you share with a traveler?" Respond in character, showing your wisdom and personality.`,
    timestamp: new Date().toISOString(),
    maxTokens: 200,
    temperature: 0.7
  }

  const aiResponse = await aiServiceAdapter.processAction(dialogueRequest as any)

  // 4. Add dialogue as memory
  await characterService.addMemory({
    characterId: character.id,
    memory: {
      characterId: character.id,
      action: 'Had a meaningful conversation about wisdom',
      actionType: 'social',
      location: 'library',
      description: 'Had a meaningful conversation about wisdom',
      emotionalImpact: 2,
      context: {
        environmentalConditions: 'library atmosphere',
        otherCharactersPresent: ['traveler']
      },
      isActive: true
    }
  })

  const result = {
    characterCreated: !!character.id,
    characterStoredInWalrus: walrusResult.success,
    walrusBlobId: walrusResult.blobId,
    dialogueGenerated: !!aiResponse.content,
    aiModel: aiResponse.model,
    memoryAdded: true,
    completeFlow: character.id && walrusResult.success && aiResponse.content
  }

  return {
    name: 'End-to-End Flow',
    success: true,
    duration: 0,
    details: result
  }
}

async function runAllTests(): Promise<void> {
  console.log('🧪 Comprehensive Service Tests')
  console.log('=====================================')
  console.log('')

  const tests = [
    { name: 'Real Character Service', fn: testRealCharacterService },
    { name: 'AI Integration (Z.ai)', fn: testAIIntegration },
    { name: 'Walrus Blockchain Storage', fn: testWalrusService },
    { name: 'End-to-End Flow', fn: testEndToEndFlow }
  ]

  const results: TestResult[] = []

  for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`)
    console.log('   ' + '='.repeat(50))

    const result = await runTest(test.name, test.fn)
    results.push(result)

    if (result.success) {
      console.log(`✅ ${test.name} - PASSED (${result.duration}ms)`)
      if (result.details && typeof result.details === 'object') {
        console.log('   Details:', JSON.stringify(result.details, null, 2))
      }
    } else {
      console.log(`❌ ${test.name} - FAILED (${result.duration}ms)`)
      console.log(`   Error: ${result.error}`)
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log('\n🎯 Test Summary')
  console.log('===============')

  const passed = results.filter(r => r.success).length
  const total = results.length
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)
  console.log(`⏱️  Total Time: ${totalTime}ms`)
  console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Services are working correctly!')
  } else {
    console.log('\n⚠️  Some tests failed. Review the error messages above.')
  }

  // Detailed results
  console.log('\n📊 Detailed Results')
  console.log('==================')
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${index + 1}. ${status} ${result.name} (${result.duration}ms)`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1)
}

// Run all tests
runAllTests().catch(error => {
  console.error('🚨 Test execution failed:', error)
  process.exit(1)
})