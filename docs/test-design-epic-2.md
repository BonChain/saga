# Test Design: Epic 2 - Unlimited Action Input System

**Generated:** 2025-11-15
**Project:** SuiSaga - Living World Blockchain Game
**Epic:** Epic 2: Unlimited Action Input System
**Mode:** Epic-Level (Phase 4 Implementation)
**Test Architect:** Murat

---

## Executive Summary

Epic 2 delivers the core innovation of SuiSaga: **unlimited player agency** through natural language action input with AI-driven consequence generation. This test design addresses the unique challenges of natural language processing, intent parsing, and real-time world state modification in a multiplayer blockchain environment.

**Critical Focus:** Risk-based testing of injection attacks, intent parsing accuracy, and performance requirements essential for hackathon success.

---

## Risk Assessment Matrix

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation Strategy | Owner |
|---------|----------|-------------|-------------|--------|-------|-------------------|-------|
| **R-001** | **SEC** | Injection attacks in natural language input (SQL, XSS, command injection) | 2 | 3 | **6** | Input sanitization, whitelist validation, parameterized queries, security test automation | Backend |
| **R-002** | **TECH** | Intent parsing accuracy <70% leading to wrong world state changes | 3 | 3 | **9** | Comprehensive test scenarios, confidence thresholds, fallback mechanisms, human review triggers | Backend |
| **R-003** | **PERF** | Action processing latency >15s breaking hackathon demo requirements | 2 | 3 | **6** | Async processing, timeout enforcement, progress indicators, queue monitoring, performance tests | Backend |
| **R-004** | **DATA** | Concurrent action conflicts causing world state corruption | 2 | 3 | **6** | Action queuing, state versioning, conflict resolution algorithms, atomic operations tests | Backend |
| **R-005** | **BUS** | Player frustration when actions produce unexpected/inappropriate results | 3 | 2 | **6** | Intent confirmation, action preview, rollback capabilities, user experience testing | Frontend |
| **R-006** | **OPS** | Natural language processing service failures (OpenAI downtime) | 2 | 2 | **4** | Fallback responses, cached intents, graceful degradation, service monitoring | Backend |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation |
|---------|----------|-------------|-------------|--------|-------|------------|
| R-007 | PERF | UI responsiveness during natural language input | 2 | 2 | 4 | Debounced input, loading states, performance monitoring |
| R-008 | TECH | Character limit bypass attacks | 1 | 3 | 3 | Server-side validation, length enforcement in multiple layers |
| R-009 | DATA | Action queue overflow under high load | 1 | 3 | 3 | Queue capacity monitoring, backpressure handling, alerting |

---

## Test Levels Strategy

### Recommended Test Distribution

**Architecture Analysis:** React Frontend + Express Backend + Natural Language Processing + 3-Layer Walrus Storage

- **Unit Tests: 40%** (35 tests)
  - **Rationale:** Complex business logic in intent parsing, input sanitization, and action processing
  - **Focus:** Pure functions, algorithms, edge cases, error handling
  - **Tools:** Jest/Vitest, in-memory test doubles

- **API Tests: 35%** (30 tests)
  - **Rationale:** Critical integration points between frontend, backend, and storage systems
  - **Focus:** Endpoint contracts, action queue processing, storage integration, error flows
  - **Tools:** Playwright API testing, Express test server, test databases

- **Component Tests: 15%** (13 tests)
  - **Rationale:** React UI components with complex interactions and visual feedback
  - **Focus:** Input validation, character counting, loading states, error displays
  - **Tools:** Playwright Component Testing, React Testing Library

- **E2E Tests: 10%** (9 tests)
  - **Rationale:** Critical user journeys and system integration validation
  - **Focus:** Action input → confirmation → world state change, cross-system flows
  - **Tools:** Playwright E2E, real browsers, test environments

---

## Comprehensive Test Coverage Plan

### Story 2.1: Natural Language Action Input (COMPLETED - Retroactive Coverage)

#### Acceptance Criteria Coverage

**AC 1: System accepts free-text input without validation errors**
```
Component Tests (3):
  ✓ Renders ActionInput component with initial state
  ✓ Handles multi-line text input correctly
  ✓ Maintains input state during user typing

Unit Tests (2):
  ✓ Input sanitization removes malicious characters
  ✓ Validation handles empty and whitespace-only inputs
```

**AC 2: Input field supports up to 500 characters**
```
Unit Tests (2):
  ✓ Enforces 500 character limit
  ✓ Truncates input at exact boundary (500 chars)

Component Tests (3):
  ✓ Character counter updates in real-time
  ✓ Visual warnings at 400+ characters
  ✓ Submit button disabled at 500+ characters

API Tests (2):
  ✓ Backend enforces 500 character limit
  ✓ Returns proper error for oversized inputs
```

**AC 3: Immediate visual feedback that action was received**
```
Component Tests (4):
  ✓ Shows loading state during submission
  ✓ Displays success confirmation with action ID
  ✓ Shows error messages for failed submissions
  ✓ Maintains feedback for 3 seconds then clears

E2E Tests (2):
  ✓ Complete submission flow with confirmation
  ✓ Error flow recovery and retry functionality
```

**AC 4: Interface provides helpful examples of possible actions**
```
Component Tests (2):
  ✓ Example action buttons populate input field
  ✓ Examples update when clicked, maintain cursor position

UX Tests (1):
  ✓ Examples are contextually relevant to game world
```

**AC 5: Can enter actions like 'befriend the goblin king' or 'cast a spell to make it rain'**
```
API Tests (5):
  ✓ Accepts simple actions ("befriend the goblin king")
  ✓ Accepts complex actions ("cast a spell to make it rain")
  ✓ Accepts creative actions ("burn the tavern and marry the dragon")
  ✓ Handles punctuation and special characters
  ✓ Processes multi-sentence actions

Security Tests (3):
  ✓ Rejects SQL injection attempts
  ✓ Sanitizes XSS payload attempts
  ✓ Handles command injection prevention
```

### Story 2.2: Intent Parsing & Action Creation (NEXT - Primary Focus)

#### Core Functionality Tests

**Intent Extraction Accuracy**
```
Unit Tests (8):
  ✓ Extracts action type (combat, social, exploration, economic, creative, other)
  ✓ Identifies primary target (character, location, item)
  ✓ Determines action method (verb/action phrase)
  ✓ Handles compound actions ("attack and then flee")
  ✓ Processes ambiguous intents with confidence scoring
  ✓ Edge cases: empty input, gibberish, non-English characters
  ✓ Performance: <100ms per intent parsing
  ✓ Memory usage: <10MB for parsing operations

API Tests (4):
  ✓ POST /api/actions/parse endpoint contract
  ✓ Returns structured Action object with metadata
  ✓ Handles malformed input gracefully
  ✓ Provides confidence scores for each parsed element
```

**Action Object Creation**
```
Unit Tests (5):
  ✓ Creates Action objects with required fields
  ✓ Includes timestamp, player ID, original input
  ✓ Generates unique action IDs
  ✓ Validates action object structure
  ✓ Serializes/deserializes for storage

API Tests (3):
  ✓ Action storage in Layer 2 queue
  ✓ Action retrieval by ID
  ✓ Action listing by player/status
```

**World Logic Validation**
```
Unit Tests (6):
  ✓ Validates actions against current world state
  ✓ Checks character availability and locations
  ✓ Verifies item/object existence
  ✓ Validates action feasibility (can player do this?)
  ✓ Detects logical contradictions
  ✓ Performance: <200ms per validation

Integration Tests (3):
  ✓ World state integration checks
  ✓ Character relationship impact assessment
  ✓ Location-based action validation
```

**Edge Case Handling**
```
Unit Tests (8):
  ✓ Ambiguous intents ("do something interesting")
  ✓ Multiple possible interpretations
  ✓ Nonsensical actions ("fly to the moon")
  ✓ Impossible actions ("kill immortal being")
  ✓ Empty or whitespace-only inputs
  ✓ Extremely long inputs (already handled, but verify)
  ✓ Special characters and Unicode
  ✓ Language detection and handling

API Tests (4):
  ✓ Fallback responses for unclear intents
  ✓ Error handling for unprocessable actions
  ✓ Logging for analysis of failed parsing
  ✓ Rate limiting for parsing requests
```

### Story 2.3: Immediate Action Confirmation (FUTURE)

#### Performance and Feedback Tests

**Processing Time Requirements**
```
E2E Tests (2):
  ✓ Complete action processing <15 seconds
  ✓ Progress indicators update during processing
  ✓ Timeout handling for long-running actions

API Tests (3):
  ✓ Action queue processing throughput
  ✓ Concurrent action handling
  ✓ Processing latency monitoring
```

**Confirmation System**
```
Component Tests (2):
  ✓ Displays action confirmation with details
  ✓ Shows unique action ID and timestamp
  ✓ Links to action details/history

API Tests (2):
  ✓ Action status tracking (received, processing, completed)
  ✓ Action history retrieval by player
  ✓ Action details by ID
```

---

## Security Testing Strategy

### Injection Prevention (R-001)

**Comprehensive Security Test Suite:**

```
Security Tests (15):
  ✓ SQL Injection Prevention
    - OR 1=1 attacks in action text
    - UNION SELECT attempts
    - DROP TABLE commands
    - Comment-based injection attempts

  ✓ XSS Prevention
    - <script>alert('xss')</script> in actions
    - onerror handlers in action text
    - JavaScript URI schemes
    - HTML entity encoding validation

  ✓ Command Injection Prevention
    - ; rm -rf / attempts
    - | cat /etc/passwd attempts
    - && operation chaining
    - Backtick command substitution

  ✓ Path Traversal Prevention
    - ../../../etc/passwd attempts
    - Absolute file paths in actions
    - Directory traversal encoded variants

  ✓ NoSQL Injection Prevention
    - MongoDB operator injection
    - Array-based injection attempts
    - Document structure manipulation
```

**Security Test Execution:**
- **Tools:** Playwright with security-focused assertions
- **Environment:** Staging with real database
- **Coverage:** All input vectors, encoding variations, Unicode attacks

---

## Performance Testing Strategy

### Latency Requirements (R-003)

**Performance Test Suite:**

```
Performance Tests (k6):
  ✓ Natural Language Processing: <1s average, <5s 95th percentile
  ✓ Intent Parsing: <100ms average
  ✓ World Logic Validation: <200ms average
  ✓ End-to-End Action Processing: <15s maximum
  ✓ Concurrent Action Processing: 50 actions/minute
  ✓ Queue Throughput: 100+ actions sustained

Load Tests:
  ✓ 50 concurrent users submitting actions
  ✓ Spike testing: 10→50 users in 30 seconds
  ✓ Stress testing: 100+ concurrent actions
  ✓ Endurance testing: 1 hour sustained load
```

---

## Test Data and Tooling Strategy

### Test Data Requirements

**Natural Language Test Cases:**
- **Valid Actions:** 50+ diverse action examples
- **Invalid Actions:** 30+ malformed inputs
- **Security Test Cases:** 20+ injection attempts
- **Performance Test Data:** 1000+ action variations
- **Edge Cases:** Unicode, special characters, extreme lengths

**Mock Data Factories:**
```typescript
// Example test data factories
interface TestAction {
  playerId: string;
  originalInput: string;
  expectedIntent: ParsedIntent;
  expectedRiskLevel: 'low' | 'medium' | 'high';
}

const actionFactory = {
  validCombatAction: () => ({...}),
  ambiguousIntent: () => ({...}),
  injectionAttempt: () => ({...}),
  performanceTest: () => ({...})
};
```

### Tool Requirements

**Development Tools:**
- Jest/Vitest for unit tests
- Playwright for API and E2E tests
- k6 for performance testing
- OWASP ZAP for security scanning
- TypeScript for type-safe tests

**CI/CD Integration:**
- Automated test execution on PR
- Performance regression detection
- Security vulnerability scanning
- Coverage requirements enforcement

---

## Execution Strategy

### Phase 1: Foundation Tests (Immediate - Week 1)

**Priority:** P0 Tests Only
**Duration:** 3 days

```
Day 1:
- Unit tests for input sanitization and validation (R-001)
- Component tests for ActionInput component
- Basic API endpoint tests for action submission

Day 2:
- Unit tests for intent parsing algorithms (R-002)
- API tests for action creation and storage
- Security tests for injection prevention

Day 3:
- Performance tests for action processing latency (R-003)
- Concurrent action handling tests (R-004)
- Integration tests with world state system
```

### Phase 2: Comprehensive Coverage (Week 2)

**Priority:** P0 + P1 Tests
**Duration:** 4 days

```
Days 1-2:
- Complete unit test suite (35 tests)
- Component test coverage for all UI interactions
- API test coverage for all endpoints

Days 3-4:
- E2E test scenarios for critical user journeys
- Security test suite expansion
- Performance baseline establishment
```

### Phase 3: Quality Gates (Week 3)

**Priority:** All Tests (P0-P3)
**Duration:** 3 days

```
Days 1-2:
- P2/P3 edge case testing
- Cross-browser and mobile testing
- Accessibility compliance testing

Day 3:
- End-to-end integration testing
- Hackathon demo scenario validation
- Performance optimization and tuning
```

---

## Quality Gate Criteria

### Mandatory Gates for Epic 2 Completion

**P0 Requirements:**
- ✅ 100% P0 test pass rate
- ✅ No critical security vulnerabilities (R-001)
- ✅ Action processing <15s (R-003)
- ✅ Intent parsing accuracy >70% (R-002)
- ✅ Zero data corruption in concurrent actions (R-004)

**P1 Requirements:**
- ✅ 95% P1 test pass rate
- ✅ Test coverage ≥80% for critical paths
- ✅ Performance benchmarks met consistently
- ✅ All high-risk mitigations implemented

**P2/P3 Requirements:**
- ✅ 90% overall test pass rate
- ✅ No regression in performance
- ✅ User experience validation complete

---

## Resource Estimates

### Test Implementation Effort

**Development Effort:**
- **P0 Tests:** 15 tests × 2 hours = 30 hours
- **P1 Tests:** 20 tests × 1.5 hours = 30 hours
- **P2 Tests:** 25 tests × 1 hour = 25 hours
- **P3 Tests:** 12 tests × 0.5 hours = 6 hours
- **Security Tests:** 15 tests × 1 hour = 15 hours
- **Performance Tests:** 8 scenarios × 2 hours = 16 hours

**Total Estimated Effort:** 122 hours (~15 days)

**Resource Allocation:**
- **Backend Testing:** 60 hours (API, Unit, Security, Performance)
- **Frontend Testing:** 35 hours (Component, E2E, UX)
- **Integration Testing:** 20 hours (Cross-system, End-to-End)
- **Test Infrastructure:** 7 hours (CI/CD, Tooling Setup)

### Timeline Recommendations

**Week 1:** Foundation and P0 Tests (40 hours)
**Week 2:** P1 Tests and Security Suite (45 hours)
**Week 3:** P2/P3 Tests and Performance (37 hours)

---

## Risk Mitigation Recommendations

### Immediate Actions (Score 9 - R-002)

**Intent Parsing Accuracy Enhancement:**
1. **Implement Confidence Thresholding:** Reject intents with <70% confidence for human review
2. **Create Fallback Mechanism:** When parsing fails, request clarification from player
3. **Add Intent Preview:** Show parsed intent before final action confirmation
4. **Implement Rollback:** Ability to undo actions with incorrect intent interpretation

### Short-term Actions (Score 6 Risks)

**Security (R-001):**
1. **Input Sanitization Layer:** Multiple validation layers with strict whitelisting
2. **Security Test Automation:** Automated injection testing in CI pipeline
3. **Regular Security Audits:** Weekly security scans and penetration testing

**Performance (R-003):**
1. **Async Processing Queue:** Immediate response with background processing
2. **Timeout Enforcement:** Hard 15-second limit with progress indicators
3. **Performance Monitoring:** Real-time alerting for latency spikes

**Data Integrity (R-004):**
1. **State Versioning:** Atomic world state updates with rollback capability
2. **Action Serialization:** Prevent concurrent modification conflicts
3. **Conflict Resolution:** Deterministic rules for simultaneous actions

---

## Next Steps

### Immediate Actions (This Week)

1. **Review Risk Assessment** with development team
2. **Prioritize R-002 Mitigation** (Intent Parsing Accuracy) - CRITICAL
3. **Implement P0 Security Tests** (R-001)
4. **Set Up Performance Testing Environment** (R-003)

### Medium-term Actions (Next 2 Weeks)

1. **Execute Complete P0 Test Suite**
2. **Implement Intent Confidence Thresholding**
3. **Create Fallback Mechanisms**
4. **Set Up CI/CD Quality Gates**

### Long-term Actions (Before Hackathon)

1. **Complete All Test Levels** (P0-P3)
2. **Validate Performance Benchmarks**
3. **Security Penetration Testing**
4. **Hackathon Demo Scenario Testing**

---

## Output Summary

**Epic:** 2 (Unlimited Action Input System)
**Scope:** Full (Complete test coverage strategy)
**Design Level:** Full comprehensive test design

**Risk Assessment:**
- Total risks identified: 9
- High-priority risks (≥6): 6
- Critical risk (score 9): 1 (R-002 Intent Parsing Accuracy)
- Categories covered: TECH, SEC, PERF, DATA, BUS, OPS

**Coverage Plan:**
- P0 scenarios: 35 tests (60 hours)
- P1 scenarios: 20 tests (30 hours)
- P2/P3 scenarios: 37 tests (31 hours)
- **Total effort:** 92 tests (121 hours ~15 days)

**Test Levels:**
- Unit: 35 tests (40%) - Business logic and algorithms
- API: 30 tests (35%) - Integration and contracts
- Component: 13 tests (15%) - UI behavior and interactions
- E2E: 9 tests (10%) - Critical user journeys

**Quality Gate Criteria:**
- P0 pass rate: 100%
- P1 pass rate: 95%
- High-risk mitigations: 100%
- Coverage: 80% for critical paths

**Output File:** `docs/test-design-epic-2.md`

---

**Generated by:** Murat, Master Test Architect
**Date:** 2025-11-15
**Knowledge Base:** Risk Governance, Test Levels Framework, NFR Criteria, Probability-Impact Matrix
**Next Action:** Review with team and implement P0 risk mitigations immediately