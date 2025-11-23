/**
 * Custom Error Classes for Production-Ready Error Handling
 *
 * Provides specific error types for better debugging and error classification
 * in production environments. Each error includes relevant context and
 * appropriate HTTP status codes.
 */

export enum ErrorCode {
  // Authentication & Authorization Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Service Errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',

  // Business Logic Errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_ACTION = 'INVALID_ACTION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface ErrorContext {
  userId?: string;
  actionId?: string;
  requestId?: string;
  service?: string;
  endpoint?: string;
  timestamp?: number;
  operation?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties for flexibility
}

/**
 * Base Application Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly context: ErrorContext;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = {
      timestamp: Date.now(),
      ...context
    };

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      isOperational: this.isOperational
    };
  }

  /**
   * Check if this is a specific error type
   */
  isErrorCode(code: ErrorCode): boolean {
    return this.code === code;
  }
}

/**
 * Authentication & Authorization Errors
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', context: ErrorContext = {}) {
    super(message, 401, ErrorCode.UNAUTHORIZED, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', context: ErrorContext = {}) {
    super(message, 403, ErrorCode.FORBIDDEN, context);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid authentication token', context: ErrorContext = {}) {
    super(message, 401, ErrorCode.INVALID_TOKEN, context);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Authentication token has expired', context: ErrorContext = {}) {
    super(message, 401, ErrorCode.TOKEN_EXPIRED, context);
  }
}

/**
 * Validation Errors
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', context: ErrorContext = {}) {
    super(message, 400, ErrorCode.VALIDATION_FAILED, context);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string = 'Invalid input provided', context: ErrorContext = {}) {
    super(message, 400, ErrorCode.INVALID_INPUT, context);
  }
}

/**
 * Resource Errors
 */
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, identifier: string, context: ErrorContext = {}) {
    super(`${resource} with identifier '${identifier}' not found`, 404, ErrorCode.RESOURCE_NOT_FOUND, context);
  }
}

export class ResourceConflictError extends AppError {
  constructor(message: string = 'Resource conflict detected', context: ErrorContext = {}) {
    super(message, 409, ErrorCode.RESOURCE_CONFLICT, context);
  }
}

/**
 * Service Errors
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string, context: ErrorContext = {}) {
    super(`${service} service is currently unavailable`, 503, ErrorCode.SERVICE_UNAVAILABLE, {
      service,
      ...context
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context: ErrorContext = {}) {
    super(`External service error from ${service}: ${message}`, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, {
      service,
      ...context
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context: ErrorContext = {}) {
    super(message, 500, ErrorCode.DATABASE_ERROR, context);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string = 'Blockchain operation failed', context: ErrorContext = {}) {
    super(message, 502, ErrorCode.BLOCKCHAIN_ERROR, context);
  }
}

/**
 * Business Logic Errors
 */
export class InsufficientBalanceError extends AppError {
  constructor(balance: number, required: number, context: ErrorContext = {}) {
    super(`Insufficient balance: have ${balance}, need ${required}`, 400, ErrorCode.INSUFFICIENT_BALANCE, {
      currentBalance: balance,
      requiredBalance: required,
      ...context
    });
  }
}

export class InvalidActionError extends AppError {
  constructor(action: string, reason: string, context: ErrorContext = {}) {
    super(`Invalid action '${action}': ${reason}`, 400, ErrorCode.INVALID_ACTION, {
      action,
      reason,
      ...context
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(limit: number, windowMs: number, context: ErrorContext = {}) {
    super(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`, 429, ErrorCode.RATE_LIMIT_EXCEEDED, {
      limit,
      windowMs,
      ...context
    });
  }
}

/**
 * System Errors
 */
export class ConfigurationError extends AppError {
  constructor(configKey: string, context: ErrorContext = {}) {
    super(`Configuration error: missing or invalid '${configKey}'`, 500, ErrorCode.CONFIGURATION_ERROR, {
      configKey,
      ...context
    });
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network operation failed', context: ErrorContext = {}) {
    super(message, 503, ErrorCode.NETWORK_ERROR, context);
  }
}

/**
 * Error Factory Functions
 */
export const ErrorFactory = {
  /**
   * Create appropriate error from service response
   */
  fromServiceError(service: string, error: any, context: ErrorContext = {}): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Handle common service error patterns
    if (error.response?.status === 401) {
      return new UnauthorizedError(error.response.data?.message || 'Service authentication failed', { service, ...context });
    }

    if (error.response?.status === 404) {
      return new ResourceNotFoundError('Service Resource', error.response.config?.url || 'unknown', { service, ...context });
    }

    if (error.response?.status >= 500) {
      return new ExternalServiceError(service, error.message, context);
    }

    // Default fallback
    return new ExternalServiceError(service, error.message || 'Unknown service error', context);
  },

  /**
   * Create validation error from express-validator result
   */
  fromValidationResult(errors: any[], context: ErrorContext = {}): ValidationError {
    const message = errors.map(err => `${err.param}: ${err.msg}`).join(', ');
    return new ValidationError(`Validation failed: ${message}`, { validationErrors: errors, ...context });
  },

  /**
   * Create appropriate error based on error code
   */
  fromErrorCode(code: ErrorCode, message?: string, context: ErrorContext = {}): AppError {
    const errorMessage = message || getDefaultErrorMessage(code);

    switch (code) {
      case ErrorCode.UNAUTHORIZED:
        return new UnauthorizedError(errorMessage, context);
      case ErrorCode.FORBIDDEN:
        return new ForbiddenError(errorMessage, context);
      case ErrorCode.VALIDATION_FAILED:
        return new ValidationError(errorMessage, context);
      case ErrorCode.RESOURCE_NOT_FOUND:
        return new ResourceNotFoundError('Resource', 'unknown', context);
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return new RateLimitExceededError(100, 900000, context);
      case ErrorCode.SERVICE_UNAVAILABLE:
        return new ServiceUnavailableError('Unknown', context);
      default:
        return new AppError(errorMessage, 500, code, context);
    }
  }
};

/**
 * Default error messages for error codes
 */
function getDefaultErrorMessage(code: ErrorCode): string {
  const messages = {
    [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
    [ErrorCode.FORBIDDEN]: 'Access forbidden',
    [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ErrorCode.CONFIGURATION_ERROR]: 'Configuration error',
    [ErrorCode.NETWORK_ERROR]: 'Network error'
  };

  return messages[code] || 'Unknown error occurred';
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError for consistent handling
 */
export function toAppError(error: any, context: ErrorContext = {}): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, ErrorCode.INTERNAL_SERVER_ERROR, context, false);
  }

  if (typeof error === 'string') {
    return new AppError(error, 500, ErrorCode.INTERNAL_SERVER_ERROR, context, false);
  }

  return new AppError('Unknown error occurred', 500, ErrorCode.INTERNAL_SERVER_ERROR, context, false);
}