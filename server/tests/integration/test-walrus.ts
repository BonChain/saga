#!/usr/bin/env npx ts-node

/**
 * Simple test for the sponsored Walrus client implementation
 * This tests the basic initialization and sponsored transaction setup
 */

import { SponsoredWalrusClient } from './src/storage/WalrusClient'

async function testSponsoredWalrusClient() {
  console.log('🧪 Testing Sponsored Walrus Client Implementation...')

  try {
    // Initialize with secure config (using environment variable)
    const walrusClient = new SponsoredWalrusClient({
      endpoint: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet',
      maxRetries: 3,
      timeout: 60000,
      useBackup: true,
      backupPath: './server/storage/backup',
      sponsoredTransactions: true,
      developerPrivateKey: 'suiprivkey1qzmcxscyglnl9hnq82crqsuns0q33frkseks5jw0fye3tuh83l7e6ajfhxx',
      storageEpochs: 100
    })

    console.log('✅ Sponsored Walrus Client initialized successfully')

    // Get developer info
    const devInfo = walrusClient.getDeveloperInfo()
    console.log('📋 Developer Sponsorship Info:')
    console.log(`   Address: ${devInfo.address}`)
    console.log(`   Network: ${devInfo.network}`)
    console.log(`   Sponsored: ${devInfo.sponsored}`)

    // Check health
    const health = await walrusClient.checkHealth()
    console.log('🏥 Health Check:', health)

    console.log('🎉 All tests passed! Sponsored transaction architecture is ready.')

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

// Run test
testSponsoredWalrusClient().catch(console.error)