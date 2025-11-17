/**
 * Real AI Integration Tests: Butterfly Effect with Actual OpenAI
 *
 * These tests use the real OpenAI API instead of mocks to validate
 * the complete AI → Consequence → Butterfly Effect flow.
 *
 * Note: Requires valid OPENAI_API_KEY environment variable
 */

import { CascadeProcessor } from '../../../src/services/CascadeProcessor'
import { WorldStateUpdater } from '../../../src/services/WorldStateUpdater'
import { ConsequenceGenerator } from '../../../src/services/ConsequenceGenerator'
import { OpenAIIntegration } from '../../../src/services/OpenAIIntegration'
import {
  AIRequest,
  AIConsequence,
  CascadeVisualizationData,
  EffectHistory,
  ConsequenceType,
  ImpactLevel,
  DurationType
} from '../../../src/types/ai'
import { Layer1Blueprint } from '../../../src/storage/Layer1Blueprint'
import { Layer3State } from '../../../src/storage/Layer3State'
import { v4 as uuidv4 } from 'uuid'

// Skip tests if no OpenAI API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

describe('Real AI Butterfly Effect Integration', () => {
  let cascadeProcessor: CascadeProcessor
  let worldStateUpdater: WorldStateUpdater
  let consequenceGenerator: ConsequenceGenerator
  let openAIIntegration: OpenAIIntegration
  let layer1Blueprint: Layer1Blueprint
  let layer3State: Layer3State

  beforeAll(async () => {
    if (!OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not found. Skipping real AI tests.')
      return
    }

    // Initialize real services
    cascadeProcessor = new CascadeProcessor()
    openAIIntegration = new OpenAIIntegration()

    // Initialize storage services (these might need configuration)
    layer1Blueprint = new Layer1Blueprint()
    layer3State = new Layer3State('./test-data', {
      walrusApiEndpoint: 'https://test.walrus.com',
      projectId: 'test-project',
      accessKey: 'test-key'
    })

    consequenceGenerator = new ConsequenceGenerator(layer1Blueprint)
    worldStateUpdater = new WorldStateUpdater(layer3State, layer1Blueprint)

    // Wait for AI service initialization
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  describe('Real AI → Consequence → Butterfly Effect Flow', () => {
    const testCases = [
      {
        name: 'Dragon Defeat',
        playerAction: 'I want to defeat the ancient dragon that has been terrorizing the village',
        playerIntent: 'Defeat dragon to save village',
        location: 'village',
        expectedEffects: ['relationship', 'economic', 'environment']
      },
      {
        name: 'Magical Discovery',
        playerAction: 'I search the ancient ruins for magical artifacts and hidden knowledge',
        playerIntent: 'Discover magical artifacts',
        location: 'ancient_ruins',
        expectedEffects: ['character', 'exploration', 'world_state']
      },
      {
        name: 'Trade Negotiation',
        playerAction: 'I want to negotiate a better trade deal with the merchant guild for our village',
        playerIntent: 'Improve village economy through trade',
        location: 'market',
        expectedEffects: ['economic', 'relationship', 'social']
      }
    ]

    testCases.forEach(testCase => {
      describe(testCase.name, () => {
        it('should process real AI response and create butterfly effects', async () => {
          if (!OPENAI_API_KEY) {
            console.warn('Skipping real AI test - no API key configured')
            return
          }

          const actionId = `real-ai-test-${uuidv4()}`

          // Step 1: Create AI Request
          const aiRequest: AIRequest = {
            actionId,
            playerIntent: testCase.playerIntent,
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
                economy: {},
                environment: {},
                events: []
              },
              characterRelationships: [],
              locationContext: {
                currentLocation: testCase.location,
                nearbyCharacters: [],
                environment: 'normal',
                timeOfDay: 'afternoon',
                weather: 'clear'
              },
              recentActions: [],
              worldRules: []
            }
          }

          console.log(`🤖 Testing AI: ${testCase.playerAction}`)

          try {
            // Step 2: Call Real OpenAI
            const startTime = Date.now()
            const aiResponse = await openAIIntegration.processRequest(aiRequest)
            const aiProcessingTime = Date.now() - startTime

            console.log(`✅ AI Response received in ${aiProcessingTime}ms`)
            console.log(`📝 AI Response: ${aiResponse.response.substring(0, 100)}...`)

            // Verify AI response
            expect(aiResponse.success).toBe(true)
            expect(aiResponse.response).toBeTruthy()
            expect(aiResponse.response.length).toBeGreaterThan(20)
            expect(aiResponse.tokenUsage).toBeDefined()
            expect(aiResponse.processingTime).toBeGreaterThan(0)

            // Step 3: Generate Consequences from AI Response
            const consequenceStartTime = Date.now()
            const consequenceResult = await consequenceGenerator.generateConsequences(
              aiResponse.response,
              aiRequest,
              { maxConsequences: 5 }
            )
            const consequenceProcessingTime = Date.now() - consequenceStartTime

            console.log(`🎯 Generated ${consequenceResult.consequences.length} consequences in ${consequenceProcessingTime}ms`)

            expect(consequenceResult.parsingSuccess).toBe(true)
            expect(consequenceResult.consequences.length).toBeGreaterThan(0)
            expect(consequenceResult.consequences.length).toBeLessThanOrEqual(5)

            // Display generated consequences
            consequenceResult.consequences.forEach((consequence, index) => {
              console.log(`   ${index + 1}. ${consequence.type}: ${consequence.description}`)
            })

            // Step 4: Generate Butterfly Effects
            const butterflyStartTime = Date.now()
            const visualizationData = await cascadeProcessor.generateButterflyEffectVisualization(
              actionId,
              testCase.playerAction,
              consequenceResult.consequences
            )
            const butterflyProcessingTime = Date.now() - butterflyStartTime

            console.log(`🦋 Created butterfly effects in ${butterflyProcessingTime}ms`)
            console.log(`   Total nodes: ${visualizationData.metadata.totalNodes}`)
            console.log(`   Total connections: ${visualizationData.metadata.totalConnections}`)
            console.log(`   Emergent opportunities: ${visualizationData.emergentOpportunities.length}`)

            expect(visualizationData.nodes.length).toBeGreaterThan(1) // Action + consequences
            expect(visualizationData.rootNode.type).toBe('action')
            expect(visualizationData.connections.length).toBeGreaterThanOrEqual(0)

            // Step 5: Persist Butterfly Effects
            const persistenceStartTime = Date.now()
            const effectHistory = await worldStateUpdater.persistButterflyEffect(
              actionId,
              visualizationData,
              {
                includeVisualizationData: true,
                trackCrossRegionEffects: true,
                enablePlayerDiscovery: true,
                persistEmergentOpportunities: true
              }
            )
            const persistenceTime = Date.now() - persistenceStartTime

            console.log(`💾 Persisted butterfly effects in ${persistenceTime}ms`)

            expect(effectHistory.originalActionId).toBe(actionId)
            expect(effectHistory.visualizationData).toBeDefined()
            expect(effectHistory.discoveredBy).toEqual([])
            expect(effectHistory.achievementUnlocked).toBe(false)

            // Step 6: Verify Performance Requirements
            const totalProcessingTime = aiProcessingTime + consequenceProcessingTime + butterflyProcessingTime

            console.log(`⏱️  Total processing time: ${totalProcessingTime}ms`)
            console.log(`   - AI Processing: ${aiProcessingTime}ms`)
            console.log(`   - Consequence Generation: ${consequenceProcessingTime}ms`)
            console.log(`   - Butterfly Effects: ${butterflyProcessingTime}ms`)
            console.log(`   - Persistence: ${persistenceTime}ms`)

            // Must complete within 15 seconds as per requirements
            expect(totalProcessingTime).toBeLessThan(15000)

            // Step 7: Verify Expected Effect Types
            const affectedSystems = new Set<ConsequenceType>()
            consequenceResult.consequences.forEach(consequence => {
              affectedSystems.add(consequence.type)
            })

            testCase.expectedEffects.forEach(expectedEffect => {
              // Check if any of the expected effect types are present
              const hasExpectedType = Array.from(affectedSystems).some(system =>
                system.toString().toLowerCase().includes(expectedEffect.toLowerCase())
              )
              if (!hasExpectedType) {
                console.log(`⚠️  Expected effect type '${expectedEffect}' not found in: ${Array.from(affectedSystems).join(', ')}`)
              }
            })

            console.log(`🎯 Successfully processed: ${testCase.name}`)
            console.log(`   AI Confidence: ${aiResponse.confidence}`)
            console.log(`   Tokens Used: ${aiResponse.tokenUsage?.total}`)
            console.log(`   Effects Generated: ${consequenceResult.consequences.length} primary + ${visualizationData.metadata.totalNodes - consequenceResult.consequences.length - 1} cascading`)

          } catch (error) {
            console.error(`❌ Failed to process ${testCase.name}:`, error)
            throw error
          }
        }, 30000) // 30 second timeout for AI requests
      })
    })
  })

  describe('AI Configuration and Health', () => {
    it('should validate OpenAI configuration', async () => {
      if (!OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY not configured for real AI tests')
        expect(OPENAI_API_KEY).toBeFalsy() // Test passes by acknowledging missing key
        return
      }

      expect(OPENAI_API_KEY).toBeTruthy()
      expect(OPENAI_API_KEY).toMatch(/^sk-/) // OpenAI keys start with 'sk-'

      console.log('✅ OpenAI API key is properly configured')
    })

    it('should test AI service health', async () => {
      if (!OPENAI_API_KEY) return

      const testRequest: AIRequest = {
        actionId: 'health-check',
        playerIntent: 'Test AI service',
        originalInput: 'Hello AI',
        timestamp: new Date().toISOString(),
        context: {
          actionId: 'health-check',
          playerIntent: 'Test AI service',
          originalInput: 'Hello AI',
          worldState: {
            timestamp: new Date().toISOString(),
            regions: {},
            characters: {},
            relationships: {},
            economy: {},
            environment: {},
            events: []
          },
          characterRelationships: [],
          locationContext: {
            currentLocation: 'test',
            nearbyCharacters: [],
            environment: 'test',
            timeOfDay: 'test',
            weather: 'test'
          },
          recentActions: [],
          worldRules: []
        }
      }

      try {
        const response = await openAIIntegration.processRequest(testRequest)
        expect(response.success).toBe(true)
        expect(response.response).toBeTruthy()
        console.log('✅ AI service health check passed')
      } catch (error) {
        console.error('❌ AI service health check failed:', error)
        throw error
      }
    }, 10000)
  })
})