/**
 * Structured Logging Infrastructure for Butterfly Effect Services
 *
 * Replaces console.log statements with Winston-based structured logging
 * for better production monitoring, debugging, and performance analysis.
 */

import winston from 'winston'

export interface LogContext {
  service?: string
  actionId?: string
  playerId?: string
  consequenceId?: string
  cascadeId?: string
  provider?: string
  performance?: {
    startTime?: number
    duration?: number
    memoryUsage?: number
    endTime?: number
    timerName?: string
  }
  [key: string]: any
}

/**
 * Enhanced Logger for Butterfly Effect Services
 */
export class ButterflyEffectLogger {
  private logger: winston.Logger
  private serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
    this.logger = this.createLogger()
  }

  private createLogger(): winston.Logger {
    const logLevel = process.env.LOG_LEVEL || 'info'
    const enableConsoleLogging = process.env.LOG_TO_CONSOLE !== 'false'
    const enableFileLogging = process.env.LOG_TO_FILE === 'true'

    const transports: winston.transport[] = []

    // Console transport for development
    if (enableConsoleLogging) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level.toUpperCase()}] [${service}] ${message} ${metaStr}`;
            })
          )
        })
      )
    }

    // File transports for production
    if (enableFileLogging) {
      const logDir = process.env.LOG_DIRECTORY || './logs'

      transports.push(
        // Error log file
        new winston.transports.File({
          filename: `${logDir}/butterfly-effect-error.log`,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        // Combined log file
        new winston.transports.File({
          filename: `${logDir}/butterfly-effect-combined.log`,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      )
    }

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: this.serviceName,
        version: '1.0.0'
      },
      transports,
      // Handle uncaught exceptions
      exceptionHandlers: enableFileLogging ? [
        new winston.transports.File({
          filename: `${process.env.LOG_DIRECTORY || './logs'}/butterfly-effect-exceptions.log`
        })
      ] : [],
      // Handle unhandled promise rejections
      rejectionHandlers: enableFileLogging ? [
        new winston.transports.File({
          filename: `${process.env.LOG_DIRECTORY || './logs'}/butterfly-effect-rejections.log`
        })
      ] : []
    })
  }

  /**
   * Log info message with context
   */
  info(message: string, context: LogContext = {}): void {
    this.logger.info(message, {
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log warning message with context
   */
  warn(message: string, context: LogContext = {}): void {
    this.logger.warn(message, {
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log error message with context and error details
   */
  error(message: string, error?: Error | unknown, context: LogContext = {}): void {
    const errorContext = error instanceof Error
      ? {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        }
      : { error: String(error) }

    this.logger.error(message, {
      ...context,
      ...errorContext,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log debug message with context
   */
  debug(message: string, context: LogContext = {}): void {
    this.logger.debug(message, {
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Performance logging helper
   */
  logPerformance(operation: string, startTime: number, additionalContext: LogContext = {}): void {
    const duration = Date.now() - startTime
    this.info(`Performance: ${operation}`, {
      ...additionalContext,
      performance: {
        ...additionalContext.performance,
        duration,
        startTime,
        endTime: Date.now()
      }
    })
  }

  /**
   * AI operation logging helper
   */
  logAIOperation(operation: string, provider: string, context: LogContext = {}): void {
    this.info(`AI Operation: ${operation}`, {
      ...context,
      provider,
      operationType: 'ai'
    })
  }

  /**
   * Cascade processing logging helper
   */
  logCascadeOperation(operation: string, context: LogContext = {}): void {
    this.info(`Cascade: ${operation}`, {
      ...context,
      operationType: 'cascade'
    })
  }

  /**
   * Memory usage logging helper
   */
  logMemoryUsage(context: LogContext = {}): void {
    const memoryUsage = process.memoryUsage()
    this.info('Memory Usage', {
      ...context,
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      }
    })
  }

  /**
   * Create child logger with additional default context
   */
  child(defaultContext: Partial<LogContext>): ButterflyEffectLogger {
    const childLogger = Object.create(this)
    childLogger.logger = this.logger.child(defaultContext)
    return childLogger
  }

  /**
   * Get the underlying Winston logger for advanced usage
   */
  getWinstonLogger(): winston.Logger {
    return this.logger
  }
}

/**
 * Factory function to create loggers for different services
 */
export function createButterflyEffectLogger(serviceName: string): ButterflyEffectLogger {
  return new ButterflyEffectLogger(serviceName)
}

/**
 * Pre-configured loggers for common services
 */
export const cascadeLogger = createButterflyEffectLogger('CascadeProcessor')
export const consequenceLogger = createButterflyEffectLogger('ConsequenceGenerator')
export const aiServiceLogger = createButterflyEffectLogger('AIServiceAdapter')
export const worldStateLogger = createButterflyEffectLogger('WorldStateUpdater')

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  static startTimer(name: string): void {
    this.timers.set(name, Date.now())
  }

  static endTimer(name: string, logger: ButterflyEffectLogger, context: LogContext = {}): number {
    const startTime = this.timers.get(name)
    if (!startTime) {
      logger.warn(`Timer '${name}' was not started`, context)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(name)

    logger.logPerformance(name, startTime, {
      ...context,
      performance: {
        ...context.performance,
        duration,
        timerName: name
      }
    })

    return duration
  }

  static measure<T>(
    name: string,
    fn: () => T,
    logger: ButterflyEffectLogger,
    context: LogContext = {}
  ): T {
    this.startTimer(name)
    try {
      const result = fn()
      this.endTimer(name, logger, context)
      return result
    } catch (error) {
      this.endTimer(name, logger, { ...context, error: String(error) })
      throw error
    }
  }

  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    logger: ButterflyEffectLogger,
    context: LogContext = {}
  ): Promise<T> {
    this.startTimer(name)
    try {
      const result = await fn()
      this.endTimer(name, logger, context)
      return result
    } catch (error) {
      this.endTimer(name, logger, { ...context, error: String(error) })
      throw error
    }
  }
}