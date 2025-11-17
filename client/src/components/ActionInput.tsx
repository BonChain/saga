import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ActionInput.css';

interface ActionInputProps {
  onSubmit?: (action: string) => void;
  disabled?: boolean;
  maxLength?: number;           // Maximum characters allowed
  enforceLimit?: boolean;       // Whether to enforce hard limit
  showCharacterCount?: boolean; // Whether to show character counter
}

const ActionInput: React.FC<ActionInputProps> = ({
  onSubmit,
  disabled = false,
  maxLength = 500,
  enforceLimit = true,
  showCharacterCount = true
}) => {
  const [action, setAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3005';

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

      if (response.data.success) {
        setFeedback(`✅ Action received: ID ${response.data.data.id}`);
        setAction('');
        onSubmit?.(action.trim());

        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(`❌ Error: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('Action submission error:', error);
      if (error.response?.status === 404) {
        setFeedback('❌ Action endpoint not found - server needs update');
      } else if (error.response?.status >= 500) {
        setFeedback('❌ Server error - please try again');
      } else {
        setFeedback(`❌ ${error.response?.data?.error || 'Network error'}`);
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

// Configuration constants for different action types
export const ACTION_CONFIG = {
  SHORT_ACTION: 100,    // Quick commands
  NORMAL_ACTION: 500,   // Standard actions
  LONG_ACTION: 1000,    // Detailed actions
};