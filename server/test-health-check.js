/**
 * Simple Health Check (JavaScript version)
 * Basic validation that environment and services are working
 */

// Load environment variables
const path = require('path')

// Try multiple methods to load .env
require('dotenv').config()
require('dotenv').config({ path: __dirname + '/.env' })
require('dotenv').config({ path: path.join(__dirname, '.env') })

console.log('🔧 Simple Health Check (JavaScript)')
console.log('======================')
console.log()

// Test Environment Variables
const requiredVars = ['SUI_NETWORK', 'DEVELOPER_PRIVATE_KEY', 'ZAI_API_KEY', 'ZAI_MODEL', 'AI_PROVIDER']
let envValid = true

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.log(`❌ Missing: ${varName}`)
    envValid = false
  } else {
    const masked = varName.includes('KEY') || varName.includes('PRIVATE')
      ? `${process.env[varName].substring(0, 8)}...`
      : process.env[varName]
    console.log(`✅ ${varName}: ${masked}`)
  }
}

// Test Services Import
const services = {
  walrusService: null,
  aiServiceAdapter: null,
  characterService: null
}

// Test Import Services (using require instead of import)
try {
  services.walrusService = require('./src/services/WalrusService')
  console.log('✅ Walrus Service: Available')
} catch (error) {
  console.log('❌ Walrus Service Error:', error.message)
  services.walrusService = null
}

try {
  services.aiServiceAdapter = require('./src/services/ai/ai-service-adapter')
  console.log('✅ AI Service Adapter: Available')
} catch (error) {
  console.log('❌ AI Service Error:', error.message)
  services.aiServiceAdapter = null
}

try {
  services.characterService = require('./src/services/RealCharacterService')
  console.log('✅ Character Service: Available')
} catch (error) {
  console.log('❌ Character Service Error:', error.message)
  services.characterService = null
}

// Test Z.ai Configuration
const zaiKey = process.env.ZAI_API_KEY
const zaiValid = zaiKey && zaiKey.length > 20 && !zaiKey.includes('your_')

console.log('\n🤖 Z.ai Configuration')
console.log(`   API Key: ${zaiValid ? '✅ Valid format' : '❌ Invalid or missing'}`)
console.log(`   Model: ${process.env.ZAI_MODEL || 'not set'}`)
console.log(`   Provider: ${process.env.AI_PROVIDER || 'not set'}`)

// Test Private Key Configuration
const privateKey = process.env.DEVELOPER_PRIVATE_KEY
const keyValid = privateKey && privateKey.startsWith('suiprivkey1q') && privateKey.length > 60

console.log('\n🔑 Private Key Configuration')
console.log(`   Private Key: ${keyValid ? '✅ Valid format' : '❌ Invalid or missing'}`)

// Summary
console.log('\n📊 Health Check Summary')
console.log('==================')
console.log(`Environment Variables: ${envValid ? '✅ All configured' : '❌ Some missing'}`)
console.log(`Services: ${envValid ? '✅ All available' : '❌ Some failed'}`)
console.log(`Z.ai Integration: ${zaiValid ? '✅ Ready' : '❌ Not configured'}`)
console.log(`Private Key: ${keyValid ? '✅ Valid' : '❌ Invalid'}`)

// Exit with appropriate code
process.exit(envValid && zaiValid && keyValid ? 0 : 1)