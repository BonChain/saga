/**
 * Accessibility Testing Utilities
 * Provides automated accessibility testing using axe-core
 */

import { configureAxe } from 'jest-axe';

// Configure axe for retro gaming UI specifics
const axe = configureAxe({
  rules: {
    // Enable color contrast checking
    'color-contrast': { enabled: true },

    // Allow some retro-specific design choices
    'color-contrast-enhanced': { enabled: false }, // WCAG AAA is handled manually

    // Ensure keyboard navigation works
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: true },

    // Check ARIA attributes
    'aria-valid-attr': { enabled: true },
    'aria-required-attr': { enabled: true },

    // Check for proper heading structure
    'heading-order': { enabled: true },

    // Check for proper form labels
    'label': { enabled: true },

    // Check for sufficient link text
    'link-name': { enabled: true },

    // Check button names
    'button-name': { enabled: true },

    // Check for duplicate IDs
    'duplicate-id': { enabled: true },

    // Check for valid HTML structure
    'html-has-lang': { enabled: true },
    'page-has-title': { enabled: true },

    // Check for image alt text
    'image-alt': { enabled: true },

    // Check for list structure
    'list': { enabled: true },
    'listitem': { enabled: true }
  }
});

export { axe };

/**
 * Test keyboard navigation for an element
 */
export function testKeyboardNavigation(element) {
  const tabbableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  return {
    tabbableCount: tabbableElements.length,
    hasFocusableElements: tabbableElements.length > 0,
    elements: Array.from(tabbableElements).map(el => ({
      tagName: el.tagName,
      type: el.type || 'N/A',
      textContent: el.textContent?.trim() || 'N/A',
      hasTabIndex: el.hasAttribute('tabindex')
    }))
  };
}

/**
 * Test ARIA attributes for an element
 */
export function testAriaAttributes(element) {
  const elementsWithAria = element.querySelectorAll('[aria-label], [aria-labelledby], [role], [aria-expanded]');

  return {
    ariaElementCount: elementsWithAria.length,
    elements: Array.from(elementsWithAria).map(el => ({
      tagName: el.tagName,
      attributes: Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('aria-') || attr.name === 'role')
        .map(attr => `${attr.name}="${attr.value}"`)
    }))
  };
}

/**
 * Test form accessibility
 */
export function testFormAccessibility(element) {
  const forms = element.querySelectorAll('form');
  const inputs = element.querySelectorAll('input, textarea, select');
  const labels = element.querySelectorAll('label');

  return {
    formCount: forms.length,
    inputCount: inputs.length,
    labelCount: labels.length,
    inputsWithoutLabels: Array.from(inputs).filter(input => {
      const id = input.id;
      const hasLabel = id ? element.querySelector(`label[for="${id}"]`) : false;
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel && input.type !== 'hidden';
    }).length
  };
}