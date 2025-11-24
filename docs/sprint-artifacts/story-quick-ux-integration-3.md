# Story 1.3: Session Persistence Enhancement

**Status:** Ready for Development
**Epic:** Quick UX Integration
**Points:** 2
**Time Estimate:** 1 day
**Dependencies:** Stories 1.1, 1.2 (Wallet Connection + Introduction Narrative)

---

## User Story

**As a** returning player
**I want to** be recognized when I reconnect to SuiSaga
**So that** I feel acknowledged as a consistent contributor to the collective living world

**PRD Traceability:** This story enables FR8, FR9, FR14, and FR16 by providing session continuity for players to discover their previous world impacts, build persistent reputation, and return to see world evolution from their prior actions.

---

## Acceptance Criteria

**AC #1:** Given returning user, when they authenticate, then welcome message includes session history ("Welcome back, [address]! This is your [N]th session")

**AC #2:** Given JWT token expiration, when token expires, then automatic refresh occurs without user interruption or awareness

**AC #3:** Given new user, when they authenticate, then welcome message indicates first session ("Welcome to SuiSaga!")

**AC #4:** Given browser restart, when user returns, then session recognition persists via stored JWT token

**AC #5:** Given session tracking, when multiple sessions occur, then session count increments accurately and persists across visits

---

## Tasks & Subtasks

- [ ] **Backend Session Tracking Enhancement**
  - [ ] Modify `server/src/services/auth-service.ts` to track player session history (AC: #1, #5)
  - [ ] Add in-memory session metadata storage (wallet address → session count, last visit) (AC: #1, #5)
  - [ ] Create `/api/auth/session-history` endpoint for returning player recognition (AC: #1)
  - [ ] Add session data types to `server/src/types/storage.ts` (AC: #1, #5)

- [ ] **JWT Token Enhancement**
  - [ ] Enhance JWT tokens to include session metadata (session count, first visit flag) (AC: #1, #3)
  - [ ] Add last visit timestamp and session increment logic (AC: #1, #5)
  - [ ] Implement JWT payload validation for session data integrity (AC: #4, #5)
  - [ ] Add session metadata to existing token refresh mechanism (AC: #2)

- [ ] **Frontend Welcome Messaging System**
  - [ ] Update IntroductionStory component to display personalized welcome messages (AC: #1, #3)
  - [ ] Implement session detection logic from JWT token payload (AC: #1, #3, #4)
  - [ ] Create welcome message templates for new vs returning users (AC: #1, #3)
  - [ ] Add session count display and recognition messaging (AC: #1, #5)

- [ ] **Automatic Token Refresh Enhancement**
  - [ ] Enhance `client/src/hooks/useAuthentication.ts` with seamless token refresh (AC: #2)
  - [ ] Add proactive token refresh before expiration (AC: #2)
  - [ ] Implement silent background refresh without UI disruption (AC: #2)
  - [ ] Add error handling for refresh failures with user-friendly recovery (AC: #2)

- [ ] **Session Persistence Logic**
  - [ ] Implement localStorage-based JWT token persistence across browser sessions (AC: #4)
  - [ ] Add token validation on app initialization to detect returning users (AC: #4)
  - [ ] Create session cleanup logic for expired or invalid tokens (AC: #4)
  - [ ] Add session state synchronization between browser tabs (AC: #4, #5)

- [ ] **API Integration & Data Flow**
  - [ ] Update `client/src/services/auth-api.ts` with session history endpoint integration (AC: #1)
  - [ ] Add session data fetching during authentication flow (AC: #1, #3)
  - [ ] Implement caching strategy for session data to reduce API calls (AC: #1)
  - [ ] Add error handling for session history API failures (AC: #1)

- [ ] **Testing Implementation**
  - [ ] Create session tracking tests in backend authentication service (AC: #1, #5)
  - [ ] Test JWT token refresh mechanism and automatic renewal (AC: #2)
  - [ ] Test welcome messaging for new vs returning users (AC: #1, #3)
  - [ ] Test session persistence across browser restarts and tab synchronization (AC: #4, #5)
  - [ ] Add integration tests for complete authentication flow with session recognition

---

## Technical Summary

This story enhances the authentication system with session persistence and player recognition. The backend auth-service.ts is modified to track player session history in memory with minimal metadata (no personal world state). JWT tokens are enhanced to include session metadata (session count, last visit, first visit flag) for offline recognition. The frontend useAuthentication hook implements seamless automatic token refresh, while the IntroductionStory component displays personalized welcome messaging. Session data persists via localStorage with cross-tab synchronization and proper cleanup for expired tokens.

---

## Project Structure Notes

**Files to Modify:**
- `server/src/services/auth-service.ts` - Add session history tracking and metadata storage
- `server/src/routes/api/auth.ts` - Add session history endpoint for returning player recognition
- `server/src/types/storage.ts` - Add player session metadata types
- `client/src/hooks/useAuthentication.ts` - Enhance with seamless token refresh logic
- `client/src/services/auth-api.ts` - Add session history endpoint integration
- `client/src/components/IntroductionStory.tsx` - Add personalized welcome messaging

**Files to Create:**
- Session tracking unit tests and integration tests
- JWT token refresh validation tests
- Session persistence cross-browser tests

---

## Key Code References

**Existing Authentication Implementation:**
- `server/src/services/auth-service.ts:45-120` - Current JWT generation and validation logic
- `server/src/routes/api/auth.ts:25-80` - Current authentication endpoints for integration

**Frontend Authentication Flow:**
- `client/src/hooks/useAuthentication.ts` - Current JWT token management hook (from Story 1.1)
- `client/src/components/IntroductionStory.tsx` - Narrative component (from Story 1.2)

**JWT Token Structure:**
- Existing token format with wallet address and expiration
- Current refresh mechanism in auth-service.ts for enhancement

---

## Context References

**Primary Context:** `docs/quick-ux-integration-tech-spec.md` - Complete technical specification with session persistence requirements, JWT enhancement patterns, and welcome messaging design.

**Related Documentation:**
- Existing auth-service.ts provides complete JWT authentication infrastructure for enhancement
- Wallet connection flow from Story 1.1 provides authentication state management foundation

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