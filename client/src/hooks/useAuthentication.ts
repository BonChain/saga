/**
 * Authentication hook for SuiSaga
 * Integrates with @mysten/dapp-kit for wallet connection and JWT authentication
 * Handles the complete authentication flow: wallet connect → challenge → sign → authenticate → JWT
 */

import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useDisconnectWallet, useSignPersonalMessage } from '@mysten/dapp-kit';
// Import only the authAPI instance
import { authAPI } from '../services/auth-api';

// Import only the base types we need
import type { SuiAddress } from '@mysten/sui';

// Define all types locally to avoid import issues
export interface WalletAccount {
  address: SuiAddress;
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
  details?: Record<string, unknown>;
}

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

const initialState: AuthenticationState = {
  status: 'disconnected',
  currentAccount: null,
  token: null,
  error: null,
  isLoading: false,
  sessionCount: 0,
  firstVisit: true,
};

/**
 * Custom hook for authentication state management
 * Integrates with Sui dApp Kit and handles JWT authentication with backend
 */
export function useAuthentication(): AuthenticationContextValue {
  const [state, setState] = useState<AuthenticationState>(initialState);

  // Sui dApp Kit hooks
  const currentAccount = useCurrentAccount();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // Update state when Sui account changes
  useEffect(() => {
    if (currentAccount) {
      setState(prev => ({
        ...prev,
        currentAccount,
        status: 'connected'
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentAccount: null,
        status: 'disconnected'
      }));
    }
  }, [currentAccount]);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(import.meta.env.VITE_SESSION_STORAGE_KEY || 'suisaga_auth_token');

      if (token && currentAccount) {
        try {
          const isValid = await authAPI.validateToken();
          if (isValid) {
            const sessionHistory = await authAPI.getSessionHistory();
            setState(prev => ({
              ...prev,
              status: 'authenticated',
              token,
              sessionCount: sessionHistory.sessionCount,
              firstVisit: sessionHistory.sessionCount === 1
            }));
          } else {
            // Token is invalid, clear it
            await authAPI.logout();
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          setState(prev => ({
            ...prev,
            status: 'connected',
            error: 'Authentication validation failed'
          }));
        }
      }
    };

    initializeAuth();
  }, [currentAccount]);

  /**
   * Complete authentication flow with Sui wallet
   */
  const authenticateWithSui = useCallback(async (): Promise<void> => {
    if (!currentAccount) {
      throw new WalletConnectionError({
        code: 'CONNECTION_FAILED',
        message: 'No wallet connected. Please connect your wallet first.'
      });
    }

    setState(prev => ({ ...prev, status: 'authenticating', isLoading: true, error: null }));

    try {
      // Step 1: Get challenge from backend
      const challenge = await authAPI.getChallenge(currentAccount.address);

      // Step 2: Prepare message for signing (following SIWE pattern)
      const message = createAuthenticationMessage(
        challenge.challenge,
        currentAccount.address,
        challenge.nonce
      );

      // Step 3: Sign message with wallet
      const messageBytes = new TextEncoder().encode(message);
      const signatureResult = await signPersonalMessage({
        message: messageBytes,
      });

      if (!signatureResult.signature) {
        throw new Error('Failed to sign authentication message');
      }

      // Step 4: Authenticate with backend
      const authResponse = await authAPI.authenticate({
        walletAddress: currentAccount.address,
        signature: signatureResult.signature,
        challenge: challenge.challenge,
        publicKey: currentAccount.publicKey,
      });

      // Step 5: Update state with authentication success
      setState(prev => ({
        ...prev,
        status: 'authenticated',
        token: authResponse.token,
        sessionCount: authResponse.sessionCount,
        firstVisit: authResponse.firstVisit,
        isLoading: false,
        error: null
      }));

    } catch (error) {
      const authError: WalletConnectionError = {
        code: 'AUTHENTICATION_FAILED',
        message: error instanceof Error ? error.message : 'Authentication failed',
        details: error
      };

      setState(prev => ({
        ...prev,
        status: 'connected', // Go back to connected state so user can try again
        isLoading: false,
        error: authError.message
      }));

      throw authError;
    }
  }, [currentAccount, signPersonalMessage]);

  /**
   * Disconnect wallet and clear authentication
   */
  const disconnectWalletHandler = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Clear JWT token from server and storage
      if (state.token) {
        await authAPI.logout();
      }

      // Disconnect wallet using Sui dApp Kit
      disconnectWallet();

      // Reset state
      setState(initialState);

    } catch (error) {
      console.error('Logout failed:', error);
      // Continue with local cleanup even if server logout fails
      setState(initialState);
    }
  }, [disconnectWallet, state.token]);

  /**
   * Refresh JWT token
   */
  const refreshTokenHandler = useCallback(async (): Promise<void> => {
    try {
      await authAPI.refreshToken();
      const token = authAPI.getStoredToken();

      if (token) {
        setState(prev => ({ ...prev, token }));
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid token
      await authAPI.logout();
      setState(initialState);
    }
  }, []);

  /**
   * Clear any current error
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Check if wallet is connected
   */
  const isConnected = useCallback((): boolean => {
    return state.status === 'connected' || state.status === 'authenticated';
  }, [state.status]);

  /**
   * Check if user is fully authenticated
   */
  const isAuthenticated = useCallback((): boolean => {
    return state.status === 'authenticated' && !!state.token;
  }, [state.status, state.token]);

  /**
   * Get current wallet address
   */
  const getWalletAddress = useCallback((): string | null => {
    return currentAccount?.address || null;
  }, [currentAccount]);

  /**
   * Get session count
   */
  const getSessionCount = useCallback((): number => {
    return state.sessionCount;
  }, [state.sessionCount]);

  return {
    ...state,
    isLoading: state.isLoading || isConnecting || isDisconnecting,
    authenticateWithSui,
    disconnectWallet: disconnectWalletHandler,
    refreshToken: refreshTokenHandler,
    clearError,
    isConnected,
    isAuthenticated,
    getWalletAddress,
    getSessionCount,
  };
}

/**
 * Create SIWE (Sign-In with Ethereum) compatible message for Sui
 */
function createAuthenticationMessage(
  challenge: string,
  address: string,
  nonce: string
): string {
  const domain = window.location.host;
  const now = new Date();
  const expirationTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
  const issuedAt = now.toISOString();

  return `${domain} wants you to sign in with your Sui account:
${address}

Welcome to SuiSaga! The living world blockchain game.

URI: ${window.location.origin}
Version: 1
Chain ID: sui:testnet
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime.toISOString()}

Challenge: ${challenge}`;
}