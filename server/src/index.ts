import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import storage components
import { StorageManager, StorageManagerConfig } from './storage/StorageManager';
import { WalrusConfig, BackupConfig, ValidationConfig, LoggerConfig } from './types/storage';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Initialize world rules on startup
storageManager.initializeWorldRules().catch(error => {
  console.error('Failed to initialize world rules:', error);
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
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
    endpoints: {
      health: '/health',
      storage: {
        worldRules: '/api/storage/world-rules',
        actions: '/api/storage/actions',
        worldState: '/api/storage/world-state',
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
app.post('/api/storage/actions', async (req, res) => {
  try {
    const { playerId, intent, originalInput, parsedIntent } = req.body;

    if (!playerId || !intent || !originalInput) {
      return res.status(400).json({
        success: false,
        error: 'playerId, intent, and originalInput are required'
      });
    }

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

app.get('/api/storage/actions', async (req, res) => {
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

app.put('/api/storage/actions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, consequences } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

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

app.post('/api/storage/world-state', async (req, res) => {
  try {
    const modifications = req.body;

    if (!modifications || typeof modifications !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Modifications object is required'
      });
    }

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SuiSaga server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;