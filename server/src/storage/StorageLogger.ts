import { promises as fs } from 'fs'
import path from 'path'
import { StorageLog } from '../types/storage'

export interface LoggerConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  logToFile: boolean
  logToConsole: boolean
  logDirectory: string
  maxLogFileSize: number // bytes
  maxLogFiles: number
  structuredLogging: boolean
  includeMetadata: boolean
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  layer: 'blueprint' | 'queue' | 'state' | 'system'
  operation: string
  id?: string
  message: string
  duration?: number
  success?: boolean
  error?: string
  metadata?: Record<string, any>
  stack?: string
}

export interface LogStats {
  totalLogs: number
  logsByLevel: Record<string, number>
  logsByLayer: Record<string, number>
  logsByOperation: Record<string, number>
  averageDuration: number
  errorRate: number
  lastLogTime: string
  oldestLogTime: string
}

export class StorageLogger {
  private readonly config: LoggerConfig
  private logs: LogEntry[] = []
  private currentLogFile: string = ''

  constructor(config: LoggerConfig) {
    this.config = config
    this.initializeLogger()
  }

  /**
   * Log a storage operation
   */
  logOperation(
    level: 'debug' | 'info' | 'warn' | 'error',
    layer: 'blueprint' | 'queue' | 'state' | 'system',
    operation: string,
    message: string,
    metadata?: {
      id?: string
      duration?: number
      success?: boolean
      error?: string
      metadata?: Record<string, any>
      stack?: string
    }
  ): void {
    if (!this.config.enabled) return

    // Check log level
    if (!this.shouldLog(level)) return

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      layer,
      operation,
      id: metadata?.id,
      message,
      duration: metadata?.duration,
      success: metadata?.success,
      error: metadata?.error,
      metadata: this.config.includeMetadata ? metadata?.metadata : undefined,
      stack: metadata?.stack
    }

    // Add to memory
    this.addToMemory(logEntry)

    // Log to console
    if (this.config.logToConsole) {
      this.logToConsole(logEntry)
    }

    // Log to file
    if (this.config.logToFile) {
      this.logToFile(logEntry)
    }
  }

  /**
   * Log storage operation from StorageLog interface
   */
  logStorageOperation(storageLog: StorageLog): void {
    const level = storageLog.success ? 'info' : 'error'
    const message = storageLog.success
      ? `${storageLog.operation} completed successfully`
      : `${storageLog.operation} failed: ${storageLog.error}`

    this.logOperation(level, storageLog.layer, storageLog.operation, message, {
      id: storageLog.id,
      duration: storageLog.duration,
      success: storageLog.success,
      error: storageLog.error,
      metadata: storageLog.metadata
    })
  }

  /**
   * Log debug message
   */
  debug(
    layer: 'blueprint' | 'queue' | 'state' | 'system',
    operation: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.logOperation('debug', layer, operation, message, { metadata })
  }

  /**
   * Log info message
   */
  info(
    layer: 'blueprint' | 'queue' | 'state' | 'system',
    operation: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.logOperation('info', layer, operation, message, { metadata })
  }

  /**
   * Log warning message
   */
  warn(
    layer: 'blueprint' | 'queue' | 'state' | 'system',
    operation: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.logOperation('warn', layer, operation, message, { metadata })
  }

  /**
   * Log error message
   */
  error(
    layer: 'blueprint' | 'queue' | 'state' | 'system',
    operation: string,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.logOperation('error', layer, operation, message, {
      error: error?.message,
      stack: error?.stack,
      metadata
    })
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit)
  }

  /**
   * Get logs by layer
   */
  getLogsByLayer(layer: 'blueprint' | 'queue' | 'state' | 'system', limit?: number): LogEntry[] {
    const filteredLogs = this.logs.filter(log => log.layer === layer)
    return limit ? filteredLogs.slice(-limit) : filteredLogs
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: 'debug' | 'info' | 'warn' | 'error', limit?: number): LogEntry[] {
    const filteredLogs = this.logs.filter(log => log.level === level)
    return limit ? filteredLogs.slice(-limit) : filteredLogs
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit?: number): LogEntry[] {
    return this.getLogsByLevel('error', limit)
  }

  /**
   * Get logs for a specific operation
   */
  getLogsByOperation(operation: string, limit?: number): LogEntry[] {
    const filteredLogs = this.logs.filter(log => log.operation === operation)
    return limit ? filteredLogs.slice(-limit) : filteredLogs
  }

  /**
   * Get logs for a specific ID
   */
  getLogsById(id: string): LogEntry[] {
    return this.logs.filter(log => log.id === id)
  }

  /**
   * Get logs within time range
   */
  getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp)
      return logTime >= startTime && logTime <= endTime
    })
  }

  /**
   * Get logging statistics
   */
  getStats(): LogStats {
    if (this.logs.length === 0) {
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByLayer: {},
        logsByOperation: {},
        averageDuration: 0,
        errorRate: 0,
        lastLogTime: '',
        oldestLogTime: ''
      }
    }

    const logsByLevel = this.groupByCount(this.logs, 'level')
    const logsByLayer = this.groupByCount(this.logs, 'layer')
    const logsByOperation = this.groupByCount(this.logs, 'operation')

    const errorLogs = this.logs.filter(log => log.level === 'error')
    const errorRate = (errorLogs.length / this.logs.length) * 100

    const durationsWithValues = this.logs
      .filter(log => log.duration !== undefined)
      .map(log => log.duration!)
    const averageDuration = durationsWithValues.length > 0
      ? durationsWithValues.reduce((sum, duration) => sum + duration, 0) / durationsWithValues.length
      : 0

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      logsByLayer,
      logsByOperation,
      averageDuration,
      errorRate,
      lastLogTime: this.logs[this.logs.length - 1].timestamp,
      oldestLogTime: this.logs[0].timestamp
    }
  }

  /**
   * Export logs to file
   */
  async exportLogs(filePath: string, format: 'json' | 'csv' = 'json'): Promise<{ success: boolean, error?: string }> {
    try {
      const exportData = format === 'json'
        ? JSON.stringify(this.logs, null, 2)
        : this.convertToCSV(this.logs)

      await fs.writeFile(filePath, exportData, 'utf8')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clear memory logs
   */
  clearMemoryLogs(): void {
    this.logs = []
  }

  /**
   * Get performance metrics for operations
   */
  getPerformanceMetrics(): Record<string, {
    count: number
    averageDuration: number
    minDuration: number
    maxDuration: number
    successRate: number
  }> {
    const metrics: Record<string, any> = {}

    // Group logs by operation
    const operationGroups = this.groupBy(this.logs, 'operation')

    Object.entries(operationGroups).forEach(([operation, operationLogs]) => {
      const durations = operationLogs
        .filter(log => log.duration !== undefined)
        .map(log => log.duration!)

      if (durations.length > 0) {
        const successCount = operationLogs.filter(log => log.success === true).length
        const totalCount = operationLogs.length

        metrics[operation] = {
          count: totalCount,
          averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          successRate: (successCount / totalCount) * 100
        }
      }
    })

    return metrics
  }

  /**
   * Create a log report
   */
  createLogReport(): {
    summary: LogStats
    performance: Record<string, any>
    recentErrors: LogEntry[]
    slowOperations: LogEntry[]
    recommendations: string[]
  } {
    const summary = this.getStats()
    const performance = this.getPerformanceMetrics()
    const recentErrors = this.getErrorLogs(10)
    const slowOperations = this.logs
      .filter(log => log.duration && log.duration > 1000) // Operations taking more than 1 second
      .slice(-10)

    const recommendations = this.generateRecommendations(summary, performance)

    return {
      summary,
      performance,
      recentErrors,
      slowOperations,
      recommendations
    }
  }

  /**
   * Search logs by text
   */
  searchLogs(query: string, caseSensitive: boolean = false): LogEntry[] {
    const searchQuery = caseSensitive ? query : query.toLowerCase()

    return this.logs.filter(log => {
      const searchText = caseSensitive
        ? `${log.message} ${log.operation} ${log.error || ''}`
        : `${log.message} ${log.operation} ${log.error || ''}`.toLowerCase()

      return searchText.includes(searchQuery)
    })
  }

  private async initializeLogger(): Promise<void> {
    if (!this.config.enabled) return

    try {
      if (this.config.logToFile) {
        await fs.mkdir(this.config.logDirectory, { recursive: true })
        this.rotateLogFile()
      }
    } catch (error) {
      console.error('Failed to initialize logger:', error)
    }
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const configLevel = levels.indexOf(this.config.logLevel)
    const messageLevel = levels.indexOf(level)

    return messageLevel >= configLevel
  }

  private addToMemory(logEntry: LogEntry): void {
    this.logs.push(logEntry)

    // Keep only last 10000 logs in memory
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000)
    }
  }

  private logToConsole(logEntry: LogEntry): void {
    const timestamp = new Date(logEntry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.layer.toUpperCase()}] [${logEntry.operation}]`

    const message = this.config.structuredLogging
      ? `${prefix} ${JSON.stringify(logEntry, null, 2)}`
      : `${prefix} ${logEntry.message}${logEntry.duration ? ` (${logEntry.duration}ms)` : ''}`

    switch (logEntry.level) {
      case 'debug':
        console.debug(message)
        break
      case 'info':
        console.info(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'error':
        console.error(message)
        if (logEntry.stack) {
          console.error(logEntry.stack)
        }
        break
    }
  }

  private async logToFile(logEntry: LogEntry): Promise<void> {
    try {
      // Check if we need to rotate the log file
      await this.checkAndRotateLogFile()

      const logLine = this.config.structuredLogging
        ? JSON.stringify(logEntry) + '\n'
        : `${logEntry.timestamp} [${logEntry.level.toUpperCase()}] [${logEntry.layer.toUpperCase()}] [${logEntry.operation}] ${logEntry.message}${logEntry.duration ? ` (${logEntry.duration}ms)` : ''}${logEntry.error ? ` - Error: ${logEntry.error}` : ''}\n`

      await fs.appendFile(this.currentLogFile, logLine, 'utf8')
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }

  private async checkAndRotateLogFile(): Promise<void> {
    try {
      if (!this.currentLogFile) {
        this.rotateLogFile()
        return
      }

      const stats = await fs.stat(this.currentLogFile)
      if (stats.size >= this.config.maxLogFileSize) {
        await this.rotateLogFile()
      }
    } catch (error) {
      // File might not exist, create a new one
      this.rotateLogFile()
    }
  }

  private rotateLogFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.currentLogFile = path.join(this.config.logDirectory, `storage_${timestamp}.log`)
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  private groupByCount<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = (groups[group] || 0) + 1
      return groups
    }, {} as Record<string, number>)
  }

  private convertToCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'layer', 'operation', 'id', 'message', 'duration', 'success', 'error']
    const csvRows = [headers.join(',')]

    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.level,
        log.layer,
        log.operation,
        log.id || '',
        `"${log.message.replace(/"/g, '""')}"`,
        log.duration || '',
        log.success || '',
        `"${(log.error || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

  private generateRecommendations(summary: LogStats, performance: Record<string, any>): string[] {
    const recommendations: string[] = []

    if (summary.errorRate > 10) {
      recommendations.push(`High error rate detected (${summary.errorRate.toFixed(1)}%). Consider reviewing error logs.`)
    }

    if (summary.averageDuration > 500) {
      recommendations.push(`Average operation duration is high (${summary.averageDuration.toFixed(0)}ms). Consider optimization.`)
    }

    Object.entries(performance).forEach(([operation, metrics]) => {
      if (metrics.successRate < 90) {
        recommendations.push(`Low success rate for ${operation} (${metrics.successRate.toFixed(1)}%). Review this operation.`)
      }

      if (metrics.averageDuration > 2000) {
        recommendations.push(`${operation} operation is slow (avg: ${metrics.averageDuration.toFixed(0)}ms). Consider optimization.`)
      }
    })

    if (Object.keys(summary.logsByOperation).length > 20) {
      recommendations.push('High variety of operations detected. Consider consolidating similar operations.')
    }

    return recommendations
  }
}