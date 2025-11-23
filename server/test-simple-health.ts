/**
 * Simple Health Check Test
 * Basic validation that environment and services are working
 */

// Load environment variables (try multiple methods)
import * as dotenv from 'dotenv'
console.log('Loading environment variables...')

// Try loading .env from multiple locations
try { dotenv.config({ path: '.env' }) } catch (e) { console.log('  .env file not found, trying parent directory') }
try { dotenv.config({ path: '../.env' }) } catch (e) { console.log('  ../.env file not found') }

// Add delay for environment loading
await new Promise(resolve => setTimeout(resolve, 500))

console.log('After loading environment:')
console.log('  ZAI_API_KEY exists:', !!process.env.ZAI_API_KEY)
console.log('  DEVELOPER_PRIVATE_KEY exists:', !!process.env.DEVELOPER_PRIVATE_KEY)
console.log('  ZAI_MODEL:', process.env.ZAI_MODEL)
console.log('  AI_PROVIDER:', process.env.AI_PROVIDER)

function testSimpleHealth() {
  console.log('🔧 Simple Health Check')
  console.log('==================')
  console.log()

  // Test 1: Environment Variables
  console.log('📋 Testing Environment Variables...')
  const requiredVars = ['SUI_NETWORK', 'DEVELOPERPER_PRIVATE_KEY', 'ZAI_API_KEY', 'ZAI_MODEL', 'AI_PROVIDER']
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

  // Test 2: Basic Services Import
  console.log('\n🛠️ Testing Service Imports...')
  try {
    const { walrusService } = await import('./src/services/WalrusService')
    console.log('✅ Walrus Service: Available')
  } catch (error) {
    console.log('❌ Walrus Service Error:', error instanceof Error ? error.message : error)
    envValid = false
  }

  try {
    const { aiServiceAdapter } = await import('./src/services/ai/ai-service-adapter')
    console.log('✅ AI Service Adapter: Available')
  } catch (error) {
    console.log('❌ AI Service Error:', error instanceof Error ? error.message : error)
    envValid = false
  }

  try {
    const { RealCharacterService } = await import('./src/services/RealCharacterService')
    console.log('✅ Character Service: Available')
  } catch (error) {
    console.log('❌ Character Service Error:', error instanceof Error ? error.message : error)
    envValid = false
  }

  // Test 3: Z.ai API Key Format
  const zaiKey = process.env.ZAI_API_KEY
  const zaiValid = zaiKey && zaiKey.length > 20 && !zaiKey.includes('your_')

  console.log('\n🤖 Z.ai Configuration')
  console.log(`   API Key: ${zaiValid ? '✅ Valid format' : '❌ Invalid or missing'}`)
  console.log(`   Model: ${process.env.ZAI_MODEL || 'not set'}`)
  console.log(`   Provider: ${process.env.AI_PROVIDER || 'not set'}`)

  // Test 4: Private Key Format
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

  return envValid && zaiValid && keyValid
}

// Run simple health check
testSimpleHealth()
  .then(success => {
    if (success) {
      console.log('\n🎉 Simple Health Check PASSED!')
      console.log('   All critical components are properly configured.')
    } else {
      console.log('\n⚠️ Simple Health Check FAILED!')
      console.log('   Fix the issues above before proceeding.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('🚨 Health check execution failed:', error)
    process.exit(1)
  })