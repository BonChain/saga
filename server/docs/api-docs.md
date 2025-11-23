# SuiSaga API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:3001`
**Last Updated:** 2025-11-23

---

## 📋 Overview

SuiSaga is a blockchain-powered living world game API that provides endpoints for:
- Authentication & User Management
- Character Management & Memory Systems
- AI-Driven Dialogue Generation
- Blockchain Action Recording & Verification
- Demo Reliability & Fallback Systems

---

## 🔐 Authentication

All API endpoints (except health and demo endpoints) require JWT authentication using wallet signatures.

### Authentication Flow
1. **Get Challenge:** Request authentication challenge for your wallet
2. **Sign Challenge:** Sign the challenge with your wallet private key
3. **Authenticate:** Submit the signed challenge to get JWT token
4. **Use Token:** Include `Authorization: Bearer <token>` in subsequent requests

---

## 🏥 Health & System Status

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy|unhealthy",
    "timestamp": "2025-11-23T11:55:39.603Z",
    "uptime": 229.2736018,
    "memory": {
      "used": 247828096,
      "total": 251047936,
      "percentage": 98.72
    },
    "cpu": { "usage": 17.859 },
    "services": {
      "storage": true,
      "ai": true,
      "database": true
    }
  }
}
```

---

## 🔑 Authentication API

### Get Authentication Challenge
```http
POST /api/auth/challenge
```

**Request Body:**
```json
{
  "walletAddress": "0x1234..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challenge": "Random challenge string to sign",
    "expiresIn": 300
  }
}
```

### Authenticate with Signed Challenge
```http
POST /api/auth/authenticate
```

**Request Body:**
```json
{
  "walletAddress": "0x1234...",
  "signature": "0xabcdef...",
  "challenge": "challenge_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "walletAddress": "0x1234...",
    "expiresIn": 3600
  }
}
```

### Refresh JWT Token
```http
POST /api/auth/refresh
```

**Request Headers:**
```
Authorization: Bearer <old_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expiresIn": 3600
  }
}
```

### Validate JWT Token
```http
GET /api/auth/validate
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "payload": {
      "walletAddress": "0x1234...",
      "role": "user"
    }
  }
}
```

---

## 🧑‍🤝‍🧑 Character Management API

### Get All Characters
```http
GET /api/characters?includeMemories=true&includeRelationships=true
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `includeMemories` (boolean): Include character memories
- `includeRelationships` (boolean): Include character relationships

**Response:**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "char_123",
        "name": "Character Name",
        "type": "npc|player",
        "personality": "FRIENDLY",
        "description": "Character description",
        "memories": [...],
        "relationships": {...}
      }
    ],
    "count": 1
  }
}
```

### Create Character
```http
POST /api/characters
```

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Character Name",
  "type": "npc",
  "personality": "FRIENDLY",
  "description": "Character description",
  "backstory": "Character backstory",
  "appearance": {
    "physicalDescription": "Description",
    "notableFeatures": ["feature1", "feature2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "char_123",
    "name": "Character Name",
    "type": "npc",
    "personality": "FRIENDLY",
    "description": "Character description",
    "backstory": "Character backstory",
    "appearance": {...},
    "createdAt": "2025-11-23T11:55:39.603Z"
  },
  "message": "Character created successfully"
}
```

### Get Character by ID
```http
GET /api/characters/{id}
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (string): Character ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "char_123",
    "name": "Character Name",
    "type": "npc",
    "personality": "FRIENDLY",
    "description": "Character description",
    "memories": [...],
    "relationships": {...}
  }
}
```

### Update Character
```http
PUT /api/characters/{id}
```

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string): Character ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "personality": "AGGRESSIVE"
}
```

### Add Memory to Character
```http
POST /api/characters/{id}/memories
```

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string): Character ID

**Request Body:**
```json
{
  "action": "Met a traveler",
  "actionType": "social",
  "location": "tavern",
  "description": "Met a friendly traveler at the tavern",
  "emotionalImpact": 1,
  "context": {
    "environmentalConditions": "tavern atmosphere",
    "otherCharactersPresent": ["traveler"]
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mem_456",
    "success": true
  },
  "message": "Memory added successfully"
}
```

### Get Character Memories
```http
GET /api/characters/{id}/memories
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (string): Character ID

**Response:**
```json
{
  "success": true,
  "data": {
    "memories": [
      {
        "id": "mem_456",
        "characterId": "char_123",
        "action": "Met a traveler",
        "actionType": "social",
        "location": "tavern",
        "description": "Met a friendly traveler at the tavern",
        "emotionalImpact": 1,
        "context": {...},
        "isActive": true,
        "timestamp": 1234567890
      }
    ],
    "count": 1
  }
}
```

### Get Character Relationships
```http
GET /api/characters/{id}/relationships
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (string): Character ID

**Response:**
```json
{
  "success": true,
  "data": {
    "relationships": {
      "char_456": {
        "score": 75,
        "type": "friendship",
        "lastInteraction": "2025-11-23T11:55:39.603Z"
      }
    },
    "count": 1
  }
}
```

### Update Relationship Score
```http
POST /api/characters/{id}/relationships/{targetId}
```

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string): Character ID
- `targetId` (string): Target character ID

**Request Body:**
```json
{
  "score": 10,
  "type": "friendship"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "characterId": "char_123",
    "targetId": "char_456",
    "score": 10,
    "type": "friendship"
  },
  "message": "Relationship updated successfully"
}
```

---

## 💬 Dialogue Generation API

### Generate AI Dialogue
```http
POST /api/dialogue/generate
```

**Request Body:**
```json
{
  "playerId": "player_123",
  "characterId": "char_456",
  "prompt": "Hello there! How are you today?",
  "context": "casual greeting at marketplace"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dialogue": "Hello, friend! I'm doing quite well today. The market is bustling with activity and I've just received a fresh shipment of goods. How may I help you?",
    "characterId": "char_456",
    "emotionalTone": "friendly",
    "consequences": [
      {
        "system": "relationships",
        "narrative": "Your greeting improves your relationship with the merchant",
        "severity": "minor",
        "impact": 2
      }
    ]
  }
}
```

### Get Dialogue Suggestions
```http
POST /api/dialogue/suggestions
```

**Request Body:**
```json
{
  "playerId": "player_123",
  "characterId": "char_456",
  "context": "negotiation for trade"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "I'd like to trade these goods for your finest sword.",
      "What's the best price you can offer for these items?",
      "Do you accept payment in gold coins?"
    ]
  }
}
```

### Get Dialogue History
```http
GET /api/dialogue/history/{characterId}/{playerId}
```

**Path Parameters:**
- `characterId` (string): Character ID
- `playerId` (string): Player ID

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "dialogue_789",
        "characterId": "char_456",
        "playerId": "player_123",
        "prompt": "Hello there!",
        "response": "Greetings, traveler!",
        "timestamp": "2025-11-23T11:55:39.603Z"
      }
    ],
    "count": 1
  }
}
```

---

## ⛓️ Blockchain Actions API

### Record Action
```http
POST /api/actions/record
```

**Request Body:**
```json
{
  "action": {
    "id": "action_123",
    "playerId": "player_456",
    "intent": "dialogue",
    "originalInput": "attack the dragon",
    "timestamp": "2025-11-23T11:55:39.603Z",
    "status": "received",
    "metadata": {
      "confidence": 0.95,
      "processingTime": 150
    }
  },
  "worldStateVersion": 1,
  "generateVerificationLink": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "actionId": "action_123",
    "blobId": "xU_0C4M7eZ4h_1Mc25zVpOBqxOhQM_Z7D369Wqa1hr0",
    "objectId": "0x5b8250a6b327b8c0ae03a04b50872005a6388c15193936b1748814ff2cab8b50",
    "verificationLink": "walrus-readblob://action_123",
    "timestamp": "2025-11-23T11:55:39.603Z"
  }
}
```

### Get Recording Status
```http
GET /api/actions/status/{actionId}
```

**Path Parameters:**
- `actionId` (string): Action ID

**Response:**
```json
{
  "success": true,
  "data": {
    "actionId": "action_123",
    "status": "completed",
    "blobId": "xU_0C4M7eZ4h_1Mc25zVpOBqxOhQM_Z7D369Wqa1hr0",
    "timestamp": "2025-11-23T11:55:39.603Z"
  }
}
```

### Verify Action
```http
GET /api/actions/verify/{actionId}
```

**Path Parameters:**
- `actionId` (string): Action ID

**Query Parameters:**
- `includeActionData` (boolean): Include full action data in response
- `checkIntegrity` (boolean): Verify cryptographic integrity

**Response:**
```json
{
  "success": true,
  "data": {
    "actionId": "action_123",
    "verified": true,
    "verificationLink": "https://walrus-gateway.testnet.walrus.ai/blobs/xU_0C4M7eZ4h_1Mc25zVpOBqxOhQM_Z7D369Wqa1hr0",
    "isTamperProof": true,
    "timestamp": "2025-11-23T11:55:39.603Z",
    "actionData": {...}
  }
}
```

### Get Verification Link
```http
GET /api/actions/link/{actionId}
```

**Path Parameters:**
- `actionId` (string): Action ID

**Response:**
```json
{
  "success": true,
  "data": {
    "actionId": "action_123",
    "verificationLink": "walrus-readblob://action_123",
    "gatewayLink": "https://walrus-gateway.testnet.walrus.ai/blobs/xU_0C4M7eZ4h_1Mc25zVpOBqxOhQM_Z7D369Wqa1hr0"
  }
}
```

---

## 🎮 Demo Reliability API

### Get Demo Status
```http
GET /api/demo/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "emergency",
    "serviceStatus": {
      "walrus": "offline",
      "ai": "error",
      "network": "online",
      "lastCheck": 1763898980131
    },
    "fallbackEnabled": false,
    "cachedResponses": 0,
    "ready": true,
    "issues": ["Walrus storage offline", "AI processing offline"]
  }
}
```

### Get Demo Health
```http
GET /api/demo/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serviceStatus": {
      "walrus": "offline",
      "ai": "error",
      "network": "online"
    },
    "ready": false,
    "mode": "emergency",
    "issues": ["Walrus storage offline", "AI processing offline"]
  }
}
```

### Get Emergency Demo Data
```http
GET /api/demo/emergency
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emergency": true,
    "mode": "emergency",
    "demoData": {
      "title": "SuiSaga Living World Demo",
      "description": "Unlimited player agency with AI-generated unexpected consequences",
      "actions": [
        {
          "id": "demo-1",
          "input": "attack the dragon with my sword",
          "consequences": [...],
          "verificationLink": "walrus-readblob://demo-dragon-action-123"
        }
      ],
      "worldState": {...}
    },
    "message": "Emergency mode activated - using fallback demo data"
  }
}
```

### Cache Response Manually
```http
POST /api/demo/cache
```

**Request Body:**
```json
{
  "actionId": "action_123",
  "actionInput": "attack the dragon",
  "actionType": "combat",
  "consequences": [
    {
      "system": "combat",
      "narrative": "The dragon roars in anger",
      "severity": "major",
      "impact": 8
    }
  ],
  "verificationLink": "walrus-readblob://action_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Response cached successfully for future fallbacks"
}
```

### Get Demo Configuration
```http
GET /api/demo/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "emergency",
    "serviceStatus": {
      "walrus": "offline",
      "ai": "error",
      "network": "online"
    },
    "fallbackEnabled": false,
    "cachedResponses": 0,
    "emergencyVideo": null
  }
}
```

---

## 📊 Error Handling

All API endpoints return consistent error responses:

### Error Response Format
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": ["Additional error details"],
  "metadata": {
    "timestamp": "2025-11-23T11:55:39.603Z",
    "requestId": "req_123"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Authentication required or invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

---

## 🔄 Rate Limiting

- **Authentication endpoints:** 10 requests per minute per IP
- **Character API:** 100 requests per minute per authenticated user
- **Dialogue API:** 50 requests per minute per authenticated user
- **Actions API:** 200 requests per minute per authenticated user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1637653200
```

---

## 🧪 Testing Examples

### Quick Test with curl
```bash
# Test health check
curl http://localhost:3001/health

# Test demo status
curl http://localhost:3001/api/demo/status

# Get authentication challenge
curl -X POST http://localhost:3001/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234..."}'
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

// Helper for authenticated requests
async function authenticatedRequest(url, token, options = {}) {
  return axios({
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
}

// Get all characters
async function getCharacters(token) {
  try {
    const response = await authenticatedRequest(
      'http://localhost:3001/api/characters',
      token
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

---

## 📝 API Versioning

- **Current Version:** v1.0.0
- **Version in URL:** Not currently versioned (base path)
- **Backward Compatibility:** Maintained within major versions
- **Deprecation Policy:** 3 months notice before breaking changes

---

## 🌐 Postman Collection

See the separate Postman collection file: [SuiSaga-API-Postman-Collection.json](./SuiSaga-API-Postman-Collection.json)

This collection includes:
- All authenticated endpoints with proper authorization
- Environment variables for easy configuration
- Test scripts for response validation
- Pre-configured request examples

---

## 📞 Support

For API support:
- Check the health endpoint: `GET /health`
- Review demo status: `GET /api/demo/status`
- Check authentication: `GET /api/auth/validate`

**Last Updated:** November 23, 2025
**API Version:** 1.0.0