# SuiSaga API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-23
**Base URL:** `http://localhost:3001`

## Overview

SuiSaga API provides comprehensive endpoints for a living world blockchain game with unlimited player agency, AI-driven consequences, and persistent character relationships. This document covers all available endpoints, authentication methods, request/response formats, and usage examples.

## Authentication

### JWT-Based Wallet Authentication

SuiSaga uses JSON Web Tokens (JWT) with wallet-based signatures for secure authentication.

#### 1. Get Authentication Challenge
```http
POST /api/auth/challenge
Content-Type: application/json

{
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "challenge": "Sign this message to authenticate with SuiSaga...",
  "timestamp": "2025-11-23T10:00:00.000Z",
  "expiresAt": "2025-11-23T10:05:00.000Z"
}
```

#### 2. Authenticate with Signature
```http
POST /api/auth/authenticate
Content-Type: application/json

{
  "walletAddress": "0x...",
  "signature": "0x...",
  "challenge": "Sign this message to authenticate..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "walletAddress": "0x..."
}
```

#### 3. Use Bearer Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Endpoints

### Health & Monitoring

#### Basic Health Check
```http
GET /health/basic
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-23T10:00:00.000Z",
  "version": "1.0.0",
  "service": "suisaga-server",
  "uptime": 3600,
  "storage": {
    "initialized": true,
    "layers": ["blueprint", "queue", "state"]
  }
}
```

#### Enhanced Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-23T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "blockchain": "healthy",
    "ai": "healthy",
    "demo": "operational"
  },
  "metrics": {
    "totalRequests": 1250,
    "errorRate": 0.02,
    "responseTime": 145
  }
}
```

### Character Management

#### Get All Characters
```http
GET /api/characters
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "character_001",
      "name": "Dragon Lord",
      "type": "dragon",
      "personality": "Wise and protective",
      "location": {
        "regionId": "lair",
        "coordinates": { "x": 100, "y": 200 }
      },
      "createdAt": "2025-11-23T09:00:00.000Z"
    }
  ],
  "metadata": {
    "total": 1,
    "timestamp": "2025-11-23T10:00:00.000Z",
    "requestId": "req_12345"
  }
}
```

#### Create Character
```http
POST /api/characters
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Goblin Scout",
  "type": "goblin",
  "personality": "Curious and sneaky",
  "description": "A quick-witted goblin explorer",
  "appearance": {
    "height": "short",
    "color": "green"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "character_002",
    "name": "Goblin Scout",
    "type": "goblin",
    "personality": "Curious and sneaky",
    "createdAt": "2025-11-23T10:00:00.000Z"
  },
  "metadata": {
    "timestamp": "2025-11-23T10:00:00.000Z",
    "requestId": "req_12346"
  }
}
```

#### Get Character by ID
```http
GET /api/characters/{characterId}
Authorization: Bearer {token}
```

#### Add Memory to Character
```http
POST /api/characters/{characterId}/memories
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "Player defeated the dragon in battle",
  "description": "Epic confrontation that changed the power dynamics",
  "emotionalImpact": "respectful",
  "location": "dragon_lair"
}
```

#### Get Character Relationships
```http
GET /api/characters/{characterId}/relationships
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "characterId": "character_001",
    "relationships": {
      "player_001": {
        "friendship": 85,
        "hostility": 10,
        "loyalty": 90,
        "respect": 95,
        "fear": 5,
        "trust": 88,
        "lastInteraction": 1700745600000,
        "totalInteractions": 25
      }
    }
  }
}
```

### Action System

#### Submit Natural Language Action
```http
POST /api/actions/submit
Content-Type: application/json

{
  "playerId": "player_001",
  "intent": "I want to befriend the dragon by offering it treasure",
  "originalInput": "befriend the dragon by offering it treasure"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "action_789",
    "playerId": "player_001",
    "originalInput": "befriend the dragon by offering it treasure",
    "intent": "I want to befriend the dragon by offering it treasure",
    "status": "received",
    "timestamp": "2025-11-23T10:00:00.000Z",
    "message": "Action received! Processing world changes...",
    "actionDescription": "befriend dragon",
    "aiProcessingStatus": "processing",
    "parsedIntent": {
      "actionType": "social",
      "target": "dragon",
      "urgency": "medium",
      "confidence": 0.89
    }
  }
}
```

#### Get Recent Actions
```http
GET /api/actions/recent?playerId=player_001&minutes=60&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "action_789",
      "playerId": "player_001",
      "intent": "befriend the dragon by offering it treasure",
      "status": "completed",
      "timestamp": "2025-11-23T10:00:00.000Z",
      "timeSinceSubmission": 300,
      "statusDisplay": "AI processed - consequences generated"
    }
  ],
  "meta": {
    "timeRange": "Last 60 minutes",
    "total": 1,
    "playerId": "player_001"
  }
}
```

### Dialogue System

#### Generate Character Dialogue
```http
POST /api/dialogue/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "characterId": "character_001",
  "playerId": "player_001",
  "context": {
    "location": "dragon_lair",
    "recentAction": "Player offered treasure",
    "emotionalState": "curious"
  },
  "conversationHistory": [
    {
      "speaker": "player",
      "message": "Hello mighty dragon, I come in peace",
      "timestamp": "2025-11-23T09:58:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "characterId": "character_001",
    "dialogue": "Greetings, brave traveler. Your offer of treasure intrigues me, but trust must be earned through deeds, not gifts. Tell me of your adventures in this realm.",
    "emotionalTone": "wise_curious",
    "contextReferences": [
      "previous encounters with the player",
      "recent events in dragon_lair"
    ],
    "relationshipChange": {
      "trust": 5,
      "respect": 3,
      "friendship": 2
    },
    "timestamp": "2025-11-23T10:00:00.000Z"
  }
}
```

### Blockchain Actions

#### Record Action on Blockchain
```http
POST /api/actions/record
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": {
    "id": "action_001",
    "playerId": "player_001",
    "intent": "Attack the goblin camp",
    "originalInput": "attack goblin camp",
    "parsedIntent": {
      "actionType": "combat",
      "target": "goblin_camp",
      "urgency": "high"
    },
    "metadata": {
      "location": "forest",
      "timestamp": "2025-11-23T10:00:00.000Z"
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
  "actionId": "action_001",
  "walrusUrl": "https://walrus-testnet.walrus.ai/v1/blob/bafy...",
  "verificationLink": "https://walrus-testnet.walrus.ai/v1/b_verify/bafy...",
  "verificationHash": "0xabc123...",
  "timestamp": "2025-11-23T10:00:05.000Z",
  "blockchainProof": {
    "hash": "0xdef456...",
    "algorithm": "ED25519",
    "timestamp": "2025-11-23T10:00:00.000Z"
  }
}
```

#### Get Recording Status
```http
GET /api/actions/record/{actionId}/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "actionId": "action_001",
  "status": "confirmed",
  "verificationLink": "https://walrus-testnet.walrus.ai/v1/b_verify/bafy...",
  "attempts": 1,
  "lastAttempt": "2025-11-23T10:00:00.000Z",
  "systemStatus": {
    "circuitBreakerOpen": false,
    "failureCount": 0,
    "nextAttemptTime": null
  }
}
```

### Demo Reliability

#### Get Demo Status
```http
GET /api/demo/status
```

**Response:**
```json
{
  "success": true,
  "mode": "normal",
  "services": {
    "walrus": "online",
    "ai": "online",
    "network": "online",
    "lastCheck": 1700745600000
  },
  "emergencyMode": false,
  "cacheStats": {
    "totalCachedResponses": 150,
    "hitRate": 0.85,
    "lastCacheUpdate": "2025-11-23T09:00:00.000Z"
  }
}
```

#### Force Emergency Mode
```http
POST /api/demo/emergency
Authorization: Bearer {token}
```

## World State Management

### Get World Rules
```http
GET /api/storage/world-rules
```

**Response:**
```json
{
  "success": true,
  "data": {
    "physics": {
      "gravity": 9.8,
      "magicEnabled": true
    },
    "characterBehavior": {
      "dragons": "intelligent_protectors",
      "goblins": "tribal_wanderers"
    },
    "actionConstraints": {
      "maxActionsPerMinute": 10,
      "combatCooldown": 30
    },
    "butterflyEffects": {
      "dragonDeath": ["economy_boost", "power_vacuum"],
      "goblinTribute": ["reputation_gain", "trade_opportunity"]
    }
  }
}
```

### Get Current World State
```http
GET /api/storage/world-state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": 42,
    "timestamp": "2025-11-23T10:00:00.000Z",
    "regions": {
      "village": {
        "type": "civilized",
        "status": "prosperous",
        "population": 500,
        "economy": "thriving"
      },
      "lair": {
        "type": "dangerous",
        "status": "occupied",
        "occupants": ["dragon_lord"],
        "danger_level": "high"
      }
    },
    "characters": {
      "dragon_001": {
        "location": { "regionId": "lair", "coordinates": { "x": 100, "y": 200 } },
        "status": "alert",
        "health": 100
      }
    }
  }
}
```

## Error Handling

### Standard Error Format

All API errors follow this consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "metadata": {
    "timestamp": "2025-11-23T10:00:00.000Z",
    "requestId": "req_12345",
    "errorCode": "VALIDATION_FAILED",
    "operation": "createCharacter"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required or invalid |
| `FORBIDDEN` | 403 | Access denied to resource |
| `VALIDATION_FAILED` | 400 | Request validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `BLOCKCHAIN_ERROR` | 502 | Blockchain operation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response:** HTTP 429 with retry information

## SDK & Examples

### JavaScript/Node.js

```javascript
// Authentication
const authResponse = await fetch('/api/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: '0x...' })
});

const { challenge } = await authResponse.json();
const signature = await signMessage(challenge); // Your wallet signing

const tokenResponse = await fetch('/api/auth/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: '0x...', signature, challenge })
});

const { token } = await tokenResponse.json();

// Submit Action
const actionResponse = await fetch('/api/actions/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    playerId: 'player_001',
    intent: 'Attack the dragon with my magic sword',
    originalInput: 'attack dragon with magic sword'
  })
});

const result = await actionResponse.json();
```

### Python

```python
import requests

# Authentication
auth_challenge = requests.post('http://localhost:3001/api/auth/challenge', json={
    'walletAddress': '0x...'
})
challenge = auth_challenge.json()['challenge']
signature = sign_challenge(challenge)  # Your signing function

token_response = requests.post('http://localhost:3001/api/auth/authenticate', json={
    'walletAddress': '0x...',
    'signature': signature,
    'challenge': challenge
})
token = token_response.json()['token']

# Get Characters
headers = {'Authorization': f'Bearer {token}'}
characters_response = requests.get('http://localhost:3001/api/characters', headers=headers)
characters = characters_response.json()
```

### cURL

```bash
# Get Challenge
curl -X POST http://localhost:3001/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x..."}'

# Authenticate
curl -X POST http://localhost:3001/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x...","signature":"0x...","challenge":"..."}'

# Submit Action
curl -X POST http://localhost:3001/api/actions/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "playerId":"player_001",
    "intent":"Explore the mysterious forest",
    "originalInput":"explore mysterious forest"
  }'
```

## WebSocket Support

For real-time updates and live world changes:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('Connected to SuiSaga real-time updates');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'world_update':
      console.log('World state changed:', data.changes);
      break;
    case 'character_action':
      console.log('New action:', data.action);
      break;
    case 'system_status':
      console.log('System status:', data.status);
      break;
  }
};
```

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Full Integration Test
```bash
# 1. Authentication
curl -X POST http://localhost:3001/api/auth/challenge -d '{"walletAddress":"0x123"}'
# ... complete authentication flow

# 2. Create Character
curl -X POST http://localhost:3001/api/characters \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Test Character","type":"human"}'

# 3. Submit Action
curl -X POST http://localhost:3001/api/actions/submit \
  -H "Authorization: Bearer TOKEN" \
  -d '{"playerId":"test","intent":"explore forest"}'

# 4. Check Results
curl http://localhost:3001/api/actions/recent?playerId=test
```

## Support & Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Ensure wallet address is valid and properly formatted
   - Check that signature matches the challenge exactly
   - Verify JWT token is not expired

2. **Rate Limited**
   - Check `X-RateLimit-*` headers
   - Implement exponential backoff
   - Consider increasing limits for production use

3. **Blockchain Errors**
   - Check network connectivity to Walrus
   - Verify sufficient WAL tokens for transactions
   - Review transaction size limits

### Debug Mode

Enable debug logging by setting:
```bash
export LOG_LEVEL=debug
export DEBUG=true
```

### Contact

- **Issues:** GitHub Issues Repository
- **Documentation:** Check `docs/` directory for detailed guides
- **API Support:** Technical team available during business hours

---

**Last Updated:** 2025-11-23
**API Version:** 1.0.0
**Compatibility:** Node.js 18+, Modern browsers with ES6+ support