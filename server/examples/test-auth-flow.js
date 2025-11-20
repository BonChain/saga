/**
 * Simple test script to demonstrate the JWT authentication flow
 * Run with: node examples/test-auth-flow.js
 */

const http = require('http');

// Helper to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3007,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': `test-${Date.now()}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuthFlow() {
  console.log('🚀 Testing JWT Wallet Authentication Flow...\n');

  const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';

  try {
    // Test 1: Get API endpoints
    console.log('1️⃣ Getting API endpoints...');
    const apiResponse = await makeRequest('/api');
    console.log('✅ API endpoints:', JSON.stringify(apiResponse.data.endpoints, null, 2));
    console.log('');

    // Test 2: Get authentication challenge
    console.log('2️⃣ Getting authentication challenge...');
    const challengeResponse = await makeRequest('/api/auth/challenge', 'POST', {
      walletAddress: walletAddress
    });

    if (!challengeResponse.data.success) {
      throw new Error(`Challenge failed: ${challengeResponse.data.error}`);
    }

    const { message, timestamp } = challengeResponse.data.data;
    console.log('✅ Challenge received:');
    console.log(`   Message: "${message}"`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log('');

    // Test 3: Mock authentication (in real app, user signs message)
    console.log('3️⃣ Testing authentication with mock signature...');
    const mockSignature = `0x${Buffer.from(message).toString('hex')}`;

    const authResponse = await makeRequest('/api/auth/authenticate', 'POST', {
      walletAddress,
      signature: mockSignature,
      message,
      timestamp
    });

    if (!authResponse.data.success) {
      throw new Error(`Authentication failed: ${authResponse.data.error}`);
    }

    const token = authResponse.data.data.token;
    console.log('✅ Authentication successful:');
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log(`   User: ${JSON.stringify(authResponse.data.data.user)}`);
    console.log(`   Expires in: ${authResponse.data.data.expiresIn} seconds`);
    console.log('');

    // Test 4: Validate JWT token
    console.log('4️⃣ Validating JWT token...');
    const validateResponse = await makeRequest('/api/auth/validate', 'POST', {
      token: token
    });

    if (!validateResponse.data.success) {
      throw new Error(`Token validation failed: ${validateResponse.data.error}`);
    }

    console.log('✅ Token validation successful:');
    console.log(`   Valid: ${validateResponse.data.data.valid}`);
    console.log(`   Payload: ${JSON.stringify(validateResponse.data.data.payload, null, 2)}`);
    console.log('');

    // Test 5: Try accessing protected endpoint without token
    console.log('5️⃣ Testing protected endpoint without token...');
    const protectedResponse = await makeRequest('/api/characters');

    if (protectedResponse.status === 401) {
      console.log('✅ Correctly rejected request without authentication');
    } else {
      console.log('❌ Expected 401, got:', protectedResponse.status);
    }
    console.log('');

    // Test 6: Try accessing protected endpoint with token
    console.log('6️⃣ Testing protected endpoint with JWT token...');
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };

    const protectedWithAuthResponse = await makeRequestWithHeaders('/api/characters', 'GET', null, authHeaders);

    if (protectedWithAuthResponse.status === 200) {
      console.log('✅ Successfully accessed protected endpoint with JWT');
    } else {
      console.log('❌ Expected 200, got:', protectedWithAuthResponse.status);
      console.log('Response:', protectedWithAuthResponse.data);
    }
    console.log('');

    console.log('🎊 JWT Authentication Flow Test Complete!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Integrate with actual Sui wallet SDK for real signatures');
    console.log('   2. Implement proper signature verification in AuthService');
    console.log('   3. Add user role management system');
    console.log('   4. Implement token refresh mechanism');
    console.log('   5. Add comprehensive error handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

function makeRequestWithHeaders(path, method, data, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3007,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': `test-${Date.now()}`,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Check if server is running
async function checkServer() {
  try {
    const response = await makeRequest('/health');
    if (response.status === 200) {
      console.log('✅ Server is running on port 3001\n');
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Server is not running on port 3001');
    console.log('   Please start the server with: npm run dev\n');
    return false;
  }
}

// Run the test
async function runTest() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAuthFlow();
  }
}

runTest();