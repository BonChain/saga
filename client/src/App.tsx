import { SuiProviders } from './components/SuiProviders'
import { WalletConnection } from './components/WalletConnection'
import { IntroductionStory } from './components/IntroductionStory'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useState, useEffect } from 'react'
import './App.css'
import './components/WalletConnection.css'
import './components/IntroductionStory.css'

function AppContent() {
  const currentAccount = useCurrentAccount()
  const [showIntroduction, setShowIntroduction] = useState(false)
  const [introductionCompleted, setIntroductionCompleted] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Show introduction when wallet connects for the first time
  useEffect(() => {
    if (currentAccount && !introductionCompleted) {
      setShowIntroduction(true)
    }
  }, [currentAccount, introductionCompleted])

  // Handle introduction completion
  const handleIntroductionComplete = () => {
    setShowIntroduction(false)
    setIntroductionCompleted(true)
  }

  // Handle skipping introduction
  const handleSkipIntroduction = () => {
    setShowIntroduction(false)
    setIntroductionCompleted(true)
  }

  // Handle wallet connection request
  const handleConnectWallet = () => {
    setShowWalletModal(true)
  }

  // Handle wallet modal close
  const handleCloseWalletModal = () => {
    setShowWalletModal(false)
  }

  return (
    <div className="app character-container">
      {/* Show introduction story when needed */}
      {showIntroduction && (
        <IntroductionStory
          isReturning={false}
          onComplete={handleIntroductionComplete}
          onSkip={handleSkipIntroduction}
        />
      )}

      {/* Simple Header */}
      <header className="simple-header">
        <div className="header-content">
          <div className="logo">
            <h1>Saga</h1>
          </div>
          <div className="wallet-section">
            <WalletConnection
              externalModalOpen={showWalletModal}
              onExternalModalClose={handleCloseWalletModal}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="simple-main">
        {currentAccount ? (
          <div className="connected-container">
            <div className="welcome-card">
              <h2>Welcome to Saga, Noble Hero</h2>
              <p>Thy sacred seal is bound to the eternal realm</p>
              <button className="start-button">Begin Adventure</button>
            </div>
          </div>
        ) : (
          <div className="landing-container">
            {/* Hero Section */}
            <section className="simple-hero">
              <div className="hero-content">
                <h1>Saga</h1>
                <p>An endless RPG adventure where heroes forge their destiny in an ever-evolving realm</p>
                <button
                  className="connect-wallet-btn"
                  onClick={handleConnectWallet}
                >
                  Enter the Realm
                </button>
              </div>
            </section>

            {/* Info Section */}
            <section className="simple-info">
              <h2>About the Saga</h2>
              <p>An endless RPG adventure where heroes forge their destiny in an ever-evolving realm</p>
            </section>

            {/* Ancient Powers Section */}
            <section className="simple-features">
              <h2>Ancient Powers</h2>
              <div className="features-list">
                <div className="feature-item">
                  <h3>Eternal Realm</h3>
                  <p>A mystical world that evolves endlessly, even while heroes rest</p>
                </div>
                <div className="feature-item">
                  <h3>Words of Power</h3>
                  <p>Speak thy will in the common tongue and shape reality itself</p>
                </div>
                <div className="feature-item">
                  <h3>Sacred Ledger</h3>
                  <p>Bound to the blockchain for eternal record and true ownership</p>
                </div>
                <div className="feature-item">
                  <h3>Hero's Legacy</h3>
                  <p>Build thy legend through quests, battles, and alliances that echo through time</p>
                </div>
              </div>
            </section>

            {/* The Hero's Journey */}
            <section className="simple-steps">
              <h2>The Hero's Journey</h2>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Obtain Thy Grimoire</h3>
                    <p>Acquire a sacred Sui wallet from the mystic browser marketplace</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Bind Thy Soul</h3>
                    <p>Create thy eternal bond with the magical arts of encryption</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Begin the Quest</h3>
                    <p>Present thy seal to the gatekeeper and enter the realm</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Waitlist Join */}
            <section className="simple-waitlist">
              <h2>Join the Adventure</h2>
              <p>Be among the first heroes to enter the realm. Sign up for exclusive access and updates.</p>
              <div className="waitlist-form">
                <input type="email" placeholder="Enter your email" className="email-input" />
                <button className="join-button">Join Waitlist</button>
              </div>
            </section>

            {/* Contact */}
            <section className="simple-contact">
              <h2>Follow the Journey</h2>
              <div className="social-links">
                <a href="https://x.com/suisaga" target="_blank" rel="noopener noreferrer" className="social-link">
                  <span className="social-icon">𝕏</span>
                  <span>Twitter</span>
                </a>
                <a href="https://t.me/suisaga" target="_blank" rel="noopener noreferrer" className="social-link">
                  <span className="social-icon">✈️</span>
                  <span>Telegram</span>
                </a>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="simple-footer">
        <p>&copy; 2025 Saga</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <SuiProviders>
      <AppContent />
    </SuiProviders>
  )
}

export default App
