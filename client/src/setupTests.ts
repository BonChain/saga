/**
 * Test Setup
 * Configures testing environment with required polyfills and global utilities
 */

// @ts-nocheck - This setup file uses Jest globals and mocks that don't need TypeScript checking

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock import.meta.env for Vite compatibility
global.import = {
  meta: {
    env: {
      DEV: false,
      MODE: 'test',
      VITE_SERVER_URL: 'http://localhost:3005',
      VITE_API_URL: 'http://localhost:3005',
    },
  },
};

// Mock MSW server to avoid import issues during basic testing
const mockServer = {
  listen: jest.fn(),
  resetHandlers: jest.fn(),
  close: jest.fn(),
  use: jest.fn(),
};

// Setup MSW server for API mocking (conditionally)
let server = mockServer;
try {
  server = require('./mocks/server').server;
} catch (error) {
  console.warn('MSW server not available, using mock');
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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

// Mock WebSocket for tests
global.WebSocket = jest.fn().mockImplementation(() => ({
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  readyState: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  protocol: '',
  extensions: '',
  binaryType: 'blob',
  bufferedAmount: 0,
  url: '',
  dispatchEvent: jest.fn(),
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

// Mock performance.now for timing tests
Object.defineProperty(global, 'performance', {
  value: {
    ...global.performance,
    now: jest.fn(() => Date.now()),
  },
});

// Mock requestAnimationFrame/cancelAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

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

// Cleanup timers and animations after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});