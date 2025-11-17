import { useState } from 'react'
import ActionInput from './components/ActionInput'
import './App.css'

function App() {
  const [submittedActions, setSubmittedActions] = useState<string[]>([])

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
