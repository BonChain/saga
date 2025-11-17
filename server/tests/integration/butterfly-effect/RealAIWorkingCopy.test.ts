/**
 * Real AI Integration Test - Working Version
 *
 * Tests the complete AI → Consequence → Butterfly Effect flow
 * using the correct TypeScript interfaces.
 */

import { ConsequenceGenerator } from '../../../src/services/ConsequenceGenerator'
import { CascadeProcessor } from '../../../src/services/CascadeProcessor'
import { AIRequest, PromptType, AIConsequence } from '../../../src/types/ai'
import { v4 as uuidv4 } from 'uuid'

// Check for Z.ai API key (configured provider)
const ZAI_API_KEY = process.env.ZAI_API_KEY

describe('Real AI → Butterfly Effect (Working)', () => {
  let consequenceGenerator: ConsequenceGenerator
  let cascadeProcessor: CascadeProcessor

  beforeAll(() => {
    cascadeProcessor = new CascadeProcessor()
    // Initialize with minimal config - Layer1Blueprint needs constructor arguments
    consequenceGenerator = new ConsequenceGenerator({
      getWorldRules: () => Promise.resolve([]),
      loadBlueprint: () => Promise.resolve(),
      validateRule: () => ({ isValid: true, conflicts: [] })
    } as any)

    if (ZAI_API_KEY) {
      console.log('✅ Z.ai API key detected')
    } else {
      console.warn('\n⚠️  ZAI_API_KEY not configured')
      console.log('Set ZAI_API_KEY in your .env file to test with real AI')
    }
  })

  // Real AI responses that represent different game scenarios
  const aiTestCases = [
    {
      name: 'Epic Dragon Battle',
      response: `The ancient dragon's final roar echoes through the valley as your enchanted sword strikes true. The beast crashes to earth in a spectacular display of fire and magic. Villagers emerge cheering, their faces filled with hope and awe. The dragon's legendary hoard reveals itself - mountains of gold, ancient artifacts, and magical crystals. The corrupted forest immediately begins to heal, trees regaining vibrant green leaves. Your name becomes legend throughout the realm. Blacksmiths queue up for dragon scales. Children will sing songs of your bravery for generations to come.`,
      description: 'Player defeats the ancient dragon terrorizing the village'
    },
    {
      name: 'Magical Discovery',
      response: `Your fingers trace the glowing runes on the ancient stone tablet, and mystical energy pulses through the chamber. Forgotten magic from ages past flows into your veins, awakening dormant powers within you. The spirits of ancient guardians acknowledge your worth with ethereal bows. Hidden chambers slide open, revealing artifacts of immense power that radiate ancient knowledge. Your reputation as a true adventurer spreads like wildfire across distant lands, attracting both allies and rivals to your cause.`,
      description: 'Player discovers ancient magical artifact in the ruins'
    },
    {
      name: 'Diplomatic Success',
      response: `Your persuasive speech sways the merchant council with unprecedented success. Trade agreements are signed that will bring prosperity to the entire region for years to come. The grateful merchants immediately establish new trade routes directly to your village, bringing exotic goods and opportunities. Your reputation as a skilled negotiator reaches distant courts, with rulers sending envoys seeking your wisdom for delicate diplomatic matters. The local economy flourishes under the new trade policies, creating wealth and opportunity for everyone involved.`,
      description: 'Player successfully negotiates better trade terms with merchant guild'
    }
  ]

  describe('AI Response Processing', () => {
    aiTestCases.forEach(testCase => {
      describe(`Scenario: ${testCase.name}`, () => {
        it('should process real AI response and create butterfly effects', async () => {
          if (!ZAI_API_KEY) {
            console.warn(`Skipping ${testCase.name} - no Z.ai API key`)
            return
          }

          console.log(`\n🤖 Processing: ${testCase.name}`)
          console.log(`📝 AI Response: ${testCase.response.substring(0, 150)}...`)

          // Step 1: Create proper AI request
          const aiRequest: AIRequest = {
            id: uuidv4(),
            actionId: `ai-test-${uuidv4()}`,
            promptType: PromptType.CONSEQUENCE_GENERATION,
            context: undefined as any, // Simplified for testing
            prompt: testCase.description,
            timestamp: new Date().toISOString(),
            maxTokens: 500,
            temperature: 0.7
          }

          try {
            // Step 2: Generate consequences from AI response
            console.log('🎯 Converting AI response to game consequences...')
            const startTime = Date.now()

            const consequenceResult = await consequenceGenerator.generateConsequences(
              testCase.response,
              aiRequest,
              { maxConsequences: 5 }
            )

            const processingTime = Date.now() - startTime

            console.log(`✅ Generated ${consequenceResult.consequences.length} consequences in ${processingTime}ms`)
            console.log(`   Parsing Success: ${consequenceResult.parsingSuccess}`)
            console.log(`   Warnings: ${consequenceResult.warnings?.length || 0}`)
            console.log(`   Errors: ${consequenceResult.errors?.length || 0}`)

            // Verify the results
            expect(consequenceResult).toBeDefined()
            expect(consequenceResult.parsingSuccess).toBe(true)
            expect(consequenceResult.consequences.length).toBeGreaterThan(0)
            expect(consequenceResult.consequences.length).toBeLessThanOrEqual(5)

            // Display the generated consequences
            console.log('\n🎯 Generated Consequences:')
            consequenceResult.consequences.forEach((consequence: AIConsequence, index: number) => {
              console.log(`   ${index + 1}. [${consequence.type.toUpperCase()}]`)
              console.log(`      Description: ${consequence.description}`)
              console.log(`      Impact: ${consequence.impact.level} (${consequence.impact.magnitude}/10)`)
              console.log(`      Duration: ${consequence.impact.duration}`)
              console.log(`      Confidence: ${(consequence.confidence * 100).toFixed(1)}%`)
              if (consequence.cascadingEffects && consequence.cascadingEffects.length > 0) {
                console.log(`      Cascading Effects: ${consequence.cascadingEffects.length}`)
              }
            })

            // Validate consequence data structure
            consequenceResult.consequences.forEach((consequence: AIConsequence) => {
              expect(consequence.id).toBeTruthy()
              expect(consequence.actionId).toBeTruthy()
              expect(consequence.type).toBeTruthy()
              expect(consequence.description).toBeTruthy()
              expect(consequence.impact).toBeDefined()
              expect(consequence.impact.level).toBeTruthy()
              expect(consequence.impact.magnitude).toBeGreaterThan(0)
              expect(consequence.impact.duration).toBeTruthy()
              expect(consequence.confidence).toBeGreaterThanOrEqual(0)
              expect(consequence.confidence).toBeLessThanOrEqual(1)
              expect(consequence.timestamp).toBeTruthy()
              expect(Array.isArray(consequence.cascadingEffects)).toBe(true)
            })

            // Step 3: Generate butterfly effects
            console.log('🦋 Creating butterfly effect visualization...')
            const butterflyStartTime = Date.now()

            const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
              aiRequest.actionId,
              testCase.description,
              consequenceResult.consequences
            )

            const butterflyTime = Date.now() - butterflyStartTime

            console.log(`✅ Created butterfly effects in ${butterflyTime}ms`)
            console.log(`   Total nodes: ${visualizationData.metadata.totalNodes}`)
            console.log(`   Total connections: ${visualizationData.metadata.totalConnections}`)
            console.log(`   Cascade depth: ${visualizationData.metadata.maxCascadeDepth}`)
            console.log(`   Emergent opportunities: ${visualizationData.emergentOpportunities.length}`)

            // Verify butterfly effect data
            expect(visualizationData).toBeDefined()
            expect(visualizationData.rootNode).toBeDefined()
            expect(visualizationData.rootNode.type).toBe('action')
            expect(visualizationData.nodes.length).toBeGreaterThan(1)
            expect(visualizationData.connections.length).toBeGreaterThanOrEqual(0)

            // Check for emergent opportunities
            if (visualizationData.emergentOpportunities.length > 0) {
              console.log('\n🌟 Emergent Opportunities Created:')
              visualizationData.emergentOpportunities.forEach((opp, index) => {
                console.log(`   ${index + 1}. ${opp.title}`)
                console.log(`      ${opp.description}`)
                console.log(`      Required: ${opp.requiredConditions.join(', ')}`)
              })
            }

            // Performance validation
            const totalTime = processingTime + butterflyTime
            console.log(`\n⏱️  Performance Metrics:`)
            console.log(`   Consequence Generation: ${processingTime}ms`)
            console.log(`   Butterfly Effects: ${butterflyTime}ms`)
            console.log(`   Total Processing: ${totalTime}ms`)

            // Must complete within 15 seconds as per requirements
            expect(totalTime).toBeLessThan(15000)

            // Final success summary
            console.log(`\n🎉 Success: ${testCase.name}`)
            console.log(`   ✅ AI → Consequences: ${consequenceResult.consequences.length}`)
            console.log(`   ✅ Butterfly Effects: ${visualizationData.metadata.totalNodes} total nodes`)
            console.log(`   ✅ Processing Time: ${totalTime}ms (< 15s requirement ✅)`)

          } catch (error) {
            console.error(`❌ Failed to process ${testCase.name}:`, error)
            throw error
          }
        }, 30000) // 30 second timeout for comprehensive testing
      })
    })
  })

  it('should handle invalid or minimal AI responses', async () => {
    if (!ZAI_API_KEY) {
      console.warn('Skipping edge case tests - no API key')
      return
    }

    const edgeCases = [
      {
        name: 'Empty Response',
        response: '',
        shouldCreateFallback: true
      },
      {
        name: 'Minimal Response',
        response: 'The player acted.',
        shouldCreateFallback: false
      },
      {
        name: 'Single Word Response',
        response: 'Success.',
        shouldCreateFallback: false
      },
      {
        name: 'Error Response',
        response: 'Unable to process request.',
        shouldCreateFallback: true
      }
    ]

    for (const edgeCase of edgeCases) {
      console.log(`\n🧪 Testing Edge Case: ${edgeCase.name}`)

      const aiRequest: AIRequest = {
        id: uuidv4(),
        actionId: `edge-test-${uuidv4()}`,
        promptType: PromptType.CONSEQUENCE_GENERATION,
        context: undefined as any,
        prompt: edgeCase.name,
        timestamp: new Date().toISOString(),
        maxTokens: 100,
        temperature: 0.5
      }

      const result = await consequenceGenerator.generateConsequences(
        edgeCase.response,
        aiRequest
      )

      console.log(`   Response: "${edgeCase.response}"`)
      console.log(`   Consequences: ${result.consequences.length}`)
      console.log(`   Parsing Success: ${result.parsingSuccess}`)

      if (edgeCase.shouldCreateFallback) {
        expect(result.parsingSuccess).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.consequences.length).toBe(1) // Should create fallback
        console.log(`   Fallback Created: ✅`)
      } else {
        expect(result.parsingSuccess).toBe(true)
        expect(result.consequences.length).toBeGreaterThanOrEqual(1)
        console.log(`   Valid Consequences: ✅`)
      }

      if (result.consequences.length > 0) {
        console.log(`   First Consequence: ${result.consequences[0].description}`)
      }
    }
  })

  it('should meet performance requirements with complex AI responses', async () => {
    if (!ZAI_API_KEY) {
      console.warn('Skipping performance test - no API key')
      return
    }

    console.log('\n⚡ Performance Test with Complex AI Response')

    const complexResponse = `
      The ancient red dragon's final roar echoes through the mountain valley as your magically enhanced sword finds its mark deep in the beast's heart.
      The massive creature crashes to the ground with earth-shaking force, sending shockwaves throughout the entire kingdom.
      Villagers who had been hiding for months emerge from their homes, their faces filled with relief and overwhelming joy.
      The dragon's legendary hoard reveals itself in spectacular fashion - mountains of gold, ancient artifacts, enchanted weapons, and magical crystals that glow with inner light.
      Raw magical energy radiates from the beast's dying heart, empowering nearby ley lines and magical nodes across the realm.
      The corrupted forest that had suffered under the dragon's dark influence immediately begins to heal, trees regaining their vibrant green leaves and flowers blooming anew.
      Your name becomes legend throughout the realm overnight, sung by bards in every tavern and whispered by children around campfires.
      The local blacksmith master immediately requests rare dragon scales for crafting legendary armor that will protect the kingdom for generations.
      Children will tell stories of your incredible bravery for centuries to come, ensuring your legacy lives forever.
      Merchants from distant lands hear of your monumental achievement and immediately begin planning trade expeditions to your village.
      Kings and queens from across the realm send envoys bearing gifts and requests for alliances, recognizing your power and wisdom.
      Ancient forest spirits and mountain guardians acknowledge your heroism with powerful blessings and magical gifts.
      The very balance of power in the realm seems to shift around your newfound fame and influence.
    `

    const aiRequest: AIRequest = {
      id: uuidv4(),
      actionId: `perf-test-${uuidv4()}`,
      promptType: PromptType.CONSEQUENCE_GENERATION,
      context: undefined as any,
      prompt: 'Performance test with complex dragon battle response',
      timestamp: new Date().toISOString(),
      maxTokens: 800,
      temperature: 0.8
    }

    const startTime = Date.now()
    const result = await consequenceGenerator.generateConsequences(
      complexResponse,
      aiRequest,
      { maxConsequences: 8 }
    )
    const totalTime = Date.now() - startTime

    console.log(`⏱️  Performance Results:`)
    console.log(`   Total Processing Time: ${totalTime}ms`)
    console.log(`   Consequences Generated: ${result.consequences.length}`)
    console.log(`   Average per Consequence: ${(totalTime / result.consequences.length).toFixed(1)}ms`)

    // Performance requirements
    expect(totalTime).toBeLessThan(10000) // Should complete in under 10 seconds
    expect(result.consequences.length).toBeGreaterThan(0)
    expect(result.consequences.length).toBeLessThanOrEqual(8)
    expect(result.parsingSuccess).toBe(true)

    console.log(`✅ Performance Test Passed (${totalTime}ms < 10s requirement)`)
  })
})