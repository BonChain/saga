module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
      }
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**/*',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(d3)/)'
  ],
  // setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // Commented out to avoid ES module issues
  testTimeout: 10000,
  verbose: true,
};