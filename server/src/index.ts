import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { validateInput, commonSchemas, securityHeaders, rateLimit } from './middleware/input-validation';
import { requestMonitor, collectMetrics, healthCheck, setupGracefulShutdown } from './middleware/monitoring';

// Load environment variables
dotenv.config();

// Import storage components
import { StorageManager, StorageManagerConfig } from './storage/storage-manager';
import { WalrusConfig, BackupConfig, ValidationConfig, LoggerConfig } from './types/storage';

// Import Story 2.2 Intent Parser
import { intentParser } from './services/intent-parser';

// Import Authentication and Character Services
import { createAuthService } from './services/auth-service';
import { createAuthRoutes } from './routes/api/auth';
import { createCharacterRoutes } from './routes/api/characters';
import { CharacterService } from './services/character-service';
import { ParsedIntent } from './types/storage';
import { IntentParseResult } from './services/intent-parser';

// Import Dialogue Service for Story 4.2
import { DialogueService } from './services/DialogueService';
import dialogueRoutes from './routes/api/dialogue';
import { createLogger, format, transports } from 'winston';

// Type definitions for API responses and intent parsing
interface IntentData extends ParsedIntent {
  confidence?: number
  originalInput?: string
  timestamp?: number
}

interface CharacterAPIData {
  id: string
  name: string
  type: string
  personality?: string
  memories?: Array<{
    id: string
    action: string
    description: string
    timestamp: number
    emotionalImpact?: string
  }>
  relationships?: Record<string, {
    scores: {
      friendship: number
      hostility: number
      loyalty: number
      respect: number
      fear: number
      trust: number
    }
    lastInteraction: number
    totalInteractions: number
  }>
}

interface AppError extends Error {
  status?: number
  statusCode?: number
  details?: unknown
}

// Character Service types
interface CreateCharacterRequest {
  name: string
  type: string
  personality?: string
  description?: string
  backstory?: string
  appearance?: Record<string, unknown>
}

interface AddMemoryRequest {
  characterId: string
  action: string
  description: string
  emotionalImpact?: string
  timestamp?: number
  location?: string
}

interface GetCharacterOptions {
  includeMemories?: boolean
  includeRelationships?: boolean
  limit?: number
}

interface UpdateCharacterRequest {
  name?: string
  personality?: string
  description?: string
  backstory?: string
  appearance?: Record<string, unknown>
}

const app = express();
const PORT = process.env.PORT || 3001; // Using port 3001

// Initialize storage configuration (SECURE: Using environment variables)
const storageConfig: StorageManagerConfig = {
  storageBasePath: path.join(__dirname, '../storage'),
  walrus: {
    endpoint: process.env.SUI_FULLNODE_URL || 'https://fullnode.testnet.sui.io:443',
    network: process.env.SUI_NETWORK || 'testnet',
    maxRetries: parseInt(process.env.WALRUS_MAX_RETRIES || '3'),
    timeout: parseInt(process.env.WALRUS_TIMEOUT || '60000'),
    useBackup: process.env.WALRUS_USE_BACKUP === 'true',
    backupPath: path.join(__dirname, '../storage/walrus-backup'),
    sponsoredTransactions: process.env.SPONSORED_TRANSACTIONS === 'true',
    developerPrivateKey: process.env.DEVELOPER_PRIVATE_KEY || '',
    storageEpochs: parseInt(process.env.STORAGE_EPOCHS || '100')
  },
  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    basePath: path.join(__dirname, '../storage/backups'),
    maxBackups: parseInt(process.env.BACKUP_MAX_BACKUPS || '10'),
    compressionEnabled: process.env.BACKUP_COMPRESSION === 'true',
    encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY
  },
  validation: {
    strictMode: process.env.VALIDATION_STRICT === 'true',
    maxActionLength: parseInt(process.env.VALIDATION_MAX_ACTION_LENGTH || '500'),
    maxWorldStateSize: parseInt(process.env.VALIDATION_MAX_STATE_SIZE || '10485760'),
    allowedActionTypes: ['combat', 'social', 'exploration', 'economic', 'creative', 'other'],
    requiredWorldRules: ['physics', 'characterBehavior', 'actionConstraints'],
    checksumAlgorithm: 'sha256',
    enableCrossLayerValidation: true
  },
  logger: {
    enabled: process.env.LOGGING_ENABLED !== 'false',
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logToConsole: process.env.LOG_TO_CONSOLE !== 'false',
    logDirectory: path.join(__dirname, '../storage/logs'),
    maxLogFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760'), // 10MB
    maxLogFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    structuredLogging: process.env.LOG_STRUCTURED === 'true',
    includeMetadata: process.env.LOG_INCLUDE_METADATA !== 'false'
  }
};

// Initialize storage manager
const storageManager = new StorageManager(storageConfig);

// Initialize world rules and world state on startup
storageManager.initializeWorldRules().catch(error => {
  console.error('Failed to initialize world rules:', error);
});

storageManager.initializeWorldState().catch(error => {
  console.error('Failed to initialize world state:', error);
});

// Security and monitoring middleware
app.use(helmet());
app.use(cors());
app.use(securityHeaders);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply monitoring and metrics collection
app.use(requestMonitor);
app.use(collectMetrics);

// Apply rate limiting to all API routes
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests from this IP' }));

// Enhanced health check endpoint
app.get('/health', healthCheck);

// Basic health check for backward compatibility
app.get('/health/basic', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'suisaga-server',
    uptime: process.uptime(),
    storage: {
      initialized: true,
      layers: ['blueprint', 'queue', 'state']
    }
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'SuiSaga Living World API',
    version: '1.0.0',
    authentication: {
      type: 'JWT Wallet-based Authentication',
      endpoints: {
        challenge: '/api/auth/challenge',
        authenticate: '/api/auth/authenticate',
        refresh: '/api/auth/refresh',
        validate: '/api/auth/validate'
      },
      usage: 'Get challenge with wallet address -> Sign message -> Authenticate to get JWT token'
    },
    endpoints: {
      health: '/health',
      authentication: '/api/auth',
      characters: '/api/characters',
      actions: {
        submit: '/api/actions/submit',
        storage: '/api/storage/actions'
      },
      storage: {
        worldRules: '/api/storage/world-rules',
        worldState: '/api/storage/world-state',
        worldStateRegions: '/api/storage/world-state/regions',
        worldStateCharacters: '/api/storage/world-state/characters',
        worldStateHistory: '/api/storage/world-state/history',
        system: '/api/storage/system'
      }
    }
  });
});

// STORAGE API ROUTES

// Layer 1: World Rules
app.get('/api/storage/world-rules', async (req, res) => {
  try {
    const result = await storageManager.getWorldRules();
    if (result.success) {
      res.json({
        success: true,
        data: result.rules
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/world-rules/butterfly-effects', async (req, res) => {
  try {
    const { trigger } = req.query;
    if (!trigger) {
      return res.status(400).json({
        success: false,
        error: 'Trigger parameter is required'
      });
    }

    const result = await storageManager.getButterflyEffects(trigger as string);
    if (result.success) {
      res.json({
        success: true,
        data: result.effects
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Layer 2: Actions
app.post('/api/storage/actions', validateInput(commonSchemas.submitAction), async (req, res) => {
  try {
    const { playerId, intent, originalInput, parsedIntent } = req.body;

    const result = await storageManager.submitAction(playerId, intent, originalInput, parsedIntent);
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.action
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Natural Language Action Submission (Story 2.1)
app.post('/api/actions/submit', validateInput(commonSchemas.submitAction), async (req, res) => {
  try {
    const { playerId, intent, originalInput, parsedIntent } = req.body;

    // Story 2.2: Parse intent using IntentParser service
    let parsedIntentResult: IntentParseResult;
    let finalParsedIntent: IntentData;

    if (parsedIntent && parsedIntent.actionType) {
      // Use provided parsedIntent
      finalParsedIntent = parsedIntent;
      console.log(`[PARSER] Using provided parsedIntent: ${JSON.stringify(parsedIntent)}`);
    } else {
      // Parse intent using our IntentParser
      console.log(`[PARSER] Parsing intent for: "${originalInput.substring(0, 100)}"`);
      parsedIntentResult = intentParser.parseIntent(originalInput);

      if (!parsedIntentResult.success || !parsedIntentResult.parsedIntent) {
        // R-002 Mitigation: Low confidence parsing - provide fallback or error
        const errorMessage = parsedIntentResult.error || 'Failed to parse intent';
        console.log(`[PARSER] Intent parsing failed: ${errorMessage}`);

        if (parsedIntentResult.fallback) {
          // Create fallback parsedIntent with confidence below threshold
          finalParsedIntent = {
            actionType: 'other',
            urgency: 'medium',
            timestamp: Date.now(),
            confidence: parsedIntentResult.confidence
          };
          console.log(`[PARSER] Using fallback intent with confidence: ${parsedIntentResult.confidence}`);
        } else {
          return res.status(400).json({
            success: false,
            error: errorMessage,
            requiresClarification: true,
            message: 'Could not understand your action. Please be more specific.'
          });
        }
      } else {
        // Use successfully parsed intent
        finalParsedIntent = parsedIntentResult.parsedIntent;
        console.log(`[PARSER] Successfully parsed intent: actionType=${finalParsedIntent.actionType}, target=${finalParsedIntent.target}, confidence=${(parsedIntentResult.confidence * 100).toFixed(1)}%`);
      }
    }

    // Log action submission
    console.log(`[ACTION] Player ${playerId} submitted action: ${intent.substring(0, 100)}`);

    // Submit action to storage manager with parsed intent
    const result = await storageManager.submitAction(
      playerId,
      intent.trim(),
      originalInput.trim(),
      finalParsedIntent
    );

    if (result.success) {
      // Story 2.3: Enhanced immediate confirmation response (AC 1)
      const confirmationData = {
        id: result.action?.id, // Now uses UUID from StorageManager
        playerId,
        originalInput: originalInput.trim(),
        intent: intent.trim(),
        status: 'received', // Enhanced status: 'received' instead of 'submitted'
        timestamp: new Date().toISOString(),
        message: 'Action received! Processing world changes...', // Exact AC requirement message
        actionDescription: finalParsedIntent?.target ?
          `${finalParsedIntent.actionType} ${finalParsedIntent.target}` :
          finalParsedIntent?.actionType || 'unknown action',
        aiProcessingStatus: 'processing', // Story 2.3: Show AI is working on consequences
        parsedIntent: finalParsedIntent // Include parsed intent for user reference
      };

      console.log(`[ACTION] Action submitted successfully: ${confirmationData.id}`);

      res.status(201).json({
        success: true,
        data: confirmationData
      });
    } else {
      console.error(`[ACTION] Submission failed: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit action'
      });
    }
  } catch (error) {
    console.error('[ACTION] Submit endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    });
  }
});

app.get('/api/storage/actions', validateInput(commonSchemas.pagination), async (req, res) => {
  try {
    const { playerId, status, limit = 50, offset = 0 } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const result = await storageManager.getActions(
      playerId as string,
      status as string,
      limitNum,
      offsetNum
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.actions,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: result.actions?.length || 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/actions/pending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);

    const result = await storageManager.getPendingActions(limitNum);
    if (result.success) {
      res.json({
        success: true,
        data: result.actions
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/storage/actions/:id/status', validateInput(commonSchemas.statusUpdate), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, consequences } = req.body;

    const result = await storageManager.updateActionStatus(id, status, consequences);
    if (result.success) {
      res.json({
        success: true,
        data: result.action
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Story 2.3: Recent Actions endpoint for immediate confirmation UI
app.get('/api/actions/recent', async (req, res) => {
  try {
    const { playerId, minutes = 60, limit = 20 } = req.query;

    const minutesNum = parseInt(minutes as string);
    const limitNum = parseInt(limit as string);
    const timeAgo = new Date(Date.now() - minutesNum * 60 * 1000).toISOString();

    // Get all actions and filter by time
    const result = await storageManager.getActions(
      playerId as string,
      null, // No status filter
      100,  // Get more than needed for filtering
      0
    );

    if (result.success) {
      // Filter actions from the last N minutes
      const recentActions = result.actions?.filter(action =>
        new Date(action.timestamp) >= new Date(timeAgo)
      ).slice(0, limitNum) || [];

      // Add enhanced status for UI display (Story 2.3)
      const enhancedActions = recentActions.map(action => ({
        ...action,
        timeSinceSubmission: Math.floor((Date.now() - new Date(action.timestamp).getTime()) / 1000),
        statusDisplay: action.status === 'pending' ? 'AI is processing...' : action.status
      }));

      res.json({
        success: true,
        data: enhancedActions,
        meta: {
          timeRange: `Last ${minutesNum} minutes`,
          total: enhancedActions.length,
          playerId: playerId || 'all players'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Layer 3: World State
app.get('/api/storage/world-state', async (req, res) => {
  try {
    const result = await storageManager.getCurrentWorldState();
    if (result.success) {
      res.json({
        success: true,
        data: result.state
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/storage/world-state', validateInput(commonSchemas.worldStateModification), async (req, res) => {
  try {
    const modifications = req.body;

    const result = await storageManager.createWorldStateVersion(modifications);
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.state
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/world-state/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);

    const result = await storageManager.getWorldStateHistory(limitNum);
    if (result.success) {
      res.json({
        success: true,
        data: result.states
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Layer 3: World State - Enhanced Endpoints
app.get('/api/storage/world-state/regions', async (req, res) => {
  try {
    const { regionId, type } = req.query;

    const result = await storageManager.getCurrentWorldState();
    if (!result.success || !result.state) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Unable to retrieve world state'
      });
    }

    let regions = result.state.regions;

    // Filter by region ID if specified
    if (regionId) {
      const region = regions[regionId as string];
      if (!region) {
        return res.status(404).json({
          success: false,
          error: `Region '${regionId}' not found`
        });
      }
      regions = { [regionId as string]: region };
    }

    // Filter by type if specified
    if (type) {
      const filteredRegions: Record<string, any> = {};
      Object.entries(regions).forEach(([id, region]) => {
        if (region.type === type) {
          filteredRegions[id] = region;
        }
      });
      regions = filteredRegions;
    }

    res.json({
      success: true,
      data: {
        regions,
        count: Object.keys(regions).length,
        worldVersion: result.state.version,
        timestamp: result.state.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/world-state/characters', async (req, res) => {
  try {
    const { characterId, location } = req.query;

    const result = await storageManager.getCurrentWorldState();
    if (!result.success || !result.state) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Unable to retrieve world state'
      });
    }

    let characters = result.state.characters;

    // Filter by character ID if specified
    if (characterId) {
      const character = characters[characterId as string];
      if (!character) {
        return res.status(404).json({
          success: false,
          error: `Character '${characterId}' not found`
        });
      }
      characters = { [characterId as string]: character };
    }

    // Filter by location if specified
    if (location) {
      const filteredCharacters: Record<string, any> = {};
      Object.entries(characters).forEach(([id, character]) => {
        if (character.location.regionId === location) {
          filteredCharacters[id] = character;
        }
      });
      characters = filteredCharacters;
    }

    // Include relationships data
    const relationships = result.state.relationships || {};

    res.json({
      success: true,
      data: {
        characters,
        relationships,
        count: Object.keys(characters).length,
        worldVersion: result.state.version,
        timestamp: result.state.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/world-state/history/:version', async (req, res) => {
  try {
    const { version } = req.params;
    const versionNum = parseInt(version);

    if (isNaN(versionNum) || versionNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid version number. Must be a positive integer.'
      });
    }

    // Get all states and find the specific version
    const historyResult = await storageManager.getWorldStateHistory(100); // Get more for search
    if (!historyResult.success || !historyResult.states) {
      return res.status(500).json({
        success: false,
        error: historyResult.error || 'Unable to retrieve world state history'
      });
    }

    const targetState = historyResult.states.find(state => state.version === versionNum);
    if (!targetState) {
      return res.status(404).json({
        success: false,
        error: `World state version ${versionNum} not found`,
        availableVersions: historyResult.states.map(s => s.version)
      });
    }

    res.json({
      success: true,
      data: {
        state: targetState,
        isLatest: false,
        timestamp: targetState.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System Management
app.get('/api/storage/system/status', async (req, res) => {
  try {
    const result = await storageManager.getSystemStatus();
    if (result.success) {
      res.json({
        success: true,
        data: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/storage/system/snapshot', async (req, res) => {
  try {
    const result = await storageManager.createDemoSnapshot();
    if (result.success) {
      res.json({
        success: true,
        data: {
          message: 'Demo snapshot created successfully',
          path: result.snapshotPath
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/system/metrics', (req, res) => {
  try {
    const metrics = storageManager.getPerformanceMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/system/logs', (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit as string);
    const logs = storageManager.getRecentLogs(limitNum);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/storage/system/logs/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({
        success: false,
        error: 'Format must be "json" or "csv"'
      });
    }

    const result = await storageManager.exportLogs(format as 'json' | 'csv');
    if (result.success) {
      const filename = `suisaga-logs-${Date.now()}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
      res.send(result.data);
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: AppError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal server error',
      status,
      details: err.details
    }
  });
});

// Setup Authentication and Character Services
console.log('🔐 Setting up authentication services...');

// Create logger for auth services
const authLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Initialize Auth Service
const authService = createAuthService(authLogger);

// Initialize Dialogue Service for Story 4.2
const dialogueService = new DialogueService({} as any);

// Initialize Character Service (basic setup for now)
// TODO: Properly integrate with existing world service
const MockCharacterService = {
  async getAllCharacters(options?: GetCharacterOptions): Promise<CharacterAPIData[]> {
    authLogger.info('CharacterService.getAllCharacters called', { options });
    return [];
  },
  async getCharacter(id: string): Promise<CharacterAPIData | null> {
    authLogger.info('CharacterService.getCharacter called', { id });
    return null;
  },
  async createCharacter(character: CreateCharacterRequest): Promise<CharacterAPIData> {
    authLogger.info('CharacterService.createCharacter called', { character });
    return { id: 'temp_' + Date.now(), type: 'npc', name: character.name, ...character } as CharacterAPIData;
  },
  async addMemory(params: AddMemoryRequest): Promise<{ id: string; success: boolean }> {
    authLogger.info('CharacterService.addMemory called', { params });
    return { id: 'mem_' + Date.now(), success: true };
  },
  async getCharacterMemories(characterId: string, options?: GetCharacterOptions): Promise<CharacterAPIData['memories']> {
    authLogger.info('CharacterService.getCharacterMemories called', { characterId, options });
    return [];
  },
  async updateRelationshipScore(characterId: string, targetId: string, score: number): Promise<void> {
    authLogger.info('CharacterService.updateRelationshipScore called', { characterId, targetId, score });
  },
  async getRelationshipStatus(characterId: string, targetId: string): Promise<any> {
    authLogger.info('CharacterService.getRelationshipStatus called', { characterId, targetId });
    return { characterId, targetId, score: 0 };
  },
  async validateCharacter(character: any): Promise<any> {
    authLogger.info('CharacterService.validateCharacter called', { character });
    return { valid: true, errors: [] };
  },
  async updateCharacter(id: string, updates: any): Promise<any> {
    authLogger.info('CharacterService.updateCharacter called', { id, updates });
    return { id, ...updates };
  }
  // Add other methods as needed
};

const characterService = MockCharacterService as any;

// Setup Authentication Routes
app.use('/api/auth', createAuthRoutes(authService, authLogger));

// Setup Character Routes (with JWT authentication)
app.use('/api/characters', createCharacterRoutes(characterService, authService, authLogger));

// Setup Dialogue Routes for Story 4.2
app.use('/api/dialogue', dialogueRoutes);

console.log('✅ Authentication and character routes configured');

// 404 handler (must be AFTER all other routes)
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

console.log('🔍 About to start server...');

// Start server
try {
  const server = app.listen(PORT, () => {
    console.log(`🚀 SuiSaga server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Enhanced monitoring: http://localhost:${PORT}/health (detailed)`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Setup graceful shutdown
    setupGracefulShutdown();
  });

  server.on('error', (error: any) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

export default app;