# 🧪 SuiSaga Backend Testing Guide

This guide covers all the testing files and how to run them to verify that your implemented services are working correctly.

## 📁 Test Files Overview

### 1. **test-health-check.ts** 🔍
**Purpose**: Quick validation of environment and service health
**What it tests**:
- ✅ Environment variables configuration
- ✅ Walrus service connectivity
- ✅ AI provider configuration (Z.ai)
- ✅ Character service health
- ✅ Network connectivity

**Usage**: `npm run test:health` or `npx ts-node test-health-check.ts`

---

### 2. **test-all-services.ts** 🛠️
**Purpose**: Comprehensive testing of all implemented services
**What it tests**:
- ✅ RealCharacterService (CRUD operations)
- ✅ AI integration (Z.ai GLM-4.6)
- ✅ Walrus blockchain storage
- ✅ End-to-end workflow

**Usage**: `npm run test:services` or `npx ts-node test-all-services.ts`

---

### 3. **test-api-endpoints.ts** 🌐
**Purpose**: REST API endpoint testing
**What it tests**:
- ✅ Health endpoint
- ✅ Demo endpoints
- ✅ Character CRUD endpoints
- ✅ Dialogue generation endpoints
- ✅ Error handling

**Usage**: `npm run test:api` or `npx ts-node test-api-endpoints.ts`

---

### 4. **test-ai-dialogue.ts** 🤖
**Purpose**: Specific AI dialogue integration testing
**What it tests**:
- ✅ Z.ai model connectivity
- ✅ Character context processing
- ✅ Response generation

**Usage**: `npm run test:ai` or `npx ts-node test-ai-dialogue.ts`

---

### 5. **test-complete-walrus-fixes.ts** 🔗
**Purpose**: Walrus blockchain integration testing
**What it tests**:
- ✅ Real SDK integration
- ✅ Blob storage and retrieval
- ✅ Verification service

**Usage**: `npm run test:walrus` or `npx ts-node test-complete-walrus-fixes.ts`

---

## 🚀 Quick Start Commands

### Install Test Dependencies
```bash
npm install
```

### Basic Health Check
```bash
npm run test:health
```

### Run All Tests
```bash
npm run test:all
```

### Individual Test Categories
```bash
npm run test:health     # Environment and service health
npm run test:services    # Core service functionality
npm run test:api         # REST API endpoints
npm run test:ai          # AI integration
npm run test:walrus       # Blockchain storage
```

## 📊 Test Results Format

### Success Indicators
- ✅ **Green checkmarks**: Tests passed
- 📊 **Metrics**: Performance data
- 🎉 **Summary**: Overall results

### Error Indicators
- ❌ **Red marks**: Tests failed
- 🔴 **Error details**: Specific issues
- ⚠️ **Warnings**: Non-critical issues

## 🛠️ Test Configuration

### Environment Variables Required
```env
# Required for all tests
SUI_NETWORK=testnet
DEVELOPER_PRIVATE_KEY=your_key_here
ZAI_API_KEY=your_zai_key
ZAI_MODEL=glm-4.6
AI_PROVIDER=zai
OPENAI_API_KEY=your_openai_key

# Optional but recommended
NODE_ENV=test
LOG_LEVEL=info
```

### Test Data Directories
```
./test-data/characters/  # Character test data
./test-data/api-test/      # API test data
./data/characters/       # Production character data
./logs/                  # Log files
```

## 🔧 Test Scenarios

### 1. Service Health Checks
```typescript
✅ Environment variables: All configured
✅ Walrus Service: Connected to testnet
✅ AI Provider: Z.ai active (glm-4.6)
✅ Character Service: Operational
✅ API Connectivity: All services reachable
```

### 2. Service Integration Tests
```typescript
✅ RealCharacterService: ✅ All basic operations working
✅ AI Integration: ✅ Z.ai GLM-4.6 model working
✅ Walrus Blockchain: ✅ Blob storage and retrieval
✅ End-to-End Flow: ✅ Character → Walrus → AI → Memory
```

### 3. API Endpoint Tests
```typescript
✅ Health Endpoint: Working correctly
✅ Demo Endpoints: Status, health, emergency data
✅ Character Endpoints: CRUD operations successful
✅ Dialogue Endpoints: AI generation working
✅ Error Handling: Proper error responses
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Found
```
❌ Missing: ZAI_API_KEY
```
**Solution**: Ensure `.env` file exists in server directory with required variables.

#### 2. Walrus Service Connection Failed
```
❌ Walrus Service Error: DEVELOPER_PRIVATE_KEY not set
```
**Solution**: Add valid Sui private key to `.env` file.

#### 3. AI Provider Not Available
```
❌ AI Service Error: Provider zai is not available or configured
```
**Solution**: Check ZAI_API_KEY is valid and properly formatted.

#### 4. Character Service File Permissions
```
❌ Character Service Error: Failed to create storage directory
```
**Solution**: Ensure write permissions for `./test-data/` directory.

### Debugging Tips

1. **Enable Verbose Logging**:
   ```bash
   LOG_LEVEL=debug npm run test:health
   ```

2. **Run Individual Tests**:
   ```bash
   npx ts-node test-health-check.ts  # Run with debugging
   ```

3. **Check Service Logs**:
   - Console output during tests
   - Log files in `./logs/` directory

4. **Verify Environment**:
   ```bash
   node -e "console.log(process.env.ZAI_API_KEY)"
   ```

## 📈 Performance Benchmarks

### Expected Response Times
- Health Check: ~50-100ms
- Character Operations: ~100-300ms
- AI Dialogue Generation: ~1-5s
- Walrus Storage: ~5-15s
- API Endpoints: ~50-200ms

### Resource Usage
- Memory: ~100-200MB during tests
- CPU: Moderate during AI/Walrus operations
- Network: Active for external service calls

## 🔄 Continuous Integration

### GitHub Actions (Optional)
```yaml
name: Test Backend Services
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:health
      - run: npm run test:services
```

### Pre-commit Hooks (Optional)
```json
{
  "husky": {
    "hooks": {
      "pre-push": "npm run test:health"
    }
  }
}
```

## ✅ Testing Best Practices

### Before Running Tests
1. ✅ Ensure `.env` file is configured
2. ✅ Check network connectivity
3. ✅ Verify test dependencies installed
4. ✅ Clear any existing test data

### During Tests
1. ✅ Monitor console output for errors
2. ✅ Check response times and quality
3. ✅ Verify data persistence
4. ✅ Validate error handling

### After Tests
1. ✅ Clean up test data if needed
2. ✅ Review failed test scenarios
3. ✅ Update test cases as needed
4. ✅ Document any issues found

## 📞 Support

### Getting Help
- Review error messages in test output
- Check this guide for troubleshooting tips
- Verify environment configuration
- Consult service-specific logs

### Test Customization
- Modify test data in test files
- Adjust test parameters in test functions
- Add new test scenarios as needed
- Update test expectations for new features

---

**🎯 These tests ensure your SuiSaga backend is fully functional and ready for production use!**