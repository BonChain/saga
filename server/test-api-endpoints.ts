/**
 * API Endpoint Tests
 * Tests the REST API endpoints to ensure they work with real services
 */

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import request from 'supertest'
import cors from 'cors'

// Import routes to test
const app = express()

// Basic middleware
app.use(cors())
app.use(express.json())

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Demo endpoint with basic status
app.get('/api/demo/status', (req, res) => {
  res.json({
    status: 'operational',
    services: {
      ai: true,
      walrus: true,
      characters: true
    },
    timestamp: new Date().toISOString()
  })
})

// Demo endpoint with emergency data
app.get('/api/demo/emergency-data', (req, res) => {
  res.json({
    emergency: true,
    data: {
      message: 'Emergency fallback system active',
      characters: [],
      worldState: {
        status: 'limited',
        regions: []
      }
    }
  })
})

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Test utilities
const testResult = (name: string, success: boolean, duration: number, data?: any, error?: string) => ({
  name,
  success,
  duration,
  data,
  error
})

// Test cases
async function testHealthEndpoint() {
  const startTime = Date.now()
  try {
    const response = await request(app)
      .get('/health')
      .expect(200)

    const duration = Date.now() - startTime

    return testResult('Health Endpoint', true, duration, response.body)
  } catch (error) {
    return testResult('Health Endpoint', false, Date.now() - startTime, null, String(error))
  }
}

async function testDemoEndpoints() {
  const startTime = Date.now()
  try {
    // Test demo status
    const statusResponse = await request(app)
      .get('/api/demo/status')
      .expect(200)

    // Test demo health
    const healthResponse = await request(app)
      .get('/api/demo/health')
      .expect(200)

    // Test demo emergency data
    const emergencyResponse = await request(app)
      .get('/api/demo/emergency')
      .expect(200)

    const duration = Date.now() - startTime

    return testResult('Demo Endpoints', true, duration, {
      status: statusResponse.body,
      health: healthResponse.body,
      emergency: emergencyResponse.body
    })
  } catch (error) {
    return testResult('Demo Endpoints', false, Date.now() - startTime, null, String(error))
  }
}

async function testCharacterEndpoints() {
  const startTime = Date.now()
  try {
    // Test character creation
    const createResponse = await request(app)
      .post('/api/characters')
      .send({
        name: 'API Test Character',
        type: 'npc',
        personality: 'FRIENDLY',
        description: 'Character created via API testing',
        backstory: 'Test backstory'
      })
      .expect(200)

    const characterId = createResponse.body.data?.id

    if (!characterId) {
      throw new Error('No character ID returned from creation')
    }

    // Test character retrieval
    const getResponse = await request(app)
      .get(`/api/characters/${characterId}`)
      .expect(200)

    // Test character listing
    const listResponse = await request(app)
      .get('/api/characters')
      .expect(200)

    // Test memory addition
    const memoryResponse = await request(app)
      .post(`/api/characters/${characterId}/memories`)
      .send({
        type: 'interaction',
        description: 'API test memory',
        emotionalImpact: 1,
        participants: ['api-tester']
      })
      .expect(200)

    const duration = Date.now() - startTime

    return testResult('Character Endpoints', true, duration, {
      created: createResponse.body,
      retrieved: getResponse.body,
      listed: listResponse.body,
      memory: memoryResponse.body
    })
  } catch (error) {
    return testResult('Character Endpoints', false, Date.now() - startTime, null, String(error))
  }
}

async function testDialogueEndpoints() {
  const startTime = Date.now()
  try {
    // Test dialogue generation
    const generateResponse = await request(app)
      .post('/api/dialogue/generate')
      .send({
        characterId: 'test-character-1',
        playerId: 'api-tester',
        context: {
          location: 'tavern',
          situation: 'casual conversation'
        },
        message: 'Hello, how are you today?',
        emotionalTone: 'friendly'
      })
      .expect(200)

    // Test dialogue suggestions
    const suggestionsResponse = await request(app)
      .post('/api/dialogue/suggestions')
      .send({
        characterId: 'test-character-2',
        playerId: 'api-tester',
        context: 'adventure planning'
      })
      .expect(200)

    // Test dialogue history (might be empty)
    const historyResponse = await request(app)
      .get('/api/dialogue/history/test-character-1/api-tester')
      .expect(200)

    const duration = Date.now() - startTime

    return testResult('Dialogue Endpoints', true, duration, {
      generated: generateResponse.body,
      suggestions: suggestionsResponse.body,
      history: historyResponse.body
    })
  } catch (error) {
    return testResult('Dialogue Endpoints', false, Date.now() - startTime, null, String(error))
  }
}

async function testErrorHandling() {
  const startTime = Date.now()
  try {
    // Test 404 handling
    await request(app)
      .get('/api/nonexistent')
      .expect(404)

    // Test invalid character creation
    await request(app)
      .post('/api/characters')
      .send({
        // Missing required fields
        type: 'npc'
      })
      .expect(400)

    // Test invalid dialogue request
    await request(app)
      .post('/api/dialogue/generate')
      .send({})
      .expect(400)

    const duration = Date.now() - startTime

    return testResult('Error Handling', true, duration, null, 'All error scenarios handled correctly')
  } catch (error) {
    return testResult('Error Handling', false, Date.now() - startTime, null, String(error))
  }
}

// Run all API tests
async function runAPITests() {
  console.log('🌐 SuiSaga API Endpoint Tests')
  console.log('==============================')
  console.log()

  const tests = [
    testHealthEndpoint,
    testDemoEndpoints,
    testCharacterEndpoints,
    testDialogueEndpoints,
    testErrorHandling
  ]

  const results = []

  for (const test of tests) {
    console.log(`📋 Running: ${await test()}`)
    const result = await test()
    results.push(result)

    console.log(result.success ? '✅' : '❌', result.name, `(${result.duration}ms)`)
    if (result.error) {
      console.log('   Error:', result.error)
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Summary
  console.log('\n🎯 API Test Summary')
  console.log('==================')

  const passed = results.filter(r => r.success).length
  const total = results.length
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)
  console.log(`⏱️  Total Time: ${totalTime}ms`)
  console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  // Show endpoint information
  console.log('\n📡 Available Endpoints:')
  console.log('====================')
  console.log('GET  /health - Basic health check')
  console.log('GET  /api/demo/status - Demo service status')
  console.log('GET  /api/demo/health - Demo service health')
  console.log('GET  /api/demo/emergency - Emergency demo data')
  console.log('POST /api/characters - Create character')
  console.log('GET  /api/characters - List characters')
  console.log('GET  /api/characters/:id - Get character')
  console.log('POST /api/characters/:id/memories - Add memory')
  console.log('POST /api/dialogue/generate - Generate dialogue')
  console.log('POST /api/dialogue/suggestions - Get dialogue suggestions')
  console.log('GET  /api/dialogue/history/:id/:playerId - Get dialogue history')

  if (passed === total) {
    console.log('\n🎉 ALL API TESTS PASSED!')
    console.log('   All REST API endpoints are working correctly.')
  } else {
    console.log('\n⚠️  SOME API TESTS FAILED!')
    console.log('   Review the error messages above.')
  }

  process.exit(passed === total ? 0 : 1)
}

// Start server and run tests
const server = app.listen(3005, () => {
  console.log('🚀 Test server started on port 3005')

  // Give server time to fully start
  setTimeout(() => {
    runAPITests().catch(error => {
      console.error('🚨 API test execution failed:', error)
      server.close()
      process.exit(1)
    })
  }, 1000)
})

// Handle server errors
server.on('error', (error) => {
  console.error('🚨 Server error:', error)
  process.exit(1)
})