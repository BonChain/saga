/**
 * Performance Monitor Type Definitions
 */

export interface PerformanceStats {
  fps: number;
  profile: 'auto' | 'high' | 'medium' | 'low';
  batteryLevel: number | null;
  isMonitoring: boolean;
  memory: string;
}

export interface PerformanceChangeCallback {
  (stats: PerformanceStats): void;
}

declare class AnimationPerformanceMonitor {
  frameCount: number;
  lastTime: number;
  fps: number;
  isMonitoring: boolean;
  performanceProfile: 'auto' | 'high' | 'medium' | 'low';
  batteryLevel: number | null;
  thresholds: {
    high: number;
    medium: number;
    low: number;
  };

  startMonitoring(): void;
  stopMonitoring(): void;
  setPerformanceProfile(profile: 'auto' | 'high' | 'medium' | 'low'): void;
  onPerformanceChange(callback: PerformanceChangeCallback): void;
  getStats(): PerformanceStats;
  toggleOverlay(show: boolean): void;
}

declare const performanceMonitor: AnimationPerformanceMonitor;
export default performanceMonitor;