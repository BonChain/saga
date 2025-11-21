# Story 1.1: Wallet Connection Implementation

**Status:** Draft
**Epic:** Quick UX Integration
**Points:** 3
**Time Estimate:** 1-2 days

---

## User Story

**As a** new player
**I want to** connect my Sui wallet to authenticate with the game
**So that** I can establish my identity and participate in the living world with a verifiable blockchain-backed account

---

## Acceptance Criteria

**AC #1:** Given user is not authenticated, when they click "Connect Wallet", then wallet selection modal appears with available Sui wallets (Sui Wallet, Suiet, etc.)

**AC #2:** Given wallet selection modal, when user selects and authorizes wallet, then backend receives valid signature and authentication succeeds

**AC #3:** Given valid signature, when authentication completes, then JWT token is stored and user state updates to 'authenticated'

**AC #4:** Given wallet connection error, when connection fails, then user-friendly error message displays with specific retry options

**AC #5:** Given successful authentication, when component unmounts or user navigates away, then wallet connection properly disconnects and cleans up resources

**AC #6:** Given accessibility testing, when screen reader users interact with wallet connection, then all elements are accessible via keyboard navigation and ARIA labels

---

## Tasks & Subtasks

- [ ] **Frontend Dependencies Setup**
  - [ ] Add @mysten/sui to client/package.json (AC: #1)
  - [ ] Configure Vite to optimize @mysten/sui for faster builds (AC: #1)
  - [ ] Verify wallet extension detection works across browsers (AC: #1, #6)

- [ ] **Wallet Connection State Management**
  - [ ] Create `client/src/hooks/useWalletConnection.ts` with connection state management (AC: #1, #3)
  - [ ] Create `client/src/hooks/useAuthentication.ts` for JWT token handling (AC: #2, #3)
  - [ ] Implement React Context for global authentication state (AC: #3)
  - [ ] Add wallet connection timeout and retry logic (AC: #4)

- [ ] **Authentication API Integration**
  - [ ] Create `client/src/services/auth-api.ts` for backend communication (AC: #2, #3)
  - [ ] Implement challenge-response flow with backend auth-service.ts (AC: #2)
  - [ ] Add JWT token storage and automatic refresh mechanism (AC: #3)
  - [ ] Implement comprehensive error handling for API failures (AC: #4)

- [ ] **Wallet Connection UI Component**
  - [ ] Create `client/src/components/WalletConnection.tsx` main component (AC: #1, #2)
  - [ ] Implement wallet selection modal with wallet-specific branding (AC: #1)
  - [ ] Add loading states for connection, signing, and authentication phases (AC: #2, #3)
  - [ ] Create error message display with retry functionality (AC: #4)
  - [ ] Implement responsive design for desktop and mobile (AC: #6)

- [ ] **TypeScript Interfaces & Types**
  - [ ] Create `client/src/types/authentication.ts` for type definitions (AC: #1, #2, #3)
  - [ ] Define wallet connection states and error types (AC: #4)
  - [ ] Add type safety for JWT token payloads and validation (AC: #3)

- [ ] **App Integration & Flow**
  - [ ] Modify `client/src/App.tsx` to integrate wallet connection before game interface (AC: #1, #3)
  - [ ] Add authentication state routing and redirects (AC: #3)
  - [ ] Implement connection cleanup on component unmount (AC: #5)
  - [ ] Add performance monitoring integration for new components (AC: #3)

- [ ] **Testing Implementation**
  - [ ] Create `client/src/components/__tests__/WalletConnection.test.tsx` component tests (AC: #1, #2, #4)
  - [ ] Test wallet connection flow with mocked @mysten/sui SDK responses (AC: #2, #3)
  - [ ] Add accessibility testing with Axe compliance verification (AC: #6)
  - [ ] Test error scenarios and retry mechanisms (AC: #4)

- [ ] **Backend Integration Verification**
  - [ ] Test integration with existing auth-service.ts JWT authentication (AC: #2, #3)
  - [ ] Verify wallet signature validation using @mysten/sui verification (AC: #2)
  - [ ] Confirm existing security middleware works with new flow (AC: #3)

---

## Technical Summary

This story implements the complete wallet connection foundation using @mysten/sui SDK 1.45.0. The implementation follows Sui wallet connection patterns: connect wallet → get challenge → sign message → authenticate → receive JWT token. React Context + custom hooks manage authentication state, while comprehensive error handling ensures graceful failure recovery. The component integrates with existing auth-service.ts backend authentication and maintains performance monitoring integration.

---

## Project Structure Notes

**Files to Modify:**
- `client/src/App.tsx` - Add authentication state and wallet connection flow
- `client/package.json` - Add @mysten/sui dependency

**Files to Create:**
- `client/src/components/WalletConnection.tsx` - Main wallet connection UI component
- `client/src/hooks/useWalletConnection.ts` - Wallet connection state management
- `client/src/hooks/useAuthentication.ts` - JWT token management hook
- `client/src/services/auth-api.ts` - Authentication API client service
- `client/src/types/authentication.ts` - TypeScript interfaces for authentication
- `client/src/components/__tests__/WalletConnection.test.tsx` - Component tests

**Test Locations:**
- `client/src/components/__tests__/` - Component testing directory
- `client/src/hooks/__tests__/` - Custom hook testing directory

---

## Key Code References

**Existing Authentication Implementation:**
- `server/src/services/auth-service.ts:45-120` - JWT generation and validation logic
- `server/src/routes/api/auth.ts:25-80` - Challenge-response authentication endpoints
- `server/examples/wallet-auth-example.ts:1-50` - Reference wallet integration pattern

**Frontend Architecture Reference:**
- `client/src/components/ActionInput.tsx:15-45` - Component structure and API integration pattern
- `client/src/App.tsx:12-30` - Performance monitoring integration and component organization

**Dependencies:**
- @mysten/sui 1.45.0 (already in backend dependencies)
- React 19.2.0 + TypeScript 5.9.3 (existing frontend stack)
- Axios 1.13.2 (existing API client)

---

## Context References

**Primary Context:** `docs/quick-ux-integration-tech-spec.md` - Complete technical specification with brownfield analysis, framework versions, existing patterns, and comprehensive implementation guidance.

**Related Documentation:**
- `server/examples/wallet-auth-example.ts` - Reference wallet integration implementation
- Existing auth-service.ts provides complete JWT authentication infrastructure

---

## Dev Agent Record

**Agent Model Used:** [To be populated during development]

**Debug Log References:** [To be populated during development]

**Completion Notes:** [To be populated during development]

**Files Modified:** [To be populated during development]

**Test Results:** [To be populated during development]

---

## Review Notes

[To be populated during code review]