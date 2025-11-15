#!/usr/bin/env npx ts-node

/**
 * Test sponsored transaction functionality with your private key
 */

import dotenv from 'dotenv'
dotenv.config() // Load environment variables

import { SponsoredWalrusClient } from './src/storage/WalrusClient'

async function testSponsorship() {
  console.log('🧪 Testing Sponsored Transaction with Your Private Key...')

  try {
    // Test with your actual private key from .env
    const walrusClient = new SponsoredWalrusClient({
      endpoint: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      maxRetries: 3,
      timeout: 60000,
      useBackup: true,
      backupPath: './server/storage/backup',
      sponsoredTransactions: true,
      developerPrivateKey: process.env.DEVELOPER_PRIVATE_KEY || '',
      storageEpochs: 100
    })

    console.log('✅ Walrus Client initialized with your private key')

    // Wait for initialization
    await walrusClient.waitForInitialization()

    // Check if ready
    if (!walrusClient.isReady()) {
      throw new Error('Client not ready')
    }

    // Get developer info
    const devInfo = walrusClient.getDeveloperInfo()
    console.log('📋 Developer Sponsorship Info:')
    console.log(`   Address: ${devInfo.address}`)
    console.log(`   Network: ${devInfo.network}`)
    console.log(`   Sponsored: ${devInfo.sponsored}`)
    console.log(`   Secure: ${devInfo.secure}`)

    // Test a small blob storage
    console.log('🧪 Testing blob storage with sponsorship...')

    const testData = {
      type: 'sui-saga-test',
      message: 'This is a sponsored transaction test',
      timestamp: new Date().toISOString(),
      developer: devInfo.address
    }

    const result = await walrusClient.store(testData, {
      source: 'sponsorship-test',
      version: '1.0.0'
    })

    if (result.success) {
      console.log('✅ SPONSORED TRANSACTION SUCCESS!')
      console.log(`   Blob ID: ${result.blobId}`)
      console.log(`   Verification URL: ${result.url}`)
      console.log(`   Developer Address: ${result.developerAddress}`)
      console.log(`   Checksum: ${result.checksum}`)

      // Test retrieval
      console.log('🔍 Testing blob retrieval...')
      const retrieveResult = await walrusClient.retrieve(result.blobId!)

      if (retrieveResult.success) {
        console.log('✅ RETRIEVAL SUCCESS!')
        console.log(`   Retrieved data: ${JSON.stringify(retrieveResult.data, null, 2)}`)
        console.log(`   Verification: ${retrieveResult.checksum === result.checksum ? '✅ MATCH' : '❌ MISMATCH'}`)
      } else {
        console.log('❌ RETRIEVAL FAILED:', retrieveResult.error)
      }
    } else {
      console.log('❌ SPONSORED TRANSACTION FAILED:', result.error)

      // Show backup storage result if available
      console.log('📁 Trying backup storage...')
      const backupResult = await walrusClient.storeToBackup(testData, 'test-backup')
      console.log('   Backup result:', backupResult.success ? '✅ SUCCESS' : '❌ FAILED')
    }

    console.log('🎉 Sponsorship test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')
    console.log('\n💡 This might be expected if:')
    console.log('   - Developer key needs WAL tokens')
    console.log('   - Network connection issues')
    console.log('   - Walrus testnet temporarily unavailable')
    console.log('   - Testnet rate limiting')

    // Show the loaded key info anyway
    if (process.env.DEVELOPER_PRIVATE_KEY) {
      console.log('\n🔑 Private key loaded from environment successfully')
    } else {
      console.log('\n❌ DEVELOPER_PRIVATE_KEY not found in environment')
    }
  }
}

// Run test
testSponsorship().catch(console.error)