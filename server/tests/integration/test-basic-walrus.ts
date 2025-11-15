#!/usr/bin/env npx ts-node

/**
 * Basic Walrus Test - Debug connectivity issues
 */

import dotenv from 'dotenv'
dotenv.config()

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { walrus } from '@mysten/walrus'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

async function testBasicWalrus() {
  console.log('🔍 Basic Walrus Connectivity Test')
  console.log('')

  try {
    // Test 1: Basic SuiClient without Walrus extension
    console.log('📡 Test 1: Basic SuiClient connection...')
    const basicClient = new SuiClient({
      url: getFullnodeUrl('testnet'),
    })

    console.log('✅ Basic SuiClient created')

    // Test 2: Try to get some basic info
    console.log('📊 Test 2: Getting protocol info...')
    try {
      const protocolInfo = await basicClient.getChainIdentifier()
      console.log('✅ Chain info:', protocolInfo)
    } catch (error) {
      console.log('⚠️  Chain info failed:', error)
    }

    // Test 3: Get your account info
    const privateKey = process.env.DEVELOPER_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('No private key')
    }

    const keypair = Ed25519Keypair.fromSecretKey(privateKey)
    const address = keypair.getPublicKey().toSuiAddress()
    console.log('🔑 Keypair loaded for address:', address)

    try {
      const balance = await basicClient.getBalance({ owner: address })
      console.log('💰 Balance:', Number(balance.totalBalance) / 1000000000, 'SUI')
    } catch (error) {
      console.log('⚠️  Balance check failed:', error)
    }

    // Test 4: Try Walrus extension with minimal config
    console.log('')
    console.log('🔧 Test 4: Walrus extension (minimal config)...')

    try {
      const walrusClient = new SuiClient({
        url: getFullnodeUrl('testnet'),
        network: 'testnet', // Required for Walrus extension!
      }).$extend(walrus())

      console.log('✅ SuiClient with Walrus extension created')

      // Test 5: Try to get Walrus capabilities
      console.log('🔍 Test 5: Walrus capabilities...')

      // Check if walrus extension is properly loaded
      if (typeof (walrusClient as any).walrus === 'object') {
        console.log('✅ Walrus extension loaded')

        // Try a basic walrus call - just see if the method exists
        if (typeof (walrusClient as any).walrus.writeBlob === 'function') {
          console.log('✅ writeBlob method available')
        } else {
          console.log('❌ writeBlob method not available')
        }

        if (typeof (walrusClient as any).walrus.readBlob === 'function') {
          console.log('✅ readBlob method available')
        } else {
          console.log('❌ readBlob method not available')
        }

      } else {
        console.log('❌ Walrus extension not loaded')
        console.log('   Available properties:', Object.keys(walrusClient as any))
      }

    } catch (error) {
      console.log('❌ Walrus extension failed:', error)
      console.log('   Error type:', error.constructor.name)
    }

    console.log('')
    console.log('🎯 Basic test completed!')
    console.log('💡 Next steps:')
    console.log('   • If basic SuiClient works but Walrus fails, issue is with Walrus extension')
    console.log('   • Try with minimal Walrus config')
    console.log('   • Check Walrus testnet status')

  } catch (error) {
    console.error('❌ Basic test failed:', error)
    console.log('   Error:', error)
    console.log('   Stack:', error instanceof Error ? error.stack : 'No stack available')
  }
}

// Run the test
testBasicWalrus().catch(console.error)