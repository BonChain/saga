import { Request, Response, NextFunction } from 'express';
import { createButterflyEffectLogger } from '../utils/butterfly-effect-logger';

const logger = createButterflyEffectLogger('MonitoringMiddleware');

/**
 * Request monitoring middleware to track API performance and health
 */
export function requestMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request details
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: () => void): Response {
    const duration = Date.now() - startTime;

    // Log response details
    if (res.statusCode >= 400) {
      logger.error('Request completed with error', new Error(`HTTP ${res.statusCode}`), {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    } else {
      logger.info('Request completed successfully', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }

    // Call original end with proper return type
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}

/**
 * System health monitoring
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  services: {
    storage: boolean;
    ai: boolean;
    database: boolean;
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

// Simple metrics tracking
let requestMetrics = {
  totalRequests: 0,
  totalResponseTime: 0,
  errorCount: 0,
  lastMinuteRequests: 0,
  lastMinuteReset: Date.now()
};

/**
 * Get current system health status
 */
export function getHealthStatus(): HealthStatus {
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = memUsage.heapTotal > 0
    ? (memUsage.heapUsed / memUsage.heapTotal) * 100
    : 0;

  // Calculate simple metrics
  const now = Date.now();
  if (now - requestMetrics.lastMinuteReset > 60000) {
    requestMetrics.lastMinuteRequests = 0;
    requestMetrics.lastMinuteReset = now;
  }

  const averageResponseTime = requestMetrics.totalRequests > 0
    ? requestMetrics.totalResponseTime / requestMetrics.totalRequests
    : 0;

  const errorRate = requestMetrics.totalRequests > 0
    ? (requestMetrics.errorCount / requestMetrics.totalRequests) * 100
    : 0;

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (errorRate > 10 || memoryUsagePercent > 90) {
    status = 'unhealthy';
  } else if (errorRate > 5 || memoryUsagePercent > 75) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round(memoryUsagePercent * 100) / 100
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000 // Simple approximation
    },
    services: {
      storage: true, // Could be enhanced with actual health checks
      ai: true,
      database: true
    },
    performance: {
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      requestsPerMinute: requestMetrics.lastMinuteRequests,
      errorRate: Math.round(errorRate * 100) / 100
    }
  };
}

/**
 * Enhanced health check endpoint middleware
 */
export function healthCheck(req: Request, res: Response): void {
  try {
    const health = getHealthStatus();

    // Update metrics
    requestMetrics.lastMinuteRequests++;

    const statusCode = health.status === 'unhealthy' ? 503 :
                      health.status === 'degraded' ? 200 : 200;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health,
      checks: {
        memory: health.memory.percentage < 80,
        cpu: health.cpu.usage < 80,
        errorRate: health.performance.errorRate < 5,
        responseTime: health.performance.averageResponseTime < 1000
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      error: 'Health check unavailable',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Metrics collection middleware
 */
export function collectMetrics(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  requestMetrics.totalRequests++;

  // Track completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    requestMetrics.totalResponseTime += duration;

    if (res.statusCode >= 400) {
      requestMetrics.errorCount++;
    }

    logger.debug('Request metrics collected', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      totalRequests: requestMetrics.totalRequests,
      errorCount: requestMetrics.errorCount
    });
  });

  next();
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    logger.warn(`Received ${signal}, starting graceful shutdown`);

    // Close server, database connections, etc.
    logger.info('Graceful shutdown completed');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason as Error);
    shutdown('unhandledRejection');
  });
}