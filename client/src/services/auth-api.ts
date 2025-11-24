/**
 * Authentication API service for SuiSaga
 * Integrates with existing backend auth-service.ts for JWT authentication
 * Handles challenge-response flow and session management
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// Define types locally to avoid import issues
export interface WalletConnectionError {
  code: 'WALLET_NOT_FOUND' | 'CONNECTION_FAILED' | 'SIGNING_FAILED' | 'AUTHENTICATION_FAILED' | 'NETWORK_ERROR';
  message: string;
  details?: any;
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

export class AuthAPI {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/auth';
    const timeout = parseInt(import.meta.env.VITE_AUTH_TIMEOUT || '30000');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            const token = this.getStoredToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearStoredToken();
            window.location.href = '/'; // Redirect to login if refresh fails
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication challenge from backend
   */
  async getChallenge(walletAddress: string): Promise<ChallengeResponse> {
    try {
      const response: AxiosResponse<ChallengeResponse> = await this.client.post('/challenge', {
        walletAddress,
      });
      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'Failed to get authentication challenge');
    }
  }

  /**
   * Authenticate with signed challenge
   */
  async authenticate(authData: AuthenticateRequest): Promise<AuthenticateResponse> {
    try {
      const response: AxiosResponse<AuthenticateResponse> = await this.client.post('/authenticate', authData);

      // Store the JWT token
      this.storeToken(response.data.token);

      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'Authentication failed');
    }
  }

  /**
   * Refresh the JWT token
   */
  async refreshToken(): Promise<void> {
    try {
      const response: AxiosResponse<{ token: string }> = await this.client.post('/refresh');
      this.storeToken(response.data.token);
    } catch (error) {
      throw this.handleAPIError(error, 'Token refresh failed');
    }
  }

  /**
   * Get session history for returning player recognition
   */
  async getSessionHistory(): Promise<SessionHistoryResponse> {
    try {
      const response: AxiosResponse<SessionHistoryResponse> = await this.client.get('/session-history');
      return response.data;
    } catch (error) {
      // Session history is not critical, so return default values on error
      return {
        sessionCount: 1,
        lastVisit: Date.now(),
        totalActions: 0,
        favoriteWorldArea: 'village'
      };
    }
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.client.get('/validate');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/logout');
    } catch (error) {
      // Continue with local cleanup even if server logout fails
      console.warn('Server logout failed:', error);
    } finally {
      this.clearStoredToken();
    }
  }

  /**
   * Get stored JWT token
   */
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(import.meta.env.VITE_SESSION_STORAGE_KEY || 'suisaga_auth_token');
  }

  /**
   * Store JWT token
   */
  private storeToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(import.meta.env.VITE_SESSION_STORAGE_KEY || 'suisaga_auth_token', token);
  }

  /**
   * Clear stored JWT token
   */
  private clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(import.meta.env.VITE_SESSION_STORAGE_KEY || 'suisaga_auth_token');
  }

  /**
   * Handle API errors and convert to WalletConnectionError
   */
  private handleAPIError(error: any, defaultMessage: string): WalletConnectionError {
    if (error.response?.data) {
      return {
        code: error.response.data.code || 'AUTHENTICATION_FAILED',
        message: error.response.data.message || defaultMessage,
        details: error.response.data.details
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Connection timeout. Please check your network and try again.',
        details: error
      };
    }

    if (error.code === 'ERR_NETWORK') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
        details: error
      };
    }

    return {
      code: 'AUTHENTICATION_FAILED',
      message: defaultMessage,
      details: error
    };
  }
}

// Create singleton instance
export const authAPI = new AuthAPI();

// Export convenience methods
export const {
  getChallenge,
  authenticate,
  refreshToken,
  getSessionHistory,
  validateToken,
  logout,
  getStoredToken
} = authAPI;