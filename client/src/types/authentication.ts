/**
 * Authentication and wallet connection types for SuiSaga
 * Provides type safety for wallet connection state and JWT token handling
 * Built on top of @mysten/dapp-kit for proper Sui wallet integration
 */

// Import the correct account type from @mysten/dapp-kit
import type { SuiAddress } from '@mysten/sui';

export interface WalletAccount {
  address: SuiAddress;
  publicKey: string;
  name?: string;
  icon?: string;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  name?: string;
  icon?: string;
}

export interface AuthenticationState {
  status: 'disconnected' | 'connecting' | 'connected' | 'authenticating' | 'authenticated' | 'error';
  currentAccount: WalletAccount | null;
  token: string | null;
  error: string | null;
  isLoading: boolean;
  sessionCount: number;
  firstVisit: boolean;
}

export interface WalletConnectionError {
  code: 'WALLET_NOT_FOUND' | 'CONNECTION_FAILED' | 'SIGNING_FAILED' | 'AUTHENTICATION_FAILED' | 'NETWORK_ERROR';
  message: string;
  details?: any;
}

export interface JWTPayload {
  walletAddress: string;
  sessionId: string;
  sessionCount: number;
  firstVisit: boolean;
  lastVisit: number;
  exp: number;
  iat: number;
}

export interface ChallengeResponse {
  challenge: string;
  nonce: string;
  expiresAt: number;
}

export interface AuthenticateRequest {
  walletAddress: string;
  signature: string;
  challenge: string;
  publicKey: string;
}

export interface AuthenticateResponse {
  token: string;
  expiresIn: number;
  walletAddress: string;
  sessionCount: number;
  firstVisit: boolean;
}

export interface SessionHistoryResponse {
  sessionCount: number;
  lastVisit: number;
  totalActions: number;
  favoriteWorldArea: string;
}

// Wallet connection events
export type WalletConnectionEvent =
  | { type: 'WALLET_CONNECTING' }
  | { type: 'WALLET_CONNECTED'; account: WalletAccount }
  | { type: 'WALLET_DISCONNECTED' }
  | { type: 'AUTHENTICATION_STARTING' }
  | { type: 'AUTHENTICATION_SUCCESS'; token: string; sessionCount: number }
  | { type: 'AUTHENTICATION_ERROR'; error: WalletConnectionError }
  | { type: 'TOKEN_REFRESHED'; newToken: string };

// Sui network configuration
export interface SuiNetworkConfig {
  name: string;
  rpcUrl: string;
  fullNodeUrl: string;
  variables?: Record<string, string>;
}

// Authentication context value - integrates with Sui dApp Kit
export interface AuthenticationContextValue extends AuthenticationState {
  // Sui dApp Kit integration
  authenticateWithSui: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;

  // Helper methods
  isConnected: () => boolean;
  isAuthenticated: () => boolean;
  getWalletAddress: () => string | null;
  getSessionCount: () => number;
}

// Message signing for authentication
export interface AuthenticationMessage {
  domain: string;
  address: string;
  nonce: string;
  statement: string;
  version: string;
  chainId: string;
  issuedAt: string;
  expirationTime: string;
  notBefore?: string;
  resources?: string[];
}