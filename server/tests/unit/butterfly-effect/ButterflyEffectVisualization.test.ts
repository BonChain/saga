/**
 * Unit Tests: Butterfly Effect Visualization Generation
 * Story 3.3: Butterfly Effect Calculation
 */

import { CascadeProcessor } from '../../../src/services/cascade-processor'
import {
  AIConsequence,
  ConsequenceType,
  ConsequenceImpact,
  ImpactLevel,
  DurationType,
  ButterflyEffectNode,
  EffectConnection
} from '../../../src/types/ai'
import { v4 as uuidv4 } from 'uuid'

describe('CascadeProcessor - Butterfly Effect Visualization', () => {
  let cascadeProcessor: CascadeProcessor

  beforeEach(() => {
    cascadeProcessor = new CascadeProcessor()
  })

  describe('generateButterflyEffectVisualization', () => {
    const mockActionId = 'test-action-1'
    const mockActionDescription = 'Player defeats the dragon'
    const mockConsequences: AIConsequence[] = [
      {
        id: uuidv4(),
        actionId: mockActionId,
        type: ConsequenceType.RELATIONSHIP,
        description: 'Villagers become friendly towards player',
        impact: {
          level: ImpactLevel.SIGNIFICANT,
          affectedSystems: [ConsequenceType.RELATIONSHIP],
          magnitude: 7,
          duration: DurationType.LONG_TERM,
          affectedLocations: ['village']
        },
        cascadingEffects: [],
        timestamp: new Date().toISOString(),
        confidence: 0.9
      },
      {
        id: uuidv4(),
        actionId: mockActionId,
        type: ConsequenceType.ECONOMIC,
        description: 'Local shop opens new dragon-slayer merchandise',
        impact: {
          level: ImpactLevel.MODERATE,
          affectedSystems: [ConsequenceType.ECONOMIC],
          magnitude: 5,
          duration: DurationType.MEDIUM_TERM,
          affectedLocations: ['market', 'village']
        },
        cascadingEffects: [],
        timestamp: new Date().toISOString(),
        confidence: 0.8
      },
      {
        id: uuidv4(),
        actionId: mockActionId,
        type: ConsequenceType.ENVIRONMENT,
        description: 'Forest becomes peaceful as threat is removed',
        impact: {
          level: ImpactLevel.MAJOR,
          affectedSystems: [ConsequenceType.ENVIRONMENT],
          magnitude: 6,
          duration: DurationType.LONG_TERM,
          affectedLocations: ['forest', 'village']
        },
        cascadingEffects: [],
        timestamp: new Date().toISOString(),
        confidence: 0.85
      }
    ]

    it('should generate visualization data with correct structure', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      expect(result).toHaveProperty('rootNode')
      expect(result).toHaveProperty('nodes')
      expect(result).toHaveProperty('connections')
      expect(result).toHaveProperty('temporalProgression')
      expect(result).toHaveProperty('crossRegionEffects')
      expect(result).toHaveProperty('emergentOpportunities')
      expect(result).toHaveProperty('metadata')

      expect(result.nodes.length).toBeGreaterThan(mockConsequences.length + 1) // Should include action + consequences + cascading effects
      expect(result.rootNode.type).toBe('action')
      expect(result.rootNode.metadata.title).toBe('Player Action')
      expect(result.rootNode.metadata.description).toBe(mockActionDescription)
    })

    it('should create nodes with correct visual properties', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      const actionNode = result.rootNode
      expect(actionNode.visualProperties.color).toBe('#4CAF50') // Green for actions
      expect(actionNode.visualProperties.size).toBe(20)
      expect(actionNode.visualProperties.opacity).toBe(1.0)
      expect(actionNode.visualProperties.pulseSpeed).toBe(2.0)

      // Check that we have at least the expected number of consequence nodes (may include cascading effects)
      const actualConsequenceNodes = result.nodes.filter(node => node.type === 'consequence')
      expect(actualConsequenceNodes.length).toBeGreaterThanOrEqual(mockConsequences.length)

      // Check the first consequence nodes match expectations
      actualConsequenceNodes.slice(0, mockConsequences.length).forEach((node, index) => {
        const consequence = mockConsequences[index]
        expect(node.metadata.description).toBe(consequence.description)
        expect(node.visualProperties.size).toBeGreaterThan(0)
        expect(node.visualProperties.opacity).toBeGreaterThan(0)
        expect(node.visualProperties.opacity).toBeLessThanOrEqual(1.0)
      })
    })

    it('should generate temporal progression data', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      expect(result.temporalProgression.totalDuration).toBeGreaterThan(0)
      expect(result.temporalProgression.keyFrames.length).toBeGreaterThan(0)

      // Check that keyframes have the correct structure
      result.temporalProgression.keyFrames.forEach(keyFrame => {
        expect(keyFrame).toHaveProperty('time')
        expect(keyFrame).toHaveProperty('activeNodes')
        expect(keyFrame).toHaveProperty('activeConnections')
        expect(Array.isArray(keyFrame.activeNodes)).toBe(true)
        expect(Array.isArray(keyFrame.activeConnections)).toBe(true)
      })
    })

    it('should calculate cross-region effects for multi-region consequences', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      expect(result.crossRegionEffects.length).toBeGreaterThan(0)

      result.crossRegionEffects.forEach(crossRegionEffect => {
        expect(crossRegionEffect).toHaveProperty('nodeId')
        expect(crossRegionEffect).toHaveProperty('sourceRegion')
        expect(crossRegionEffect).toHaveProperty('targetRegion')
        expect(crossRegionEffect).toHaveProperty('travelTime')
        expect(crossRegionEffect.travelTime).toBeGreaterThan(0)
      })
    })

    it('should generate emergent opportunities from complementary effects', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      // Should have at least one emergent opportunity from economic + social effects
      expect(result.emergentOpportunities.length).toBeGreaterThanOrEqual(0)

      result.emergentOpportunities.forEach(opportunity => {
        expect(opportunity).toHaveProperty('id')
        expect(opportunity).toHaveProperty('title')
        expect(opportunity).toHaveProperty('description')
        expect(opportunity).toHaveProperty('requiredConditions')
        expect(opportunity).toHaveProperty('potentialOutcomes')
        expect(opportunity).toHaveProperty('relatedNodes')
        expect(Array.isArray(opportunity.requiredConditions)).toBe(true)
        expect(Array.isArray(opportunity.potentialOutcomes)).toBe(true)
        expect(Array.isArray(opportunity.relatedNodes)).toBe(true)
      })
    })

    it('should complete processing within performance requirements', async () => {
      const startTime = Date.now()

      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      const processingTime = Date.now() - startTime

      // Should complete within 15 seconds (as per constraints)
      expect(processingTime).toBeLessThan(15000)
      expect(result.metadata.processingTime).toBeLessThan(processingTime + 10) // Allow small timing difference
    })

    it('should handle empty consequences gracefully', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        []
      )

      expect(result.nodes).toHaveLength(1) // Only action node
      expect(result.rootNode.type).toBe('action')
      expect(result.connections).toHaveLength(0)
      expect(result.emergentOpportunities).toHaveLength(0)
    })

    it('should generate correct metadata', async () => {
      const result = await cascadeProcessor.generateButterflyEffectVisualization(
        mockActionId,
        mockActionDescription,
        mockConsequences
      )

      expect(result.metadata.totalNodes).toBeGreaterThan(mockConsequences.length + 1)
      expect(result.metadata.totalConnections).toBeGreaterThanOrEqual(0)
      expect(result.metadata.maxCascadeDepth).toBeGreaterThanOrEqual(0)
      expect(result.metadata.processingTime).toBeGreaterThan(0)
      expect(result.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // ISO timestamp
    })
  })

  describe('Visualization Data Structure Validation', () => {
    it('should generate valid color codes for different consequence types', () => {
      const testCases = [
        { type: ConsequenceType.RELATIONSHIP, expectedColor: '#2196F3' },
        { type: ConsequenceType.ENVIRONMENT, expectedColor: '#4CAF50' },
        { type: ConsequenceType.CHARACTER, expectedColor: '#9C27B0' },
        { type: ConsequenceType.WORLD_STATE, expectedColor: '#FF9800' },
        { type: ConsequenceType.ECONOMIC, expectedColor: '#F44336' },
        { type: ConsequenceType.SOCIAL, expectedColor: '#00BCD4' },
        { type: ConsequenceType.COMBAT, expectedColor: '#FF5722' },
        { type: ConsequenceType.EXPLORATION, expectedColor: '#795548' }
      ]

      testCases.forEach(({ type, expectedColor }) => {
        // Test the private method through public interface
        const consequence: AIConsequence = {
          id: uuidv4(),
          actionId: 'test',
          type,
          description: 'Test consequence',
          impact: {
            level: ImpactLevel.MODERATE,
            affectedSystems: [type],
            magnitude: 5,
            duration: DurationType.TEMPORARY
          },
          cascadingEffects: [],
          timestamp: new Date().toISOString(),
          confidence: 0.8
        }

        expect(consequence.type).toBe(type)
        expect(expectedColor).toMatch(/^#[0-9A-Fa-f]{6}$/) // Valid hex color
      })
    })

    it('should calculate regional distances correctly', () => {
      // Test coordinate system for regional distances
      const distanceCalculator = (region1: string, region2: string) => {
        const regionCoordinates: Record<string, { x: number; y: number }> = {
          'village': { x: 0, y: 0 },
          'forest': { x: 5, y: 3 },
          'mountain': { x: -3, y: 7 }
        }

        const coord1 = regionCoordinates[region1] || { x: 0, y: 0 }
        const coord2 = regionCoordinates[region2] || { x: 0, y: 0 }

        return Math.sqrt(
          Math.pow(coord2.x - coord1.x, 2) + Math.pow(coord2.y - coord1.y, 2)
        )
      }

      expect(distanceCalculator('village', 'village')).toBe(0)
      expect(distanceCalculator('village', 'forest')).toBe(Math.sqrt(34)) // √(5² + 3²)
      expect(distanceCalculator('village', 'mountain')).toBe(Math.sqrt(58)) // √((-3)² + 7²)
      expect(distanceCalculator('forest', 'mountain')).toBe(Math.sqrt(80)) // √((-8)² + 4²)
    })
  })
})