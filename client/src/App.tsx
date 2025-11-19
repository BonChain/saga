import { useState, useEffect } from 'react'
import ActionInput from './components/ActionInput'
import CascadeVisualization from './components/cascade/CascadeVisualization'
import performanceMonitor from './utils/performanceMonitor'
import type { CascadeNode } from './components/cascade/types/cascade'
import './App.css'

function App() {
  const [submittedActions, setSubmittedActions] = useState<string[]>([])
  // const [currentCascadeAction, setCurrentCascadeAction] = useState<string | null>(null)
  const [showCascade, setShowCascade] = useState(false)

  // Initialize performance monitoring (always automatic, user-friendly)
  useEffect(() => {
    // Start in auto mode - no user configuration needed
    performanceMonitor.setPerformanceProfile('auto')

    // Start monitoring silently for automatic adjustments
    performanceMonitor.startMonitoring()

    // Optional: Show performance overlay only in development
    if (import.meta.env.DEV) {
      performanceMonitor.toggleOverlay(true)
    }
  }, [])

  const handleActionSubmit = (action: string) => {
    setSubmittedActions(prev => [...prev, action])
    // Show cascade visualization for the latest action
    // setCurrentCascadeAction(`action-${Date.now()}`)
    setShowCascade(true)
  }

  const handleNodeClick = (node: CascadeNode) => {
    console.log('Node clicked:', node)
    // Could expand to show more details or navigate to related views
  }

  const handleNodeHover = (node: CascadeNode | null) => {
    // Update UI state for hover feedback
    console.log('Node hovered:', node?.label)
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="header">
        <h1 data-text="SuiSaga Living World">SuiSaga Living World</h1>
        <p>Unlimited Player Agency - Natural Language Action System</p>
      </div>

      <div className="main-content" id="main-content">
        <ActionInput onSubmit={handleActionSubmit} />

        {/* Cascade Visualization Section */}
        {showCascade && (
          <div className="cascade-section">
            <div className="cascade-header">
              <h3>ACTION CASCADE VISUALIZATION</h3>
              <button
                className="cascade-close-button"
                onClick={() => setShowCascade(false)}
                aria-label="Close cascade visualization"
              >
                ✕
              </button>
            </div>
            <CascadeVisualization
              data={null} // Will use default demo data for now
              width={Math.min(800, window.innerWidth - 40)}
              height={400}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
            />
          </div>
        )}

        {submittedActions.length > 0 && (
          <div className="recent-actions">
            <h3>Recent Actions:</h3>
            <ul>
              {submittedActions.slice(-5).map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="world-info">
          <h3>World Status</h3>
          <p>Server: <span className="status-online">● Online</span></p>
          <p>Connected to Living World API</p>
          <p>Ready to process unlimited actions</p>
          {!showCascade && (
            <p className="cascade-hint">Submit an action to see cascade visualization</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
