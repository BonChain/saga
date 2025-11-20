/**
 * Enhanced API Key Validation Utilities
 *
 * Provides comprehensive validation for AI provider API keys including:
 * - Format validation with regex patterns
 * - Security checks for suspicious patterns
 * - Length and character validation
 * - Provider-specific validation rules
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  provider?: string;
  pattern?: string;
}

export class APIKeyValidator {
  // OpenAI key patterns (updated for current formats)
  private static readonly OPENAI_PATTERNS = {
    // Current project keys: sk-proj-abc123...
    PROJ: /^sk-proj-[A-Za-z0-9]{48}$/,
    // Legacy format: sk-abc123...
    LEGACY: /^sk-[A-Za-z0-9]{48}$/,
    // New format: sk-ant-api03-abc123...
    ANT_API: /^sk-ant-api03-[A-Za-z0-9]{95}$/,
    // Service account keys: sk-service-abc123...
    SERVICE: /^sk-service-[A-Za-z0-9]{64}$/,
  };

  // Z.ai key patterns (based on actual format from user's .env)
  private static readonly ZAI_PATTERNS = {
    // Standard format: alphanumeric with dots
    STANDARD: /^[A-Za-z0-9]+\.[A-Za-z0-9]+\.[A-Za-z0-9]+$/,
    // Extended format: longer alphanumeric with dots
    EXTENDED: /^[A-Za-z0-9]+\.[A-Za-z0-9]+\.[A-Za-z0-9]+\.[A-Za-z0-9]+$/,
    // Simple format: pure alphanumeric
    SIMPLE: /^[A-Za-z0-9]{16,128}$/,
  };

  // Common suspicious patterns to detect
  private static readonly SUSPICIOUS_PATTERNS = [
    /test/i,
    /example/i,
    /demo/i,
    /fake/i,
    /invalid/i,
    /placeholder/i,
    /your.*key/i,
    /xxxx/i,
    /12345/,
    /(.)\1{10,}/, // Repeated characters
    /^sk-[^a-z0-9]*$/i, // sk- followed by non-alphanumeric
  ];

  // Common placeholder values
  private static readonly PLACEHOLDER_VALUES = [
    'your_openai_api_key_here',
    'sk-yourkeyhere',
    'sk-xxxx',
    'sk-example',
    'example_key',
    'test_key',
    'your_zai_key_here',
    'sk-zai-example',
    'demo_key',
    'api_key_placeholder',
  ];

  /**
   * Validate OpenAI API key
   */
  static validateOpenAIKey(apiKey: string): ValidationResult {
    const baseValidation = this.validateBaseKey(apiKey, 'OpenAI');
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const trimmedKey = apiKey.trim();

    // Check OpenAI-specific format requirements
    const patterns = Object.values(this.OPENAI_PATTERNS);
    const matchingPattern = patterns.find(pattern => pattern.test(trimmedKey));

    if (!matchingPattern) {
      return {
        valid: false,
        error: 'Invalid OpenAI API key format. Expected formats: sk-proj-*, sk-*, sk-ant-api03-*, or sk-service-*',
        provider: 'OpenAI'
      };
    }

    // Additional OpenAI-specific length validation
    if (trimmedKey.length < 20) {
      return {
        valid: false,
        error: 'OpenAI API key too short (minimum 20 characters)',
        provider: 'OpenAI'
      };
    }

    if (trimmedKey.length > 200) {
      return {
        valid: false,
        error: 'OpenAI API key too long (maximum 200 characters)',
        provider: 'OpenAI'
      };
    }

    // Check for suspicious patterns specific to OpenAI
    if (this.containsSuspiciousPatterns(trimmedKey)) {
      return {
        valid: false,
        error: 'OpenAI API key contains suspicious patterns or appears to be a placeholder',
        provider: 'OpenAI'
      };
    }

    return {
      valid: true,
      provider: 'OpenAI',
      pattern: matchingPattern.source
    };
  }

  /**
   * Validate Z.ai API key
   */
  static validateZAIKey(apiKey: string): ValidationResult {
    const baseValidation = this.validateBaseKey(apiKey, 'Z.ai');
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const trimmedKey = apiKey.trim();

    // Z.ai specific length validation
    if (trimmedKey.length < 16) {
      return {
        valid: false,
        error: 'Z.ai API key too short (minimum 16 characters)',
        provider: 'Z.ai'
      };
    }

    if (trimmedKey.length > 128) {
      return {
        valid: false,
        error: 'Z.ai API key too long (maximum 128 characters)',
        provider: 'Z.ai'
      };
    }

    // Check Z.ai patterns
    const patterns = Object.values(this.ZAI_PATTERNS);
    const matchingPattern = patterns.find(pattern => pattern.test(trimmedKey));

    if (!matchingPattern) {
      return {
        valid: false,
        error: 'Invalid Z.ai API key format. Expected alphanumeric format with optional dots (.) separators',
        provider: 'Z.ai'
      };
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(trimmedKey)) {
      return {
        valid: false,
        error: 'Z.ai API key contains suspicious patterns or appears to be a placeholder',
        provider: 'Z.ai'
      };
    }

    return {
      valid: true,
      provider: 'Z.ai',
      pattern: matchingPattern.source
    };
  }

  /**
   * Validate OpenRouter API key
   */
  static validateOpenRouterKey(apiKey: string): ValidationResult {
    const baseValidation = this.validateBaseKey(apiKey, 'OpenRouter');
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const trimmedKey = apiKey.trim();

    // OpenRouter keys are typically UUID-like or long alphanumeric strings
    const openRouterPattern = /^sk-or-[A-Za-z0-9_-]{48,}$/;

    if (!openRouterPattern.test(trimmedKey)) {
      return {
        valid: false,
        error: 'Invalid OpenRouter API key format. Expected format: sk-or-* followed by alphanumeric characters',
        provider: 'OpenRouter'
      };
    }

    return {
      valid: true,
      provider: 'OpenRouter',
      pattern: openRouterPattern.source
    };
  }

  /**
   * Base validation common to all API keys
   */
  private static validateBaseKey(apiKey: string, provider: string): ValidationResult {
    if (!apiKey) {
      return {
        valid: false,
        error: `${provider} API key cannot be empty`,
        provider
      };
    }

    if (typeof apiKey !== 'string') {
      return {
        valid: false,
        error: `${provider} API key must be a string`,
        provider
      };
    }

    const trimmedKey = apiKey.trim();

    if (trimmedKey.length === 0) {
      return {
        valid: false,
        error: `${provider} API key cannot be empty or whitespace only`,
        provider
      };
    }

    // Check for common placeholder values
    if (this.isPlaceholderValue(trimmedKey)) {
      return {
        valid: false,
        error: `${provider} API key appears to be a placeholder value`,
        provider
      };
    }

    return { valid: true };
  }

  /**
   * Check if key matches common placeholder patterns
   */
  private static isPlaceholderValue(apiKey: string): boolean {
    const lowerKey = apiKey.toLowerCase();
    return this.PLACEHOLDER_VALUES.some(placeholder =>
      lowerKey.includes(placeholder.toLowerCase())
    );
  }

  /**
   * Check for suspicious patterns
   */
  private static containsSuspiciousPatterns(apiKey: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(apiKey)) ||
           this.isPlaceholderValue(apiKey);
  }

  /**
   * Validate AI provider configuration comprehensively
   */
  static validateAIProviderConfig(config: {
    openai?: { apiKey?: string };
    zai?: { apiKey?: string };
    openrouter?: { apiKey?: string };
  }): void {
    // Validate OpenAI configuration
    if (config.openai?.apiKey) {
      const openaiValidation = this.validateOpenAIKey(config.openai.apiKey);
      if (!openaiValidation.valid) {
        throw new Error(`OpenAI API key validation failed: ${openaiValidation.error}`);
      }
    }

    // Validate Z.ai configuration
    if (config.zai?.apiKey) {
      const zaiValidation = this.validateZAIKey(config.zai.apiKey);
      if (!zaiValidation.valid) {
        throw new Error(`Z.ai API key validation failed: ${zaiValidation.error}`);
      }
    }

    // Validate OpenRouter configuration
    if (config.openrouter?.apiKey) {
      const openrouterValidation = this.validateOpenRouterKey(config.openrouter.apiKey);
      if (!openrouterValidation.valid) {
        throw new Error(`OpenRouter API key validation failed: ${openrouterValidation.error}`);
      }
    }
  }

  /**
   * Sanitize API key for logging (hide sensitive parts)
   */
  static sanitizeForLogging(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '[INVALID]';
    }

    // Show first 4 and last 4 characters, mask the rest
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(apiKey.length - 8);

    return `${start}${middle}${end}`;
  }
}