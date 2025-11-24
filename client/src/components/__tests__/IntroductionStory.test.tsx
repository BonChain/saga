/**
 * Tests for IntroductionStory component
 * Covers narrative display, typewriter animations, accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { IntroductionStory } from '../IntroductionStory';

// Mock axios for API calls
jest.mock('axios');
const mockedAxios = require('axios');

// Mock setTimeout and clearTimeout for typewriter effect
jest.useFakeTimers();

// Mock narrative data
const mockNarrativeData = {
  greeting: 'Welcome, brave soul, to a world where every choice echoes through eternity.',
  worldContext: {
    village: 'Dragonslayer Village',
    dragon: {
      name: 'Ignis',
      title: 'the Ancient',
      location: 'Ancient Dragon Lair',
      status: 'tense'
    },
    worldState: {
      timeOfDay: 12,
      weather: 'clear',
      season: 'summer',
      magicalEnergy: 75
    }
  },
  storySections: [
    {
      title: 'Your Awakening',
      content: 'You find yourself awakening in Dragonslayer Village, a quiet village that exists in the shadow of ancient power.'
    },
    {
      title: 'The Living World',
      content: 'This is no ordinary realm—it is a living world that evolves with every hero\'s choice.'
    }
  ]
};

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('IntroductionStory Component', () => {
  const defaultProps = {
    onComplete: jest.fn(),
    onSkip: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    test('shows loading state initially', () => {
      mockedAxios.get.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ data: { success: true, data: mockNarrativeData } }), 100);
      }));

      render(<IntroductionStory {...defaultProps} />);

      expect(screen.getByText('Preparing your journey...')).toBeInTheDocument();
      expect(screen.getByText('Loading introduction story')).toBeInTheDocument();
    });

    test('shows accessibility labels for loading state', () => {
      mockedAxios.get.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ data: { success: true, data: mockNarrativeData } }), 100);
      }));

      render(<IntroductionStory {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading introduction story');
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to load narrative content';
      mockedAxios.get.mockRejectedValue(new Error(errorMessage));

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Story')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('shows retry button when error occurs', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Narrative Content Display', () => {
    test('displays narrative content after successful API call', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(mockNarrativeData.greeting)).toBeInTheDocument();
        expect(screen.getByText('Your Awakening')).toBeInTheDocument();
        expect(screen.getByText('Skip Introduction')).toBeInTheDocument();
      });
    });

    test('displays world context information', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('World Context')).toBeInTheDocument();
        expect(screen.getByText('Location:')).toBeInTheDocument();
        expect(screen.getByText('Dragonslayer Village')).toBeInTheDocument();
        expect(screen.getByText('Guardian:')).toBeInTheDocument();
        expect(screen.getByText('Ignis the Ancient')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Navigation', () => {
    test('shows progress indicator with correct section count', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Section 1 of 2')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      });
    });

    test('shows continue button after typewriter effect completes', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Your Awakening')).toBeInTheDocument();
      });

      // Wait for typewriter effect to complete
      act(() => {
        jest.advanceTimersByTime(mockNarrativeData.storySections[0].content.length * 30 + 100);
      });

      await waitFor(() => {
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });
    });
  });

  describe('Skip Functionality', () => {
    test('calls onSkip when skip button is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        const skipButton = screen.getByText('Skip Introduction');
        fireEvent.click(skipButton);
      });

      expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Compliance', () => {
    test('has no accessibility violations', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      const { container } = render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Your Awakening')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA labels and roles', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Introduction story');
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow');
        expect(screen.getByLabelText('Skip introduction and continue to game')).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: true, data: mockNarrativeData } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Skip Introduction')).toBeInTheDocument();
      });

      const skipButton = screen.getByText('Skip Introduction');
      skipButton.focus();
      expect(document.activeElement).toBe(skipButton);
    });
  });

  describe('Error Recovery', () => {
    test('recovers from API errors and allows retry', async () => {
      // First call fails
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Story')).toBeInTheDocument();
      });

      // Retry with success
      mockedAxios.get.mockResolvedValueOnce({ data: { success: true, data: mockNarrativeData } });

      // Mock window.location.reload for retry
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockReload).toHaveBeenCalled();
    });

    test('handles malformed API responses gracefully', async () => {
      mockedAxios.get.mockResolvedValue({ data: { success: false, error: 'Invalid response' } });

      render(<IntroductionStory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Story')).toBeInTheDocument();
        expect(screen.getByText('Invalid response')).toBeInTheDocument();
      });
    });
  });
});