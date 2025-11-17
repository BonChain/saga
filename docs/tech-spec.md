# saga - Technical Specification

**Author:** Tenny
**Date:** 2025-11-14
**Project Level:** Full Stack Hackathon Project
**Change Type:** New Implementation (Greenfield)
**Development Context:** 3-day hackathon build with innovative blockchain gaming architecture

---

## Context

### Available Documents

**Loaded Documents for Architecture Planning:**
- **Product Brief:** `bmm-product-brief-saga-2025-11-14.md` - Core innovation vision and target users
- **PRD:** `PRD.md` - Detailed functional requirements (25 FRs) and technical constraints
- **UX Design Specification:** `ux-design-specification.md` - Complete retro gaming interface design
- **Epics Breakdown:** `epics.md` - 7 epics with 21 detailed user stories
- **Brainstorming Results:** `bmm-brainstorming-session-2025-11-14.md` - Feature ideation and innovation patterns

**Project Status:**
- Phase 1 Planning: Complete (PRD, Product Brief, UX Design)
- Phase 2 Architecture: Starting now
- Phase 3 Implementation: 3-day hackathon window
- Total Stories: 21 detailed stories ready for development

### Project Stack

**Target Technology Stack (from PRD):**
- **Backend:** Node.js with Express server (localhost processing)
- **Frontend:** Vanilla HTML/JS/CSS for maximum compatibility and speed
- **AI Integration:** OpenAI GPT-3.5-turbo with custom prompt templates
- **Blockchain:** Sui blockchain with Walrus storage integration
- **UI Framework:** shadcn/ui with custom retro gaming styling
- **Development:** 3-day hackathon timeline with rapid prototyping approach

### Existing Codebase Structure

**Current Status:** Greenfield project - starting fresh with established design patterns from UX specification and detailed epic breakdown. Architecture will be built from scratch following the 3-layer Walrus model defined in requirements.

---

## The Change

### Problem Statement

Build SuiSaga, an AI-driven "Living World" blockchain game for hackathon demonstration, within 3-day development window. Must showcase three core innovations: asynchronous processing, AI-driven world logic, and provable history through blockchain verification.

**Key Constraints:**
- **Timeline:** 3 days (24 hours development time)
- **Demo Reliability:** Must work perfectly for hackathon judges
- **Innovation Showcase:** "15-second wonder" demonstration flow
- **Multi-device Coordination:** Prove asynchronous multiplayer capability
- **Technical Complexity:** Novel architecture requiring AI + blockchain integration

### Proposed Solution

Implement the "Asynchronous World" architecture using a 3-layer Walrus storage system with Node.js backend and retro gaming frontend. The solution balances technical innovation with hackathon reliability through comprehensive fallback systems and focused feature scope.

**Architecture Overview:**
- **Layer 1 (Blueprint):** Immutable world rules and butterfly effect logic
- **Layer 2 (Queue):** Scalable action storage with individual JSON files
- **Layer 3 (State):** Versioned world state with shard-based organization
- **AI Processing:** OpenAI integration with MAX_API_CALLS safety mechanisms
- **Frontend:** Retro arcade interface with real-time activity monitoring

### Scope

**In Scope:**
- Core 3-layer Walrus architecture implementation
- Basic dragon combat with HP/damage systems
- Action recording with blockchain verification links
- AI-driven world change processing and cascade visualization
- Multi-device coordination for demo purposes
- Retro gaming interface with accessibility compliance
- Comprehensive fallback systems for demo reliability

**Out of Scope:**
- Complex game mechanics beyond basic combat
- Advanced AI training or custom models
- Extended economic simulation
- Multi-layered reputation systems
- Player housing or complex building systems
- Cross-platform mobile optimization
- Advanced security and anti-cheat systems

---

## Implementation Details

### Source Tree Changes

**New Project Structure:**
```
saga/
├── package.json                    # Root package.json with workspace scripts
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore patterns
├── README.md                       # Project documentation
│
├── client/                        # Vite + React Frontend
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.ts             # Vite configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   ├── public/                    # Static assets
│   │   ├── fonts/                 # VT323 and Roboto Mono fonts
│   │   ├── icons/                 # Retro gaming icon set
│   │   ├── sounds/                # Audio effects for arcade feel
│   │   └── demo/
│   │       ├── demo-video.mp4     # Backup demo recording
│   │       └── cached-responses.json # Fallback responses for demo failures
│   └── src/                       # Frontend source code
│       ├── main.tsx               # React app entry point
│       ├── App.tsx                # Main App component with world map
│       ├── components/            # React components
│       │   ├── ui/                # shadcn/ui components
│       │   ├── game/              # Game-specific components
│       │   └── retro/             # Custom retro gaming components
│       ├── lib/                   # Frontend utilities
│       ├── types/                 # TypeScript types
│       └── test/                  # Frontend tests
│
├── server/                        # Express Backend
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── nodemon.json               # Nodemon configuration for development
│   └── src/                       # Backend source code
│       ├── server.ts              # Express server entry point
│       ├── routes/                # Express API routes
│       │   ├── api/              # Main API endpoints
│       │   │   ├── actions.ts     # Action processing
│       │   │   ├── world.ts       # World state management
│       │   │   └── activities.ts  # Multiplayer coordination
│       │   └── middleware/        # Express middleware
│       ├── services/              # Business logic services
│       │   ├── action-service.ts  # Action processing logic
│       │   ├── world-service.ts    # World state management
│       │   ├── ai-service.ts       # AI integration and processing
│       │   └── walrus-service.ts   # Storage integration
│       ├── models/                # Data models and schemas
│       ├── config/                # Configuration files
│       │   ├── database.ts         # Database configuration
│       │   └── environment.ts       # Environment management
│       └── utils/                 # Backend utilities
│           ├── logger.ts           # Logging utilities
│           ├── validation.ts       # Input validation
│           └── cache.ts            # Cache management
│
└── contract/                      # Smart Contract & Protocol Logic
    ├── package.json               # Contract dependencies
    ├── tsconfig.json              # TypeScript configuration
    └── src/                       # Contract source code
        ├── contracts/             # Move/Smart contract files
        ├── types/                 # Contract types and interfaces
        └── utils/                 # Contract interaction utilities
```
├── components/
│   ├── ui/                        # shadcn/ui components (customized)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── badge.tsx
│   ├── game/
│   │   ├── WorldMap.tsx          # Interactive world map (3 areas)
│   │   ├── ActionPanel.tsx       # Action buttons (attack, defend, etc.)
│   │   ├── ProofCard.tsx         # Blockchain verification display
│   │   ├── ProcessingVisualizer.tsx # 15-second AI processing animation
│   │   ├── MultiplayerMonitor.tsx # Real-time activity feed
│   │   └── RetroScoreDisplay.tsx # Player score and achievements
│   └── retro/                     # Custom retro gaming components
│       ├── RetroButton.tsx       # Neon button with pixel borders
│       ├── RetroCard.tsx          # Dark card with glowing effects
│       ├── RetroText.tsx          # VT323 styled text
│       └── ScanlineEffect.tsx     # CRT monitor simulation
├── lib/
│   ├── ai/
│   │   ├── openai-client.ts       # OpenAI GPT-3.5-turbo integration
│   │   ├── prompts/
│   │   │   ├── world-logic-analysis.txt
│   │   │   ├── butterfly-effect-calculation.txt
│   │   │   └── state-consistency-validation.txt
│   │   ├── processor.ts          # Action processing logic with safety checks
│   │   └── safety-mechanisms.ts   # MAX_API_CALLS and fallback systems
│   ├── layers/
│   │   ├── blueprint.ts          # Layer 1: Immutable world rules
│   │   ├── queue.ts              # Layer 2: Action queue and status tracking
│   │   └── state.ts              # Layer 3: Versioned world state management
│   ├── walrus/
│   │   ├── client.ts             # Walrus storage integration
│   │   ├── uploader.js            # File upload with retry logic and verification
│   │   └── verifier.ts           # File download and blockchain verification
│   ├── game/
│   │   ├── world.ts              # World state and area management
│   │   ├── combat.ts              # Dragon combat mechanics and HP systems
│   │   ├── cascades.ts            # Butterfly effect calculation and visualization
│   │   └── multiplayer.ts        # Asynchronous coordination and activity monitoring
│   └── utils/
│       ├── validation.ts         # Input validation with Joi schemas
│       ├── cache.ts              # Hot cache for demo performance
│       ├── logger.ts             # Structured logging with Winston
│       └── queue.ts              # Simple in-memory job queue for background processing
├── public/
│   ├── fonts/                     # VT323 and Roboto Mono fonts
│   ├── icons/                     # Retro gaming icon set
│   ├── sounds/                    # Audio effects for arcade feel
│   └── demo/
│       ├── demo-video.mp4         # Backup demo recording for reliability
│       └── cached-responses.json   # Fallback responses for demo failures
├── types/
│   ├── game.ts                    # Game type definitions (Action, WorldState, etc.)
│   ├── world.ts                   # World state and area types
│   ├── api.ts                     # API request/response types
│   └── walrus.ts                  # Walrus storage types
├── tests/
│   ├── components/                # React component tests
│   ├── pages/                     # Page component tests
│   ├── api/                       # API route tests
│   ├── lib/                       # Library function tests
│   └── demo/                      # Demo flow validation tests
└── docs/
    ├── API.md                     # Vite API routes documentation
    ├── DEMO.md                    # Demo setup and execution guide
    └── ARCHITECTURE.md             # Vite architecture overview
```

### Technical Approach

**Vite + React + Express Architecture (Specialized Frontend + Backend):**

**Data Flow Architecture:**
```
React Components (Vite) → API Calls → Express Backend → AI Processing → World State → Walrus Storage
          ↓                        ↓             ↓                ↓            ↓
  User Interaction   HTTP Requests   Backend Logic   Background     Layer Updates   Blockchain
                 Fast React      Express Routes   Jobs Queue      Processing     Storage
```

**Key Architectural Decisions:**
- **Specialized Services:** Frontend optimized for UI, backend optimized for processing
- **Express Backend:** Dedicated server for AI processing, multiplayer coordination, background jobs
- **Clear Separation:** UI logic in React, business logic in Express with TypeScript
- **TypeScript Everywhere:** Shared type definitions across frontend and backend
- **Real-time Communication:** WebSocket connections for live multiplayer updates
- **Background Processing:** Dedicated job queue for AI processing and world state updates

**AI Integration Strategy:**
```typescript
// lib/ai/processor.ts - Direct integration from API routes
import { OpenAI } from 'openai';

export async function processAction(action: Action): Promise<WorldChange> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: getPromptTemplate('world-logic-analysis') },
      { role: 'user', content: `Process action: ${JSON.stringify(action)}` }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  return parseAIResponse(response.choices[0].message.content);
}
```

**Real-time Architecture:**
- **Server-Sent Events:** For real-time activity updates without WebSocket complexity
- **React State Management:** Zustand for shared game state across components
- **Optimistic Updates:** Immediate UI updates with rollback on errors
- **Hot Cache:** In-memory cache for instant world state during demo

**Frontend Architecture (Vite + React):**
```typescript
// src/components/game/ActionPanel.tsx - Frontend components
'use client';

import { useState } from 'react';
import { RetroButton } from '@/components/retro/RetroButton';
import { useGameStore } from '@/stores/gameStore';
import { submitAction } from '@/lib/api/client';

export function ActionPanel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const addWorldUpdate = useGameStore((state) => state.addWorldUpdate);

  const handleAttack = async () => {
    setIsProcessing(true);

    try {
      // API call to Express backend
      const result = await submitAction({
        type: 'dragon_attack',
        damage: 15,
        weapon: 'sword',
        player_id: getCurrentPlayerId()
      });

      console.log('Action created:', result.action_id);
      // Handle immediate confirmation

    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <RetroButton
        onClick={handleAttack}
        disabled={isProcessing}
        variant="primary"
      >
        ⚔️ Attack Dragon
      </RetroButton>

      <RetroButton variant="secondary">
        🛡️ Defend
      </RetroButton>

      <RetroButton variant="danger">
        💀 Ultimate
      </RetroButton>

      <RetroButton variant="secondary">
        🏃 Run Away
      </RetroButton>
    </div>
  );
}
```

**Backend Architecture (Express):**
```typescript
// server/src/services/action-service.ts - Backend business logic
import { Action } from '@/models/action';
import { WorldService } from './world-service';
import { AIService } from './ai-service';

export class ActionService {
  private worldService: WorldService;
  private aiService: AIService;

  constructor() {
    this.worldService = new WorldService();
    this.aiService = new AIService();
  }

  async createAction(actionData: any): Promise<Action> {
    // Create immediate action record
    const action = await this.worldService.createAction(actionData);

    // Upload to Walrus immediately for proof
    await this.worldService.uploadToWalrus(action);

    // Return immediate confirmation
    return action;
  }

  async processActionAsync(actionId: string): Promise<void> {
    // Background AI processing
    try {
      const action = await this.worldService.getAction(actionId);

      // Process with OpenAI
      const worldChange = await this.aiService.processAction(action);

      // Apply to world state
      await this.worldService.updateWorld(worldChange);

      // Broadcast to connected clients
      this.broadcastUpdate(actionId, worldChange);

    } catch (error) {
      console.error('AI processing failed:', error);
      // Update action status to failed
      await this.worldService.updateActionStatus(actionId, 'failed');
    }
  }

  private async broadcastUpdate(actionId: string, worldChange: any): Promise<void> {
    // WebSocket broadcast to all connected clients
    // Implementation would use WebSocket or Server-Sent Events
    // This is how real-time multiplayer works
  }
}
```

### Existing Patterns to Follow

**Greenfield Project - Establishing New Patterns:**
- **Error Handling:** Comprehensive error boundaries with user-friendly messages and fallback systems
- **Logging:** Winston-style structured logging with appropriate levels and context
- **Validation:** Input validation at API boundaries with Joi-style schemas
- **Testing:** Jest-based unit and integration tests with 80%+ coverage targets
- **Documentation:** JSDoc comments for all public APIs with examples
- **Security:** Input sanitization, rate limiting, and proper error message handling

### Integration Points

**Internal System Integration:**
- **Express Routes:** RESTful API endpoints for world state, actions, and multiplayer coordination
- **Layer Communication:** Blueprint → Queue → State data flow with validation at each layer
- **AI Processing Queue:** Background job processing with OpenAI API integration
- **Frontend Updates:** Real-time WebSocket connections for live activity display
- **Walrus Storage:** File upload/download with retry logic and verification

**External API Integration:**
- **OpenAI GPT-3.5-turbo:** Text analysis and world logic processing
- **Sui Blockchain:** Transaction verification and proof generation
- **Walrus Gateway:** File storage and retrieval with URL verification

**Demo-Specific Integration:**
- **Backup Video:** Pre-recorded demo flow for technical failure recovery
- **Cached Responses:** Fallback data for offline or slow network scenarios
- **Multi-Device Coordination:** Local network discovery for simultaneous device demos
- **Presentation Mode:** Optimized interface for projection and large screen displays

---

## Development Context

### Relevant Existing Code

**No Existing Codebase:** Greenfield project with comprehensive design documentation. All implementation decisions based on requirements from PRD and detailed UX specification.

### Dependencies

**Framework/Libraries:**
- **Vite 5.x** - Lightning-fast build tool and development server
- **React 18.x** - Component library with hooks and concurrent features
- **TypeScript 5.x** - Type safety and enhanced development experience
- **Tailwind CSS 3.x** - Utility-first CSS framework with retro customization
- **OpenAI 4.x** - AI integration for world logic processing
- **uuid 9.x** - Unique identifier generation for action tracking
- **Zustand 4.x** - Lightweight state management for game state
- **Framer Motion 10.x** - Animations and transitions for retro gaming effects

**UI Component Library:**
- **shadcn/ui** - Component library with Vite compatibility
- **Radix UI** - Headless UI components for accessibility
- **Lucide React** - Icon library with retro gaming adaptations
- **Class Variance Authority (CVA)** - Component variant system for retro themes

**Development Dependencies:**
- **@vitejs/plugin-react** - Vite React plugin with Fast Refresh
- **@types/react** - React type definitions
- **@types/node** - Node.js type definitions
- **Vitest** - Testing framework with Vite integration
- **jsdom** - DOM environment for testing
- **eslint 8.x** - Code linting with React and TypeScript rules
- **prettier 3.x** - Code formatting for consistent style
- **typescript 5.x** - TypeScript compiler and configuration

### Configuration Changes

**Environment Variables (.env.example):**
```env
# Vite Configuration
VITE_APP_NAME=SuiSaga
VITE_DEMO_MODE=true

# OpenAI Integration
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_MAX_API_CALLS=50

# Walrus Storage
VITE_WALRUS_CREDENTIALS=your_credentials_here
VITE_WALRUS_GATEWAY_URL=https://walrus-gateway.example.com

# Database/Storage
VITE_WORLD_STATE_CACHE_TTL=300
VITE_ACTION_QUEUE_SIZE=100

# Demo Configuration
VITE_ENABLE_FALLBACKS=true
VITE_BACKUP_VIDEO_ENABLED=true
VITE_MULTIPLAYER_DEMO_MODE=true

# Development
NODE_ENV=development
```

**Package.json Scripts:**
```json
{
  "name": "saga",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "demo:video": "ffmpeg -f x11grab -i :0.0 -f alsa -i default -c:v libx264 -c:a aac demo.mp4"
  }
}
```

**Vite Configuration (vite.config.ts):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    globals: {
      define: true,
    },
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Vitest Configuration (vitest.config.ts):**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

### Existing Conventions

**Greenfield Project - Establishing New Conventions:**
- **Code Style:** Prettier + ESLint configuration for consistent formatting
- **Naming Conventions:** camelCase for variables/functions, PascalCase for classes
- **File Organization:** Feature-based structure with clear separation of concerns
- **Error Handling:** Consistent error patterns with proper HTTP status codes
- **Testing:** Test-driven development with comprehensive test coverage
- **Documentation:** Inline documentation for all public APIs and complex logic

### Test Framework & Standards

**Testing Strategy:**
- **Unit Tests:** Jest for individual function and module testing
- **Integration Tests:** API endpoint testing with test database setup
- **Demo Flow Tests:** Validation of complete demo experience
- **Performance Tests:** Response time validation for critical paths
- **Accessibility Tests:** WCAG compliance validation with automated tools

**Test Organization:**
- **Unit Tests:** `tests/unit/` - Individual component testing
- **Integration Tests:** `tests/integration/` - API and database testing
- **Demo Tests:** `tests/demo/` - Demo flow and reliability testing
- **Test Data:** `tests/fixtures/` - Mock data and test scenarios

---

## Implementation Stack

**Frontend Architecture:**
- **Vite 5.x** - Lightning-fast build tool and development server
- **React 18.x** - Component library with hooks, concurrent features, and Suspense
- **TypeScript 5.x** - Static type checking with enhanced developer experience
- **App Router** - File-based routing with server components and streaming

**Backend Integration:**
- **API Routes** - Built-in server-side API endpoints with same codebase
- **Server Actions** - Progressive enhancement for forms with optimal UX
- **Middleware Pipeline** - Vite middleware for CORS, logging, and validation
- **Background Processing** - In-memory job queue for AI processing

**UI Component System:**
- **shadcn/ui + Radix UI** - Accessible, customizable component foundation
- **Tailwind CSS 3.x** - Utility-first CSS with custom retro theme system
- **Framer Motion** - Declarative animations for retro gaming effects
- **Class Variance Authority** - Component variant system for consistent styling

**State Management:**
- **Zustand 4.x** - Lightweight state management for global game state
- **React Context** - Component-level state and theme management
- **Optimistic Updates** - Immediate UI updates with rollback capabilities
- **Real-time Synchronization** - Server-Sent Events for live multiplayer updates

**AI Integration:**
- **OpenAI GPT-3.5-turbo** - Text analysis and world logic processing
- **Direct API Integration** - No external queue systems for hackathon simplicity
- **Prompt Templates** - Custom templates for world logic vs prose generation
- **Safety Mechanisms** - API call limits, cached responses, error handling

**Blockchain Integration:**
- **Sui Blockchain** - Transaction verification and proof generation
- **Walrus Storage** - Decentralized file storage with immediate verification
- **3-Layer Architecture** - Blueprint, Queue, State management in unified codebase
- **Proof Cards** - React components displaying blockchain verification

**Development Tools:**
- **ESLint + Prettier** - Code formatting and linting with Vite configurations
- **Vitest + Testing Library** - Comprehensive testing for React components and API routes
- **TypeScript Compiler** - Real-time type checking and enhanced IntelliSense
- **Hot Module Replacement** - Instant development feedback for both frontend and backend
- **WebSocket Support** - For real-time multiplayer coordination
- **Background Job Processing** - For AI processing and world updates

---

## Technical Details

**Core System Architecture:**

**1. Asynchronous Processing Pipeline:**
```
User Action → Immediate Confirmation → Queue → AI Processing → World Update → Proof Card
    (0.1s)           (0.1s)              (15s)         (0.1s)       (0.1s)
```

**2. Multi-Device Coordination:**
```
Device 1 (Action) → Shared State ← Device 2 (Action) → Shared State ← Device 3 (Action)
                      ↓                 ↓                 ↓
                   WebSocket       WebSocket       WebSocket
                      ↓                 ↓                 ↓
                 Real-time UI    Real-time UI    Real-time UI
```

**3. AI Processing Flow:**
```
Action Received → Load World State → Apply Butterfly Effects → Validate Rules → Commit Changes
        ↓                  ↓                      ↓                 ↓            ↓
   Action Queue    Blueprint Rules   Cascade Calculation    State Validation  Layer 3 Update
```

**Data Flow Architecture:**
```
Frontend UI → Express API → Action Queue → AI Processor → World State → Walrus Storage
     ↓            ↓              ↓             ↓            ↓              ↓
  User Input   Validation      Background     Logic      Persistence    Blockchain
```

**Performance Considerations:**
- **Hot Cache Strategy:** Pre-load world state to eliminate Walrus latency during demo
- **Batch Processing:** Group multiple actions for efficient AI processing
- **Lazy Loading:** Load world state shards on-demand based on user actions
- **Connection Pooling:** Reuse HTTP connections for external API calls
- **Memory Management:** Efficient JSON parsing and garbage collection

**Security Considerations:**
- **Input Sanitization:** Validate all user inputs with proper schemas
- **Rate Limiting:** Prevent abuse with per-IP and per-user rate limits
- **API Key Management:** Secure storage of OpenAI and Walrus credentials
- **Error Message Sanitization:** Prevent information leakage in error responses
- **CORS Configuration**: Proper cross-origin resource sharing setup

**Error Handling Strategy:**
- **Graceful Degradation:** Fallback systems for all critical functionality
- **Comprehensive Logging:** Structured logging with appropriate log levels
- **User-Friendly Errors:** Clear error messages with recovery options
- **Retry Logic:** Automatic retry with exponential backoff for external services
- **Monitoring Integration:** Health checks and performance metrics

---

## Development Setup

**Prerequisites:**
- Node.js 20.x or later installed
- Git for version control
- Text editor with JavaScript support
- Web browser with modern JavaScript support
- OpenAI API key for AI integration
- Walrus storage credentials (provided for hackathon)

**Local Development Setup:**
```bash
# 1. Create root project directory
mkdir saga
cd saga

# 2. Initialize root package.json with workspace scripts
npm init -y

# 3. Create client (Vite + React)
npm create vite@latest client -- --template react-ts
cd client
npm install @radix-ui/react-slot class-variance-authority lucide-react zustand framer-motion
npm install openai uuid
npm install -D @types/uuid
cd ..

# 4. Create server (Express + TypeScript)
mkdir server
cd server
npm init -y
npm install express cors helmet morgan dotenv
npm install openai uuid
npm install -D @types/node @types/express @types/cors typescript ts-node nodemon
cd ..

# 5. Create contract directory
mkdir contract
cd contract
npm init -y
npm install -D typescript
cd ..

# 6. Install shadcn/ui components in client
cd client
npx shadcn-ui@latest add button card dialog badge
npx shadcn-ui@latest add separator skeleton progress
cd ..

# 7. Set up environment variables
cp .env.example .env
# Edit .env with your API keys and credentials

# 8. Start development servers (run in separate terminals)
# Terminal 1: Start frontend
cd client && npm run dev

# Terminal 2: Start backend
cd server && npm run dev

# 9. Open browser to application
open http://localhost:5173  # Vite default port
```

**Development Environment:**
- **Port 5173** for Vite frontend development server
- **Port 3001** for Express backend development server
- **Hot Module Replacement (HMR)** works for frontend
- **File watching** enabled with automatic server restart for backend
- **TypeScript** compilation with real-time error checking
- **Fast Refresh** for React component changes
- **Debug mode** with detailed logging for both services

**Testing Environment:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test -- --coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

**Project Creation Commands:**
```bash
# Complete project setup in one command:
npx create-next-app@latest saga --typescript --tailwind --eslint --app && \
cd saga && \
npm install @radix-ui/react-slot class-variance-authority lucide-react zustand framer-motion openai uuid && \
npm install -D @types/uuid jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom && \
npx shadcn-ui@latest add button card dialog badge separator skeleton progress
```

---

## Implementation Guide

### Setup Steps

**Phase 1: Foundation (Day 1 - 8 hours)**
1. **Project Setup:** Create project structure and install dependencies
2. **Express Server:** Basic HTTP server with middleware pipeline
3. **Walrus Integration:** File upload/download with retry logic and verification
4. **3-Layer Architecture:** Implement blueprint, queue, and state layers
5. **Basic API Endpoints:** Health check, world state, and action submission

**Phase 2: Core Features (Day 2 - 8 hours)**
1. **AI Integration:** OpenAI API with prompt templates and safety mechanisms
2. **Action Processing:** Complete pipeline from user action to world state change
3. **Frontend Framework:** Retro gaming UI with shadcn/ui components
4. **Multiplayer Coordination:** Real-time activity monitoring and state synchronization
5. **Dragon Combat:** Basic HP system and world-changing trigger mechanisms

**Phase 3: Demo Polish (Day 3 - 8 hours)**
1. **Cascade Visualization:** Real-time diagrams showing butterfly effects
2. **Proof Cards:** Blockchain verification display with share functionality
3. **Backup Systems:** Demo reliability features and fallback mechanisms
4. **Mobile Optimization:** Responsive design and touch interface
5. **Final Testing:** Demo flow validation and performance optimization

### Implementation Steps

**Step-by-Step Development:**

**Story Implementation Approach:**
1. Start with Epic 1 (Foundation & Infrastructure) stories
2. Progress through epics in dependency order
3. Each story includes unit tests before moving to next story
4. Integration testing after each epic completion
5. Final demo testing and optimization

**Critical Path Items:**
1. **Walrus Storage Integration** - Required for all other functionality
2. **AI Processing Pipeline** - Core innovation feature
3. **Multiplayer Coordination** - Hackathon success requirement
4. **Demo Reliability Systems** - Ensures successful presentation
5. **Retro Gaming UI** - Differentiator and judge appeal

### Testing Strategy

**Unit Testing (80% coverage target):**
- Layer 1: Blueprint rule validation and butterfly effect calculations
- Layer 2: Action queue processing and status management
- Layer 3: World state management and consistency validation
- AI Integration: Prompt template processing and response parsing
- Frontend: Component behavior and user interaction handling

**Integration Testing:**
- API endpoint testing with realistic data scenarios
- Walrus storage integration with retry logic verification
- AI processing pipeline end-to-end testing
- Multi-device coordination state synchronization
- Complete demo flow validation

**Demo Testing:**
- 15-second wonder flow timing validation
- Multi-device simultaneous action testing
- Fallback system reliability testing
- Network failure recovery testing
- Judge presentation scenario testing

### Acceptance Criteria

**Functional Requirements (All 25 FRs from PRD):**
- ✅ Players can initiate world-changing actions (FR1)
- ✅ Players receive immediate confirmation (FR2)
- ✅ Players can view blockchain verification links (FR3)
- ✅ Players can see cascade diagrams (FR4)
- ✅ Players can observe real-time activity (FR5)
- [Complete validation of all 25 functional requirements]

**Technical Requirements:**
- ✅ UI Response Time: < 100ms for hot cache queries
- ✅ Action Processing: < 30 seconds end-to-end
- ✅ Concurrent User Support: 3+ devices demo ready, architecture scales to 1,000+
- ✅ Success Rate: 100% with comprehensive fallback systems
- ✅ Integration: Walrus storage, OpenAI API, multi-device coordination

**Demo Requirements:**
- ✅ Innovation Demonstration: Clear understanding within 2 minutes
- ✅ 15-Second Wonder: Smooth demo flow with technical glitches
- ✅ Multi-Device Coordination: 3+ devices without conflicts
- ✅ Blockchain Integration: Functional verification links
- ✅ Time Management: Complete within 5-minute presentation slot

---

## Developer Resources

### File Paths Reference

**Core Application Files:**
- `server/src/server.ts` - Express server entry point
- `server/src/services/world-service.ts` - World rules and butterfly effects
- `server/src/services/action-service.ts` - Action queue and status management
- `server/src/services/ai-service.ts` - AI integration and processing
- `server/src/services/walrus-service.ts` - Walrus storage integration
- `client/src/App.tsx` - Main React application component
- `client/src/main.tsx` - React app entry point

**Configuration Files:**
- `.env` - Environment variables and API keys (root)
- `client/package.json` - Frontend dependencies and scripts
- `server/package.json` - Backend dependencies and scripts
- `contract/package.json` - Contract dependencies and scripts
- `client/vite.config.ts` - Vite build configuration
- `server/nodemon.json` - Development server configuration

**Demo Resources:**
- `client/public/demo/demo-video.mp4` - Backup demo recording
- `client/public/demo/cached-responses.json` - Fallback responses
- `docs/DEMO.md` - Demo execution guide

### Key Code Locations

**API Endpoints:**
- `GET /health` - Server status and health check
- `GET /api/world/state` - Current world state from Layer 3
- `POST /api/actions` - Submit new player actions
- `GET /api/activities` - Recent player activities
- `GET /api/world/history` - World state evolution timeline

**Core Logic (Server):**
- `WorldService.applyButterflyEffects()` (server/src/services/world-service.ts)
- `ActionService.processAction()` (server/src/services/action-service.ts)
- `AIService.analyzeAction()` (server/src/services/ai-service.ts)
- `WalrusService.uploadToStorage()` (server/src/services/walrus-service.ts)

**Frontend Components (Client):**
- `App.initialize()` (client/src/App.tsx)
- `ActionPanel.handleAttack()` (client/src/components/game/ActionPanel.tsx)
- `WorldMap.render()` (client/src/components/game/WorldMap.tsx)
- `ProofCard.displayVerification()` (client/src/components/game/ProofCard.tsx)

### Testing Locations

**Unit Tests:**
- `tests/unit/layers/` - Blueprint, queue, and state layer tests
- `tests/unit/ai/` - AI integration and prompt template tests
- `tests/unit/game/` - Combat and world logic tests
- `tests/unit/utils/` - Utility function and helper tests

**Integration Tests:**
- `tests/integration/api/` - API endpoint tests
- `tests/integration/walrus/` - Storage integration tests
- `tests/integration/multiplayer/` - Coordination tests

**Demo Tests:**
- `tests/demo/flow/` - Complete demo scenario tests
- `tests/demo/reliability/` - Fallback system tests
- `tests/demo/performance/` - Response time and load tests

### Documentation to Update

**Technical Documentation:**
- `docs/API.md` - Complete API endpoint documentation
- `docs/ARCHITECTURE.md` - System architecture overview
- `docs/DEMO.md` - Demo setup and execution guide
- `README.md` - Project overview and getting started guide

**Inline Documentation:**
- JSDoc comments for all public APIs
- Usage examples in complex functions
- Architecture decision records in source files
- TODO comments for future enhancements

---

## UX/UI Considerations

**Complete UI/UX Implementation Required:**

**UI Components from UX Specification:**
- **RetroButton** - Primary action buttons with arcade styling
- **WorldAreaCard** - World area displays with status indicators
- **ProofCard** - Blockchain verification and action results
- **ProcessingVisualizer** - 15-second AI processing display
- **MultiplayerMonitor** - Real-time activity coordination
- **RetroScoreDisplay** - Player score and achievement display

**Visual Design Implementation:**
- **Retro Gaming Theme:** Dark backgrounds with neon green/cyan/pink accents
- **Typography:** VT323 and Roboto Mono for terminal aesthetics
- **Visual Effects:** Scanlines, pixel borders, glow animations
- **Accessibility:** WCAG 2.1 AAA compliance with color-blind friendly design
- **Responsive Design:** Desktop (1024px+), Tablet (768px+), Mobile (320px+)

**User Journey Implementation:**
- **"15-Second Wonder" Demo Flow:** Optimized sequence for hackathon judges
- **Multiplayer Demonstration:** 3-device coordination showcase
- **World Evolution Explorer:** Timeline of world changes
- **Error States and Recovery:** Comprehensive fallback systems

**Technical Implementation Requirements:**
- **shadcn/ui Integration:** Custom retro styling of React components
- **Real-time Updates:** WebSocket or Server-Sent Events for live activity
- **Performance Optimization:** Fast loading times for demo reliability
- **Cross-device Compatibility:** Consistent experience across all devices
- **Browser Compatibility:** Modern browser support with fallbacks

**Accessibility Implementation:**
- **High Contrast:** 7:1 contrast ratios for normal text
- **Keyboard Navigation:** Complete keyboard accessibility
- **Screen Reader Support:** ARIA labels and semantic HTML
- **Focus Indicators:** 2px neon outline on all focusable elements
- **Animation Controls:** Respect prefers-reduced-motion setting

---

## Testing Approach

**Comprehensive Testing Strategy:**

**Unit Testing (Jest Framework):**
- **Test Framework:** Jest 29.5.0 with coverage reporting
- **Coverage Target:** 80% minimum, 90% for critical paths
- **Mock Strategy:** Mock external dependencies (OpenAI, Walrus)
- **Test Organization:** Feature-based test structure mirroring source code

**Integration Testing:**
- **API Testing:** Express endpoint validation with realistic data
- **Storage Testing:** Walrus integration with retry logic verification
- **AI Integration:** Prompt template processing and response validation
- **Multiplayer Testing:** State synchronization across multiple clients

**Demo Testing (Critical for Hackathon Success):**
- **Flow Testing:** Complete 15-second wonder demo validation
- **Reliability Testing:** Fallback system activation and validation
- **Multi-device Testing:** Simultaneous action coordination testing
- **Performance Testing:** Response time validation under load
- **Network Failure Testing:** Graceful degradation verification

**Test Data Management:**
- **Fixtures:** Comprehensive test data for all scenarios
- **Mock Responses:** Realistic AI and blockchain API responses
- **Test Database:** In-memory database for consistent test state
- **Environment Isolation:** Separate test environment configuration

**Quality Assurance:**
- **Code Coverage:** Automated coverage reporting with GitHub Actions
- **Linting:** ESLint with custom rules for project standards
- **Code Review:** Pull request reviews for all changes
- **Performance Monitoring:** Response time and resource usage tracking

---

## Deployment Strategy

### Deployment Steps

**Development Environment:**
```bash
# Local development setup
npm install
npm run dev
```

**Staging Environment (Pre-hackathon validation):**
```bash
# Build and test staging deployment
npm run build
npm run test:staging
npm run deploy:staging
```

**Hackathon Demo Environment:**
```bash
# Production-like setup for demonstration
npm run build:production
npm run start:production
npm run health-check
```

**Emergency Deployment (Backup Systems):**
```bash
# Fallback deployment for demo failures
npm run deploy:backup
npm run validate:demo
```

### Rollback Plan

**Immediate Rollback (Critical Demo Failure):**
1. **Switch to Backup Video:** Immediately play pre-recorded demo
2. **Restore Previous Version:** Git revert to last known working commit
3. **Clear Browser Cache:** Force reload to avoid cached issues
4. **Restart Services:** Clean restart of all application services
5. **Validate Core Functionality:** Quick smoke test of critical features

**Technical Rollback Procedures:**
- **Database Rollback:** Restore world state from backup files
- **Configuration Rollback:** Revert to previous environment configuration
- **Dependency Rollback:** Downgrade problematic package versions
- **Cache Invalidation:** Clear all application and browser caches

### Monitoring

**Real-time Monitoring During Demo:**
- **Server Health:** CPU, memory, and response time monitoring
- **API Performance:** Endpoint response times and error rates
- **External Services:** OpenAI API and Walrus storage status
- **User Activity:** Real-time player actions and world changes
- **System Resources:** Disk space, network connectivity, database performance

**Alert Thresholds:**
- **Response Time:** Alert if > 2 seconds for any API endpoint
- **Error Rate:** Alert if > 5% error rate across all endpoints
- **External API:** Alert if OpenAI or Walrus services unavailable
- **System Resources:** Alert if CPU > 80% or memory > 90%
- **Database:** Alert if any query exceeds 1 second execution time

**Post-Demo Analysis:**
- **Performance Metrics:** Response time analysis and optimization opportunities
- **Error Analysis:** Error patterns and prevention strategies
- **User Behavior:** Action patterns and world change trends
- **System Utilization:** Resource usage patterns and scaling opportunities
- **Success Metrics:** Demo success criteria validation and lessons learned