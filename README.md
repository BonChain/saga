# SuiSaga - Living World Blockchain Game

**Hackathon Project (3-day development sprint)**

SuiSaga is an AI-driven "Living World" built on Sui blockchain that fundamentally transforms multiplayer gaming through asynchronous processing, provable world history, and intelligent world responses.

## 🚀 Core Innovation

**Unlimited Agency + AI Consequences**: Players can attempt any action they can imagine, and AI generates logical, surprising consequences that create emergent narratives no designer could predict.

## 📁 Project Structure

```
suisaga/
├── client/          # React + TypeScript frontend (Vite)
├── server/          # Express + TypeScript backend API
├── contract/        # Sui blockchain + Walrus storage integration
├── stories/         # User story documentation
├── docs/           # Project documentation and specs
└── README.md       # This file
```

## 🛠️ Technology Stack

### Frontend (client/)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Port**: 5173
- **Features**: Hot module replacement, strict TypeScript mode

### Backend (server/)
- **Framework**: Express.js with TypeScript
- **Development**: Nodemon with hot reload
- **Port**: 3001
- **Features**: Health checks, CORS, security middleware

### Blockchain (contract/)
- **Platform**: Sui blockchain
- **Storage**: Walrus decentralized storage
- **SDK**: @mysten/sui
- **Features**: Action recording, verification links

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install all dependencies** (from root):
```bash
npm run install:all
```

2. **Start development servers**:
```bash
npm run dev
```
This starts both frontend and backend concurrently:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

3. **Individual development**:
```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:client       # Frontend only (port 5173)
npm run dev:server       # Backend only (port 3001)

# Building
npm run build            # Build all components
npm run build:client     # Build frontend only
npm run build:server     # Build backend only
npm run build:contract   # Build contract layer only

# Code Quality
npm run lint             # Lint all code
npm run lint:client      # Lint frontend only
npm run lint:server      # Lint backend only
npm run lint:contract    # Lint contract layer only
```

## 📊 Development Environment

### Health Check
Verify backend is running:
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:48:26.882Z",
  "version": "1.0.0",
  "service": "suisaga-server",
  "uptime": 78.222315
}
```

### Code Quality Tools
- **ESLint**: TypeScript strict mode with custom rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict mode enabled across all components

## 🎯 Development Status

### Current Story: Epic 1.1 - Project Setup & Build System ✅

**Acceptance Criteria Completed:**
- ✅ Project structure with client/, server/, contract/ directories
- ✅ Vite build system configured for React frontend
- ✅ Express TypeScript server with nodemon
- ✅ All dependencies installed and versions locked
- ✅ Build completes without errors
- ✅ Development servers on correct ports (5173 frontend, 3001 backend)
- ✅ Health check endpoint at /health
- ✅ ESLint and Prettier configured
- ✅ README with development setup instructions

## 🏗️ Architecture Overview

### 3-Layer Walrus System
1. **Layer 1 (Blueprint)**: Immutable world rules and butterfly effect logic
2. **Layer 2 (Queue)**: Individual action files with timestamps
3. **Layer 3 (State)**: Versioned world state shards

### API Endpoints
- `GET /health` - Server health check
- `GET /api` - API information and available endpoints

## 🔧 Configuration

### Environment Variables
Create `.env` files in respective directories:

**server/.env**:
```env
PORT=3001
NODE_ENV=development
```

### TypeScript Configuration
All components use strict TypeScript mode with:
- No implicit any
- Strict null checks
- Exact optional property types
- Source maps enabled

## 📝 Development Notes

- Frontend uses Vite for fast development and optimized builds
- Backend includes comprehensive error handling and security middleware
- Contract layer prepared for Sui blockchain integration
- All builds generate source maps for debugging
- ESLint configured for consistent code quality across components

## 🎮 Game Development Roadmap

This project setup enables the implementation of:
- Unlimited natural language action input
- AI-driven consequence generation
- Living character systems with memory
- Blockchain verification of player actions
- Retro gaming interface with cascade visualization
- Asynchronous multiplayer coordination

## 🤝 Contributing

During hackathon development:
1. Follow TypeScript strict mode guidelines
2. Run linting before commits: `npm run lint`
3. Test builds: `npm run build`
4. Update story documentation in `stories/` directory

---

**Built for Hackathon Innovation**
*Unlimited player agency meets AI-driven living worlds*