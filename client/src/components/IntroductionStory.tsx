/**
 * IntroductionStory component for SuiSaga
 * Immersive narrative system with typewriter animations and world context integration
 */

import { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../services/api-client';

interface NarrativeContent {
  greeting: string;
  worldContext: {
    village: string;
    dragon: {
      name: string;
      title: string;
      location: string;
      status: string;
    };
    worldState: {
      timeOfDay: number;
      weather: string;
      season: string;
      magicalEnergy: number;
    };
  };
  storySections: Array<{
    title: string;
    content: string;
  }>;
}

interface IntroductionStoryProps {
  isReturning?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function IntroductionStory({
  isReturning = false,
  onComplete,
  onSkip
}: IntroductionStoryProps) {
  const [narrativeContent, setNarrativeContent] = useState<NarrativeContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [skipIntroduction, setSkipIntroduction] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);

  const typingSpeed = 30; // milliseconds per character
  const typewriterRef = useRef<number | null>(null);

  // Fetch narrative content from backend
  useEffect(() => {
    const fetchNarrativeContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await ApiClient.getIntroduction(isReturning);

        if (response.success) {
          setNarrativeContent(response.data);
          setCurrentSection(0);
          setDisplayedText(''); // Start with empty text for typewriter effect
        } else {
          throw new Error(response.error || 'Failed to load narrative content');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Failed to fetch narrative content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarrativeContent();
  }, [isReturning]);

  // Typewriter effect
  useEffect(() => {
    if (!narrativeContent || currentSection >= narrativeContent.storySections.length) {
      return;
    }

    const currentContent = narrativeContent.storySections[currentSection];
    const fullText = currentContent.content;

    // Reset for new section
    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;

    const typeNextChar = () => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
        typewriterRef.current = setTimeout(typeNextChar, typingSpeed);
      } else {
        setIsTyping(false);

        // Check if this is the last section
        if (currentSection === narrativeContent.storySections.length - 1) {
          setShowCompleteButton(true);
        }
      }
    };

    typeNextChar();

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [currentSection, narrativeContent]);

  // Handle section progression
  const handleNextSection = () => {
    if (narrativeContent && currentSection < narrativeContent.storySections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  // Handle story completion
  const handleComplete = () => {
    onComplete?.();
  };

  // Handle skip introduction
  const handleSkip = () => {
    setSkipIntroduction(true);
    onSkip?.();
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="introduction-story loading"
        role="status"
        aria-live="polite"
        aria-label="Loading introduction story"
      >
        <div className="loading-container">
          <div className="loading-text">Preparing your journey...</div>
          <div className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="introduction-story error"
        role="alert"
        aria-live="assertive"
      >
        <div className="error-container">
          <h2>Unable to Load Story</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
            aria-label="Retry loading introduction"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Skip introduction view
  if (skipIntroduction) {
    return null;
  }

  if (!narrativeContent) {
    return null;
  }

  const currentContent = narrativeContent.storySections[currentSection];
  const progress = ((currentSection + 1) / narrativeContent.storySections.length) * 100;

  return (
    <div
      className="introduction-story"
      role="article"
      aria-label="Introduction story"
    >
      <div className="story-container">
        {/* Header with greeting and skip option */}
        <header className="story-header">
          <div className="greeting" role="heading" aria-level={2}>
            {narrativeContent.greeting}
          </div>

          <div className="story-controls">
            <div className="progress-indicator" aria-label="Story progress">
              <span>Section {currentSection + 1} of {narrativeContent.storySections.length}</span>
              <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <button
              onClick={handleSkip}
              className="skip-button"
              aria-label="Skip introduction and continue to game"
            >
              Skip Introduction
            </button>
          </div>
        </header>

        {/* Main story content */}
        <main className="story-content">
          <div className="story-section">
            <h3 className="section-title" aria-label={`Section: ${currentContent.title}`}>
              {currentContent.title}
            </h3>

            <div
              className="typewriter-text"
              aria-live="polite"
              aria-atomic="true"
            >
              {displayedText}
              {isTyping && <span className="typing-cursor" aria-hidden="true">|</span>}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="story-navigation">
            {currentSection < narrativeContent.storySections.length - 1 ? (
              <button
                onClick={handleNextSection}
                disabled={isTyping}
                className="continue-button"
                aria-label="Continue to next section"
              >
                Continue
              </button>
            ) : showCompleteButton ? (
              <button
                onClick={handleComplete}
                className="complete-button"
                aria-label="Complete introduction and begin adventure"
              >
                Begin Your Adventure
              </button>
            ) : null}
          </div>
        </main>

        {/* World context sidebar */}
        <aside className="world-context" aria-label="World information">
          <h4>World Context</h4>
          <div className="context-item">
            <span className="context-label">Location:</span>
            <span className="context-value">{narrativeContent.worldContext.village}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Guardian:</span>
            <span className="context-value">
              {narrativeContent.worldContext.dragon.name} {narrativeContent.worldContext.dragon.title}
            </span>
          </div>
          <div className="context-item">
            <span className="context-label">Time:</span>
            <span className="context-value">
              {narrativeContent.worldContext.worldState.weather} •
              {narrativeContent.worldContext.worldState.season} •
              {narrativeContent.worldContext.worldState.timeOfDay}:00
            </span>
          </div>
          <div className="context-item">
            <span className="context-label">Magic:</span>
            <span className="context-value">
              {narrativeContent.worldContext.worldState.magicalEnergy}% magical energy
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}