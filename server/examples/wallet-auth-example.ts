/**
 * Wallet-based JWT Authentication Example
 *
 * This example demonstrates the complete authentication flow:
 * 1. Get authentication challenge
 * 2. Sign challenge with wallet
 * 3. Authenticate to get JWT token
 * 4. Use JWT token for API requests
 */

// This would be run on the client side
export class WalletAuthClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Step 1: Get authentication challenge for wallet signing
   */
  async getChallenge(walletAddress: string): Promise<{ message: string; timestamp: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': `req-${Date.now()}`
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(`Failed to get challenge: ${data.error}`);
      }

      return {
        message: data.data.message,
        timestamp: data.data.timestamp
      };
    } catch (error) {
      console.error('Error getting challenge:', error);
      throw error;
    }
  }

  /**
   * Step 2: Sign the challenge message with your wallet
   * NOTE: This is a mock implementation. In a real application,
   * you would use the actual wallet SDK to sign the message.
   */
  async signMessageWithWallet(message: string, walletAddress: string): Promise<string> {
    // MOCK: In reality, you would use Sui wallet SDK
    // Example with Sui SDK:
    // const signature = await signMessage(wallet, message);

    console.log('📝 Message to sign:', message);
    console.log('👛 Wallet address:', walletAddress);

    // For demo purposes, return a mock signature
    // In production, replace this with actual wallet signing
    const mockSignature = `0x${Buffer.from(`${message}:${walletAddress}:${Date.now()}`).toString('hex')}`;
    console.log('✅ Signature generated (mock):', mockSignature);

    return mockSignature;
  }

  /**
   * Step 3: Authenticate with signature to get JWT token
   */
  async authenticate(walletAddress: string, signature: string, message: string, timestamp: number): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': `auth-${Date.now()}`
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          timestamp
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(`Authentication failed: ${data.error}`);
      }

      console.log('🎉 Authentication successful!');
      console.log('📱 JWT Token:', data.data.token);
      console.log('⏰ Expires in:', data.data.expiresIn, 'seconds');
      console.log('👤 User:', data.data.user);

      return data.data.token;
    } catch (error) {
      console.error('Error authenticating:', error);
      throw error;
    }
  }

  /**
   * Step 4: Use JWT token for authenticated API requests
   */
  async makeAuthenticatedRequest(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-request-id': `api-${Date.now()}`
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error('Authentication required - token may be expired');
      }

      return data;
    } catch (error) {
      console.error('Error making authenticated request:', error);
      throw error;
    }
  }

  /**
   * Complete authentication flow
   */
  async fullAuthenticationFlow(walletAddress: string): Promise<void> {
    console.log('🚀 Starting wallet-based authentication flow...\n');

    try {
      // Step 1: Get challenge
      console.log('1️⃣ Getting authentication challenge...');
      const challenge = await this.getChallenge(walletAddress);
      console.log('✅ Challenge received');
      console.log(`   Message: "${challenge.message}"`);
      console.log(`   Timestamp: ${challenge.timestamp}\n`);

      // Step 2: Sign challenge (in real app, user would approve this in wallet)
      console.log('2️⃣ Signing challenge with wallet...');
      const signature = await this.signMessageWithWallet(challenge.message, walletAddress);
      console.log('✅ Message signed\n');

      // Step 3: Authenticate to get JWT
      console.log('3️⃣ Authenticating to get JWT token...');
      const token = await this.authenticate(walletAddress, signature, challenge.message, challenge.timestamp);
      console.log('✅ JWT token received\n');

      // Step 4: Use token for API request
      console.log('4️⃣ Making authenticated API request...');
      const apiResponse = await this.makeAuthenticatedRequest(token);
      console.log('✅ API request successful');
      console.log('   Response:', JSON.stringify(apiResponse, null, 2));

      console.log('\n🎊 Complete authentication flow successful!');
      console.log('🔑 JWT Token:', token);

    } catch (error) {
      console.error('❌ Authentication flow failed:', error.message);
      throw error;
    }
  }
}

/**
 * Example usage
 */
export async function demonstrateWalletAuth() {
  const client = new WalletAuthClient();

  // Example wallet address (replace with actual user's wallet address)
  const exampleWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';

  try {
    await client.fullAuthenticationFlow(exampleWalletAddress);
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateWalletAuth();
}

/**
 * API Integration Example for Frontend
 */
export class SuiSagaAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async authenticate(walletAddress: string): Promise<void> {
    const client = new WalletAuthClient(this.baseUrl);

    // Get challenge
    const challenge = await client.getChallenge(walletAddress);

    // In a real app, you would prompt the user to sign with their wallet
    // For this example, we'll use a mock signature
    const signature = await client.signMessageWithWallet(challenge.message, walletAddress);

    // Authenticate and store token
    this.token = await client.authenticate(walletAddress, signature, challenge.message, challenge.timestamp);
  }

  async getCharacters(): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const response = await fetch(`${this.baseUrl}/api/characters`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  async refreshToken(): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated.');
    }

    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: this.token })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error('Token refresh failed');
    }

    this.token = data.data.token;
  }
}

export default SuiSagaAPI;