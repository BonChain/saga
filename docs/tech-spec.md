# SuiSaga - Technical Specification

**Author:** Tenny
**Date:** 2025-11-23
**Project Level:** quick-flow-brownfield
**Change Type:** Feature Addition
**Development Context:** Story 5.2 - Proof Card Generation & Display

---

## Context

### Available Documents

**Documents Loaded:**
- Sprint status file showing Story 5.1 completed (Action Recording & Walrus Integration)
- Epic 5 documentation for Blockchain Proof & Verification
- Existing cascade visualization components (ConsequenceCard.tsx)
- Retro gaming UI patterns from Story 8.1

**Brownfield Status:**
- Existing codebase with Walrus blockchain integration complete
- Retro gaming design system established
- React component patterns with TypeScript interfaces defined
- Express backend with @mysten/walrus SDK integration

### Project Stack

**Frontend Stack:**
- React 18.2.0 with TypeScript 5.3.3
- Vite build system with responsive design
- Retro design system: VT323 font, neon colors, scanline effects
- Mobile-first responsive approach (320px+ mobile, 1024px+ desktop)

**Backend Stack:**
- Node.js 20.x with Express 4.18.2
- TypeScript 5.3.3 with strict mode
- @mysten/walrus 0.8.4 for blockchain storage
- @mysten/sui 1.45.0 for Sui blockchain integration
- Comprehensive services: WalrusStorageService, VerificationService, CryptographicService

**Development Tools:**
- Jest 30.2.0 for testing with 75% current coverage
- ESLint 8.56.0 for code quality
- Winston 3.18.3 for logging
- Nodemon for development

### Existing Codebase Structure

**Frontend Structure:**
```
client/src/
├── components/
│   ├── ActionInput.tsx (retro styling patterns)
│   ├── cascade/
│   │   ├── ConsequenceCard.tsx (existing card pattern)
│   │   ├── CascadeResults.tsx (container pattern)
│   │   └── styles/
│   │       └── cascade.css (retro gaming styles)
├── App.tsx (main application)
└── index.css (global styles)
```

**Backend Structure:**
```
server/src/
├── services/
│   ├── WalrusStorageService.ts (blockchain storage)
│   ├── VerificationService.ts (action verification)
│   └── CryptographicService.ts (Ed25519 signatures)
├── routes/
│   └── api/
│       └── actions/ (action recording endpoints)
└── types/storage.ts (Action interface)
```

**Existing Patterns:**
- Component structure with TypeScript interfaces and comprehensive JSDoc
- CSS custom properties for dynamic theming
- Mobile-first responsive design with accessibility (WCAG 2.1 AAA)
- Async/await patterns with proper error handling
- Service layer with dependency injection

---

## The Change

### Problem Statement

Players need visual confirmation that their actions are permanently recorded on blockchain storage. While Story 5.1 implemented the backend Walrus integration for immutable action recording, there's no frontend visualization showing players their actions are verifiably stored. Players cannot currently see proof cards with verification links, timestamps, or blockchain confirmation status, reducing the perceived value and transparency of the blockchain integration.

### Proposed Solution

Create a ProofCard component that displays visual proof cards for each recorded player action, showing:
1. Action description and consequences summary
2. Blockchain verification status (processing, confirmed, verified)
3. Clickable verification link to Walrus Gateway for independent verification
4. Timestamp and unique action ID
5. Retro gaming aesthetics matching existing design system
6. Share functionality for proof links
7. World impact summary and visual status indicators

The solution will integrate with existing Walrus services from Story 5.1 and follow the established ConsequenceCard pattern for consistency.

### Scope

**In Scope:**
- ProofCard React component with TypeScript interfaces
- Integration with existing VerificationService and WalrusStorageService
- API endpoint for retrieving proof card data
- Retro gaming styling matching ConsequenceCard patterns
- Mobile-responsive design with accessibility features
- Clickable verification links and share functionality
- Visual status indicators for blockchain confirmation

**Out of Scope:**
- New blockchain storage implementations (handled by Story 5.1)
- Advanced card management features (filtering, sorting)
- Batch proof generation or export
- Real-time proof status updates (basic polling only)

---

## Implementation Details

### Source Tree Changes

**Frontend Files:**
- `client/src/components/proof/ProofCard.tsx` - CREATE - Main proof card component
- `client/src/components/proof/ProofCardGallery.tsx` - CREATE - Container for multiple proof cards
- `client/src/components/proof/types/proof.ts` - CREATE - TypeScript interfaces
- `client/src/components/proof/styles/proof.css` - CREATE - Retro gaming styles
- `client/src/components/proof/hooks/useProofData.ts` - CREATE - Data fetching hook
- `client/src/services/proofService.ts` - CREATE - API client for proof endpoints

**Backend Files:**
- `server/src/routes/api/proof/index.ts` - CREATE - Proof routes module
- `server/src/routes/api/proof/getProofCard.ts` - CREATE - Get single proof card
- `server/src/routes/api/proof/getPlayerProofs.ts` - CREATE - Get player's proof cards
- `server/src/services/ProofCardService.ts` - CREATE - Business logic for proof cards

**Modified Files:**
- `client/src/App.tsx` - MODIFY - Add ProofCardGallery integration
- `server/src/index.ts` - MODIFY - Add proof routes registration

### Technical Approach

**Frontend Approach:**
- Follow ConsequenceCard component pattern with similar structure and styling
- Use React functional components with TypeScript interfaces
- Implement custom hooks for data fetching and state management
- CSS custom properties for dynamic retro theming
- Mobile-first responsive design with CSS Grid and Flexbox

**Backend Approach:**
- Create ProofCardService that orchestrates VerificationService and WalrusStorageService
- Implement RESTful endpoints following existing /api/actions pattern
- Use Express middleware for validation and error handling
- Integrate with existing Winston logging and error handling patterns

**Data Flow:**
1. ProofCard component requests proof data via proofService
2. Backend ProofCardService calls VerificationService and WalrusStorageService
3. VerificationService retrieves action status and verification links
4. ProofCard displays formatted data with retro styling
5. User can click verification link to view Walrus Gateway

### Existing Patterns to Follow

**Component Pattern (from ConsequenceCard.tsx):**
- Functional component with comprehensive JSDoc documentation
- TypeScript interfaces for props and data structures
- CSS custom properties for dynamic theming
- Accessibility attributes (aria-expanded, aria-label)
- Mobile-first responsive design with conditional styling

**Service Pattern (from VerificationService.ts):**
- Class-based service with dependency injection
- Async methods with proper error handling
- Caching mechanisms and status tracking
- Comprehensive logging with Winston
- Type-safe interfaces and configuration objects

**Styling Pattern (from cascade.css):**
- CSS custom properties for colors and effects
- Retro gaming aesthetics with VT323 font family
- Neon color scheme with glow effects
- Mobile-first responsive breakpoints
- Accessibility compliance with WCAG 2.1 AAA contrast

### Integration Points

**Internal Dependencies:**
- VerificationService - For action status and verification links
- WalrusStorageService - For blob ID and storage confirmation
- ConsequenceCard styles - For consistent retro aesthetics
- ActionInput component - For action triggering integration

**External APIs:**
- Walrus Gateway - For verification link destinations
- No new external dependencies required

**State Management:**
- Local component state for UI interactions
- React Query or SWR for data fetching (existing patterns)
- No global state management required

---

## Development Context

### Relevant Existing Code

**Frontend References:**
- `client/src/components/cascade/ConsequenceCard.tsx:37` - Component structure and JSDoc pattern
- `client/src/components/cascade/styles/cascade.css:10-100` - Retro styling and CSS custom properties
- `client/src/components/ActionInput.tsx` - Form handling and API integration patterns

**Backend References:**
- `server/src/services/VerificationService.ts:116` - Action verification and status tracking
- `server/src/services/WalrusStorageService.ts:129` - Action storage and blob ID management
- `server/src/routes/api/actions/record.ts` - Route structure and validation patterns

### Dependencies

**Framework/Libraries:**
- React 18.2.0 (frontend framework)
- Express 4.18.2 (backend framework)
- TypeScript 5.3.3 (language)
- @mysten/walrus 0.8.4 (blockchain storage)

**Internal Modules:**
- @/services/VerificationService (action verification)
- @/services/WalrusStorageService (blockchain storage)
- @/components/cascade/ConsequenceCard (styling patterns)
- @/types/storage (Action interface)

### Configuration Changes

**No configuration file changes required** - using existing environment variables:
- `WALRUS_AUTH_TOKEN` (from Story 5.1)
- `SUI_NETWORK` (from Story 5.1)
- `DEVELOPER_PRIVATE_KEY` (from Story 5.1)

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode with comprehensive type definitions
- JSDoc comments for all public methods and components
- Async/await patterns with proper error boundaries
- Express middleware patterns for validation and logging

**Naming Conventions:**
- PascalCase for components (ProofCard, ProofCardGallery)
- camelCase for methods and variables (getProofCard, useProofData)
- kebab-case for CSS classes and routes (proof-card, /api/proof)

**File Organization:**
- Feature-based grouping in components directory
- Separate types, hooks, and styles directories
- Service layer separate from route handlers
- Test files colocated with implementation

### Test Framework & Standards

**Frontend Testing:**
- Jest 30.2.0 with React Testing Library
- Component testing with accessibility validation
- Mock service responses for isolated testing
- Performance testing for responsive behavior

**Backend Testing:**
- Jest 30.2.0 with Supertest for API testing
- Service layer unit testing with mock dependencies
- Integration testing with real Walrus responses
- Error scenario testing and validation

**Coverage Requirements:**
- Maintain current 75% test coverage
- All new components must have corresponding tests
- Critical paths (verification links, status updates) require 100% coverage

---

## Implementation Stack

**Frontend:**
- Runtime: Node.js 20.x
- Framework: React 18.2.0 with TypeScript 5.3.3
- Build: Vite 5.0.0
- Styling: CSS custom properties with mobile-first design
- Testing: Jest 30.2.0 with React Testing Library

**Backend:**
- Runtime: Node.js 20.x
- Framework: Express 4.18.2 with TypeScript 5.3.3
- Blockchain: @mysten/walrus 0.8.4, @mysten/sui 1.45.0
- Logging: Winston 3.18.3
- Testing: Jest 30.2.0 with Supertest

**Development:**
- Linting: ESLint 8.56.0 with TypeScript rules
- Formatting: Prettier (existing configuration)
- Git: Conventional commits pattern
- CI/CD: Existing GitHub Actions workflow

---

## Technical Details

**Component Architecture:**
- ProofCard component displays single action proof with retro styling
- ProofCardGallery manages multiple cards with filtering and search
- useProofData hook handles data fetching and error states
- Type-safe interfaces for all proof data structures

**API Design:**
- GET /api/proof/:actionId - Retrieve single proof card
- GET /api/proof/player/:playerId - Get player's proof cards
- Response includes verification links, status, timestamps
- Error handling follows existing Express middleware patterns

**Blockchain Integration:**
- Uses existing VerificationService.getVerificationLink() for links
- Leverages WalrusStorageService.readBlob() for action data
- Status tracking through VerificationService verification cache
- No additional blockchain operations required

**Security Considerations:**
- Input validation on all API endpoints
- Rate limiting following existing patterns
- No sensitive data exposed in verification links
- CSRF protection through existing middleware

**Performance Considerations:**
- Lazy loading of proof cards in gallery view
- Memoization of verification status checks
- Efficient CSS animations using GPU acceleration
- Responsive image sizing for mobile bandwidth

---

## Development Setup

**Prerequisites:**
- Node.js 20.x installed
- Git repository cloned and Story 5.1 completed
- Development environment configured with existing .env variables

**Setup Commands:**
```bash
# Clone and navigate to project
git clone <repository-url>
cd sagasaga-backend

# Install dependencies (both client and server)
cd server && npm install
cd ../client && npm install

# Configure environment (existing from Story 5.1)
cp server/.env.example server/.env
# Edit .env with WALRUS_AUTH_TOKEN, SUI_NETWORK, DEVELOPER_PRIVATE_KEY

# Start development servers
cd server && npm run dev    # Backend on port 3001
cd client && npm run dev    # Frontend on port 5173
```

**Verification:**
- Backend health check: http://localhost:3001/health
- Frontend application: http://localhost:5173
- Walrus services: Test action recording from Story 5.1

---

## Implementation Guide

### Setup Steps

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/proof-card-generation
   git pull origin dev
   ```

2. **Verify Story 5.1 Integration**
   - Confirm Walrus services working
   - Test action recording endpoints
   - Verify blockchain storage functioning

3. **Set Up Development Environment**
   - Install dependencies
   - Configure environment variables
   - Start both development servers
   - Run existing test suite

4. **Review Existing Patterns**
   - Study ConsequenceCard component structure
   - Examine cascade styling patterns
   - Understand VerificationService API

### Implementation Steps

**Phase 1: Backend Foundation**
1. Create ProofCardService with VerificationService integration
2. Implement GET /api/proof/:actionId endpoint
3. Add error handling and validation
4. Write unit tests for service layer

**Phase 2: Frontend Component**
1. Create ProofCard component based on ConsequenceCard pattern
2. Implement retro styling with CSS custom properties
3. Add responsive design and accessibility features
4. Create useProofData hook for API integration

**Phase 3: Gallery and Integration**
1. Create ProofCardGallery container component
2. Add filtering and search functionality
3. Integrate with main App.tsx
4. Implement share functionality for verification links

**Phase 4: Testing and Polish**
1. Write comprehensive component tests
2. Add API integration tests
3. Verify mobile responsiveness
4. Performance optimization and accessibility validation

### Testing Strategy

**Unit Tests:**
- ProofCard component rendering with different states
- ProofCardService business logic and error handling
- useProofData hook with mock API responses
- Verification link generation and formatting

**Integration Tests:**
- End-to-end proof card creation flow
- API endpoint functionality with real services
- Error handling and recovery scenarios
- Mobile device compatibility testing

**Accessibility Tests:**
- WCAG 2.1 AAA contrast compliance
- Keyboard navigation and screen reader support
- Touch target sizing (44px minimum)
- Focus management and ARIA labels

### Acceptance Criteria

1. **Given** a player has recorded actions, **when** they view proof cards, **then** they see cards with action description and consequences
2. **Given** an action is stored on Walrus, **when** viewing its proof card, **then** it includes clickable verification link to Walrus Gateway
3. **Given** blockchain storage processing, **when** viewing proof cards, **then** cards show blockchain confirmation status and timestamp
4. **Given** retro gaming requirements, **when** proof cards display, **then** cards use retro gaming aesthetics with neon borders
5. **Given** verification functionality, **when** players interact with proof cards, **then** they can share proof links with others to demonstrate actions
6. **Given** processing states, **when** proof cards load, **then** cards display processing status and world impact summary

---

## Developer Resources

### File Paths Reference

**Frontend Files:**
- `client/src/components/proof/ProofCard.tsx` - Main proof card component
- `client/src/components/proof/ProofCardGallery.tsx` - Gallery container
- `client/src/components/proof/types/proof.ts` - TypeScript interfaces
- `client/src/components/proof/styles/proof.css` - Retro styling
- `client/src/components/proof/hooks/useProofData.ts` - Data fetching hook
- `client/src/services/proofService.ts` - API client service

**Backend Files:**
- `server/src/services/ProofCardService.ts` - Business logic service
- `server/src/routes/api/proof/index.ts` - Routes module
- `server/src/routes/api/proof/getProofCard.ts` - Single proof endpoint
- `server/src/routes/api/proof/getPlayerProofs.ts` - Player proofs endpoint

**Modified Files:**
- `client/src/App.tsx` - Add ProofCardGallery integration
- `server/src/index.ts` - Register proof routes

### Key Code Locations

**Component Pattern Reference:**
- ProofCard component: `client/src/components/cascade/ConsequenceCard.tsx:37`
- Retro styling: `client/src/components/cascade/styles/cascade.css:10-100`
- Form integration: `client/src/components/ActionInput.tsx`

**Backend Integration Points:**
- VerificationService: `server/src/services/VerificationService.ts:116`
- WalrusStorageService: `server/src/services/WalrusStorageService.ts:129`
- Route patterns: `server/src/routes/api/actions/record.ts`

### Testing Locations

**Frontend Tests:**
- Unit tests: `client/src/components/proof/__tests__/ProofCard.test.tsx`
- Hook tests: `client/src/components/proof/hooks/__tests__/useProofData.test.ts`
- Integration tests: `client/src/components/proof/__tests__/ProofCardGallery.test.tsx`

**Backend Tests:**
- Service tests: `server/src/services/__tests__/ProofCardService.test.ts`
- API tests: `server/src/routes/api/proof/__tests__/getProofCard.test.ts`
- Integration tests: `server/tests/integration/proof-cards.test.ts`

### Documentation to Update

- `client/README.md` - Add proof card component documentation
- `server/README.md` - Document new API endpoints
- `docs/api.md` - Add proof endpoints to API documentation
- `CHANGELOG.md` - Note Story 5.2 completion

---

## UX/UI Considerations

**UI Components Affected:**
- ProofCard component (new) - Main proof visualization
- ProofCardGallery component (new) - Container for multiple proofs
- App.tsx (modify) - Integration of proof gallery
- Navigation (modify) - Add access to proof gallery

**UX Flow Changes:**
- **Current Flow:** Player enters action → sees consequences → no visual proof
- **New Flow:** Player enters action → sees consequences → accesses proof gallery → sees verification cards → shares proofs

**Visual/Interaction Patterns:**
- **Follow Existing Design System:** VT323 font, neon colors, scanline effects
- **Consistency with ConsequenceCard:** Similar card structure, expand/collapse patterns
- **Responsive Design:** Mobile-first approach with 44px minimum tap targets
- **Status Indicators:** Visual confirmation of blockchain processing states

**Accessibility:**
- **Keyboard Navigation:** Tab order through verification links and controls
- **Screen Reader Support:** Comprehensive ARIA labels and semantic HTML
- **Color Contrast:** WCAG 2.1 AAA compliance with existing neon palette
- **Focus Management:** Clear focus indicators for interactive elements

**User Feedback:**
- **Loading States:** Processing indicators while verification links generate
- **Error Messages:** Clear feedback if verification fails or action not found
- **Success Confirmation:** Visual confirmation when proof cards load successfully
- **Share Feedback:** Confirmation when proof links are copied/shared

---

## Testing Approach

**Test Framework Configuration:**
- **Frontend:** Jest 30.2.0 with React Testing Library and accessibility testing
- **Backend:** Jest 30.2.0 with Supertest for API endpoint testing
- **E2E:** Manual testing of complete proof card flow
- **Performance:** Existing performance monitoring tools

**CONFORM TO EXISTING TEST STANDARDS:**
- Follow existing test file naming: *.test.tsx for components, *.test.ts for services
- Use existing test organization: __tests__ directories colocated with implementation
- Match existing assertion style: expect(...).toBe() patterns with descriptive test names
- Meet existing coverage requirements: Maintain 75% overall test coverage

**Test Strategy:**
- **Unit Tests:** Individual component rendering and service logic
- **Integration Tests:** API endpoints with real Walrus service integration
- **Accessibility Tests:** Screen reader compatibility and keyboard navigation
- **Performance Tests:** Card rendering speed and memory usage in gallery view
- **Mocking Strategy:** Mock Walrus responses for consistent testing, test error scenarios

**Coverage:**
- **Unit Test Coverage:** Target 80% for new proof components
- **Integration Coverage:** All API endpoints and error scenarios
- **Accessibility Coverage:** All interactive elements tested with screen readers
- **User Flow Coverage:** Complete proof card creation and verification process

---

## Deployment Strategy

### Deployment Steps

1. **Merge to Development Branch**
   - Pull request review and approval
   - Automated testing runs via GitHub Actions
   - Merge to dev branch for integration testing

2. **CI/CD Pipeline**
   - Automated build and test execution
   - TypeScript compilation verification
   - Bundle size analysis and performance regression checks

3. **Staging Deployment**
   - Deploy to staging environment for QA testing
   - Verify Walrus integration in staging
   - Test proof card functionality end-to-end

4. **Production Deployment**
   - Merge to main branch
   - Deploy to production with zero downtime
   - Monitor blockchain integration and verification links

### Rollback Plan

1. **Immediate Rollback**
   - Revert deployment commit if critical issues detected
   - Restore previous version from tagged release
   - Verify rollback successful with health checks

2. **Database Rollback**
   - No database changes required for this feature
   - Walrus storage is immutable, no rollback needed
   - Service configuration restored via deployment

3. **Monitoring and Validation**
   - Check API endpoint responses post-rollback
   - Verify existing functionality still working
   - Monitor error rates and performance metrics

### Monitoring

**Error Monitoring:**
- Track proof card generation failures
- Monitor Walrus verification link accessibility
- Alert on API endpoint error rate spikes

**Performance Monitoring:**
- Proof card loading times and API response times
- Gallery view performance with multiple cards
- Mobile device performance and memory usage

**User Experience Monitoring:**
- Proof card interaction rates and share functionality usage
- Verification link click-through rates
- Error reports from blockchain integration

**Business Metrics:**
- Player engagement with proof cards
- Share functionality usage for demonstrating blockchain features
- Success rates for proof card generation and verification