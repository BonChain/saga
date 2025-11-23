/**
 * Dialogue Generation API Endpoint - Story 4.2: Dynamic Dialogue Generation
 *
 * REST API endpoint for generating AI-driven dialogue with character context.
 * POST /api/dialogue/generate with character and player context.
 */

import { Router, Request, Response } from 'express'
import { DialogueService } from '../../../services/DialogueService'
import { DialogueRequest, DialogueResponse } from '../../../types/dialogue'
import { validateDialogueRequest } from './validation/dialogue-validation'
import { createRateLimiter } from '../../middleware/rate-limiter'
import { Personality } from '../../../models/character'

// Import the AIServiceAdapter interface from DialogueService
import { AIServiceAdapter, AIServiceRequest, AIServiceResponse } from '../../../services/DialogueService'
import { aiServiceAdapter } from '../../../services/ai/ai-service-adapter'

const router = Router()

// Create adapter to bridge aiServiceAdapter to DialogueService interface
const aiServiceAdapterForDialogue: AIServiceAdapter = {
  generateResponse: async (request: AIServiceRequest) => {
    // For now, use a simpler direct Z.ai approach
    try {
      // Call Z.ai directly with the character context
      const characterContext = request.context?.personality
        ? `Character personality: ${request.context.personality}. Character emotional tone: ${request.context?.emotionalTone || 'neutral'}.`
        : 'You are a friendly NPC character.'

      const promptForAI = `${characterContext}\n\nPlayer says: "${request.prompt}"\n\nRespond as the character, keeping in character with your personality and emotional state:`

      // Simple prompt-based request to the AI service
      const aiRequest = {
        id: `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionId: `dialogue_${Date.now()}`,
        promptType: 'character_response' as any,
        context: {
          actionId: `dialogue_${Date.now()}`,
          playerIntent: 'dialogue',
          originalInput: request.prompt,
          worldState: {
            timestamp: new Date().toISOString(),
            regions: [],
            characters: [],
            economy: { prosperity: 50, stability: 50 },
            environment: { weather: 'clear', timeOfDay: 'day' },
            events: []
          },
          characterRelationships: [],
          locationContext: {
            currentLocation: 'unknown',
            nearbyCharacters: [],
            environmentalFactors: []
          },
          recentActions: [],
          worldRules: []
        },
        prompt: promptForAI,
        timestamp: new Date().toISOString(),
        maxTokens: request.maxTokens || 500,
        temperature: request.temperature || 0.7
      }

      // Use real AI service adapter (with type assertion to bypass complex type checking)
      const response = await aiServiceAdapter.processAction(aiRequest as any)

      return {
        content: response.consequences?.[0]?.description || response.content || 'No response generated',
        usage: response.tokenUsage ? {
          promptTokens: response.tokenUsage.promptTokens,
          completionTokens: response.tokenUsage.completionTokens,
          totalTokens: response.tokenUsage.totalTokens
        } : undefined,
        model: response.model
      }
    } catch (error) {
      console.error('AI dialogue generation error:', error)
      return {
        content: 'I apologize, but I\'m having trouble thinking of a response right now.',
        usage: undefined,
        model: 'error'
      }
    }
  }
}

const dialogueService = new DialogueService(aiServiceAdapterForDialogue)

/**
 * Generate dialogue for NPC character
 * POST /api/dialogue/generate
 */
router.post('/generate', createRateLimiter(), async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = validateDialogueRequest(req.body)
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validationResult.errors
      })
    }

    const dialogueRequest: DialogueRequest = req.body

    // Add request metadata for performance tracking
    const startTime = Date.now()

    // Generate dialogue using DialogueService
    const dialogueResponse = await dialogueService.generateDialogue(dialogueRequest)

    // Log generation metrics
    const generationTime = Date.now() - startTime
    console.log(`Dialogue generated in ${generationTime}ms for character ${dialogueRequest.characterId}`)

    // Return successful response
    res.json({
      success: true,
      data: dialogueResponse,
      metadata: {
        generationTime,
        requestId: `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dialogue generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Dialogue generation failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
})

/**
 * Batch dialogue generation for multiple NPCs
 * POST /api/dialogue/batch-generate
 */
router.post('/batch-generate', createRateLimiter(), async (req: Request, res: Response) => {
  try {
    const { requests }: { requests: DialogueRequest[] } = req.body

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'requests must be a non-empty array'
      })
    }

    if (requests.length > 10) {
      return res.status(400).json({
        error: 'Too many requests',
        message: 'Maximum 10 dialogue requests per batch'
      })
    }

    // Validate all requests
    const validationResults = requests.map(request => validateDialogueRequest(request))
    const invalidRequests = validationResults.filter(result => !result.isValid)

    if (invalidRequests.length > 0) {
      return res.status(400).json({
        error: 'Invalid requests found',
        details: invalidRequests.flatMap(result => result.errors)
      })
    }

    // Generate dialogues in parallel
    const startTime = Date.now()
    const batchPromises = requests.map(request =>
      dialogueService.generateDialogue(request)
    )

    const responses = await Promise.allSettled(batchPromises)
    const generationTime = Date.now() - startTime

    // Process results
    const results = responses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          success: true,
          data: result.value,
          requestId: requests[index].characterId
        }
      } else {
        return {
          success: false,
          error: result.reason.message,
          requestId: requests[index].characterId
        }
      }
    })

    res.json({
      success: true,
      data: results,
      metadata: {
        totalRequests: requests.length,
        successfulRequests: results.filter(r => r.success).length,
        failedRequests: results.filter(r => !r.success).length,
        generationTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Batch dialogue generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Batch dialogue generation failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
})

/**
 * Get dialogue suggestions for a character
 * POST /api/dialogue/suggestions
 */
router.post('/suggestions', createRateLimiter(), async (req: Request, res: Response) => {
  try {
    const { characterId, playerId, context } = req.body

    if (!characterId || !playerId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['characterId', 'playerId']
      })
    }

    // This would integrate with MemoryAnalyzer service
    const suggestions = {
      topics: [
        {
          topic: 'Ask about recent activities',
          relevanceScore: 0.9,
          emotionalTone: 'friendly' as const
        },
        {
          topic: 'Mention shared location',
          relevanceScore: 0.7,
          emotionalTone: 'neutral' as const
        }
      ],
      conversationStarters: [
        'Hello again! How have you been?',
        'I was just thinking about our last conversation.',
        'Something interesting happened recently...'
      ],
      emotionalContext: {
        recommendedTone: 'friendly',
        confidence: 0.8
      }
    }

    res.json({
      success: true,
      data: suggestions,
      metadata: {
        characterId,
        playerId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dialogue suggestions error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
})

/**
 * Get dialogue history for a character-player pair
 * GET /api/dialogue/history/:characterId/:playerId
 */
router.get('/history/:characterId/:playerId', createRateLimiter(), async (req: Request, res: Response) => {
  try {
    const { characterId, playerId } = req.params
    const { limit = 20, offset = 0 } = req.query

    // This would integrate with existing CharacterService from Story 4.1
    const history = {
      characterId,
      playerId,
      conversations: [
        {
          id: 'conv_1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          dialogue: 'Hello there! How are you doing today?',
          emotionalTone: 'friendly' as const,
          personalityScore: 0.95
        },
        {
          id: 'conv_2',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          dialogue: 'Good to see you again!',
          emotionalTone: 'friendly' as const,
          personalityScore: 0.88
        }
      ],
      total: 2,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }

    res.json({
      success: true,
      data: history,
      metadata: {
        characterId,
        playerId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dialogue history error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dialogue history',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
})

/**
 * Submit dialogue feedback for improvement
 * POST /api/dialogue/feedback
 */
router.post('/feedback', createRateLimiter(), async (req: Request, res: Response) => {
  try {
    const {
      dialogueId,
      characterId,
      playerId,
      dialogue,
      rating, // 1-5 scale
      feedback,
      issues = []
    } = req.body

    if (!dialogueId || !characterId || !playerId || !dialogue || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['dialogueId', 'characterId', 'playerId', 'dialogue', 'rating']
      })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      })
    }

    // Log feedback for analysis and improvement
    console.log('Dialogue feedback received:', {
      dialogueId,
      characterId,
      playerId,
      rating,
      feedback,
      issues,
      timestamp: new Date().toISOString()
    })

    // In a real implementation, this would:
    // 1. Store feedback in database
    // 2. Update character personality models
    // 3. Improve dialogue generation algorithms
    // 4. Track feedback metrics

    res.json({
      success: true,
      message: 'Feedback received successfully',
      data: {
        dialogueId,
        feedbackRecorded: true,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dialogue feedback error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process feedback',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
})

export default router