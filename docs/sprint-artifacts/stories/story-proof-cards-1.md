# Story: Proof Card Generation & Display

**Story ID:** story-proof-cards-1
**Epic:** Epic 5 - Blockchain Proof & Verification
**Status:** ready
**Priority:** high
**Estimated Hours:** 16
**Assigned To:** Development Agent
**Created:** 2025-11-23

---

## Description

As a player, I want to see visual proof cards showing my actions are permanently recorded, so that I have tangible evidence of my impact on the world.

This story creates the frontend visualization for the blockchain integration completed in Story 5.1, providing players with visual proof cards that display action details, verification links, and blockchain confirmation status with retro gaming aesthetics.

---

## Acceptance Criteria

1. **Given** a player has recorded actions, **when** they view proof cards, **then** they see cards with action description and consequences
2. **Given** an action is stored on Walrus, **when** viewing its proof card, **then** it includes clickable verification link to Walrus Gateway
3. **Given** blockchain storage processing, **when** viewing proof cards, **then** cards show blockchain confirmation status and timestamp
4. **Given** retro gaming requirements, **when** proof cards display, **then** cards use retro gaming aesthetics with neon borders
5. **Given** verification functionality, **when** players interact with proof cards, **then** they can share proof links with others to demonstrate actions
6. **Given** processing states, **when** proof cards load, **then** cards display processing status and world impact summary

---

## Technical Implementation

### Backend Components

**ProofCardService** (`server/src/services/ProofCardService.ts`):
```typescript
export class ProofCardService {
  constructor(
    private verificationService: VerificationService,
    private walrusStorageService: WalrusStorageService
  )

  async getProofCard(actionId: string): Promise<ProofCardData>
  async getPlayerProofs(playerId: string): Promise<ProofCardData[]>
  async generateVerificationLink(actionId: string): Promise<string>
  async getVerificationStatus(actionId: string): Promise<VerificationStatus>
}
```

**API Endpoints**:
- `GET /api/proof/:actionId` - Retrieve single proof card
- `GET /api/proof/player/:playerId` - Get player's proof cards

### Frontend Components

**ProofCard** (`client/src/components/proof/ProofCard.tsx`):
```typescript
interface ProofCardProps {
  proofData: ProofCardData
  isLoading?: boolean
  onShare?: (verificationLink: string) => void
  onRefresh?: () => void
}
```

**ProofCardGallery** (`client/src/components/proof/ProofCardGallery.tsx`):
```typescript
interface ProofCardGalleryProps {
  playerId: string
  filter?: 'all' | 'verified' | 'processing'
  search?: string
}
```

**Data Hook** (`client/src/components/proof/hooks/useProofData.ts`):
```typescript
export const useProofData = (actionId: string) => {
  const { data, loading, error, refresh } = useAsyncData(
    () => proofService.getProofCard(actionId),
    [actionId]
  )
  return { data, loading, error, refresh }
}
```

### Integration Points

**Existing Services**:
- `VerificationService.getVerificationLink()` - Generate Walrus links
- `WalrusStorageService.readBlob()` - Retrieve action data
- Existing retro styling from `ConsequenceCard` component

**Data Flow**:
1. User requests proof cards → `ProofCardGallery`
2. Component calls `useProofData` hook → API service
3. Backend `ProofCardService` orchestrates existing services
4. Returns formatted proof data with verification links
5. `ProofCard` displays with retro styling and interactions

---

## File Structure

### New Files

**Frontend:**
```
client/src/components/proof/
├── ProofCard.tsx                 # Main proof card component
├── ProofCardGallery.tsx          # Gallery container
├── types/
│   └── proof.ts                 # TypeScript interfaces
├── styles/
│   └── proof.css                # Retro gaming styles
├── hooks/
│   └── useProofData.ts           # Data fetching hook
└── __tests__/
    ├── ProofCard.test.tsx
    ├── ProofCardGallery.test.tsx
    └── useProofData.test.ts
```

**Backend:**
```
server/src/
├── services/
│   └── ProofCardService.ts       # Business logic
├── routes/api/proof/
│   ├── index.ts                  # Routes module
│   ├── getProofCard.ts           # Single proof endpoint
│   └── getPlayerProofs.ts        # Player proofs endpoint
└── tests/
    ├── ProofCardService.test.ts
    └── integration/
        └── proof-cards.test.ts
```

### Modified Files

- `client/src/App.tsx` - Add ProofCardGallery integration
- `server/src/index.ts` - Register proof routes
- `docs/sprint-status.yaml` - Update story status

---

## Development Tasks

### Phase 1: Backend Foundation (4 hours)

1. **Create ProofCardService** (1.5 hours)
   - Implement service class with VerificationService integration
   - Add methods for proof data retrieval and formatting
   - Include error handling and logging

2. **Implement API Endpoints** (1.5 hours)
   - Create GET /api/proof/:actionId endpoint
   - Add input validation and error handling
   - Implement GET /api/proof/player/:playerId endpoint

3. **Write Backend Tests** (1 hour)
   - Unit tests for ProofCardService
   - API endpoint integration tests
   - Error scenario testing

### Phase 2: Frontend Component (6 hours)

1. **Create TypeScript Interfaces** (1 hour)
   - Define ProofCardData, VerificationStatus interfaces
   - Create component prop types
   - Add type safety for API responses

2. **Implement ProofCard Component** (2.5 hours)
   - Create component based on ConsequenceCard pattern
   - Add retro styling with CSS custom properties
   - Implement share functionality and status indicators

3. **Create useProofData Hook** (1 hour)
   - Implement data fetching with error handling
   - Add loading states and refresh functionality
   - Include caching for performance

4. **Style with Retro Gaming Aesthetics** (1.5 hours)
   - Follow ConsequenceCard styling patterns
   - Add neon borders, glow effects, and scanlines
   - Ensure mobile responsiveness and accessibility

### Phase 3: Gallery and Integration (3 hours)

1. **Create ProofCardGallery Component** (1.5 hours)
   - Implement container with filtering and search
   - Add responsive grid layout
   - Include loading states and error handling

2. **Integrate with Main Application** (1 hour)
   - Add ProofCardGallery to App.tsx
   - Create navigation/routing to proof gallery
   - Ensure proper data flow and state management

3. **Implement Share Functionality** (0.5 hours)
   - Add copy-to-clipboard for verification links
   - Include share dialog or modal
   - Add success/error feedback

### Phase 4: Testing and Polish (3 hours)

1. **Write Frontend Tests** (1.5 hours)
   - Component unit tests with React Testing Library
   - Hook testing with mock API responses
   - Accessibility testing with screen readers

2. **Verify Mobile Responsiveness** (0.5 hours)
   - Test on various screen sizes (320px+)
   - Ensure touch targets are 44px minimum
   - Validate responsive design with browser tools

3. **Performance Optimization** (0.5 hours)
   - Add memoization for expensive operations
   - Implement lazy loading for gallery view
   - Optimize CSS animations for GPU acceleration

4. **Accessibility Validation** (0.5 hours)
   - Ensure WCAG 2.1 AAA contrast compliance
   - Test keyboard navigation and screen readers
   - Validate ARIA labels and semantic HTML

---

## Testing Strategy

### Unit Tests

**Frontend (Jest + React Testing Library):**
```typescript
describe('ProofCard', () => {
  it('displays action data correctly')
  it('shows verification status and timestamp')
  it('applies retro styling classes')
  it('handles share functionality')
  it('is accessible via keyboard navigation')
})

describe('useProofData', () => {
  it('fetches proof data successfully')
  it('handles loading states')
  it('manages error conditions')
  it('implements refresh functionality')
})
```

**Backend (Jest + Supertest):**
```typescript
describe('ProofCardService', () => {
  it('retrieves proof card data')
  it('generates verification links')
  it('handles missing actions gracefully')
  it('integrates with VerificationService')
})

describe('GET /api/proof/:actionId', () => {
  it('returns proof card data')
  it('validates actionId parameter')
  it('returns 404 for missing actions')
})
```

### Integration Tests

**End-to-End Flow:**
1. Record action → Store on Walrus → Generate proof card
2. Verify proof card displays correct data
3. Test verification link functionality
4. Validate share functionality
5. Test mobile responsiveness

### Accessibility Tests

- **WCAG 2.1 AAA Compliance:** Color contrast ratios
- **Keyboard Navigation:** Tab order and focus management
- **Screen Reader Support:** ARIA labels and semantic HTML
- **Touch Targets:** 44px minimum tap targets

---

## Dependencies

### Prerequisites

- **Story 5.1 Completed:** Action Recording & Walrus Integration
- **Existing Services:** VerificationService, WalrusStorageService
- **Design System:** Retro gaming aesthetics from Story 8.1

### Technical Dependencies

**Frontend:**
- React 18.2.0 (existing)
- TypeScript 5.3.3 (existing)
- CSS custom properties (existing)

**Backend:**
- Express 4.18.2 (existing)
- @mysten/walrus 0.8.4 (existing)
- VerificationService (from Story 5.1)

**No New Dependencies Required**

---

## Success Metrics

### Functional Metrics

- ✅ Proof cards display for all recorded actions
- ✅ Verification links are clickable and functional
- ✅ Cards show correct blockchain status and timestamps
- ✅ Retro styling matches existing design system
- ✅ Share functionality works across platforms
- ✅ Mobile responsiveness validated on all screen sizes

### Performance Metrics

- **API Response Time:** < 200ms for proof card retrieval
- **Component Render Time:** < 100ms for individual cards
- **Gallery Load Time:** < 1s for 20 cards
- **Mobile Performance:** 60fps animations on mobile devices

### Quality Metrics

- **Test Coverage:** 80% for new components
- **Accessibility:** WCAG 2.1 AAA compliance
- **Code Quality:** Zero TypeScript errors
- **Bundle Size:** < 10KB additional JavaScript

---

## Rollback Plan

If critical issues arise during implementation:

1. **Frontend Rollback:** Remove ProofCardGallery from App.tsx
2. **Backend Rollback:** Remove /api/proof routes registration
3. **Data Safety:** No database changes required
4. **User Impact:** Minimal - new feature only

---

## Completion Checklist

- [ ] Backend ProofCardService implemented and tested
- [ ] API endpoints created and documented
- [ ] ProofCard component built with retro styling
- [ ] ProofCardGallery container implemented
- [ ] Data fetching hook created and tested
- [ ] Mobile responsiveness validated
- [ ] Accessibility compliance verified
- [ ] All unit tests passing (80% coverage)
- [ ] Integration tests passing
- [ ] Share functionality working
- [ ] Documentation updated
- [ ] Story status updated to 'done'

---

**Tech Spec Reference:** `docs/tech-spec.md`
**Related Stories:** Story 5.1 (prerequisite)
**Implementation Context:** Brownfield project with existing Walrus integration