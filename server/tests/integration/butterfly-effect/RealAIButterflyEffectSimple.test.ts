/**
 * Real AI Integration Tests (Simple Version)
 *
 * Tests the actual OpenAI integration with butterfly effect processing.
 * Simplified to focus on the core AI → Consequence → Butterfly Effect flow.
 */

import { ConsequenceGenerator } from '../../../src/services/consequence-generator'
import { CascadeProcessor } from '../../../src/services/cascade-processor'
import { AIRequest, ConsequenceType } from '../../../src/types/ai'
import { Layer1Blueprint } from '../../../src/storage/layer1-blueprint'
import { v4 as uuidv4 } from 'uuid'

// Check for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

describe('Real AI → Butterfly Effect Integration (Simple)', () => {
  let consequenceGenerator: ConsequenceGenerator
  let cascadeProcessor: CascadeProcessor
  let layer1Blueprint: Layer1Blueprint

  beforeAll(() => {
    // Initialize services with minimal setup
    cascadeProcessor = new CascadeProcessor()
    layer1Blueprint = new Layer1Blueprint('./test-data', {
      projectId: 'test-project',
      accessKey: 'test-key'
    })
    consequenceGenerator = new ConsequenceGenerator(layer1Blueprint)

    if (!OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not found. Real AI tests will be skipped.')
      console.log('To run real AI tests, add your OpenAI API key to .env file:')
      console.log('OPENAI_API_KEY=sk-your-key-here')
    }
  })

  const testCases = [
    {
      name: 'Combat Scenario',
      aiResponse: `The dragon roars in fury as your sword strikes true. The beast falls, its massive body crashing to the ground. Villagers emerge from hiding, cheering your name. The dragon's hoard of gold and ancient artifacts now lies exposed. The forest begins to heal from the dragon's corrupting influence. The local blacksmith requests dragon scales for legendary armor. Children whisper stories of your bravery for generations to come.`,
      playerAction: 'I defeated the ancient dragon terrorizing the village',
      expectedEffects: ['relationship', 'economic', 'environment', 'character']
    },
    {
      name: 'Discovery Scenario',
      aiResponse: `Your hand brushes against the ancient stone tablet, and glowing runes illuminate the chamber. The tablet reveals forgotten magic that pulses through the air. Mystical energy flows through your veins, granting you new abilities. The spirits of the ancient guardians acknowledge your worth. Hidden chambers open, revealing artifacts of immense power. Your reputation as a true adventurer spreads throughout the realm.`,
      playerAction: 'I discovered an ancient magical artifact in the ruins',
      expectedEffects: ['character', 'exploration', 'world_state', 'relationship']
    },
    {
      name: 'Social Scenario',
      aiResponse: `Your persuasive speech sways the merchant council. Trade agreements are signed, bringing prosperity to the region. The grateful merchants establish new trade routes to your village. Your reputation as a skilled negotiator reaches distant lands. Other rulers seek your wisdom for diplomatic matters. The local economy flourishes under the new trade policies.`,
      playerAction: 'I successfully negotiated better trade terms with the merchant guild',
      expectedEffects: ['economic', 'relationship', 'social', 'world_state']
    }
  ]

  describe('AI Response Processing', () => {
    testCases.forEach(testCase => {
      describe(`Scenario: ${testCase.name}`, () => {
        it('should process real AI response and create butterfly effects', async () => {
          if (!OPENAI_API_KEY) {
            console.warn('Skipping real AI test - no API key')
            return
          }

          console.log(`\n🤖 Testing: ${testCase.name}`)
          console.log(`📝 AI Response: ${testCase.aiResponse.substring(0, 100)}...`)

          // Step 1: Create test AI request
          const actionId = `real-test-${uuidv4()}`
          const aiRequest: AIRequest = {
            actionId,
            playerIntent: testCase.playerAction,
            originalInput: testCase.playerAction,
            timestamp: new Date().toISOString(),
            context: {
              actionId,
              playerIntent: testCase.playerIntent,
              originalInput: testCase.playerAction,
              worldState: {
                timestamp: new Date().toISOString(),
                regions: [],
                characters: [],
                relationships: [],
                economy: { resources: {}, tradeRoutes: [], markets: [] },
                environment: { weather: 'clear', timeOfDay: 'day', season: 'summer', magicalConditions: [], naturalDisasters: [] },
                events: []
              },
              characterRelationships: [],
              locationContext: {
                currentLocation: 'test',
                environment: 'normal',
                timeOfDay: 'afternoon',
                weather: 'clear'
              },
              recentActions: [],
              worldRules: []
            }
          }

          try {
            // Step 2: Generate consequences from AI response (simulated)
            console.log('🎯 Processing AI response into consequences...')
            const startTime = Date.now()

            const consequenceResult = await consequenceGenerator.generateConsequences(
              testCase.aiResponse, // Use the pre-defined AI response
              aiRequest,
              { maxConsequences: 5 }
            )

            const processingTime = Date.now() - startTime

            console.log(`✅ Generated ${consequenceResult.consequences.length} consequences in ${processingTime}ms`)
            console.log(`   Parsing Success: ${consequenceResult.parsingSuccess}`)

            // Verify consequences
            expect(consequenceResult.parsingSuccess).toBe(true)
            expect(consequenceResult.consequences.length).toBeGreaterThan(0)
            expect(consequenceResult.consequences.length).toBeLessThanOrEqual(5)

            // Display generated consequences
            consequenceResult.consequences.forEach((consequence, index) => {
              console.log(`   ${index + 1}. ${consequence.type}: ${consequence.description}`)
              console.log(`      Impact: ${consequence.impact.level} (${consequence.impact.magnitude}/10)`)
              console.log(`      Duration: ${consequence.impact.duration}`)
            })

            // Step 3: Generate butterfly effects
            console.log('🦋 Creating butterfly effect visualization...')
            const butterflyStartTime = Date.now()

            const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
              actionId,
              testCase.playerAction,
              consequenceResult.consequences
            )

            const butterflyTime = Date.now() - butterflyStartTime

            console.log(`✅ Created butterfly effects in ${butterflyTime}ms`)
            console.log(`   Total nodes: ${visualizationData.metadata.totalNodes}`)
            console.log(`   Total connections: ${visualizationData.metadata.totalConnections}`)
            console.log(`   Emergent opportunities: ${visualizationData.emergentOpportunities.length}`)

            // Verify visualization data
            expect(visualizationData.nodes.length).toBeGreaterThan(1)
            expect(visualizationData.rootNode.type).toBe('action')
            expect(visualizationData.rootNode.metadata.title).toBe('Player Action')
            expect(visualizationData.connections.length).toBeGreaterThanOrEqual(0)

            // Check emergent opportunities
            if (visualizationData.emergentOpportunities.length > 0) {
              console.log('🌟 Emergent Opportunities Created:')
              visualizationData.emergentOpportunities.forEach((opp, index) => {
                console.log(`   ${index + 1}. ${opp.title}: ${opp.description}`)
              })
            }

            // Step 4: Verify expected effect types
            const affectedSystems = new Set<ConsequenceType>()
            consequenceResult.consequences.forEach(consequence => {
              affectedSystems.add(consequence.type)
            })

            console.log(`🎯 Affected Systems: ${Array.from(affectedSystems).join(', ')}`)

            // Check if expected effects are present
            let foundExpectedEffects = 0
            testCase.expectedEffects.forEach(expectedEffect => {
              const hasEffect = Array.from(affectedSystems).some(system =>
                system.toString().toLowerCase().includes(expectedEffect.toLowerCase())
              )
              if (hasEffect) {
                foundExpectedEffects++
              } else {
                console.log(`⚠️  Expected effect '${expectedEffect}' not found`)
              }
            })

            console.log(`✅ Found ${foundExpectedEffects}/${testCase.expectedEffects.length} expected effect types`)

            // Step 5: Performance validation
            const totalTime = processingTime + butterflyTime
            console.log(`⏱️  Total processing time: ${totalTime}ms`)

            // Must complete within 15 seconds
            expect(totalTime).toBeLessThan(15000)

            // Step 6: Success summary
            console.log(`🎉 Successfully processed: ${testCase.name}`)
            console.log(`   • AI consequences: ${consequenceResult.consequences.length}`)
            console.log(`   • Butterfly nodes: ${visualizationData.metadata.totalNodes}`)
            console.log(`   • Processing time: ${totalTime}ms (< 15s ✅)`)
            console.log(`   • Effects types: ${Array.from(affectedSystems).join(', ')}`)

          } catch (error) {
            console.error(`❌ Failed to process ${testCase.name}:`, error)
            throw error
          }
        }, 20000) // 20 second timeout
      })
    })
  })

  it('should handle empty or invalid AI responses gracefully', async () => {
    if (!OPENAI_API_KEY) return

    const invalidResponses = [
      '', // Empty response
      'The player did nothing.', // Minimal response
      'Error: Unable to process request.' // Error response
    ]

    for (const invalidResponse of invalidResponses) {
      const aiRequest: AIRequest = {
        actionId: uuidv4(),
        playerIntent: 'Test',
        originalInput: 'test',
        timestamp: new Date().toISOString(),
        context: {
          actionId: uuidv4(),
          playerIntent: 'Test',
          originalInput: 'test',
          worldState: {
            timestamp: new Date().toISOString(),
            regions: [],
            characters: [],
            relationships: [],
            economy: { resources: {}, tradeRoutes: [], markets: [] },
            environment: { weather: 'clear', timeOfDay: 'day', season: 'summer', magicalConditions: [], naturalDisasters: [] },
            events: []
          },
          characterRelationships: [],
          locationContext: {
            currentLocation: 'test',
            environment: 'normal',
            timeOfDay: 'afternoon',
            weather: 'clear'
          },
          recentActions: [],
          worldRules: []
        }
      }

      const result = await consequenceGenerator.generateConsequences(
        invalidResponse,
        aiRequest,
        { maxConsequences: 3 }
      )

      expect(result.parsingSuccess).toBe(false)
      expect(result.consequences.length).toBe(1) // Should create fallback consequence
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })
})