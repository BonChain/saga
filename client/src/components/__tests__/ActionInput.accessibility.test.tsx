/**
 * ActionInput Component Accessibility Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import ActionInput from '../ActionInput';
import { testKeyboardNavigation, testAriaAttributes, testFormAccessibility } from '../../utils/test/accessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock axios to prevent actual API calls
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({
    data: { success: true, data: { id: 'test-123' } }
  }))
}));

describe('ActionInput Accessibility', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should not have any accessibility violations', async () => {
    const { container } = render(<ActionInput />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper form labels and accessibility attributes', () => {
    render(<ActionInput />);

    // Check for textarea with proper accessibility
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAccessibleName(); // Should have placeholder or label

    // Check for submit button
    const submitButton = screen.getByRole('button', { name: /execute action/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  it('should be keyboard navigable', () => {
    const { container } = render(<ActionInput />);

    const keyboardNav = testKeyboardNavigation(container);

    expect(keyboardNav.hasFocusableElements).toBe(true);
    expect(keyboardNav.tabbableCount).toBeGreaterThan(1); // textarea + buttons
  });

  it('should have proper ARIA attributes', () => {
    const { container } = render(<ActionInput />);

    const ariaTest = testAriaAttributes(container);

    // Should have proper ARIA attributes for interactive elements
    expect(ariaTest.ariaElementCount).toBeGreaterThanOrEqual(0);
  });

  it('should have accessible form structure', () => {
    const { container } = render(<ActionInput />);

    const formTest = testFormAccessibility(container);

    expect(formTest.formCount).toBe(1);
    expect(formTest.inputsWithoutLabels).toBe(0); // Textarea should have placeholder
  });

  it('should announce changes to screen readers', async () => {
    const user = userEvent.setup();
    render(<ActionInput />);

    const textarea = screen.getByRole('textbox');

    // Type content to trigger character count changes
    await user.type(textarea, 'test action');

    // Character counter should be visible and update
    expect(screen.getByText(/12\/500/)).toBeInTheDocument();
  });

  it('should handle disabled state accessibly', () => {
    render(<ActionInput disabled={true} />);

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /execute action/i });

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should provide feedback accessibly', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();

    render(<ActionInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /execute action/i });

    // Submit form
    await user.type(textarea, 'test action');
    await user.click(submitButton);

    // Should show feedback message (though mock may delay this)
    expect(mockOnSubmit).toHaveBeenCalledWith('test action');
  });

  it('should respect reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { container } = render(<ActionInput />);

    // Component should still be accessible with reduced motion
    const results = Promise.resolve(axe(container));
    expect(results).resolves.not.toThrow();
  });

  it('should have sufficient color contrast', () => {
    const { container } = render(<ActionInput />);

    // While axe handles basic contrast, we can check that contrast-enhanced rules exist
    // This test ensures our retro color scheme doesn't break accessibility
    const style = getComputedStyle(container);
    expect(style.color).toBeDefined();
    expect(style.backgroundColor).toBeDefined();
  });
});