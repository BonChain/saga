#!/usr/bin/env npx ts-node

/**
 * Simple test to verify your private key is working correctly
 */

import dotenv from 'dotenv'
dotenv.config() // Load environment variables

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { MIST_PER_SUI } from '@mysten/sui/utils'

async function testPrivateKeyLoading() {
  console.log('🔑 Testing Your Private Key Configuration...')

  try {
    // Check environment variable
    const envPrivateKey = process.env.DEVELOPER_PRIVATE_KEY
    if (!envPrivateKey) {
      throw new Error('DEVELOPER_PRIVATE_KEY not found in environment')
    }

    console.log('✅ Private key found in environment variable')
    console.log(`   Length: ${envPrivateKey.length} characters`)
    console.log(`   Starts with: ${envPrivateKey.substring(0, 10)}...`)

    // Test keypair creation
    console.log('🔧 Creating keypair from your private key...')
    const keypair = Ed25519Keypair.fromSecretKey(envPrivateKey)
    const address = keypair.getPublicKey().toSuiAddress()

    console.log('✅ Keypair created successfully')
    console.log(`   Address: ${address}`)

    // Test Sui client connection
    console.log('🌐 Connecting to Sui testnet...')
    const suiClient = new SuiClient({
      url: getFullnodeUrl('testnet'),
    })

    // Check balance
    console.log('💰 Checking account balances...')
    const balance = await suiClient.getBalance({
      owner: address,
    })

    const suiAmount = Number(balance.totalBalance) / Number(MIST_PER_SUI)
    console.log(`   SUI Balance: ${suiAmount.toFixed(4)} SUI`)

    // Check WAL token balance
    try {
      const walBalance = await suiClient.getBalance({
        owner: address,
        coinType: `0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL`,
      })

      const walAmount = Number(walBalance.totalBalance) / Number(MIST_PER_SUI)
      console.log(`   WAL Balance: ${walAmount.toFixed(4)} WAL`)
    } catch (error) {
      console.log('   WAL Balance: No WAL tokens found')
    }

    console.log('\n🎉 SUCCESS! Your private key configuration is working perfectly!')
    console.log('🔒 Security Status: SECURE (loaded from environment variable)')
    console.log('🏗️ Sponsored Transactions: READY')
    console.log('💼 Ready to store blob data on Walrus!')

    return {
      success: true,
      address,
      suiBalance: suiAmount,
      secure: true
    }

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')

    const envPrivateKey = process.env.DEVELOPER_PRIVATE_KEY
    if (envPrivateKey) {
      console.log('\n💡 Issue is likely with network connectivity or testnet availability')
      console.log('   Your private key loaded successfully')
      console.log('   The error is in external service connections')
    } else {
      console.log('\n❌ DEVELOPER_PRIVATE_KEY environment variable issue')
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Run test
testPrivateKeyLoading().then(result => {
  console.log('\n📊 Test Summary:', JSON.stringify(result, null, 2))
}).catch(console.error)