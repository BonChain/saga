# Story 8.4: Hero NFT Smart Contract Integration

**Status:** Ready for Development
**Epic:** Quick UX Integration
**Points:** 5
**Time Estimate:** 2-3 days

---

## User Story

**As a** new player
**I want to** mint a unique Hero NFT that represents my character in the SuiSaga world
**So that** I have a permanent, verifiable blockchain identity that unlocks gameplay and serves as my gateway to the living world experience

**PRD Traceability:** This story enables FR1 (Digital Identity), FR3 (Onchain Assets), and enables the hybrid blockchain architecture by creating the primary onboarding mechanism that bridges wallet connection to active gameplay participation.

---

## Acceptance Criteria

**AC #1:** Given user has completed wallet connection, when they reach the character creation phase, then the Hero NFT minting interface appears with character customization options (class, name, appearance traits)

**AC #2:** Given character creation interface, when user selects their hero options and confirms, then a minimal Hero NFT smart contract mints exactly one NFT to their wallet with the selected traits stored on-chain

**AC #3:** Given successful NFT mint, when the transaction completes, then the game interface displays the player's Hero NFT with stats, ownership verification, and seamless transition to active gameplay

**AC #4:** Given minting transaction error, when the transaction fails, then user receives clear error messaging with specific guidance and retry options without losing their character configuration

**AC #5:** Given existing Hero NFT in wallet, when user returns to the game, then the system detects their NFT and skips character creation, directly loading their existing hero into the game interface

**AC #6:** Given gas cost considerations, when user initiates minting, then the interface displays estimated gas fees and implements the one-time gas cost model for permanent hero ownership

---

## Tasks & Subtasks

- [ ] **Hero NFT Smart Contract Development**
  - [ ] Create minimal `hero_nft.move` contract with NFT minting capability (AC: #2)
  - [ ] Define HeroNFT struct with on-chain trait storage (class, name, stats) (AC: #1, #2)
  - [ ] Implement mint_hero function with one-time fee mechanism (AC: #2, #6)
  - [ ] Add transfer restrictions to keep NFT in player's wallet (AC: #2)
  - [ ] Create owner verification functions for game integration (AC: #3, #5)

- [ ] **Character Creation UI Component**
  - [ ] Create `client/src/components/HeroCreation.tsx` main interface (AC: #1)
  - [ ] Implement character class selection (Warrior, Mage, Rogue, Hunter) with retro gaming styling (AC: #1)
  - [ ] Add hero name input with validation and profanity filtering (AC: #1)
  - [ ] Create appearance trait selection system with visual previews (AC: #1)
  - [ ] Implement minting button with gas fee display and confirmation dialog (AC: #6)

- [ ] **NFT Minting Service Integration**
  - [ ] Create `client/src/services/hero-nft-service.ts` for contract interaction (AC: #2, #4)
  - [ ] Implement transaction signing and submission using Sui dApp Kit (AC: #2, #4)
  - [ ] Add transaction status tracking (pending, confirmed, failed) (AC: #2, #4)
  - [ ] Implement gas estimation and cost display functionality (AC: #6)
  - [ ] Add comprehensive error handling for transaction failures (AC: #4)

- [ ] **Hero Display & Management**
  - [ ] Create `client/src/components/HeroDisplay.tsx` for showing owned NFT (AC: #3, #5)
  - [ ] Implement NFT ownership detection from user's wallet (AC: #5)
  - [ ] Add hero stats display with on-chain trait verification (AC: #3)
  - [ ] Create retro-styled NFT visualization with neon borders and effects (AC: #3)
  - [ ] Implement "View on Sui Explorer" functionality for verification (AC: #3)

- [ ] **TypeScript Interfaces & Types**
  - [ ] Create `client/src/types/hero-nft.ts` with comprehensive type definitions (AC: #1, #2, #3)
  - [ ] Define HeroClass, HeroTraits, and NFT metadata interfaces (AC: #1, #2)
  - [ ] Add transaction status and error types for minting flow (AC: #4)
  - [ ] Create contract interaction response types for type safety (AC: #2, #3)

- [ ] **Game Flow Integration**
  - [ ] Modify `client/src/App.tsx` to integrate hero creation between wallet connection and game interface (AC: #1, #3)
  - [ ] Implement hero ownership check on app initialization (AC: #5)
  - [ ] Add routing logic: wallet → hero creation (if no NFT) → game interface (AC: #1, #3, #5)
  - [ ] Ensure seamless transition from minting completion to gameplay (AC: #3)

- [ ] **Testing Implementation**
  - [ ] Create `client/src/components/__tests__/HeroCreation.test.tsx` component tests (AC: #1, #4, #6)
  - [ ] Test minting flow with mocked Sui transaction responses (AC: #2, #4)
  - [ ] Add wallet NFT detection testing with mock wallet data (AC: #5)
  - [ ] Test error scenarios and recovery mechanisms (AC: #4)
  - [ ] Verify retro gaming styling and accessibility compliance (AC: #1, #3)

---

## Technical Summary

This story implements the core Hero NFT minting system using a minimal Move smart contract focused solely on NFT creation and ownership. The implementation creates a seamless bridge between wallet authentication (Story 8.1) and active gameplay, ensuring every player has a verifiable on-chain identity. The smart contract emphasizes gas efficiency by implementing a one-time minting cost, while the frontend provides an engaging character creation experience with retro gaming aesthetics. The system integrates with existing Sui dApp Kit infrastructure and maintains type safety throughout the stack.

---

## Project Structure Notes

**Files to Create:**
- `contract/move/source/hero_nft.move` - Minimal Hero NFT smart contract
- `client/src/components/HeroCreation.tsx` - Character creation and minting interface
- `client/src/components/HeroDisplay.tsx` - Hero NFT display and management
- `client/src/services/hero-nft-service.ts` - Contract interaction service
- `client/src/types/hero-nft.ts` - TypeScript interfaces for Hero NFT system
- `client/src/components/__tests__/HeroCreation.test.tsx` - Component tests

**Files to Modify:**
- `client/src/App.tsx` - Add hero creation flow and NFT ownership detection
- `client/package.json` - Add any new dependencies if required
- `docs/sprint-artifacts/sprint-status.yaml` - Add story tracking

**Integration Points:**
- `client/src/components/WalletConnection.tsx` - Transition to hero creation after wallet connect
- `client/src/hooks/useAuthentication.ts` - Leverage existing wallet connection state
- `client/src/services/auth-api.ts` - Potential backend integration for hero data

---

## Key Code References

**Existing Wallet Integration:**
- `client/src/components/WalletConnection.tsx:1-200` - Sui dApp Kit integration patterns
- `client/src/components/SuiProviders.tsx:1-50` - React providers for Sui context
- `client/src/hooks/useAuthentication.ts:1-100` - Wallet state management patterns

**Smart Contract Reference:**
- `contract/move/source/suisaga.move:1-261` - Existing Move contract structure and patterns
- Uses similar UID, event emission, and transfer patterns as existing codebase

**Frontend Architecture Reference:**
- `client/src/components/ActionInput.tsx:15-45` - Component structure and API integration
- `client/src/App.tsx:12-30` - Performance monitoring and component organization

---

## Hero NFT Smart Contract Specification

**Contract Name:** `hero_nft.move`
**Module:** `suisaga::hero_nft`

**Core Structures:**
```move
public struct HeroNFT has key, store {
    id: UID,
    owner: address,
    name: String,
    class: u8,  // 0=Warrior, 1=Mage, 2=Rogue, 3=Hunter
    level: u8,
    experience: u64,
    traits: vector<String>,
    minted_at: u64,
}

public struct MintConfig has key {
    id: UID,
    mint_fee: u64,
    max_supply: u64,
    current_supply: u64,
}
```

**Key Functions:**
- `mint_hero(name: String, class: u8, traits: vector<String>)` - Mint new Hero NFT
- `verify_ownership(hero: &HeroNFT, owner: address): bool` - Verify hero ownership
- `get_hero_stats(hero: &HeroNFT): (u8, u64)` - Get hero level and experience

**Events:**
- `HeroMinted` - Emitted when new hero is created
- `HeroLeveledUp` - Emitted when hero gains experience (future enhancement)

---

## Prerequisites & Dependencies

**Technical Prerequisites:**
- Story 8.1 (Wallet Connection Implementation) - Complete and verified
- Sui dApp Kit integration working with wallet authentication
- Move compiler and Sui testnet deployment environment
- User wallet with sufficient Sui tokens for gas fees

**System Dependencies:**
- @mysten/dapp-kit for wallet interaction
- @mysten/sui for Move contract interaction
- Existing TypeScript configuration and build system
- Retro gaming UI components and styling system

**Business Dependencies:**
- Gas cost analysis for minting transactions
- Character class balancing and game design decisions
- NFT metadata standards compliance for future marketplace integration

---

## Risk Assessment & Mitigation

**High Risk:**
- **Transaction Failures:** Users may experience failed minting transactions due to network congestion or insufficient gas
  - *Mitigation:* Implement comprehensive error handling, gas estimation, and retry mechanisms with user guidance

**Medium Risk:**
- **Smart Contract Bugs:** Critical bugs in the Hero NFT contract could prevent minting or ownership verification
  - *Mitigation:* Thorough testing on testnet, simple contract design, and code review before deployment

**Low Risk:**
- **UI/UX Issues:** Character creation interface may be confusing or have accessibility issues
  - *Mitigation:* Follow existing retro gaming patterns, implement comprehensive testing, and user feedback loops

---

## Success Metrics

**Functional Metrics:**
- Successfully minted Hero NFTs: 100% of completed character creations
- Transaction success rate: >95% (accounting for network issues)
- Ownership detection accuracy: 100% for returning players
- Gas cost efficiency: <0.1 SUI per mint transaction

**User Experience Metrics:**
- Character creation completion rate: >80% of users who reach this step
- Time from wallet connect to gameplay: <3 minutes
- Error recovery success rate: >90% of failed transactions resolved
- User satisfaction with hero customization: Qualitative feedback during hackathon

---

## Time Breakdown

- **Day 1 (8 hours):** Hero NFT smart contract development and testing
- **Day 2 (8 hours):** Character creation UI component and service integration
- **Day 3 (4 hours):** Hero display, testing refinement, and deployment

**Total Estimated:** 20 hours (2.5 days)

---

## Dev Agent Record

**Agent Model Used:** Claude Sonnet 4.5 (Anthropic)

**Context:** Created as strategic bridge between wallet authentication and active gameplay, enabling the hybrid blockchain architecture for SuiSaga. Focuses on minimal gas costs and seamless user experience.

**Integration Notes:** This story serves as the critical onboarding mechanism that converts wallet-connected users into active players with permanent on-chain identity. The implementation emphasizes simplicity and reliability for hackathon demonstration while establishing the foundation for future gameplay mechanics.

---

## Review Notes

[To be populated during code review]