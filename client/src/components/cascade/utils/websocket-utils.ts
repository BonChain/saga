/**
 * WebSocket utility functions for cascade visualization
 * Provides secure URL construction and error message sanitization
 */

/**
 * Create secure WebSocket URL with proper protocol conversion
 */
export function createWebSocketUrl(serverUrl: string, actionId: string): string {
  try {
    const url = new URL(serverUrl);

    // Validate URL format
    if (!url.protocol || !url.hostname) {
      throw new Error('Invalid URL format: missing protocol or hostname');
    }

    // Convert HTTP/HTTPS to WS/WSS
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

    // Prevent localhost in production
    if (import.meta.env.PROD) {
      const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (localhostPatterns.includes(url.hostname)) {
        throw new Error('Localhost URLs not allowed in production');
      }
    }

    // Validate port range
    const port = parseInt(url.port);
    if (port && (port < 1 || port > 65535)) {
      throw new Error('Invalid port number: must be between 1 and 65535');
    }

    // Construct WebSocket URL
    const wsUrl = `${protocol}//${url.host}/cascade-updates/${encodeURIComponent(actionId)}`;

    // Final validation
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      throw new Error('Invalid WebSocket URL format');
    }

    return wsUrl;
  } catch (error) {
    console.error('Invalid server URL provided:', serverUrl, error);
    throw new Error(`Failed to create WebSocket URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate WebSocket URL for security
 */
export interface ValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

export function validateWebSocketUrl(url: string): ValidationResult {
  // Basic format validation
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    // Parse URL
    const parsedUrl = new URL(url);

    // Protocol validation
    if (!['ws:', 'wss:'].includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: 'Only WebSocket protocols (ws://, wss://) are supported'
      };
    }

    // Hostname validation
    if (!parsedUrl.hostname) {
      return { isValid: false, error: 'Invalid hostname' };
    }

    // Prevent localhost in production
    if (import.meta.env.PROD) {
      const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (localhostPatterns.includes(parsedUrl.hostname)) {
        return {
          isValid: false,
          error: 'Localhost URLs not allowed in production'
        };
      }
    }

    // Port validation
    const port = parseInt(parsedUrl.port);
    if (port && (port < 1 || port > 65535)) {
      return { isValid: false, error: 'Invalid port number' };
    }

    return { isValid: true, sanitizedUrl: parsedUrl.toString() };

  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Sanitize error messages for production to prevent information leakage
 */
export function sanitizeErrorMessage(error: Error | string, isProduction: boolean = import.meta.env.PROD): string {
  const message = typeof error === 'string' ? error : error.message;

  if (isProduction) {
    // Generic error messages for production
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Authentication failed. Please check your credentials.';
    }

    if (message.includes('403') || message.includes('Forbidden')) {
      return 'Access denied. You do not have permission to access this resource.';
    }

    if (message.includes('404') || message.includes('Not Found')) {
      return 'Resource not found. The requested action or data may not exist.';
    }

    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Server error occurred. Please try again later.';
    }

    if (message.includes('502') || message.includes('503') || message.includes('504')) {
      return 'Service temporarily unavailable. Please try again later.';
    }

    if (message.includes('network') || message.includes('connection') ||
        message.includes('ECONNREFUSED') || message.includes('ENOTFOUND') ||
        message.includes('WebSocket') || message.includes('socket')) {
      return 'Connection error - please check your internet connection and try again.';
    }

    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return 'Connection timeout. Please check your connection and try again.';
    }

    if (message.includes('localhost') && isProduction) {
      return 'Invalid server configuration.';
    }

    // Default generic message
    return 'An error occurred while connecting to the server. Please try again later.';
  }

  // Return full error messages in development
  return message;
}