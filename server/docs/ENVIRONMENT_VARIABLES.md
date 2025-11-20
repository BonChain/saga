# Environment Variables Documentation

This document describes all environment variables used by the SuiSaga backend application.

## 🔧 Required Environment Variables

### **Core Infrastructure**
```bash
SUI_NETWORK=testnet
WALRUS_MAX_RETRIES=3
WALRUS_TIMEOUT=60000
WALRUS_USE_BACKUP=true
```

**Description:**
- `SUI_NETWORK`: Sui blockchain network (testnet/mainnet)
- `WALRUS_MAX_RETRIES`: Maximum retry attempts for Walrus operations
- `WALRUS_TIMEOUT`: Timeout for Walrus operations in milliseconds
- `WALRUS_USE_BACKUP`: Enable backup mechanism for Walrus storage

### **Private Key (Security)**
```bash
DEVELOPER_PRIVATE_KEY=your_sui_private_key_here
```
**Description:**
- `DEVELOPER_PRIVATE_KEY`: Sui developer private key for sponsored transactions

## 🔧 Security Configuration

### **Authentication & Rate Limiting**
```bash
# Rate limiting (per IP, per minute)
MAX_API_CALLS_PER_DAY=1000
AI_RATE_LIMIT_PER_USER=10

# Request timeouts and retries
AI_REQUEST_TIMEOUT=15000
MAX_RETRY_ATTEMPTS=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=10000
```

**Description:**
- `MAX_API_CALLS_PER_day`: Maximum API calls per day per user
- `AI_RATE_LIMIT_PER_USER`: Rate limit per user per hour
- `AI_REQUEST_TIMEOUT`: AI request timeout in milliseconds
- `MAX_RETRY_ATTEMPTS`: Maximum retry attempts for failed requests
- `RETRY_BASE_DELAY`: Base delay between retries in milliseconds
- `RETRY_MAX_DELAY`: Maximum delay between retries in milliseconds

### **Circuit Breaker Configuration**
```bash
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30000
```

**Description:**
- `CIRCUIT_BREAKER_FAILURE_THRESHOLD**: Failures before opening circuit breaker
- `CIRCUIT_BREAKER_RECOVERY_TIMEOUT`: Recovery timeout in milliseconds

### **Cost Controls**
```bash
TOKEN_USAGE_WARNING_THRESHOLD=8000
COST_ESTIMATE_ENABLED=true
```

**Description:**
- `TOKEN_USAGE_THRESHOLD`: Warning threshold for token usage (cost estimate)
- `COST_ESTIMATE_ENABLED`: Enable cost estimation for AI operations

## 🤖 Z.ai AI Integration

### **Z.ai Configuration**
```bash
# Z.ai API integration
ZAI_API_KEY=your_zai_api_key_here
ZAI_MODEL=glm-4.6
ZAI_TEMPERATURE=0.7
ZAI_MAX_TOKENS=500
```

**Description:**
- `ZAI_API_KEY`: Z.ai API key for AI processing
- `ZAI_MODEL`: Default Z.ai model (glm-4.6, glm-4, glm-4-airx, glm-4-flash, glm-3-turbo)
- `ZAI_TEMPERATURE**: AI creativity level (0.0-2.0)
- `ZAI_MAX_TOKENS`: Maximum tokens per response

### **OpenAI Fallback**
```bash
# OpenAI configuration (fallback)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_DEBUG_MODE=false
OPENAI_LOG_LEVEL=info
```

**Description:**
- `OPENAI_API_KEY`: OpenAI API key (fallback when Z.ai unavailable)
- `OPENAI_MODEL`: OpenAI model (fallback model)
- `OPENAI_DEBUG_MODE`: Enable debug logging for OpenAI calls
- `OPENAI_LOG_LEVEL`: Log level for OpenAI operations

## 🔒 Data Validation Configuration

### **Input Validation**
```bash
VALIDATION_STRICT=false
VALIDATION_MAX_ACTION_LENGTH=500
VALIDATION_MAX_STATE_SIZE=10485760
```

**Description:**
- `VALIDATION_STRICT`: Enable strict validation mode
- `VALIDATION_MAX_ACTION_LENGTH`: Maximum length for action descriptions
- `VALIDATION_MAX_STATE_SIZE`: Maximum state object size (10MB)

## 📝 Logging Configuration

### **Log Levels and Output**
```bash
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_TO_CONSOLE=true
AUDIT_RETENTION_DAYS=30
ENABLE_SENSITIVE_DATA_LOGGING=false
ENABLE_PERFORMANCE_TRACKING=true
ENABLE_COMPLIANCE_LOGGING=false
ENABLE_ANONYMIZATION=true
```

**Description:**
- `LOG_LEVEL`: Minimum log level (debug, info, warn, error)
- `LOG_TO_FILE`: Enable file logging
- `LOG_TO_CONSOLE`: Enable console output
- `AUDIT_RETENTION_DAYS`: Days to keep audit logs
- `ENABLE_SENSITIVE_DATA_LOGGING`: Log sensitive data (security risk)
- `ENABLE_PERFORMANCE_TRACKING: Track performance metrics
- `ENABLE_COMPLIANCE_LOGGING: Log compliance and validation events
- `ENABLE_ANONYMIZATION`: Anonymize sensitive data in logs

### **Session Management**
```bash
SESSION_ID=session_1763556016930_xxyz
```

**Description:**
- `SESSION_ID`: Unique identifier for tracking user sessions

## 🔍 Backup Configuration

### **Backup Settings**
```bash
BACKUP_ENABLED=true
BACKUP_MAX_BACKUPS=10
BACKUP_COMPRESSION=false
BACKUP_ENCRYPTION=false
BACKUP_ENCRYPTION_KEY=
```

**Description:**
- `BACKUP_ENABLED`: Enable backup mechanism
- `BACKUP_MAX_BACKUPS`: Maximum number of backups to keep
- `BACKUP_COMPRESSION`: Enable backup compression
- `BACKUP_ENCRYPTION`: Enable backup encryption
- `BACKUP_ENCRYPTION_KEY`: Encryption key for backup files

## 🔧 Error Handling

### **Error Response Format**
```javascript
{
  "error": "Descriptive error message",
  "status": "error",
  "code": "ERROR_CODE",
  "timestamp": "2023-11-19T12:00:00.000Z",
  "requestId": "req-123456"
}
```

## 🔐 Development Settings

### **Debug Mode**
```bash
OPENAI_DEBUG_MODE=true
OPENAI_LOG_LEVEL=debug
ZAI_DEBUG_MODE=true
```

**Description:**
- `OPENAI_DEBUG_MODE`: Enable detailed OpenAI debug logging
- `OPENAI_LOG_LEVEL`: Set to debug level for verbose logging
- `ZAI_DEBUG_MODE`: Enable Z.ai debug mode

### **Testing Configuration**
```bash
TEST_DATABASE_URL=mongodb://localhost:27017/test
TEST_AI_RESPONSE_DELAY=100
```

**Description:**
- `TEST_DATABASE_URL`: Test database connection string
- `TEST_AI_RESPONSE_DELAY`: Delay for AI test responses (ms)

## 🚨 Security Considerations

### **Never Commit to Version Control**
- ✅ `DEVELOPER_PRIVATE_KEY` - Store securely in environment variables only
- ✅ Session tokens - Use ephemeral tokens with short expiration
- ✅ API keys - Use environment variables, never commit to code

### **Input Validation**
- ✅ Content-Type enforcement prevents injection attacks
- ✅ Payload size limits prevent denial of service
- ✅ Parameter validation prevents malformed requests
- ✅ Rate limiting prevents abuse and API abuse

### **Rate Limiting**
- ✅ Per-IP limiting prevents spam attacks
- ✅ Proper retry logic prevents cascading failures
- ✅ Circuit breaker prevents service overload
- ✅ Headers provide visibility for rate limiting status

### **Memory Optimization**
- ✅ String compression reduces memory footprint for repeated strings
- ✅ Object pooling prevents garbage collection overhead
- ✅ Compact data structures use primitive types instead of strings
- ✅ Lazy evaluation defers expensive operations

## 📚 Monitoring & Debugging

### **Key Metrics to Monitor**
- Rate limit hit rates
- Authentication failure rates
- Input validation failures
- Memory usage trends
- API response times
- Error rates by endpoint

### **Debug Information Available**
- Config validation results with issue details
- Authentication header processing logs
- Rate limiting state information
- Input validation error details
- Memory optimization statistics

---

## 📖 How to Configure

### **1. Copy .env.example to .env:**
```bash
cp .env.example .env
```

### **2. Edit .env with your values:**
```bash
# Required
DEVELOPER_PRIVATE_KEY=your_sui_private_key_here

# Optional
OPENAI_API_KEY=your_openai_key_here
ZAI_API_KEY=your_zai_key_here
LOG_LEVEL=debug
```

### **3. Restart the application:**
```bash
npm run dev
```

---

## 🆘 Validation Commands

### **Check Configuration:**
```bash
npm run config:validate
npm run env:check
```

### **Test Authentication:**
```bash
npm test -- --testPathPattern="security"
```

### **Test Rate Limiting:**
```bash
npm test --testPathPattern="rate-limiting"
```

### **Check Environment Variables:**
```bash
npm run env:list
npm run env:verify
```

---

**📝 For security questions or issues, refer to the security audit checklist.**