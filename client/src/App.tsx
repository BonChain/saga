import { useState, useEffect } from 'react'
import ActionInput from './components/ActionInput'
import performanceMonitor from './utils/performanceMonitor'
import './App.css'

function App() {
  const [submittedActions, setSubmittedActions] = useState<string[]>([])

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
        </div>
      </div>
    </div>
  )
}

export default App
