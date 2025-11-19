/**
 * Performance monitoring and budget warnings for cascade visualization
 * Monitors metrics and provides warnings when approaching performance limits
 */

import { getCascadeConfig } from '../config/cascade-config';

export interface PerformanceBudget {
  maxNodes: number;
  maxConnections: number;
  maxRenderTime: number;
  maxMemoryUsage: number;
  minFPS: number;
}

export interface PerformanceMetrics {
  nodeCount: number;
  connectionCount: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
  deviceCategory: 'low-end' | 'mid-range' | 'high-end';
}

export interface PerformanceWarning {
  type: PerformanceWarningType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  developerMessage: string;
  recommendation: string;
  currentValue: number;
  budgetValue: number;
}

export const PerformanceWarningType = {
  TOO_MANY_NODES: 'TOO_MANY_NODES',
  TOO_MANY_CONNECTIONS: 'TOO_MANY_CONNECTIONS',
  SLOW_RENDER: 'SLOW_RENDER',
  HIGH_MEMORY: 'HIGH_MEMORY',
  LOW_FPS: 'LOW_FPS'
} as const;

export type PerformanceWarningType = typeof PerformanceWarningType[keyof typeof PerformanceWarningType];

/**
 * Performance budgets for different device categories
 */
const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
  'high-end': {
    maxNodes: 1000,
    maxConnections: 2000,
    maxRenderTime: 50, // ms
    maxMemoryUsage: 100, // MB
    minFPS: 60
  },
  'mid-range': {
    maxNodes: 500,
    maxConnections: 1000,
    maxRenderTime: 75, // ms
    maxMemoryUsage: 75, // MB
    minFPS: 45
  },
  'low-end': {
    maxNodes: 250,
    maxConnections: 500,
    maxRenderTime: 100, // ms
    maxMemoryUsage: 50, // MB
    minFPS: 30
  }
};

// Cache device detection results
let cachedDeviceCategory: 'low-end' | 'mid-range' | 'high-end' | null = null;
let deviceDetectionTimestamp = 0;
const DEVICE_DETECTION_CACHE_TTL = 300000; // 5 minutes

/**
 * Detect device capabilities with caching
 */
function detectDeviceCategory(): 'low-end' | 'mid-range' | 'high-end' {
  const now = Date.now();

  // Return cached result if still valid
  if (cachedDeviceCategory && (now - deviceDetectionTimestamp) < DEVICE_DETECTION_CACHE_TTL) {
    return cachedDeviceCategory;
  }
  // Check for hardware concurrency (CPU cores)
  const cpuCores = navigator.hardwareConcurrency || 4;

  // Check for device memory (Chrome only)
  const deviceMemory = ('deviceMemory' in navigator) ? (navigator.deviceMemory as number) : 4; // GB

  // Check for screen resolution
  const pixelRatio = window.devicePixelRatio || 1;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const totalPixels = screenWidth * screenHeight * pixelRatio;

  // Simple scoring system
  let score = 0;

  if (cpuCores >= 8) score += 3;
  else if (cpuCores >= 4) score += 2;
  else score += 1;

  if (deviceMemory >= 8) score += 3;
  else if (deviceMemory >= 4) score += 2;
  else score += 1;

  if (totalPixels >= 1920 * 1080) score += 2;
  else if (totalPixels >= 1366 * 768) score += 1;

  // Cache and return result
  cachedDeviceCategory = score >= 7 ? 'high-end' : score >= 4 ? 'mid-range' : 'low-end';
  deviceDetectionTimestamp = now;
  return cachedDeviceCategory;
}

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  private deviceCategory: 'low-end' | 'mid-range' | 'high-end';
  private budget: PerformanceBudget;
  private renderStartTime: number = 0;
  private currentFPS: number = 60;
  private callbacks: ((warnings: PerformanceWarning[]) => void)[] = [];

  constructor() {
    this.deviceCategory = detectDeviceCategory();

    // Get configuration override if available
    const config = getCascadeConfig();
    const defaultBudget = PERFORMANCE_BUDGETS[this.deviceCategory];

    // Apply custom performance budget if configured
    this.budget = {
      ...defaultBudget,
      ...(config.performance || {})
    };

    this.initializeFPSMonitoring();
  }

  /**
   * Get current device category and budget
   */
  public getDeviceCategory() {
    return this.deviceCategory;
  }

  public getBudget() {
    return { ...this.budget };
  }

  /**
   * Start measuring render time
   */
  public startRender() {
    this.renderStartTime = performance.now();
  }

  /**
   * End measuring render time and check performance
   */
  public endRender(): PerformanceWarning[] {
    const renderTime = performance.now() - this.renderStartTime;
    const memoryUsage = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      nodeCount: 0, // Will be set by checkPerformance
      connectionCount: 0, // Will be set by checkPerformance
      renderTime,
      memoryUsage,
      fps: this.currentFPS,
      deviceCategory: this.deviceCategory
    };

    return this.checkPerformance(metrics);
  }

  /**
   * Check performance against budgets
   */
  public checkPerformance(metrics: PerformanceMetrics): PerformanceWarning[] {
    const warnings: PerformanceWarning[] = [];

    // Check node count
    if (metrics.nodeCount > this.budget.maxNodes) {
      warnings.push({
        type: PerformanceWarningType.TOO_MANY_NODES,
        severity: metrics.nodeCount > this.budget.maxNodes * 1.5 ? 'critical' : 'high',
        message: 'Large dataset detected. Performance may be significantly affected.',
        developerMessage: `Dataset contains ${metrics.nodeCount} nodes, exceeding budget of ${this.budget.maxNodes}. Consider implementing virtualization.`,
        recommendation: 'Enable virtualization mode or filter data to reduce node count',
        currentValue: metrics.nodeCount,
        budgetValue: this.budget.maxNodes
      });
    } else if (metrics.nodeCount > this.budget.maxNodes * 0.8) {
      warnings.push({
        type: PerformanceWarningType.TOO_MANY_NODES,
        severity: 'medium',
        message: 'Large dataset detected. Performance may be affected.',
        developerMessage: `Dataset contains ${metrics.nodeCount} nodes, approaching budget of ${this.budget.maxNodes}.`,
        recommendation: 'Monitor performance closely with this dataset size',
        currentValue: metrics.nodeCount,
        budgetValue: this.budget.maxNodes
      });
    }

    // Check connection count
    if (metrics.connectionCount > this.budget.maxConnections) {
      warnings.push({
        type: PerformanceWarningType.TOO_MANY_CONNECTIONS,
        severity: 'high',
        message: 'Complex visualization with many connections detected.',
        developerMessage: `Dataset contains ${metrics.connectionCount} connections, exceeding budget of ${this.budget.maxConnections}.`,
        recommendation: 'Consider simplifying the visualization or reducing connection density',
        currentValue: metrics.connectionCount,
        budgetValue: this.budget.maxConnections
      });
    }

    // Check render time
    if (metrics.renderTime > this.budget.maxRenderTime) {
      warnings.push({
        type: PerformanceWarningType.SLOW_RENDER,
        severity: metrics.renderTime > this.budget.maxRenderTime * 2 ? 'critical' : 'high',
        message: metrics.renderTime > this.budget.maxRenderTime * 2 ? 'Very slow rendering detected.' : 'Slow rendering detected.',
        developerMessage: `Render time ${metrics.renderTime.toFixed(2)}ms exceeds budget of ${this.budget.maxRenderTime}ms. Optimize D3 calculations.`,
        recommendation: 'Optimize D3 calculations and consider memoization',
        currentValue: metrics.renderTime,
        budgetValue: this.budget.maxRenderTime
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.budget.maxMemoryUsage) {
      warnings.push({
        type: PerformanceWarningType.HIGH_MEMORY,
        severity: 'medium',
        message: 'High memory usage detected.',
        developerMessage: `Memory usage ${metrics.memoryUsage.toFixed(1)}MB exceeds budget of ${this.budget.maxMemoryUsage}MB.`,
        recommendation: 'Implement memory cleanup and object pooling',
        currentValue: metrics.memoryUsage,
        budgetValue: this.budget.maxMemoryUsage
      });
    }

    // Check FPS
    if (metrics.fps < this.budget.minFPS) {
      warnings.push({
        type: PerformanceWarningType.LOW_FPS,
        severity: metrics.fps < this.budget.minFPS / 2 ? 'critical' : 'high',
        message: metrics.fps < this.budget.minFPS / 2 ? 'Very poor performance detected.' : 'Poor performance detected.',
        developerMessage: `FPS ${metrics.fps} below minimum ${this.budget.minFPS}. Consider reducing animation complexity.`,
        recommendation: 'Reduce animation complexity or enable performance optimizations',
        currentValue: metrics.fps,
        budgetValue: this.budget.minFPS
      });
    }

    // Log warnings to console in development
    if (import.meta.env.DEV && warnings.length > 0) {
      console.group('🚨 Performance Warnings');
      warnings.forEach(warning => {
        console.warn(`${warning.severity.toUpperCase()}: ${warning.developerMessage}`);
      });
      console.groupEnd();
    }

    // Notify callbacks
    if (warnings.length > 0) {
      this.callbacks.forEach(callback => callback(warnings));
    }

    return warnings;
  }

  /**
   * Get estimated memory usage
   */
  private getMemoryUsage(): number {
    // Approximate memory usage calculation
    const perfMemory = performance as unknown as { memory?: { usedJSHeapSize: number } };
    if (perfMemory.memory) {
      // Chrome-specific memory API
      return perfMemory.memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Fallback estimation based on heuristics
    return 30; // Default estimate in MB
  }

  /**
   * Initialize FPS monitoring
   */
  private initializeFPSMonitoring() {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        this.currentFPS = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Add performance warning callback
   */
  public onPerformanceWarning(callback: (warnings: PerformanceWarning[]) => void) {
    this.callbacks.push(callback);
  }

  /**
   * Remove performance warning callback
   */
  public removePerformanceWarningCallback(callback: (warnings: PerformanceWarning[]) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Get user-friendly warning messages
   */
  public getUserFriendlyMessages(warnings: PerformanceWarning[]): string[] {
    return warnings.map(warning => warning.message);
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary() {
    return {
      deviceCategory: this.deviceCategory,
      budget: this.budget,
      currentFPS: this.currentFPS,
      memoryUsage: this.getMemoryUsage(),
      isHealthy: this.currentFPS >= this.budget.minFPS
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for using performance monitor in React components
 */
export const usePerformanceMonitor = () => {
  return {
    monitor: performanceMonitor,
    startRender: () => performanceMonitor.startRender(),
    endRender: () => performanceMonitor.endRender(),
    getBudget: () => performanceMonitor.getBudget(),
    getSummary: () => performanceMonitor.getPerformanceSummary(),
    onWarning: (callback: (warnings: PerformanceWarning[]) => void) => {
      performanceMonitor.onPerformanceWarning(callback);
    }
  };
};