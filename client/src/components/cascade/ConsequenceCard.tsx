import React from 'react'
import type { ConsequenceCardProps } from './types/cascade'
import './styles/cascade.css'

/**
 * ConsequenceCard Component
 * Individual consequence card with retro styling and tap-to-reveal functionality
 * Story 8.2 - Cascade Visualization Engine
 */
const ConsequenceCard: React.FC<ConsequenceCardProps & { style?: React.CSSProperties }> = ({
  consequence,
  isExpanded = false,
  onToggle,
  style = {}
}) => {
  const worldSystemColors = {
    'environment': { primary: '#00ff41', secondary: '#00cc33', glow: 'rgba(0, 255, 65, 0.3)' },
    'combat': { primary: '#ff4444', secondary: '#cc0000', glow: 'rgba(255, 68, 68, 0.3)' }
  }

  const worldSystemColor = worldSystemColors[consequence.system as keyof typeof worldSystemColors] || worldSystemColors['environment']

  const severityColor = {
    minor: '#00ff41',      // neon green
    major: '#ffaa00',      // neon orange
    critical: '#ff4444'     // neon red
  }[consequence.severity || 'minor']

  const familiarityGlow = {
    known: 'rgba(0, 255, 65, 0.3)',      // green glow
    unknown: 'rgba(153, 68, 255, 0.3)'    // purple glow
  }[consequence.familiarity || 'unknown']

  const personalRelevanceOpacity = 0.3 + (consequence.personalRelevance || 50) / 100 * 0.7

  return (
    <div
      className={`consequence-card ${consequence.familiarity} ${consequence.severity}`}
      style={{
        ...style,
        '--card-glow-color': familiarityGlow,
        '--card-primary-color': worldSystemColor.primary,
        '--card-secondary-color': worldSystemColor.secondary,
        '--card-severity-color': severityColor,
        '--card-relevance-opacity': personalRelevanceOpacity.toString(),
        '--animation-delay': `${(consequence.delay || 0) * 500}ms`
      } as React.CSSProperties}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="card-system">{consequence.system.toUpperCase()}</div>
        <div className={`card-severity ${consequence.severity}`}>
          {consequence.severity?.toUpperCase()}
        </div>
      </div>

      {/* Card Title */}
      <div className="card-title">
        {consequence.label}
      </div>

      {/* Basic Info */}
      <div className="card-info">
        <div className="card-relevance">
          <span className="relevance-label">Relevance:</span>
          <div className="relevance-bar">
            <div
              className="relevance-fill"
              style={{ width: `${consequence.personalRelevance || 50}%` }}
            />
          </div>
          <span className="relevance-value">{consequence.personalRelevance || 50}%</span>
        </div>
        <div className="card-impact">
          <span className="impact-label">Impact:</span>
          <span className={`impact-badge ${consequence.severity}`}>
            {consequence.impact}/10
          </span>
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        className="card-toggle"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} consequence details`}
      >
        <span className={`toggle-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {isExpanded ? '−' : '+'}
        </span>
        <span className="toggle-text">
          {isExpanded ? 'Show Less' : 'Show More'}
        </span>
      </button>

      {/* Expanded Content */}
      <div className={`card-expanded ${isExpanded ? 'visible' : 'hidden'}`}>
        <div className="expanded-content">
          <div className="narrative">
            <h4>Impact Narrative</h4>
            <p>{consequence.narrative}</p>
          </div>

          <div className="technical-details">
            <h4>Technical Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{consequence.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">System:</span>
                <span className="detail-value">{consequence.system}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Delay:</span>
                <span className="detail-value">{consequence.delay || 0}s</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{consequence.duration || 1}s</span>
              </div>
            </div>
          </div>

          <div className="familiarity-info">
            <h4>Familiarity Status</h4>
            <div className={`familiarity-badge ${consequence.familiarity}`}>
              {consequence.familiarity === 'known' ? (
                <>
                  <span className="badge-icon">🎯</span>
                  <span className="badge-text">Known Effect</span>
                </>
              ) : (
                <>
                  <span className="badge-icon">✨</span>
                  <span className="badge-text">Discovery Moment</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsequenceCard