/**
 * Environment variable type declarations for SuiSaga
 * Ensures type safety for environment-based configuration
 */

// Vite environment variables
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_SERVER_URL: string
  readonly VITE_DEV_API_URL: string
  readonly VITE_DEV_FRONTEND_URL: string
  readonly VITE_PROD_API_URL: string
  readonly VITE_PROD_FRONTEND_URL: string

  // Sui Blockchain Configuration
  readonly VITE_SUI_NETWORK: 'devnet' | 'testnet' | 'mainnet'
  readonly VITE_SUI_FULLNODE_URL: string

  // Wallet Configuration
  readonly VITE_PREFERRED_WALLETS: string
  readonly VITE_AUTO_CONNECT: 'true' | 'false'

  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string

  // Development Configuration
  readonly VITE_DEV_MODE: 'true' | 'false'

  // Feature Flags
  readonly VITE_ENABLE_DEBUG_LOGGING: 'true' | 'false'
  readonly VITE_ENABLE_PERFORMANCE_OVERLAY: 'true' | 'false'

  // Authentication Configuration
  readonly VITE_AUTH_TIMEOUT: string
  readonly VITE_SESSION_STORAGE_KEY: string

  // Security Configuration
  readonly VITE_ENABLE_CORS: 'true' | 'false'

  // UI Configuration
  readonly VITE_ENABLE_ANIMATIONS: 'true' | 'false'
  readonly VITE_THEME: 'default' | 'dark' | 'high-contrast'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global environment variables
declare global {
  // Define globally available environment variables
  const __APP_ENV__: string
  const __API_URL__: string
  const __DEV__: boolean
}

export {}