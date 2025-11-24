import { Request, Response, NextFunction } from 'express';

/**
 * Input Validation Middleware
 * Provides comprehensive input validation and sanitization for API endpoints
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

/**
 * Sanitize input string to prevent XSS and injection attacks
 */
export function sanitizeInput(input: any): any {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/['"\\]/g, '') // Remove quotes and backslashes
    .substring(0, 10000); // Limit length
}

/**
 * Validate a single value against rules
 */
export function validateValue(value: any, rule: ValidationRule): { valid: boolean; error?: string } {
  // Check if required field is missing
  if (rule.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${rule.field} is required` };
  }

  // Skip validation if field is not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: `${rule.field} must be a string` };
        }
        break;
      case 'number': {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { valid: false, error: `${rule.field} must be a number` };
        }
        value = numValue;
        break;
      }
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return { valid: false, error: `${rule.field} must be a boolean` };
        }
        value = Boolean(value);
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return { valid: false, error: `${rule.field} must be an object` };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, error: `${rule.field} must be an array` };
        }
        break;
    }
  }

  // Length validation for strings
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return { valid: false, error: `${rule.field} must be at least ${rule.minLength} characters` };
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return { valid: false, error: `${rule.field} must not exceed ${rule.maxLength} characters` };
    }
  }

  // Range validation for numbers
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return { valid: false, error: `${rule.field} must be at least ${rule.min}` };
    }
    if (rule.max !== undefined && value > rule.max) {
      return { valid: false, error: `${rule.field} must not exceed ${rule.max}` };
    }
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      return { valid: false, error: `${rule.field} format is invalid` };
    }
  }

  // Whitelist validation
  if (rule.whitelist && rule.whitelist.length > 0) {
    if (!rule.whitelist.includes(value)) {
      return { valid: false, error: `${rule.field} contains invalid value` };
    }
  }

  // Blacklist validation
  if (rule.blacklist && rule.blacklist.length > 0) {
    if (rule.blacklist.includes(value)) {
      return { valid: false, error: `${rule.field} contains prohibited value` };
    }
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      return { valid: false, error: typeof customResult === 'string' ? customResult : `${rule.field} is invalid` };
    }
  }

  return { valid: true };
}

/**
 * Create validation middleware from schema
 */
export function validateInput(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      for (const rule of schema.body) {
        const value = req.body[rule.field];
        const result = validateValue(value, rule);

        if (!result.valid) {
          errors.push(result.error!);
        } else if (rule.sanitize && typeof value === 'string') {
          req.body[rule.field] = sanitizeInput(value);
        }
      }
    }

    // Validate query parameters
    if (schema.query) {
      for (const rule of schema.query) {
        const value = req.query[rule.field];
        const result = validateValue(value, rule);

        if (!result.valid) {
          errors.push(result.error!);
        } else if (rule.sanitize && typeof value === 'string') {
          req.query[rule.field] = sanitizeInput(value);
        }
      }
    }

    // Validate path parameters
    if (schema.params) {
      for (const rule of schema.params) {
        const value = req.params[rule.field];
        const result = validateValue(value, rule);

        if (!result.valid) {
          errors.push(result.error!);
        } else if (rule.sanitize && typeof value === 'string') {
          req.params[rule.field] = sanitizeInput(value);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Action submission validation
  submitAction: {
    body: [
      { field: 'playerId', required: true, type: 'string' as const, minLength: 1, maxLength: 100, sanitize: true },
      { field: 'intent', required: true, type: 'string' as const, minLength: 1, maxLength: 500, sanitize: true },
      { field: 'originalInput', required: true, type: 'string' as const, minLength: 1, maxLength: 500, sanitize: true },
      { field: 'parsedIntent', required: false, type: 'object' as const }
    ]
  },

  // Pagination validation
  pagination: {
    query: [
      { field: 'limit', required: false, type: 'number' as const, min: 1, max: 100 },
      { field: 'offset', required: false, type: 'number' as const, min: 0 }
    ]
  },

  // ID parameter validation
  idParam: {
    params: [
      { field: 'id', required: true, type: 'string' as const, minLength: 1, maxLength: 100, sanitize: true }
    ]
  },

  // World state modification validation
  worldStateModification: {
    body: [
      { field: 'regions', required: false, type: 'object' as const },
      { field: 'characters', required: false, type: 'object' as const },
      { field: 'economy', required: false, type: 'object' as const },
      { field: 'environment', required: false, type: 'object' as const }
    ]
  },

  // Status update validation
  statusUpdate: {
    params: [
      { field: 'id', required: true, type: 'string' as const, minLength: 1, maxLength: 100, sanitize: true }
    ],
    body: [
      {
        field: 'status',
        required: true,
        type: 'string' as const,
        whitelist: ['pending', 'processing', 'completed', 'failed'],
        sanitize: true
      },
      { field: 'consequences', required: false, type: 'array' as const }
    ]
  }
};

/**
 * Middleware to prevent common injection attacks
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

/**
 * Rate limiting middleware (basic in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean old entries
    for (const [ip, data] of rateLimitStore.entries()) {
      if (data.resetTime < windowStart) {
        rateLimitStore.delete(ip);
      }
    }

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < windowStart) {
      entry = { count: 0, resetTime: now + options.windowMs };
      rateLimitStore.set(key, entry);
    }

    // Check limit
    if (entry.count >= options.max) {
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    entry.count++;
    next();
  };
}