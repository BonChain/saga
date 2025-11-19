/**
 * Performance Controls Component
 * Provides controls for monitoring and adjusting animation performance
 */

import React, { useState, useEffect } from 'react';
import performanceMonitor from '../utils/performanceMonitor';
import './PerformanceControls.css';

const PerformanceControls: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [profile, setProfile] = useState('auto');
  const [stats, setStats] = useState(performanceMonitor.getStats());

  useEffect(() => {
    // Listen for performance changes
    const handlePerformanceChange = (newStats: any) => {
      setStats(newStats);
    };

    performanceMonitor.onPerformanceChange(handlePerformanceChange);

    // Start monitoring if overlay is shown
    if (showOverlay) {
      performanceMonitor.startMonitoring();
    } else {
      performanceMonitor.stopMonitoring();
    }

    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, [showOverlay]);

  useEffect(() => {
    // Update overlay visibility
    performanceMonitor.toggleOverlay(showOverlay);
  }, [showOverlay]);

  const handleProfileChange = (newProfile: 'auto' | 'high' | 'medium' | 'low') => {
    setProfile(newProfile);
    performanceMonitor.setPerformanceProfile(newProfile);
  };

  const toggleMonitoring = () => {
    setShowOverlay(!showOverlay);
  };

  return (
    <div className="performance-controls">
      <div className="performance-header">
        <h3>⚡ PERFORMANCE</h3>
        <button
          className={`toggle-button ${showOverlay ? 'active' : ''}`}
          onClick={toggleMonitoring}
          aria-label={showOverlay ? 'Hide performance overlay' : 'Show performance overlay'}
        >
          {showOverlay ? '📊 ON' : '📊 OFF'}
        </button>
      </div>

      <div className="performance-settings">
        <div className="setting-group">
          <label htmlFor="performance-profile">
            <span className="setting-label">Profile:</span>
            <select
              id="performance-profile"
              value={profile}
              onChange={(e) => handleProfileChange(e.target.value as 'auto' | 'high' | 'medium' | 'low')}
              className="profile-select"
            >
              <option value="auto">🤖 Auto</option>
              <option value="high">🚀 High Quality</option>
              <option value="medium">⚖️ Medium Performance</option>
              <option value="low">🐌 Low Performance</option>
            </select>
          </label>
        </div>

        <div className="stats-display">
          <div className="stat-item">
            <span className="stat-label">FPS:</span>
            <span className={`stat-value ${
              stats.fps >= 50 ? 'good' :
              stats.fps >= 30 ? 'medium' : 'poor'
            }`}>
              {stats.fps}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Mode:</span>
            <span className="stat-value">{stats.profile}</span>
          </div>

          {stats.batteryLevel !== null && (
            <div className="stat-item">
              <span className="stat-label">🔋:</span>
              <span className={`stat-value ${
                stats.batteryLevel > 0.5 ? 'good' :
                stats.batteryLevel > 0.2 ? 'medium' : 'poor'
              }`}>
                {Math.round(stats.batteryLevel * 100)}%
              </span>
            </div>
          )}

          <div className="stat-item">
            <span className="stat-label">Memory:</span>
            <span className="stat-value">{stats.memory}</span>
          </div>
        </div>

        <div className="performance-tips">
          <p className="tip">
            💡 <strong>Auto mode</strong> adjusts animations based on device performance
          </p>
          <p className="tip">
            🔋 Low battery automatically reduces animations
          </p>
          <p className="tip">
            👀 Enable overlay to see real-time performance metrics
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceControls;