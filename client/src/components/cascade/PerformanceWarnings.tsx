/**
 * Performance Warnings Component
 * Shows user-friendly performance warnings for cascade visualization
 */

import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor, type PerformanceWarning, PerformanceWarningType } from './utils/performance-monitor';
import './styles/performance-warnings.css';

interface PerformanceWarningsProps {
  nodeCount?: number;
  connectionCount?: number;
  className?: string;
}

const PerformanceWarnings: React.FC<PerformanceWarningsProps> = ({
  nodeCount = 0,
  connectionCount = 0,
  className = ''
}) => {
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const { monitor, onWarning } = usePerformanceMonitor();

  useEffect(() => {
    // Subscribe to performance warnings
    const handleWarnings = (newWarnings: PerformanceWarning[]) => {
      setWarnings(newWarnings);
    };

    onWarning(handleWarnings);
  }, [nodeCount, connectionCount, monitor, onWarning]);

  useEffect(() => {
    // Check performance when component props change
    if (nodeCount > 0 || connectionCount > 0) {
      // Use setTimeout to avoid synchronous setState
      setTimeout(() => {
        monitor.startRender();
        const currentWarnings = monitor.endRender();

        // Update metrics with actual counts
        const metrics = {
          nodeCount,
          connectionCount,
          renderTime: currentWarnings.length > 0 ?
            currentWarnings.find(w => w.type === PerformanceWarningType.SLOW_RENDER)?.currentValue || 0 : 0,
          memoryUsage: 30, // Estimated
          fps: 60, // Will be updated by monitor
          deviceCategory: monitor.getDeviceCategory()
        };

        const updatedWarnings = monitor.checkPerformance(metrics);
        setWarnings(updatedWarnings);
      }, 0);
    }
  }, [nodeCount, connectionCount, monitor]);

  if (warnings.length === 0) {
    return null;
  }

  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const highWarnings = warnings.filter(w => w.severity === 'high');
  const mediumWarnings = warnings.filter(w => w.severity === 'medium');

  const getWarningIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  };

  const getWarningClass = (severity: string) => {
    return `performance-warning performance-warning--${severity}`;
  };

  return (
    <div className={`performance-warnings ${className}`}>
      <div className="performance-warnings__header">
        <div className="performance-warnings__summary">
          {criticalWarnings.length > 0 && (
            <span className="performance-warnings__badge performance-warnings__badge--critical">
              {getWarningIcon('critical')} {criticalWarnings.length} Critical
            </span>
          )}
          {highWarnings.length > 0 && (
            <span className="performance-warnings__badge performance-warnings__badge--high">
              {getWarningIcon('high')} {highWarnings.length} High
            </span>
          )}
          {mediumWarnings.length > 0 && (
            <span className="performance-warnings__badge performance-warnings__badge--medium">
              {getWarningIcon('medium')} {mediumWarnings.length} Medium
            </span>
          )}
        </div>

        <button
          className="performance-warnings__toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showDetails && (
        <div className="performance-warnings__details">
          <div className="performance-warnings__device-info">
            <strong>Device:</strong> {monitor.getDeviceCategory()} |
            <strong>Budget:</strong> {monitor.getBudget().maxNodes} nodes, {monitor.getBudget().maxRenderTime}ms render
          </div>

          {warnings.map((warning, index) => (
            <div
              key={`${warning.type}-${index}`}
              className={getWarningClass(warning.severity)}
            >
              <div className="performance-warning__header">
                <span className="performance-warning__icon">
                  {getWarningIcon(warning.severity)}
                </span>
                <span className="performance-warning__title">
                  {warning.type.replace(/_/g, ' ').toLowerCase()}
                </span>
                <span className="performance-warning__severity">
                  {warning.severity.toUpperCase()}
                </span>
              </div>

              <div className="performance-warning__message">
                {warning.message}
              </div>

              {warning.recommendation && (
                <div className="performance-warning__recommendation">
                  <strong>Recommendation:</strong> {warning.recommendation}
                </div>
              )}

              <div className="performance-warning__metrics">
                <span>Current: {warning.currentValue}</span>
                <span>Budget: {warning.budgetValue}</span>
              </div>

              {import.meta.env.DEV && warning.developerMessage && (
                <details className="performance-warning__developer">
                  <summary>Developer Info</summary>
                  <code>{warning.developerMessage}</code>
                </details>
              )}
            </div>
          ))}

          <div className="performance-warnings__actions">
            <button
              className="performance-warnings__action performance-warnings__action--optimize"
              onClick={() => {
                // Trigger optimization (to be implemented)
                console.log('Enabling performance optimizations...');
              }}
            >
              Enable Optimizations
            </button>

            <button
              className="performance-warnings__action performance-warnings__action--dismiss"
              onClick={() => {
                setWarnings([]);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceWarnings;