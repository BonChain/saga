# Technical Specification: "SuiSaga" (v11.0)
**Version:** 11.0 (Enhanced Implementation Detail)
**Date:** 14 November 2025
**Project:** SuiSaga: The Asynchronous Living World

---

## 1. 🚀 Project Overview

**SuiSaga** is a scalable, AI-driven "Living World" built on Sui. It is not a static game, but a persistent universe where player actions have real, asynchronous consequences on a shared world state.

Our architecture solves the core challenges of on-chain gaming: **scalability** (handling 1,000s of users), **persistence** (a world that evolves), and **authenticity** (a provable history).

* **Target Track (Primary):** `Track 2 (AI x DATA)`
* **Target Track (Secondary):** `Track 3 (Provably Authentic)`
* **Target Track (Business Model):** `Track 1 (Data Economy)`

---

## 2. 🎯 The Problem & The Market Gap

### 2.1 The Problem: Static, Centralized Worlds
Most blockchain "games" are static. The world doesn't change, player actions are isolated, and the game logic is centralized. This fails to deliver on the promise of a true "metaverse."

### 2.2 The Gap (Our Competitive Research)
Our research into market leaders like **AI Dungeon** reveals a critical gap.

* **Their Strength (The "Writer"):** Competitors are "Advanced Writers." They fine-tune models (like "Nova" from Llama 70B) to excel at "prose," "character description," and "cliché elimination." Their goal is to make a *better story*.
* **Their Weakness (The "Architect"):** Their worlds are **instanced and disconnected**. Their "multiplayer" is just co-op in a private room. Their "worldbuilding" is limited to generating *descriptions* (e.g., a "unique tavern"), not creating *interconnected logic*.

**SuiSaga's Opportunity:** We are not building a better "Writer." We are building a better **"Architect."** Our AI isn't fine-tuned to write flowery prose; it's fine-tuned to understand **World Logic** and process **Asynchronous State Changes**. This is a problem competitors are not solving.

---

## 3. 💡 The Solution: The "Asynchronous World" (v11.0)

Our solution is a hybrid architecture that provides instant feedback (realism) while handling complex world logic (depth).

### 3.1 The "Two-Speed World" (The UX)
To solve the 7-10 second Walrus Read Latency, the client **NEVER** reads directly from Walrus for live gameplay.

1. **"Hot Cache" Path (0.1s Read):**
   * The UI (Frontend) reads its *current state* directly from our `localhost` (Node.js) server's in-memory cache.
   * This provides an **instant** user experience.

2. **"Cold Truth" Path (15s Write):**
   * The `localhost` server (our "AI Worker") asynchronously processes logic and writes the "permanent, provable truth" (`state_v2.json`, `log.json`) to Walrus in the background.

### 3.2 The 3-Layer Walrus Architecture (The "Cold" Storage)
This is the "provable" backend that our `localhost` server interacts with.

1. **Layer 1: The Blueprint (Immutable Rules)**
   * **Location:** `/rules/world_rules.json`
   * **Purpose:** Stores the "Butterfly Effect" logic (e.g., "IF dragon=dead, THEN village=blessed").
   * **User:** Read by the "Butterfly AI Worker."

2. **Layer 2: The "Queue" (Scalable Actions)**
   * **Location:** `/actions/` (A folder)
   * **File Format:** `action_<timestamp>_<player_id>.json` (One separate file per action).
   * **Purpose:** The "Inbox" for all 1,000+ users. This solves write concurrency; 1,000 users can write 1,000 separate files simultaneously without conflict.

3. **Layer 3: The "State" (Verifiable Facts)**
   * **Location:** `/states/` (A folder)
   * **File Format:** `state_<shard_id>_v<N>.json` (e.g., `state_lair_001_v2.json`)
   * **Purpose:** The "Database" storing the latest "Truth" for every object (Shard) in the world.

---

## 4. ⚙️ Technical Specifications

### 4.1 Frontend (UI)
* **Stack:** Vanilla HTML/JS/CSS (Fastest MVP)
* **Dependencies:** None (keeps it simple for demo)
* **Logic:**
  * **DOES NOT** talk to Walrus or OpenAI directly
  * `GET /state`: Fetches world state from `localhost:3000/state` (the "Hot Cache") every 2 seconds to render the UI
  * `POST /action`: Sends the player's action (e.g., "Attack Dragon") to `localhost:3000/action`
  * **Demo Feature:** Displays "Verifiable Links" (clickable) that point directly to the Walrus Gateway URLs for the files in Layer 2 and Layer 3

### 4.2 Backend (`localhost` Server - The "MVP Brain")
* **Stack:** Node.js (Express)
* **Dependencies:**
  ```json
  {
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0"
  }
  ```
* **Configuration:** `.env` file
  ```env
  OPENAI_API_KEY=your_key_here
  WALRUS_API_ENDPOINT=https://api.walrus.testnet.sui.io
  WALRUS_GATEWAY=https://walrus.testnet.sui.io
  MAX_API_CALLS=20
  PORT=3000
  ```

* **"Hot Cache":** A simple in-memory JSON object storing the *latest known state* of all Shards
* **API Endpoints:**
  * `GET /state`: Returns the "Hot Cache" (0.01s response)
  * `POST /action`:
    1. Receives the action from the UI
    2. Asynchronously (no `await`) triggers `processAction(action)`
    3. Instantly returns `202 Accepted` to the UI

* **Background Worker (The `processAction` function):**
  1. **Write L2 (Queue):** Writes `action_...json` to Walrus Layer 2
  2. **Read L3 (State):** Reads `state_v_old.json` from Walrus Layer 3
  3. **Call AI:** Calls OpenAI API (with `MAX_CALLS` safety limit)
  4. **Write L3 (State):** Writes `state_v_new.json` to Walrus Layer 3
  5. **Update Hot Cache:** Updates the `localhost` in-memory cache with `state_v_new`
  6. **Run Butterfly Worker:** Scans `world_rules.json` (L1) -> If trigger matches, repeats steps 3-5 for the *affected* Shard

### 4.3 AI Model & Cost Control
* **MVP Model:** `gpt-3.5-turbo` (OpenAI)
* **Prompt Template:**
  ```javascript
  const prompt = `You are a world state simulator for SuiSaga. Given the current state and player action, return ONLY a valid JSON response.

  Current State: ${JSON.stringify(currentState)}
  Player Action: ${action}

  Return new state in this exact format:
  {
    "success": true/false,
    "new_state": { /* updated state object */ },
    "narrative": "Brief description of what happened"
  }`;
  ```
* **Cost Control:** A hardcoded global variable: `MAX_API_CALLS = 20`
* **Fallback:** If `MAX_CALLS` is reached or the API fails, the server will return a pre-cached, hardcoded JSON response

### 4.4 Walrus Integration Details
* **Authentication:** Use existing Walrus credentials from your other projects
* **Upload Process:**
  ```javascript
  async function uploadToWalrus(filePath, content) {
    // Use your existing Walrus upload logic
    // Returns Walrus blob ID for verification
  }
  ```
* **Download Process:**
  ```javascript
  async function downloadFromWalrus(blobId) {
    // Use your existing Walrus download logic
    // Returns file content
  }
  ```

### 4.5 Sui Integration (Future Scope)
* **MVP Scope:** **0% Code. 100% Slides.**
* **Future Vision (The Pitch):** The "AI Workers" will be decentralized. They will periodically snapshot the "State Hash" from Walrus Layer 3 onto a "Sui World NFT" to make the world's history fully on-chain and provable (Track 3).

---

## 5. 📋 Data Schemas (The "Contracts")

### 5.1 Layer 1: `world_rules.json`
```json
{
  "version": 1,
  "last_updated": 1712340000,
  "triggers": [
    {
      "trigger_id": "trg_dragon_dead",
      "condition_shard": "lair_001",
      "condition_path": "data.entities[0].status",
      "condition_value": "Dead",
      "effect_shard": "village_001",
      "effect_action": "UPDATE",
      "effect_data": {
        "data.global_effects": ["DRAGON_CURSE_LIFTED"],
        "data.status": "Blessed",
        "data.buildings.shop": "Open"
      }
    }
  ]
}
```

### 5.2 Layer 2: `action_1712345678_0xABC.json`
```json
{
  "action_id": "act_1712345678_0xABC",
  "player_id": "0xabc123...def456",
  "timestamp": 1712345678,
  "status": "Pending",
  "target_shard_id": "lair_001",
  "action_type": "COMBAT",
  "parameters": {
    "verb": "ATTACK",
    "target_entity_id": "dragon_ignis",
    "weapon": "sword_steel"
  },
  "walrus_blob_id": "bafy...abc",
  "processed_at": null
}
```

### 5.3 Layer 3: `state_lair_001_v1.json`
```json
{
  "shard_id": "lair_001",
  "version": 1,
  "last_updated_at": 1712340000,
  "last_updated_by_action": "world_init",
  "walrus_blob_id": "bafy...def",
  "data": {
    "name": "Dragon's Lair",
    "description": "A dark cave filled with treasure and the smell of sulfur",
    "entities": [
      {
        "id": "dragon_ignis",
        "name": "Ignis the Red",
        "type": "DRAGON",
        "status": "Alive",
        "hp": 100,
        "max_hp": 100,
        "attributes": {
          "strength": 95,
          "defense": 80
        }
      }
    ],
    "items": [
      {
        "id": "treasure_chest_001",
        "name": "Ancient Treasure Chest",
        "locked": true
      }
    ]
  }
}
```

---

## 6. 🎮 Game Logic & World Design

### 6.1 Initial World Setup
**Demo World: The Dragon's Curse Saga**

#### Shard 1: `village_001` - "Shadowmire Village"
* **Initial State:** Cursed, shop closed, villagers fearful
* **Key Entities:** Village Elder, Blacksmith, Merchant
* **Goal:** Lift curse by defeating dragon

#### Shard 2: `lair_001` - "Dragon's Lair"
* **Initial State:** Dragon alive, treasure locked
* **Key Entities:** Ignis the Red Dragon
* **Goal:** Defeat dragon, unlock treasure

#### Shard 3: `forest_001` - "Whispering Woods"
* **Initial State:** Safe area with resources
* **Key Entities:** Forest Spirits, Resource Nodes
* **Goal:** Gather supplies for dragon fight

### 6.2 Action Types
```javascript
const ACTION_TYPES = {
  COMBAT: {
    ATTACK: "ATTACK",
    DEFEND: "DEFEND",
    FLEE: "FLEE"
  },
  INTERACTION: {
    TALK: "TALK",
    TRADE: "TRADE",
    EXAMINE: "EXAMINE"
  },
  MOVEMENT: {
    TRAVEL: "TRAVEL",
    EXPLORE: "EXPLORE"
  },
  RESOURCE: {
    GATHER: "GATHER",
    CRAFT: "CRAFT",
    USE: "USE"
  }
};
```

### 6.3 Butterfly Effect Rules
```json
{
  "triggers": [
    {
      "trigger_id": "trg_dragon_defeated",
      "condition_shard": "lair_001",
      "condition_path": "data.entities[0].status",
      "condition_value": "Dead",
      "effects": [
        {
          "effect_shard": "village_001",
          "effect_action": "UPDATE",
          "effect_data": {
            "data.global_effects": ["DRAGON_CURSE_LIFTED"],
            "data.status": "Prosperous",
            "data.buildings.shop": "Open",
            "data.npcs.merchant.mood": "Happy"
          }
        },
        {
          "effect_shard": "lair_001",
          "effect_action": "UPDATE",
          "effect_data": {
            "data.items[0].locked": false,
            "data.entities[0].status": "Dead"
          }
        }
      ]
    }
  ]
}
```

---

## 7. 🔧 Development Setup

### 7.1 Prerequisites
* Node.js 18+
* Walrus CLI/HTTP access (existing credentials)
* OpenAI API key

### 7.2 Project Structure
```
suisaga/
├── server/
│   ├── index.js              # Express server
│   ├── package.json
│   ├── .env                 # Environment variables
│   ├── walrus.js            # Walrus integration
│   ├── openai.js            # AI processing
│   └── game/
│       ├── world-rules.json # Layer 1
│       ├── initial-states/  # Initial L3 states
│       └── fallbacks/       # Pre-cached responses
├── client/
│   ├── index.html          # Main UI
│   ├── style.css           # Styling
│   └── app.js              # Frontend logic
└── README.md
```

### 7.3 Local Development Commands
```bash
# Install dependencies
cd server && npm install

# Start backend server
npm run dev

# Start frontend (serve static files)
# Open client/index.html in browser
```

---

## 8. 📅 3-Day Execution Plan

### Day 1 (Foundation) - 8 hours
**Morning (4 hours):**
- [ ] Setup project structure and install dependencies
- [ ] Implement basic Express server with `/state` and `/action` endpoints
- [ ] Implement Walrus integration using existing credentials
- [ ] Test file upload/download to Layer 2 and Layer 3

**Afternoon (4 hours):**
- [ ] Create initial world states (village_001, lair_001, forest_001)
- [ ] Upload world rules to Layer 1
- [ ] Implement basic "Hot Cache" in-memory state management
- [ ] Test end-to-end: UI → Server → Walrus

### Day 2 (AI Integration) - 8 hours
**Morning (4 hours):**
- [ ] Implement OpenAI API integration with prompt templates
- [ ] Add MAX_API_CALLS safety mechanism
- [ ] Create pre-cached fallback responses
- [ ] Test AI processing with sample actions

**Afternoon (4 hours):**
- [ ] Implement background action processing pipeline
- [ ] Add Butterfly Effect rule engine
- [ ] Implement state versioning and conflict resolution
- [ ] Test full async processing loop

### Day 3 (UI & Polish) - 8 hours
**Morning (4 hours):**
- [ ] Build HTML/JS frontend with real-time updates
- [ ] Add "Verifiable Links" to Walrus Gateway
- [ ] Implement action buttons and status displays
- [ ] Add loading states and error handling

**Afternoon (4 hours):**
- [ ] End-to-end testing (3-5 complete cycles)
- [ ] Prepare demo script with "Dead Air" timing
- [ ] Record backup video (CRITICAL)
- [ ] Final bug fixes and performance optimization

---

## 9. ⚠️ Risk Mitigation (The "Bulletproofing")

| Risk | Mitigation Strategy |
|------|-------------------|
| **Walrus Read (10s) is too slow** | **"Hot Cache" Fix (v11.0):** UI NEVER reads from Walrus live. It reads from localhost (0.01s). We show the Walrus URL only as "proof." |
| **Demo "Dead Air" (15s wait)** | **"Demo Script" Fix:** This 15s wait is our feature. While the AI thinks, we click the link and show the action_log.json file on the Walrus Gateway, proving the immutable log (Track 3). |
| **OpenAI API Fails / Too Slow** | **"Safety" Fix:** 1. MAX_CALLS = 20 limit. 2. If API fails (or count > 20), localhost server will immediately return the pre-cached fallback JSON result. The demo continues seamlessly. |
| **Concurrency/Locking** | **"MVP" Fix:** Our localhost server is single-threaded. It processes one action at a time (sequential processing), which acts as a "natural" lock. We will talk about distributed locks (Redis, etc.) as "Future Work." |
| **Live Demo Fails (Network, etc.)** | **"Emergency" Fix:** We will have a pre-recorded backup video of the perfect demo flow, ready to play instantly. |
| **State Corruption** | **"Versioning Fix:"** Each state update increments version number. If corruption detected, rollback to previous version from Walrus. |

---

## 10. 📊 Success Metrics

### Technical Metrics
- **API Response Time:** `< 100ms` for `/state` endpoint
- **Action Processing Time:** `< 30 seconds` end-to-end
- **Success Rate:** `100%` (with fallbacks)
- **Walrus Storage:** All actions and states verifiable

### Demo Metrics
- **"Wow Factor":** Demonstrates asynchronous AI processing
- **"Proof Factor":** Verifiable links showing immutable history
- **"Scalability Story":** Architecture handles 1,000+ concurrent users
- **"Business Case":** Clear path to Data Economy (Track 1)

---

## 11. 🎯 Demo Script Highlights

### The "Dead Air" Moment (Our Feature)
1. **Player attacks dragon** → UI shows "Processing..."
2. **15 seconds of "thinking"** → We click "Verifiable Link"
3. **Show Walrus Gateway** → `action_...json` appears in real-time
4. **Explain:** "This is the immutable proof. While our AI processes the action, the blockchain already recorded the player's intention."
5. **UI updates** → Dragon defeated, village blessed
6. **Show butterfly effects** → Village state changes automatically

### Technical Talking Points
- "We solved blockchain gaming's latency problem with a two-speed architecture"
- "Every action is provable and immutable"
- "Our AI understands world logic, not just writing stories"
- "This scales to thousands of concurrent players"

---

**Version:** 11.0
**Ready for Implementation:** ✅
**3-Day Feasibility:** ✅ (with existing Walrus experience)