import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface ActionInputProps {
  onSubmit?: (action: string) => void;
  disabled?: boolean;
}

const ActionInput: React.FC<ActionInputProps> = ({ onSubmit, disabled = false }) => {
  const [action, setAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxCharacters = 500;
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

    setIsSubmitting(true);
    setFeedback(null);

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
    if (value.length <= maxCharacters) {
      setAction(value);
      setCharacterCount(value.length);
    }
  };

  const selectExampleAction = (example: string) => {
    setAction(example);
    setCharacterCount(example.length);
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
      <style>{`
        .action-input-container {
          font-family: 'VT323', monospace;
          background: #0a0a0a;
          border: 2px solid #00ff41;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          box-shadow:
            0 0 20px rgba(0, 255, 65, 0.3),
            inset 0 0 20px rgba(0, 255, 65, 0.1);
          position: relative;
          overflow: hidden;
        }

        .action-input-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 65, 0.03) 2px,
              rgba(0, 255, 65, 0.03) 4px
            );
          pointer-events: none;
          z-index: 1;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #00ff41;
          position: relative;
          z-index: 2;
        }

        .terminal-title {
          color: #00ff41;
          font-size: 18px;
          text-shadow: 0 0 10px #00ff41;
          flex: 1;
        }

        .terminal-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-light {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-light.online {
          background: #00ff41;
          box-shadow: 0 0 10px #00ff41;
        }

        .status-light.processing {
          background: #ffaa00;
          box-shadow: 0 0 10px #ffaa00;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .input-wrapper {
          position: relative;
          z-index: 2;
        }

        .action-textarea {
          width: 100%;
          min-height: 100px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid #00ff41;
          border-radius: 4px;
          color: #00ff41;
          font-family: 'VT323', monospace;
          font-size: 16px;
          padding: 12px;
          resize: vertical;
          outline: none;
          transition: all 0.3s ease;
          line-height: 1.4;
        }

        .action-textarea::placeholder {
          color: rgba(0, 255, 65, 0.4);
        }

        .action-textarea:focus {
          border-color: #00ff41;
          box-shadow:
            0 0 15px rgba(0, 255, 65, 0.4),
            inset 0 0 10px rgba(0, 255, 65, 0.1);
          background: rgba(0, 0, 0, 0.9);
        }

        .action-textarea:disabled {
          border-color: rgba(0, 255, 65, 0.3);
          color: rgba(0, 255, 65, 0.3);
          cursor: not-allowed;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          position: relative;
          z-index: 2;
        }

        .character-counter {
          color: #00ff41;
          font-size: 14px;
          opacity: 0.8;
        }

        .character-counter.warning {
          color: #ffaa00;
        }

        .character-counter.error {
          color: #ff4141;
        }

        .submit-button {
          background: #00ff41;
          color: #0a0a0a;
          border: none;
          border-radius: 4px;
          padding: 8px 20px;
          font-family: 'VT323', monospace;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .submit-button:hover:not(:disabled) {
          background: #00cc33;
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
          transform: translateY(-1px);
        }

        .submit-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .submit-button:disabled {
          background: rgba(0, 255, 65, 0.2);
          color: rgba(0, 255, 65, 0.5);
          cursor: not-allowed;
          transform: none;
        }

        .feedback-message {
          margin-top: 15px;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
          position: relative;
          z-index: 2;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feedback-message.success {
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid rgba(0, 255, 65, 0.3);
          color: #00ff41;
        }

        .feedback-message.error {
          background: rgba(255, 65, 65, 0.1);
          border: 1px solid rgba(255, 65, 65, 0.3);
          color: #ff4141;
        }

        .examples-section {
          margin-top: 20px;
          position: relative;
          z-index: 2;
        }

        .examples-title {
          color: #00ff41;
          font-size: 14px;
          margin-bottom: 10px;
          opacity: 0.8;
        }

        .example-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .example-action {
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid rgba(0, 255, 65, 0.3);
          border-radius: 4px;
          color: #00ff41;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .example-action:hover {
          background: rgba(0, 255, 65, 0.2);
          border-color: #00ff41;
          transform: translateY(-1px);
        }

        /* Import VT323 font */
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
      `}</style>

      <div className="terminal-header">
        <div className="terminal-title">ACTION INPUT TERMINAL</div>
        <div className="terminal-status">
          <div className={`status-light ${isSubmitting ? 'processing' : 'online'}`}></div>
          <span style={{ color: '#00ff41', fontSize: '14px' }}>
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
          />
        </div>

        <div className="input-footer">
          <div className={`character-counter ${
            characterCount > maxCharacters * 0.9 ? 'warning' :
            characterCount >= maxCharacters ? 'error' : ''
          }`}>
            {characterCount}/{maxCharacters}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={disabled || isSubmitting || !action.trim() || characterCount > maxCharacters}
          >
            {isSubmitting ? 'PROCESSING...' : 'EXECUTE ACTION'}
          </button>
        </div>
      </form>

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