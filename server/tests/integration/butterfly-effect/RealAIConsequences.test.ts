/**
 * Real AI Consequences Test (Minimal)
 *
 * This test focuses specifically on testing the ConsequenceGenerator
 * with real AI responses to validate the AI → Consequence flow.
 */

import { ConsequenceGenerator } from '../../../src/services/ConsequenceGenerator'
import { AIRequest } from '../../../src/types/ai'
import { v4 as uuidv4 } from 'uuid'

// Check for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

describe('Real AI Consequence Generation', () => {
  let consequenceGenerator: ConsequenceGenerator

  beforeAll(() => {
    // Initialize with minimal configuration
    consequenceGenerator = new ConsequenceGenerator({} as any)

    if (!OPENAI_API_KEY) {
      console.warn('\n⚠️  OPENAI_API_KEY not configured')
      console.log('To run real AI tests:')
      console.log('1. Get an API key from https://platform.openai.com/api-keys')
      console.log('2. Add it to your .env file: OPENAI_API_KEY=sk-your-key-here')
      console.log('3. Restart and run tests again')
    } else {
      console.log('✅ OpenAI API key found')
    }
  })

  const realAIResponses = [
    {
      name: 'Dragon Victory',
      response: `The dragon's final roar echoes through the valley as it falls to your sword. Villagers emerge cheering, their faces filled with hope. The dragon's hoard reveals ancient artifacts and gold. The forest begins to heal from the dragon's corruption. Your name becomes legend throughout the realm. Blacksmiths request dragon scales for armor. Children will tell stories of your bravery for generations.`,
      expectedConsequences: ['relationship', 'economic', 'environment', 'character', 'exploration']
    },
    {
      name: 'Magical Discovery',
      response: `Your fingers trace glowing runes on the ancient stone tablet. Mystical energy pulses through the chamber, flowing into your veins. Forgotten magic awakens within you, granting new abilities. Spirits of ancient guardians acknowledge your worth. Hidden chambers open, revealing artifacts of immense power. Your reputation as a true adventurer spreads to distant lands.`,
      expectedConsequences: ['character', 'exploration', 'world_state', 'relationship']
    },
    {
      name: 'Trade Success',
      response: `Your persuasive speech sways the merchant council. Trade agreements bring prosperity to the region. Grateful merchants establish new routes to your village. Your reputation as a skilled negotiator reaches distant lands. Other rulers seek your wisdom for diplomatic matters. The local economy flourishes under new trade policies, creating opportunities for everyone.`,
      expectedConsequences: ['economic', 'relationship', 'social', 'world_state']
    },
    {
      name: 'Forest Restoration',
      response: `Your nurturing hands heal the corrupted forest. Trees regain their vibrant green leaves. Wildlife returns to their natural habitats. The forest spirits bless you with their protection. Villagers celebrate the restoration of their sacred grove. Natural resources become abundant again. The balance of nature is restored, bringing harmony to the land.`,
      expectedConsequences: ['environment', 'character', 'relationship', 'economic']
    }
  ]

  describe('AI Response Processing', () => {
    realAIResponses.forEach(testCase => {
      describe(testCase.name, () => {
        it('should generate structured consequences from real AI response', async () => {
          if (!OPENAI_API_KEY) {
            console.warn(`Skipping ${testCase.name} - no API key`)
            return
          }

          console.log(`\n🤖 Testing: ${testCase.name}`)
          console.log(`📝 AI Response: ${testCase.response.substring(0, 120)}...`)

          // Create basic AI request
          const aiRequest: AIRequest = {
            actionId: `test-${uuidv4()}`,
            playerIntent: 'Test AI response processing',
            originalInput: testCase.name,
            timestamp: new Date().toISOString(),
            context: undefined as any // Simplified for testing
          }

          try {
            const startTime = Date.now()

            // Process AI response into consequences
            const result = await consequenceGenerator.generateConsequences(
              testCase.response,
              aiRequest,
              { maxConsequences: 5 }
            )

            const processingTime = Date.now() - startTime

            console.log(`✅ Processing completed in ${processingTime}ms`)
            console.log(`   Parsing Success: ${result.parsingSuccess}`)
            console.log(`   Total Consequences: ${result.consequences.length}`)
            console.log(`   Warnings: ${result.warnings.length}`)
            console.log(`   Errors: ${result.errors.length}`)

            // Verify results
            expect(result).toBeDefined()
            expect(result.consequences).toBeDefined()
            expect(result.consequences.length).toBeGreaterThan(0)
            expect(result.consequences.length).toBeLessThanOrEqual(5)

            // Display generated consequences
            console.log('\n🎯 Generated Consequences:')
            result.consequences.forEach((consequence, index) => {
              console.log(`   ${index + 1}. ${consequence.type}`)
              console.log(`      Description: ${consequence.description}`)
              console.log(`      Impact: ${consequence.impact.level} (${consequence.impact.magnitude}/10)`)
              console.log(`      Duration: ${consequence.impact.duration}`)
              console.log(`      Confidence: ${(consequence.confidence * 100).toFixed(1)}%`)
              if (consequence.cascadingEffects.length > 0) {
                console.log(`      Cascading Effects: ${consequence.cascadingEffects.length}`)
              }
            })

            // Validate consequence structure
            result.consequences.forEach(consequence => {
              expect(consequence.id).toBeTruthy()
              expect(consequence.type).toBeTruthy()
              expect(consequence.description).toBeTruthy()
              expect(consequence.impact).toBeDefined()
              expect(consequence.impact.level).toBeTruthy()
              expect(consequence.impact.magnitude).toBeGreaterThan(0)
              expect(consequence.impact.duration).toBeTruthy()
              expect(consequence.confidence).toBeGreaterThanOrEqual(0)
              expect(consequence.confidence).toBeLessThanOrEqual(1)
              expect(consequence.timestamp).toBeTruthy()
            })

            // Check if expected consequence types are present
            const generatedTypes = result.consequences.map(c => c.type)
            const foundTypes = []

            testCase.expectedConsequences.forEach(expectedType => {
              const found = generatedTypes.some(generated =>
                generated.toLowerCase().includes(expectedType.toLowerCase())
              )
              if (found) {
                foundTypes.push(expectedType)
              }
            })

            console.log(`\n🎯 Expected Types: ${testCase.expectedConsequences.join(', ')}`)
            console.log(`✅ Found Types: ${foundTypes.join(', ')}`)
            console.log(`   Coverage: ${foundTypes.length}/${testCase.expectedConsequences.length}`)

            // Performance check
            expect(processingTime).toBeLessThan(5000) // Should complete in under 5 seconds

            console.log(`⏱️  Performance: ${processingTime}ms (< 5s ✅)`)
            console.log(`🎉 Successfully processed: ${testCase.name}`)

          } catch (error) {
            console.error(`❌ Failed to process ${testCase.name}:`, error)
            throw error
          }
        }, 15000) // 15 second timeout
      })
    })
  })

  it('should handle edge cases gracefully', async () => {
    if (!OPENAI_API_KEY) return

    const edgeCases = [
      {
        name: 'Empty Response',
        response: '',
        expectFallback: true
      },
      {
        name: 'Minimal Response',
        response: 'The player did nothing.',
        expectFallback: false
      },
      {
        name: 'Error Response',
        response: 'Error: Unable to process request.',
        expectFallback: true
      },
      {
        name: 'Single Word',
        response: 'Success.',
        expectFallback: false
      }
    ]

    for (const edgeCase of edgeCases) {
      console.log(`\n🧪 Testing Edge Case: ${edgeCase.name}`)

      const aiRequest: AIRequest = {
        actionId: uuidv4(),
        playerIntent: 'Test edge case',
        originalInput: edgeCase.name,
        timestamp: new Date().toISOString(),
        context: undefined as any
      }

      const result = await consequenceGenerator.generateConsequences(
        edgeCase.response,
        aiRequest
      )

      if (edgeCase.expectFallback) {
        expect(result.parsingSuccess).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.consequences.length).toBe(1) // Should create fallback
      } else {
        expect(result.parsingSuccess).toBe(true)
        expect(result.consequences.length).toBeGreaterThanOrEqual(1)
      }

      console.log(`   ✅ Handled: ${edgeCase.name}`)
      console.log(`   Consequences: ${result.consequences.length}`)
      if (result.parsingSuccess) {
        console.log(`   First consequence: ${result.consequences[0].description}`)
      }
    }
  })

  it('should validate performance requirements', async () => {
    if (!OPENAI_API_KEY) {
      console.warn('Skipping performance test - no API key')
      return
    }

    console.log('\n⚡ Performance Test with Complex AI Response')

    const complexResponse = `
      The ancient dragon's final roar echoes through the mountain valley as your magical sword finds its mark.
      The beast's massive body crashes to the ground, sending shockwaves through the earth.
      Villagers emerge from hiding, their faces filled with hope and relief.
      The dragon's legendary hoard reveals itself, piles of gold and ancient artifacts gleaming in the sunlight.
      Magical energy radiates from the beast's heart, empowering nearby ley lines.
      The corrupted forest begins to heal immediately, trees regaining their vibrant green leaves.
      Your name becomes legend throughout the realm, sung by bards in every tavern.
      The local blacksmith immediately requests dragon scales for crafting legendary armor.
      Children will tell stories of your bravery for generations to come.
      Merchants from distant lands hear of your deed and seek trade opportunities.
      The kingdom's rulers send envoys with requests for alliances.
      Ancient spirits acknowledge your heroism with blessings and gifts.
      The very fabric of reality seems to shift around your newfound fame.
      Adventure seekers now follow your path, hoping to learn from your experience.
      The balance of power in the realm has fundamentally changed.
    `

    const aiRequest: AIRequest = {
      actionId: uuidv4(),
      playerIntent: 'Test performance with complex response',
      originalInput: 'Performance test',
      timestamp: new Date().toISOString(),
      context: undefined as any
    }

    const startTime = Date.now()
    const result = await consequenceGenerator.generateConsequences(
      complexResponse,
      aiRequest,
      { maxConsequences: 8 }
    )
    const totalTime = Date.now() - startTime

    console.log(`⏱️  Total processing time: ${totalTime}ms`)
    console.log(`   Consequences generated: ${result.consequences.length}`)
    console.log(`   Average per consequence: ${(totalTime / result.consequences.length).toFixed(1)}ms`)

    // Performance requirements
    expect(totalTime).toBeLessThan(10000) // Should complete in under 10 seconds
    expect(result.consequences.length).toBeGreaterThan(0)
    expect(result.consequences.length).toBeLessThanOrEqual(8)

    console.log(`✅ Performance test passed (${totalTime}ms < 10s)`)
  })
})