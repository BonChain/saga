/**
 * Test Setup
 * Configures testing environment with required polyfills and global utilities
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { server } from './mocks/server';

// Setup MSW server for API mocking
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset request handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are complete
afterAll(() => server.close());

// Mock ResizeObserver for tests that measure elements
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for tests with scroll/viewport
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS custom properties for testing
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop) => {
      const properties = {
        '--terminal-black': '#0a0a0a',
        '--terminal-dark': '#1a1a1a',
        '--neon-green': '#00ff41',
        '--neon-cyan': '#00ffff',
        '--neon-pink': '#ff99ff',
        '--neon-yellow': '#ffaa00',
        '--neon-red': '#ff4141',
      };
      return properties[prop] || '';
    },
  }),
});

// Suppress console warnings in tests unless needed
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('act()')
    ) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});