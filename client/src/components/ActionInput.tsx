import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import type { ActionInputProps } from './cascade/types/cascade';
import './ActionInput.css';

const ActionInput: React.FC<ActionInputProps> = ({
  onSubmit,
  disabled = false,
  maxLength = 500,
  minLength = 3, // Minimum 3 characters required
  enforceLimit = true,
  showCharacterCount = true
}) => {
  const [action, setAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const serverUrl = (import.meta.env?.VITE_SERVER_URL as string) || 'http://localhost:3005';

  const exampleActions = [
    'befriend the goblin king',
    'cast a spell to make it rain',
    'burn the tavern and marry the dragon',
    'challenge the mayor to a duel',
    'plant an enchanted forest',
    'steal the dragon\'s treasure',
    'negotiate peace between villages',
    'build a magical portal'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!action.trim() || isSubmitting || disabled) {
      setError('⚠️ Please enter an action before submitting');
      return;
    }

    // Minimum character validation
    if (action.trim().length < (minLength || 3)) {
      setError(`⚠️ Action must be at least ${minLength || 3} characters long`);
      return;
    }

    // Character limit validation
    if (enforceLimit && maxLength && action.length > maxLength) {
      setError(`Action exceeds maximum length of ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await axios.post(`${serverUrl}/api/actions/submit`, {
        playerId: 'player-001', // Temporary player ID
        intent: action.trim(),
        originalInput: action.trim(),
        parsedIntent: {
          type: 'natural_language',
          content: action.trim()
        }
      });

      const responseData = response.data as { success: boolean; data?: { id: string }; error?: string };
      if (responseData.success) {
        setFeedback(`✅ Action received: ID ${responseData.data?.id}`);
        setAction('');
        onSubmit?.(action.trim());

        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(`❌ Error: ${responseData.error}`);
      }
    } catch (error: unknown) {
      console.error('Action submission error:', error);
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
      if (axiosError.response?.status === 404) {
        setFeedback('❌ Action endpoint not found - server needs update');
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        setFeedback('❌ Server error - please try again');
      } else {
        setFeedback(`❌ ${axiosError.response?.data?.error || 'Network error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Clear any previous errors when user starts typing
    if (error) {
      setError(null);
    }

    if (enforceLimit && maxLength && value.length > maxLength) {
      // Truncate to max length
      const truncatedValue = value.substring(0, maxLength);
      setAction(truncatedValue);
      setCharacterCount(truncatedValue.length);
      return;
    }

    setAction(value);
    setCharacterCount(value.length);
  };

  // Helper function to determine character count color
  const getCharacterCountColor = () => {
    if (!characterCount) return 'var(--terminal-light)';
    if (maxLength && characterCount >= maxLength) return 'var(--neon-red)';
    if (maxLength && characterCount >= maxLength * 0.8) return 'var(--neon-yellow)';
    return 'var(--neon-green)';
  };

  const selectExampleAction = (example: string) => {
    // Check if example exceeds the limit
    if (enforceLimit && maxLength && example.length > maxLength) {
      const truncatedExample = example.substring(0, maxLength);
      setAction(truncatedExample);
      setCharacterCount(truncatedExample.length);
      setError(`Example action truncated to ${maxLength} characters`);
    } else {
      setAction(example);
      setCharacterCount(example.length);
    }
    setFeedback(null);
  };

  useEffect(() => {
    // Auto-focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="action-input-container">
  
      <div className="terminal-header">
        <div className="terminal-title">ACTION INPUT TERMINAL</div>
        <div className="terminal-status">
          <div className={`status-light ${isSubmitting ? 'processing' : 'online'}`}></div>
          <span className="status-text">
            {isSubmitting ? 'PROCESSING...' : 'ONLINE'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={action}
            onChange={handleInputChange}
            placeholder="Enter any action you can imagine..."
            className="action-textarea"
            disabled={disabled || isSubmitting}
            rows={4}
            maxLength={enforceLimit ? maxLength : undefined}
          />
        </div>

        <div className="input-footer">
          {showCharacterCount && (
            <div
              className={`character-counter ${
                characterCount > maxLength * 0.9 ? 'warning' :
                characterCount >= maxLength ? 'error' : ''
              }`}
              style={{ color: getCharacterCountColor() }}
            >
              {characterCount}/{maxLength}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={
              disabled ||
              isSubmitting ||
              !action.trim() ||
              (enforceLimit && characterCount > maxLength)
            }
          >
            {isSubmitting ? 'PROCESSING...' : 'EXECUTE ACTION'}
          </button>

          <button
            type="button"
            className="demo-button"
            onClick={() => {
              const demoActions = [
                { text: 'Cast fireball at goblin', system: 'magic' },
                { text: 'Negotiate peace treaty', system: 'social' },
                { text: 'Plant enchanted forest', system: 'environment' },
                { text: 'Raid dragon\'s lair', system: 'combat' },
                { text: 'Build magical portal', system: 'magic' }
              ];

              const demo = demoActions[Math.floor(Math.random() * demoActions.length)];
              setAction(demo.text);

              // Create mock cascade data for immediate display
              const mockCascadeData = {
                actionId: `demo-${Date.now()}`,
                nodes: [
                  { id: 'action-demo', type: 'action' as const, label: demo.text, system: demo.system, impact: 8, delay: 0, duration: 1 },
                  { id: 'consequence-demo', type: 'consequence' as const, label: 'Immediate effect', system: 'combat', impact: 6, delay: 1, duration: 2 },
                  { id: 'butterfly-1', type: 'butterfly-effect' as const, label: 'Social reaction', system: 'social', impact: 5, delay: 2.5, duration: 3 },
                  { id: 'butterfly-2', type: 'butterfly-effect' as const, label: 'Environmental impact', system: 'environment', impact: 7, delay: 3, duration: 4 }
                ],
                connections: [
                  { source: 'action-demo', target: 'consequence-demo', type: 'direct' as const, strength: 0.9, delay: 1, duration: 2 },
                  { source: 'action-demo', target: 'butterfly-1', type: 'cascading' as const, strength: 0.7, delay: 2, duration: 3 },
                  { source: 'consequence-demo', target: 'butterfly-2', type: 'cascading' as const, strength: 0.8, delay: 2.5, duration: 4 }
                ],
                metadata: { totalNodes: 4, totalConnections: 3, processingTime: 6.5, worldSystemsAffected: [demo.system, 'combat', 'social', 'environment'], maxDepth: 2, severity: 'high' as const },
                timestamp: new Date().toISOString(),
                playerId: 'demo-player'
              };

              setFeedback(`🎮 Demo: ${demo.text}`);
              onSubmit?.(demo.text);

              // Show demo cascade immediately without backend
              setTimeout(() => {
                // This will trigger the cascade visualization if it exists
                const event = new CustomEvent('showDemoCascade', { detail: mockCascadeData });
                window.dispatchEvent(event);
              }, 500);

              setTimeout(() => setFeedback(null), 3000);
            }}
          >
            🎮 DEMO MODE
          </button>
        </div>
      </form>

      {error && (
        <div className="feedback-message error">
          {error}
        </div>
      )}

      {feedback && (
        <div className={`feedback-message ${
          feedback.includes('✅') ? 'success' : 'error'
        }`}>
          {feedback}
        </div>
      )}

      <div className="examples-section">
        <div className="examples-title">INSPIRATION:</div>
        <div className="example-actions">
          {exampleActions.map((example, index) => (
            <button
              key={index}
              type="button"
              className="example-action"
              onClick={() => selectExampleAction(example)}
              disabled={disabled || isSubmitting}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionInput;