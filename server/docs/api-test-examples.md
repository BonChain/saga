# SuiSaga API Testing Examples

This file provides quick examples for testing the SuiSaga API endpoints using curl, JavaScript, and Python.

## Quick Setup

1. **Start the server:**
```bash
cd server
npm run dev
```

2. **Base URL:** `http://localhost:3001`

---

## 🚀 Quick Test Commands

### Test Health (No Auth Required)
```bash
curl http://localhost:3001/health
```

### Test Demo Status (No Auth Required)
```bash
curl http://localhost:3001/api/demo/status
```

### Test Emergency Demo Data (No Auth Required)
```bash
curl http://localhost:3001/api/demo/emergency
```

---

## 🔐 Authentication Flow Tests

### 1. Get Authentication Challenge
```bash
curl -X POST http://localhost:3001/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234567890123456789012345678901234567890"}'
```

### 2. Simulate Authentication (for testing)
Since we need a real wallet signature for authentication, here's how to test the flow:

```bash
# This will return unauthorized without a real signature
curl -X POST http://localhost:3001/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "signature": "test_signature",
    "challenge": "test_challenge"
  }'
```

---

## 🧑‍🤝‍🧑 Character API Tests

### Get All Characters (Requires Auth)
```bash
curl -X GET http://localhost:3001/api/characters \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Character (Requires Auth)
```bash
curl -X POST http://localhost:3001/api/characters \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Character",
    "type": "npc",
    "personality": "FRIENDLY",
    "description": "A test character for API testing"
  }'
```

### Get Character by ID (Requires Auth)
```bash
curl -X GET http://localhost:3001/api/characters/test_character_id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Memory to Character (Requires Auth)
```bash
curl -X POST http://localhost:3001/api/characters/test_character_id/memories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Met a traveler",
    "actionType": "social",
    "location": "tavern",
    "description": "Met a friendly traveler at the tavern",
    "emotionalImpact": 1
  }'
```

---

## 💬 Dialogue API Tests

### Generate Dialogue
```bash
curl -X POST http://localhost:3001/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test_player_001",
    "characterId": "test_character_001",
    "prompt": "Hello there! How are you today?",
    "context": "casual greeting at marketplace"
  }'
```

### Get Dialogue Suggestions
```bash
curl -X POST http://localhost:3001/api/dialogue/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test_player_001",
    "characterId": "test_character_001",
    "context": "negotiation for trade"
  }'
```

---

## ⛓️ Blockchain Actions Tests

### Record Action
```bash
curl -X POST http://localhost:3001/api/actions/record \
  -H "Content-Type: application/json" \
  -d '{
    "action": {
      "id": "action_test_001",
      "playerId": "test_player_001",
      "intent": "dialogue",
      "originalInput": "test action input",
      "timestamp": "2025-11-23T12:00:00.000Z",
      "status": "received",
      "metadata": {
        "confidence": 0.95,
        "processingTime": 150
      }
    },
    "worldStateVersion": 1,
    "generateVerificationLink": true
  }'
```

### Get Action Status
```bash
curl -X GET http://localhost:3001/api/actions/status/action_test_001
```

---

## 🎮 Demo Reliability Tests

### Get Demo Configuration
```bash
curl http://localhost:3001/api/demo/config
```

### Get Demo Health
```bash
curl http://localhost:3001/api/demo/health
```

### Cache Response
```bash
curl -X POST http://localhost:3001/api/demo/cache \
  -H "Content-Type: application/json" \
  -d '{
    "actionInput": "attack the dragon",
    "actionType": "combat",
    "consequences": [
      {
        "system": "combat",
        "narrative": "Dragon breathes fire",
        "severity": "major",
        "impact": 8
      }
    ]
  }'
```

---

## 🐍 Python Examples

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:3001"

class SuiSagaAPI:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None

    def get_health(self):
        """Get system health status"""
        response = requests.get(f"{self.base_url}/health")
        return response.json()

    def get_demo_status(self):
        """Get demo status"""
        response = requests.get(f"{self.base_url}/api/demo/status")
        return response.json()

    def get_challenge(self, wallet_address):
        """Get authentication challenge"""
        response = requests.post(
            f"{self.base_url}/api/auth/challenge",
            json={"walletAddress": wallet_address}
        )
        return response.json()

    def authenticate(self, wallet_address, signature, challenge):
        """Authenticate with signed challenge"""
        response = requests.post(
            f"{self.base_url}/api/auth/authenticate",
            json={
                "walletAddress": wallet_address,
                "signature": signature,
                "challenge": challenge
            }
        )
        if response.json().get('success'):
            self.token = response.json()['data']['token']
        return response.json()

    def create_character(self, character_data):
        """Create a new character"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(
            f"{self.base_url}/api/characters",
            json=character_data,
            headers=headers
        )
        return response.json()

    def generate_dialogue(self, player_id, character_id, prompt, context=None):
        """Generate AI dialogue"""
        data = {
            "playerId": player_id,
            "characterId": character_id,
            "prompt": prompt
        }
        if context:
            data["context"] = context

        response = requests.post(
            f"{self.base_url}/api/dialogue/generate",
            json=data
        )
        return response.json()

# Usage Example
api = SuiSagaAPI()

# Test health
print("Health Status:", api.get_health())

# Test demo status
print("Demo Status:", api.get_demo_status())

# Test dialogue generation
print("Dialogue:", api.generate_dialogue(
    "player_001",
    "character_001",
    "Hello there!",
    "greeting"
))
```

---

## 📜 JavaScript/Node.js Examples

```javascript
const axios = require('axios');

class SuiSagaAPI {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    async getHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            return response.data;
        } catch (error) {
            console.error('Health check error:', error.response?.data);
            throw error;
        }
    }

    async getDemoStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/demo/status`);
            return response.data;
        } catch (error) {
            console.error('Demo status error:', error.response?.data);
            throw error;
        }
    }

    async getChallenge(walletAddress) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/challenge`, {
                walletAddress
            });
            return response.data;
        } catch (error) {
            console.error('Challenge error:', error.response?.data);
            throw error;
        }
    }

    async authenticate(walletAddress, signature, challenge) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/authenticate`, {
                walletAddress,
                signature,
                challenge
            });

            if (response.data.success) {
                this.token = response.data.data.token;
            }

            return response.data;
        } catch (error) {
            console.error('Authentication error:', error.response?.data);
            throw error;
        }
    }

    async createCharacter(characterData) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/characters`, characterData, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Create character error:', error.response?.data);
            throw error;
        }
    }

    async generateDialogue(playerId, characterId, prompt, context = null) {
        try {
            const data = {
                playerId,
                characterId,
                prompt
            };

            if (context) {
                data.context = context;
            }

            const response = await axios.post(`${this.baseUrl}/api/dialogue/generate`, data);
            return response.data;
        } catch (error) {
            console.error('Dialogue generation error:', error.response?.data);
            throw error;
        }
    }
}

// Usage Example
async function testAPI() {
    const api = new SuiSagaAPI();

    try {
        // Test health
        const health = await api.getHealth();
        console.log('Health Status:', health);

        // Test demo status
        const demoStatus = await api.getDemoStatus();
        console.log('Demo Status:', demoStatus);

        // Test dialogue generation
        const dialogue = await api.generateDialogue(
            'player_001',
            'character_001',
            'Hello there, wise sage!',
            'seeking wisdom'
        );
        console.log('Generated Dialogue:', dialogue);

    } catch (error) {
        console.error('API Test Error:', error.message);
    }
}

// Run tests
testAPI();
```

---

## 📊 Testing Results Expected

### ✅ Working Endpoints (No Auth Required):
- `GET /health` - System health status
- `GET /api/demo/status` - Demo mode and service status
- `GET /api/demo/health` - Demo health check
- `GET /api/demo/emergency` - Emergency demo data
- `GET /api/demo/config` - Demo configuration
- `POST /api/demo/cache` - Cache response
- `POST /api/dialogue/generate` - Dialogue generation (with validation)
- `POST /api/dialogue/suggestions` - Dialogue suggestions

### 🔒 Authentication Required:
- All `/api/characters/*` endpoints
- `/api/auth/validate`, `/api/auth/refresh`

### ⚠️ Expected Responses:
- **401 Unauthorized** for endpoints requiring auth without valid token
- **400 Bad Request** for invalid input data
- **404 Not Found** for non-existent resources

---

## 🚨 Common Issues & Solutions

### 1. Authentication Issues
**Problem:** Getting 401 Unauthorized errors
**Solution:** Make sure to get a JWT token first through the auth flow

### 2. Port Conflicts
**Problem:** Server not starting on port 3001
**Solution:** Check if another service is using the port and stop it

### 3. CORS Issues
**Problem:** Browser blocking requests from different origins
**Solution:** The API includes CORS middleware, but ensure your requests have proper headers

### 4. Service Dependencies
**Problem:** Demo endpoints showing services as offline
**Solution:** This is normal in development - the demo reliability system handles this automatically

---

## 📈 Performance Testing

### Quick Load Test
```bash
# Test 100 health check requests
for i in {1..100}; do
  curl -s http://localhost:3001/health > /dev/null
  echo "Request $i completed"
done
```

### Response Time Testing
```bash
# Measure response time
time curl -s http://localhost:3001/health
```

---

**Last Updated:** November 23, 2025
**API Version:** 1.0.0