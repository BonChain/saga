# saga - Quick UX Integration Technical Specification

**Author:** Tenny
**Date:** 2025-11-21
**Project Level:** Level 1 (Quick-Flow Brownfield Enhancement)
**Change Type:** Feature Enhancement (User Experience Integration)
**Development Context:** Adding wallet connection, narrative introduction, and session recognition to existing Living World blockchain game

---

## Context

### Available Documents

**Product Brief Loaded:** `docs/bmm-product-brief-saga-2025-11-14.md` (346 lines)
- Comprehensive vision for SuiSaga "Living World" blockchain game
- Target users: Impact-driven gamers, digital legacy builders, collaborative world shapers
- Core innovation: Asynchronous world architecture with AI-driven consequences
- Technical requirements: 3-layer Walrus storage, Sui blockchain integration
- MVP scope: Action recording, cascade visualization, basic combat, multi-device support

### Project Stack

**Frontend Stack:**
- React 19.2.0 (latest) + TypeScript 5.9.3 + Vite 7.2.2
- Jest 30.2.0 + React Testing Library 16.3.0 + Axe 4.11.0 (accessibility)
- Axios 1.13.2 for API communication

**Backend Stack:**
- Node.js + Express 4.18.2 + TypeScript 5.3.3
- @mysten/sui 1.45.0 (Sui blockchain SDK) + @mysten/walrus 0.8.4
- OpenAI 6.9.0 (AI integration) + Winston 3.18.3 (logging)
- JWT authentication + helmet security + morgan monitoring

**Development Tools:**
- ESLint 9.39.1 + Prettier 3.1.1 + concurrently 8.2.2
- Comprehensive testing across client/server with accessibility compliance

### Existing Codebase Structure

**Sophisticated Architecture:**
- 3-Layer Walrus storage system (blueprint/queue/state) with versioning
- JWT-based authentication service with Sui wallet challenge-response (`server/src/services/auth-service.ts`)
- AI-driven consequence generation with OpenAI integration (`server/src/services/openai-integration.ts`)
- Character service and relationship management system
- Cascade visualization engine with performance monitoring
- Comprehensive middleware: security, monitoring, input validation
- Performance optimization with memory management and circuit breakers

**Code Patterns:**
- Service-oriented architecture with dependency injection
- TypeScript strict mode with comprehensive type definitions
- Express.js REST API with structured error handling
- Winston structured logging with multiple transports
- Jest testing framework with accessibility compliance (Axe)
- Component-based React architecture with hooks and performance monitoring

---

## The Change

### Problem Statement

SuiSaga has a sophisticated backend architecture and game mechanics, but lacks the essential user experience layer for player engagement. Users cannot currently connect their wallets, receive narrative introduction to the world, or receive recognition as returning players. This creates a cold, impersonal entry experience that undermines the game's focus on meaningful player connections and digital legacy building.

### Proposed Solution

Implement a three-part Quick UX Integration that creates a welcoming user journey: (1) Sui wallet connection UI using existing @mysten/sui SDK, (2) Initial narrative introduction system that provides story context after authentication, and (3) Session persistence with player recognition using existing JWT authentication. This creates a complete user onboarding flow while preserving the existing collective world evolution mechanics.

### Scope

**In Scope:**

- Wallet Connection UI Component with @mysten/sui SDK integration
- React authentication state management with JWT tokens
- Introduction narrative system with "You wake up under a tree..." storytelling
- Session persistence with returning player recognition
- Integration with existing auth-service.ts backend authentication
- Responsive design matching existing retro gaming aesthetic
- Accessibility compliance (Axe standards) for new components
- Integration with existing performance monitoring system

**Out of Scope:**

- Personal world state persistence (world remains collective)
- Player inventory or progression systems
- Complex onboarding tutorials or help systems
- New blockchain contracts or tokenomics
- Modifications to core game mechanics or AI systems
- Database schema changes (uses existing JWT system)
- Social features or player profiles beyond recognition

---

## Implementation Details

### Source Tree Changes

**Frontend Components (CREATE):**
- `client/src/components/WalletConnection.tsx` - Main wallet connection UI
- `client/src/components/IntroductionStory.tsx` - Narrative display component
- `client/src/components/AuthenticationGuard.tsx` - Route protection wrapper
- `client/src/hooks/useWalletConnection.ts` - Wallet connection state management
- `client/src/hooks/useAuthentication.ts` - JWT token management hook
- `client/src/services/auth-api.ts` - Authentication API client
- `client/src/types/authentication.ts` - TypeScript interfaces for auth
- `client/src/components/__tests__/WalletConnection.test.tsx` - Component tests
- `client/src/components/__tests__/IntroductionStory.test.tsx` - Narrative tests

**Frontend Modifications (MODIFY):**
- `client/src/App.tsx` - Add authentication state and wallet connection flow
- `client/package.json` - Add @mysten/sui dependency for wallet SDK

**Backend Enhancements (MODIFY):**
- `server/src/routes/api/auth.ts` - Add player session history endpoint
- `server/src/services/auth-service.ts` - Add session recognition logic
- `server/src/types/storage.ts` - Add player session metadata types

### Technical Approach

**Wallet Connection Strategy:**
Use @mysten/sui SDK 1.45.0 (already in backend dependencies) to implement wallet connection. The SDK provides secure wallet communication, message signing for challenge-response authentication, and transaction capabilities. Implementation follows Sui wallet connection patterns: connect wallet → get challenge → sign message → authenticate → receive JWT token.

**State Management Architecture:**
React Context + custom hooks for authentication state management. useWalletConnection hook handles wallet connection state, useAuthentication hook manages JWT tokens and session validation. AuthenticationGuard component provides route-level protection and redirects unauthenticated users.

**Narrative Integration:**
IntroductionStory component triggers after successful wallet connection using useEffect dependency on authentication state. Content dynamically loaded from backend world-state API to ensure consistency with current world state (Dragonslayer Village, Ignis the Ancient dragon, etc.).

**Session Recognition:**
JWT tokens stored in localStorage with automatic refresh. Backend auth-service.ts enhanced to track player session history and provide "Welcome back" messaging. No personal world state - world continues evolving collectively regardless of individual player sessions.

### Existing Patterns to Follow

**Component Architecture:**
Follow existing ActionInput.tsx pattern: functional components with hooks, performance monitoring integration, accessibility attributes (aria-labels, skip links), and TypeScript strict typing.

**API Integration:**
Follow existing client/server communication pattern seen in ActionInput: Axios for HTTP requests, comprehensive error handling, loading states, and response type validation.

**Authentication Flow:**
Integrate with existing auth-service.ts JWT pattern: challenge-response wallet signing, token validation, refresh mechanism, and error handling. Use existing security middleware and monitoring.

**Testing Standards:**
Follow existing Jest + React Testing Library pattern: component rendering tests, user interaction simulations, accessibility testing with Axe, and coverage reporting.

### Integration Points

**Authentication Service Integration:**
Connect to existing `server/src/services/auth-service.ts` for wallet challenge generation and JWT token validation. Leverage existing middleware: security headers, rate limiting, and monitoring.

**World State Integration:**
Connect to existing `/api/storage/world-state` endpoints for narrative content. Use current world state to ensure introduction story matches actual world configuration (village, dragon, regions).

**Frontend Integration:**
Integrate with existing App.tsx performance monitoring and CSS patterns. Use existing performanceMonitor for new components and maintain responsive design consistency.

**Storage Integration:**
No changes needed to 3-layer Walrus storage system. Authentication uses existing JWT system without affecting world state persistence or collective evolution mechanics.

---

## Development Context

### Relevant Existing Code

**Authentication Service:**
- `server/src/services/auth-service.ts` - Complete JWT authentication with Sui wallet challenges
- `server/src/routes/api/auth.ts` - REST endpoints for challenge, authenticate, refresh, validate
- `server/examples/wallet-auth-example.ts` - Reference implementation

**Frontend Architecture:**
- `client/src/App.tsx` - Main application structure with performance monitoring
- `client/src/components/ActionInput.tsx` - Example of component architecture and API integration
- `client/src/components/cascade/CascadeResults.tsx` - Complex component with state management

**World State System:**
- `server/src/storage/layer3-state.ts` - Current world state with Dragonslayer Village configuration
- `server/src/index.ts` API endpoints - `/api/storage/world-state` for narrative content

### Dependencies

**Framework/Libraries:**

- **Frontend:** React 19.2.0, TypeScript 5.9.3, Vite 7.2.2, Axios 1.13.2
- **Testing:** Jest 30.2.0, React Testing Library 16.3.0, Axe 4.11.0
- **Backend:** Node.js, Express 4.18.2, TypeScript 5.3.3, Winston 3.18.3
- **Blockchain:** @mysten/sui 1.45.0, @mysten/walrus 0.8.4 (already in dependencies)
- **Authentication:** jsonwebtoken 9.0.2 (existing), helmet 7.1.0 (existing)

**Internal Modules:**

- `@/services/auth-service` - JWT authentication and wallet validation
- `@/services/auth-api` - New frontend API client for authentication
- `@/hooks/useWalletConnection` - New wallet connection state management
- `@/hooks/useAuthentication` - New JWT token management
- `@/components/WalletConnection` - New wallet connection UI component
- `@/components/IntroductionStory` - New narrative display component

### Configuration Changes

**Environment Variables (ADD):**
- `REACT_APP_WALLET_NETWORK` - Sui network (testnet/mainnet)
- `JWT_SESSION_SECRET` - Enhanced JWT session signing key
- `WALLET_CONNECTION_TIMEOUT` - Wallet connection timeout in milliseconds

**Package.json Updates:**
- Add @mysten/sui to client dependencies (already in backend)
- No backend dependency changes required

**Vite Configuration:**
- Add @mysten/sui to optimize dependencies for faster builds
- No breaking changes to existing configuration

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode with comprehensive interface definitions
- Functional components with React hooks (useState, useEffect, useContext)
- Semicolons: Yes (following existing server/client pattern)
- Quotes: Single quotes for strings, double quotes for JSX attributes
- Import organization: External libraries first, internal modules second, relative imports last

**File Organization:**
- Components in `client/src/components/` with co-located `__tests__/` directories
- Hooks in `client/src/hooks/` with descriptive names (use prefix)
- Services in `client/src/services/` for API communication
- Types in `client/src/types/` for TypeScript interface definitions
- Following existing directory structure exactly

**Error Handling:**
- Try-catch blocks with specific error types
- User-friendly error messages with technical details in console
- Axios error handling with status code specific responses
- Following existing ActionInput error communication patterns

### Test Framework & Standards

**Frontend Testing:**
- Jest 30.2.0 with React Testing Library 16.3.0
- Component rendering tests with `screen.getByRole`, `screen.getByText`
- User interaction simulation with `userEvent.click`, `userEvent.type`
- Accessibility compliance testing with Axe 4.11.0
- Coverage reporting with `npm run test:coverage`

**Testing Patterns:**
- Test files named `[Component].test.tsx` in `__tests__/` subdirectories
- Mock API responses using jest.mock for external dependencies
- Performance testing integration with existing performanceMonitor
- Following existing test structure in ActionInput.test.tsx

---

## Implementation Stack

**Frontend Development:**
- Runtime: React 19.2.0 with TypeScript 5.9.3
- Build Tool: Vite 7.2.2 with hot module replacement
- Wallet SDK: @mysten/sui 1.45.0 for Sui blockchain interaction
- State Management: React Context + custom hooks (useWalletConnection, useAuthentication)
- HTTP Client: Axios 1.13.2 with request/response interceptors
- Testing: Jest 30.2.0 + React Testing Library 16.3.0 + Axe 4.11.0

**Backend Integration:**
- Authentication: JWT with wallet signature verification using @mysten/sui 1.45.0
- API Layer: Express 4.18.2 with existing security middleware
- Logging: Winston 3.18.3 with structured JSON logging
- Monitoring: Existing performance monitoring and health check systems
- Session Management: JWT tokens with automatic refresh mechanism

**Development Environment:**
- Package Manager: npm with concurrently 8.2.2 for multi-service development
- Code Quality: ESLint 9.39.1 + Prettier 3.1.1 with TypeScript strict mode
- Build Process: `npm run build` for production optimization
- Development: `npm run dev` with hot reload for both client and server

---

## Technical Details

**Wallet Connection Flow:**
1. User clicks "Connect Wallet" button
2. @mysten/sui SDK detects available Sui wallets (Sui Wallet, Suiet, etc.)
3. User selects and authorizes wallet connection
4. Frontend receives wallet address and requests challenge from `/api/auth/challenge`
5. User signs challenge message with wallet private key
6. Frontend sends signature to `/api/auth/authenticate`
7. Backend validates signature using @mysten/sui verification
8. Backend issues JWT token with wallet address and session metadata
9. Frontend stores JWT token and updates authentication state
10. IntroductionStory component triggers with world context

**State Management Architecture:**
React Context provides global authentication state with these states: 'disconnected' | 'connecting' | 'connected' | 'authenticating' | 'authenticated' | 'error'. useWalletConnection manages wallet connection lifecycle, useAuthentication handles JWT token validation and refresh. Components subscribe to context updates and render appropriate UI based on authentication state.

**Narrative System Design:**
IntroductionStory component fetches current world state from `/api/storage/world-state` to ensure narrative matches actual world configuration. Content includes: greeting based on player session history, description of Dragonslayer Village, introduction to Ignis the Ancient dragon, and context about the living world mechanics. Typography and styling match existing retro gaming aesthetic with CSS animations for text reveal.

**Session Recognition Logic:**
JWT tokens include wallet address, session start time, and previous session count. Backend auth-service.ts enhanced to track player sessions in memory with minimal metadata (no personal state). Returning users see "Welcome back, [address]! This is your [N]th session" message. World state remains collective - no personal world modifications saved.

**Performance Considerations:**
Wallet connection components use React.memo for optimization, authentication state updates batched to prevent unnecessary re-renders, world state requests cached with 5-minute TTL, and all new components integrated with existing performanceMonitor for automatic optimization.

**Security Implementation:**
All wallet communications use @mysten/sui SDK secure methods, JWT tokens stored in localStorage with httpOnly cookies considered for future enhancement, existing security middleware maintained (helmet, rate limiting, input validation), and challenge-response authentication prevents replay attacks.

---

## Development Setup

**Prerequisites:**
- Node.js 18+ (existing project requirement)
- Sui wallet browser extension (Sui Wallet, Suiet, or compatible)
- Existing project dependencies installed (`npm run install:all`)

**Development Commands:**
```
1. Clone repo (if not already)
2. npm run install:all (installs client, server, and contract dependencies)
3. cp server/.env.example server/.env (configure environment variables)
4. npm run dev (starts both client and server with hot reload)
5. Open browser and navigate to http://localhost:5173 (client default)
6. Install Sui wallet browser extension and create/import wallet
7. Test wallet connection with Sui testnet (default network)
```

**Environment Configuration:**
Required environment variables in server/.env:
- `SUI_FULLNODE_URL` - Sui blockchain RPC endpoint (testnet default)
- `JWT_SESSION_SECRET` - Enhanced JWT signing key for session management
- `WALLET_CONNECTION_TIMEOUT` - Wallet connection timeout (default: 30000ms)

**Browser Testing:**
Test wallet connection in multiple browsers (Chrome, Firefox, Safari) to ensure wallet extension compatibility. Verify responsive design on mobile devices where wallet extensions may not be available.

---

## Implementation Guide

### Setup Steps

**Development Environment Checklist:**
- Verify existing SuiSaga backend is running on http://localhost:3001
- Test current health endpoint: http://localhost:3001/health
- Confirm @mysten/sui dependency available in backend node_modules
- Install Sui wallet browser extension with testnet configuration
- Create or import Sui wallet for testing connection flow

**Pre-Implementation Tasks:**
- Create feature branch from backend branch: `git checkout -b feature/quick-ux-integration`
- Review existing auth-service.ts implementation for JWT patterns
- Test current authentication endpoints: /api/auth/challenge, /api/auth/authenticate
- Verify world state API returns Dragonslayer Village content: /api/storage/world-state

### Implementation Steps

**Story 1: Wallet Connection Implementation**

1. **Frontend Dependencies:** Add @mysten/sui to client/package.json
2. **Wallet Connection Hook:** Create `client/src/hooks/useWalletConnection.ts` with connection state management
3. **Authentication Hook:** Create `client/src/hooks/useAuthentication.ts` for JWT token handling
4. **API Service:** Create `client/src/services/auth-api.ts` for backend communication
5. **UI Component:** Create `client/src/components/WalletConnection.tsx` with wallet selection and connection flow
6. **TypeScript Interfaces:** Create `client/src/types/authentication.ts` for type definitions
7. **App Integration:** Modify `client/src/App.tsx` to integrate wallet connection before game interface
8. **Testing:** Create comprehensive tests for wallet connection flow and error handling

**Story 2: Introduction Narrative System**

1. **World State API:** Extend backend to provide narrative content from current world state
2. **Introduction Component:** Create `client/src/components/IntroductionStory.tsx` with dynamic content loading
3. **Animation System:** Implement text reveal and fade-in animations matching retro gaming aesthetic
4. **Integration:** Connect component to trigger after successful authentication in App.tsx
5. **Content Management:** Ensure narrative content matches current world configuration (village, dragon, etc.)
6. **Accessibility:** Implement screen reader compatibility and keyboard navigation
7. **Testing:** Test narrative display with different world states and user session histories

**Story 3: Session Persistence Enhancement**

1. **Backend Enhancement:** Modify `server/src/services/auth-service.ts` to track session history
2. **Session Endpoint:** Add `/api/auth/session-history` endpoint for returning player recognition
3. **Welcome Messaging:** Implement "Welcome back" messaging in IntroductionStory component
4. **JWT Management:** Enhance token refresh mechanism and error handling in useAuthentication hook
5. **Session State:** Add session count and last visit tracking in JWT tokens
6. **Recognition Logic:** Implement returning player detection and personalized messaging
7. **Testing:** Verify session persistence across browser restarts and token expiration scenarios

### Testing Strategy

**Unit Testing:**
- Wallet connection flow with mocked @mysten/sui SDK responses
- JWT token management and validation logic
- Introduction story content loading and display
- Session recognition and welcome messaging
- Error handling for wallet connection failures

**Integration Testing:**
- Complete authentication flow from wallet connection to JWT receipt
- Backend integration with existing auth-service.ts
- World state API integration for narrative content
- Session persistence across page refreshes
- Multi-browser compatibility testing

**Accessibility Testing:**
- Axe compliance for all new components
- Keyboard navigation for wallet connection
- Screen reader compatibility for narrative text
- Color contrast verification with existing retro gaming styling
- Focus management during authentication flow

**Performance Testing:**
- Wallet connection timeout handling
- Component rendering optimization with React.memo
- Authentication state update performance
- World state request caching effectiveness
- Memory usage monitoring with existing performanceMonitor

### Acceptance Criteria

**Story 1 - Wallet Connection:**
- Given user is not authenticated, when they click "Connect Wallet", then wallet selection modal appears
- Given wallet selection modal, when user selects and authorizes wallet, then backend receives valid signature
- Given valid signature, when authentication completes, then JWT token is stored and user state updates to 'authenticated'
- Given wallet connection error, when connection fails, then user-friendly error message displays with retry option
- Given successful authentication, when component unmounts, then wallet connection properly disconnects

**Story 2 - Introduction Narrative:**
- Given user is authenticated, when authentication completes, then introduction story appears with current world context
- Given introduction story, when content loads, then narrative includes Dragonslayer Village and Ignis the Ancient references
- Given introduction story, when text displays, then typography matches existing retro gaming aesthetic with animations
- Given screen reader user, when introduction displays, then all content is accessible via assistive technology
- Given mobile device, when introduction displays, then content is responsive and readable

**Story 3 - Session Recognition:**
- Given returning user, when they authenticate, then welcome message includes session history ("Welcome back, [address]!")
- Given JWT token expiration, when token expires, then automatic refresh occurs without user interruption
- Given new user, when they authenticate, then welcome message indicates first session ("Welcome to SuiSaga!")
- Given browser restart, when user returns, then session recognition persists via stored JWT token
- Given session tracking, when multiple sessions occur, then session count increments accurately

---

## Developer Resources

### File Paths Reference

**Frontend Components:**
- `client/src/components/WalletConnection.tsx` - Main wallet connection UI component
- `client/src/components/IntroductionStory.tsx` - Narrative display component
- `client/src/components/AuthenticationGuard.tsx` - Route protection wrapper
- `client/src/App.tsx` - Modified main application with authentication flow

**Frontend Logic:**
- `client/src/hooks/useWalletConnection.ts` - Wallet connection state management
- `client/src/hooks/useAuthentication.ts` - JWT token management hook
- `client/src/services/auth-api.ts` - Authentication API client service
- `client/src/types/authentication.ts` - TypeScript interfaces for authentication

**Backend Integration:**
- `server/src/services/auth-service.ts` - Enhanced JWT authentication service
- `server/src/routes/api/auth.ts` - Modified authentication routes with session tracking
- `server/src/types/storage.ts` - Enhanced type definitions for session metadata

**Testing Files:**
- `client/src/components/__tests__/WalletConnection.test.tsx` - Wallet connection tests
- `client/src/components/__tests__/IntroductionStory.test.tsx` - Narrative component tests
- `client/src/hooks/__tests__/useAuthentication.test.ts` - Authentication hook tests

### Key Code Locations

**Existing Authentication Implementation:**
- `server/src/services/auth-service.ts:45-120` - JWT generation and validation logic
- `server/src/routes/api/auth.ts:25-80` - Challenge-response authentication endpoints
- `server/examples/wallet-auth-example.ts:1-50` - Reference wallet integration pattern

**Frontend Architecture Reference:**
- `client/src/components/ActionInput.tsx:15-45` - Component structure and API integration pattern
- `client/src/App.tsx:12-30` - Performance monitoring integration and component organization
- `client/src/components/cascade/CascadeResults.tsx:1-30` - Complex state management example

**World State Integration:**
- `server/src/storage/layer3-state.ts:626-779` - Default world state with Dragonslayer Village
- `server/src/index.ts:476-496` - World state API endpoint implementation

### Testing Locations

**Unit Tests:**
- `client/src/components/__tests__/` - Component testing directory
- `client/src/hooks/__tests__/` - Custom hook testing directory
- `client/src/services/__tests__/` - API service testing directory

**Integration Testing:**
- `client/src/__tests__/integration/` - End-to-end authentication flow tests
- `server/src/routes/__tests__/` - Backend authentication endpoint tests

**Accessibility Testing:**
- `client/src/components/__tests__/` - Axe accessibility compliance tests
- `client/src/components/__tests__/accessibility/` - Screen reader and keyboard navigation tests

### Documentation to Update

**User Documentation:**
- `README.md` - Add wallet connection setup and usage instructions
- `docs/GETTING_STARTED.md` - Create user onboarding guide with wallet connection steps

**Developer Documentation:**
- `docs/API.md` - Document new authentication endpoints and usage patterns
- `docs/WALLET_INTEGRATION.md` - Create wallet integration technical reference
- `CHANGELOG.md` - Note Quick UX Integration feature addition

**Code Documentation:**
- JSDoc comments for all new components and hooks
- TypeScript interface documentation for authentication types
- API endpoint documentation with request/response examples

---

## UX/UI Considerations

**UI Components Affected:**

**WalletConnection Component (CREATE):**
- Primary "Connect Wallet" button with loading states and error handling
- Wallet selection modal for multiple wallet options (Sui Wallet, Suiet, etc.)
- Connection status indicator with progress feedback
- Error message display with retry functionality
- Responsive design for desktop and mobile experiences

**IntroductionStory Component (CREATE):**
- Full-screen overlay for narrative presentation
- Typewriter text animation effect for immersive storytelling
- "Skip Introduction" option for returning users who prefer immediate action
- Fade transitions between narrative sections
- Reading time estimate and progress indicator

**AuthenticationGuard Component (CREATE):**
- Route protection wrapper with loading spinner
- Redirect logic for unauthenticated users
- Session timeout handling with user-friendly warnings
- Automatic token refresh with seamless user experience

**UX Flow Changes:**

**Current User Journey:**
- Landing page → Action input (no authentication required)

**New User Journey:**
- Landing page → Wallet connection → Authentication → Introduction story → Action input

**Returning User Journey:**
- Landing page → Wallet reconnect (automatic) → Welcome back → Action input (skip intro available)

**Visual/Interaction Patterns:**

**Follow Existing Design System:**
- Maintain retro gaming aesthetic with existing CSS variables and color schemes
- Use existing animation patterns (fade-in, typewriter effects) from cascade components
- Consistent button styling and hover states from current UI elements
- Responsive design patterns matching existing mobile-first approach

**New Patterns Needed:**
- Wallet connection modal with wallet-specific branding and colors
- Loading states specific to blockchain operations (connection, signing, transaction)
- Success feedback for authentication completion
- Error recovery patterns for wallet connection failures

**Accessibility:**

**Keyboard Navigation:**
- Full keyboard access to wallet connection flow
- Focus management during authentication process
- Escape key handling for modal dismissal
- Tab order preservation through authentication states

**Screen Reader Compatibility:**
- ARIA labels for wallet connection buttons and status indicators
- Live regions for authentication state updates
- Screen reader-optimized introduction story presentation
- Alternative text for wallet icons and branding

**Color Contrast:**
- Verify all new UI elements meet WCAG AA contrast standards
- Maintain existing high contrast retro gaming aesthetic
- Ensure error states are distinguishable for colorblind users

**User Feedback:**

**Loading States:**
- Connecting to wallet... (wallet-specific loading indicator)
- Signing message... (progress indicator with time estimate)
- Authenticating... (server processing indicator)
- Loading world context... (narrative preparation)

**Error Messages:**
- Wallet connection failed: [specific error with retry option]
- Authentication error: Invalid signature (with troubleshooting steps)
- Network error: Please check connection and retry
- Wallet not supported: List of compatible wallets

**Success Confirmations:**
- Wallet connected successfully! ✓
- Authentication complete! Welcome to SuiSaga
- Welcome back, [wallet address]! [session count] sessions

---

## Testing Approach

**CONFORM TO EXISTING TEST STANDARDS:**

- Follow existing test file naming: `[Component].test.tsx` in `__tests__/` subdirectories
- Use existing test organization: tests alongside components in dedicated directories
- Match existing assertion style: expect(screen.getByRole('button')).toBeInTheDocument()
- Meet existing coverage requirements: Aim for 80%+ coverage as demonstrated in current test suite

**Test Strategy:**

- Test framework: Jest 30.2.0 with React Testing Library 16.3.0 (from existing setup)
- Unit tests for wallet connection flow, JWT token management, and narrative display
- Integration tests for complete authentication flow with mocked @mysten/sui SDK
- Mock @mysten/sui SDK wallet functions to avoid actual wallet dependency during tests
- Performance benchmarks for authentication state updates using existing performanceMonitor
- Accessibility tests using Axe 4.11.0 (existing accessibility testing setup)

**Coverage:**

- Unit test coverage: 90% for authentication logic and wallet connection components
- Integration coverage: Critical authentication paths (wallet connect → JWT → introduction)
- Ensure all acceptance criteria have corresponding tests with edge case coverage
- Mock external dependencies (@mysten/sui SDK, browser wallet APIs) for reliable testing

**Mocking Strategy:**

- Mock @mysten/sui SDK wallet functions (connectWallet, signMessage)
- Mock browser wallet APIs (window.sui) for consistent test environment
- Mock JWT token encryption/decryption for predictable authentication testing
- Use existing MSW (Mock Service Worker) setup for API endpoint mocking

---

## Deployment Strategy

### Deployment Steps

**Frontend Deployment:**
1. Merge quick-ux-integration branch to main branch
2. Run `npm run build:client` to create optimized production build
3. Deploy static files to existing hosting (Vercel, Netlify, or existing setup)
4. Configure environment variables for production Sui network (mainnet vs testnet)
5. Update any CDN caching for new wallet connection assets

**Backend Deployment:**
1. Deploy enhanced authentication service with session tracking
2. Update environment variables for production JWT session secret
3. Restart backend service to load new authentication enhancements
4. Verify health check endpoint includes new authentication capabilities
5. Test wallet connection flow in production environment

**Configuration Management:**
- Update production environment variables for Sui mainnet access
- Configure JWT session secret with production-grade security
- Set wallet connection timeout values for production performance
- Update rate limiting for authentication endpoints if needed

### Rollback Plan

**Immediate Rollback (< 5 minutes):**
1. Frontend: Revert to previous static build in hosting service
2. Backend: Deploy previous version of authentication service without session tracking
3. Database: No database changes needed - uses in-memory session tracking only

**Complete Rollback (< 30 minutes):**
1. Git revert merge commit for quick-ux-integration feature
2. Redeploy frontend and backend from previous stable commit
3. Verify existing game functionality remains unaffected
4. Test that existing authentication system continues working for any active sessions

**Monitoring During Rollback:**
- Monitor error rates for wallet connection failures
- Track authentication success/failure rates
- Monitor user feedback channels for connection issues
- Check performance metrics for authentication response times

### Monitoring

**Performance Monitoring:**
- Authentication endpoint response times (target: < 2 seconds)
- Wallet connection success rates (target: > 95%)
- JWT token validation performance (target: < 100ms per request)
- Introduction story load times (target: < 1 second)

**Error Monitoring:**
- Wallet connection failure rates with error categorization
- JWT token expiration and refresh failure tracking
- Browser compatibility issues with wallet extensions
- Network timeout occurrences for Sui blockchain communication

**User Experience Monitoring:**
- Authentication funnel drop-off rates (wallet connect → success)
- Introduction story completion rates
- Session persistence success across browser restarts
- Mobile vs desktop wallet connection performance

**Business Metrics:**
- Daily active user authentication events
- New user wallet connection completion rates
- Returning user session frequency
- User satisfaction with onboarding experience

**Alerting:**
- Authentication success rate below 90% triggers immediate alert
- Wallet connection timeout rate above 10% triggers investigation
- Introduction story loading failures require immediate attention
- JWT token validation errors indicate security concerns needing urgent review