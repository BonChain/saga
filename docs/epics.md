# Epic Breakdown: SuiSaga - Living World Blockchain Game

**Author:** Tenny
**Date:** November 14, 2025
**Project Level:** Hackathon MVP with Full Product Vision
**Total Epics:** 8 | Total Stories:** 28
**Development Context:** 3-day hackathon build with unlimited agency + AI consequences innovation

---

## Epic Overview

This document transforms SuiSaga's vision of unlimited player agency with AI-generated unexpected events into implementable development stories. Each epic delivers vertical slices of functionality that showcase the core innovation: seamless multiplayer RPG where players can attempt any action and discover AI-generated consequences.

**Core Innovation Vision:**
- **Unlimited Agency:** Players input any action they can imagine ("burn the tavern and marry the dragon")
- **AI-Generated Unexpected Events:** Creates addictive "what if" curiosity loops
- **Deep Character Relationships:** NPCs remember everything, form real opinions, develop relationships
- **Seamless Multiplayer:** Living world where collective actions create emergent narratives

**Epic Structure:**

**Epic 1: Foundation & Infrastructure** - Technical foundation with 3-layer Walrus architecture
**Epic 2: Unlimited Action Input System** - Natural language action input and confirmation
**Epic 3: AI-Driven World Logic Engine** - Consequence generation and butterfly effects
**Epic 4: Living Character System** - NPCs with genuine memories and relationships
**Epic 5: Blockchain Proof & Verification** - Immutable action recording and proof cards
**Epic 6: Asynchronous Multiplayer Coordination** - Multi-device world interaction
**Epic 7: Combat & World Interaction** - Dragon combat with world-changing triggers
**Epic 8: Retro Gaming Interface & Demo Experience** - Polished hackathon demonstration

**Sequencing Rationale:**
- Epic 1 establishes foundation enabling all subsequent work
- Epic 2 enables the core unlimited agency innovation
- Epic 3 implements the AI consequence engine
- Epics 4-7 add living world features and multiplayer
- Epic 8 ensures hackathon demonstration success

---

## Epic 1: Foundation & Infrastructure

**Goal:** Establish technical foundation for living world architecture with 3-layer Walrus system, Express backend, and React frontend.

### Story 1.1: Project Setup & Build System

As a developer, I want a properly structured project with build automation, so that I can develop efficiently and deploy reliably.

**Acceptance Criteria:**
Given a fresh development environment,
When I run the setup script,
Then the project structure is created with separate client/, server/, and contract/ directories
And the Vite build system is configured for the React frontend
And the Express TypeScript server is configured with nodemon
And all dependencies are installed and versions are locked
And the build completes without errors
And development servers start on their configured ports (5173 for frontend, 3001 for backend)

**Prerequisites:** None

**Technical Notes:**
- Use separate package.json files for client/server/contract
- Configure TypeScript with strict mode enabled
- Set up ESLint and Prettier for code consistency
- Add basic health check endpoint at /health
- Include README with development setup instructions

---

### Story 1.2: 3-Layer Walrus Architecture

As a system, I want a 3-layer storage architecture for world persistence, so that actions, rules, and state are properly separated and verifiable.

**Acceptance Criteria:**
Given the Express server is running,
When I initialize the world storage system,
Then Layer 1 (Blueprint) creates immutable world rules and butterfly effect logic in world_rules.json
And Layer 2 (Queue) creates individual action files in action_*.json format (one per action)
And Layer 3 (State) creates versioned world state shards in state_*_vN.json files
And all layers communicate through consistent interfaces
And the system can write and read from each layer independently
And data integrity is maintained across all layers

**Prerequisites:** Story 1.1

**Technical Notes:**
- Implement storage interfaces for each layer
- Add retry logic for Walrus storage operations
- Include backup local storage for demo reliability
- Create validation functions for data consistency
- Add logging for all storage operations

---

### Story 1.3: Basic World State Management

As a player, I want the world to have a persistent state that remembers all changes, so that my actions have lasting meaning.

**Acceptance Criteria:**
Given the 3-layer architecture is implemented,
When I query the current world state,
Then I can see the status of village, lair, and forest regions
And the world state includes character locations, relationships, and environmental conditions
And the state persists across server restarts
And I can access the complete history of world state changes
And the state updates are atomic and consistent

**Prerequisites:** Story 1.2

**Technical Notes:**
- Define WorldState interface with region-specific properties
- Implement state transition functions
- Add state validation before applying changes
- Create world state initialization with default values
- Include state rollback capability for testing

---

## Epic 2: Unlimited Action Input System

**Goal:** Enable players to input any action they can imagine using natural language and receive immediate confirmation.

### Story 2.1: Natural Language Action Input

As a player, I want to type any action I can think of in plain English, so that I can attempt unlimited behaviors in the world.

**Acceptance Criteria:**
Given I'm in the game interface,
When I type "I want to burn down the village tavern and marry the dragon" in the action input,
Then the system accepts my free-text input without validation errors
And the input field supports up to 500 characters
And I get immediate visual feedback that my action was received
And the interface provides helpful examples of possible actions
And I can enter actions like "befriend the goblin king" or "cast a spell to make it rain"

**Prerequisites:** Epic 1.3

**Technical Notes:**
- Implement multi-line text input with character counter
- Add input sanitization and basic validation
- Include action history and suggested actions
- Design responsive input interface for mobile
- Add loading states for action processing

---

### Story 2.2: Intent Parsing & Action Creation

As a system, I want to understand player intent from natural language, so that I can process actions meaningfully.

**Acceptance Criteria:**
Given a player submits an action like "attack the dragon with my sword",
When the system processes the intent,
Then it extracts the action type (combat), target (dragon), and method (sword)
And it creates a structured Action object with intent, timestamp, and player ID
And it validates that the action is logically possible within world rules
And it handles ambiguous or unclear intents with clarification prompts
And it saves the action to Layer 2 storage with unique ID

**Prerequisites:** Story 2.1

**Technical Notes:**
- Implement intent parsing using keyword matching and pattern recognition
- Create Action interface with intent, parameters, and metadata
- Add action validation against current world state
- Include confidence scoring for intent extraction
- Handle edge cases and malformed inputs gracefully

---

### Story 2.3: Immediate Action Confirmation

As a player, I want instant confirmation that my action was recorded, so that I feel my input mattered and the system is working.

**Acceptance Criteria:**
Given I've submitted an action,
When the system processes my input,
Then I receive confirmation within 1 second showing my action was recorded
And I see a unique action ID for tracking my request
And I get a message like "Action received! Processing world changes..."
And I can see my action in the recent actions list
And the confirmation includes the timestamp and action description
And I know the AI is working on consequences in the background

**Prerequisites:** Story 2.2

**Technical Notes:**
- Implement synchronous action recording with immediate response
- Create unique action IDs using UUID generation
- Add action status tracking (received, processing, completed)
- Design confirmation UI with clear visual feedback
- Include action metadata for user reference

---

## Epic 3: AI-Driven World Logic Engine

**Goal:** Create AI system that generates coherent, surprising consequences while maintaining logical world consistency.

### Story 3.1: OpenAI Integration & Prompt Templates

As a system, I want to integrate with OpenAI API using specialized prompts, so that I can generate intelligent world responses.

**Acceptance Criteria:**
Given an action has been parsed and recorded,
When the AI engine processes the action,
Then it connects to OpenAI GPT-3.5-turbo with proper authentication
And it uses world-specific prompt templates for context understanding
And it includes current world state, character relationships, and location context
And it handles API rate limits and quotas gracefully
And it implements retry logic for failed API calls
And it respects the MAX_API_CALLS safety mechanism

**Prerequisites:** Story 2.3

**Technical Notes:**
- Implement OpenAI client with proper error handling
- Create prompt templates for world logic analysis
- Add API key management and security
- Include usage tracking and cost controls
- Design prompt engineering for consistent output

---

### Story 3.2: Consequence Generation & World Changes

As a system, I want to generate logical, surprising consequences from player actions, so that the world feels alive and unpredictable.

**Acceptance Criteria:**
Given the AI has analyzed player intent and world context,
When it generates consequences,
Then the changes are logical within the world's established rules
And the consequences create interesting cascading effects across multiple systems
And the results are surprising but coherent within world logic
And the changes affect character relationships, environment, and future possibilities
And the consequences are stored as structured data for world state updates
And each action generates 2-4 related consequences for richness

**Prerequisites:** Story 3.1

**Technical Notes:**
- Implement consequence parsing from AI responses
- Create structured consequence data models
- Add consequence validation against world rules
- Design cascading effect calculation system
- Include consequence prioritization and filtering

---

### Story 3.3: Butterfly Effect Calculation

As a player, I want to see how my actions ripple through the world, so that I understand the impact of my choices.

**Acceptance Criteria:**
Given a consequence has been generated,
When the system calculates butterfly effects,
Then it identifies related world systems that will be affected
And it calculates secondary effects on character relationships and environment
And it creates a visual map showing cause-and-effect relationships
And the effects persist across multiple world regions and time periods
And players can discover effects created by other players
And the butterfly effects create emergent gameplay opportunities

**Prerequisites:** Story 3.2

**Technical Notes:**
- Implement effect propagation algorithm
- Create relationship mapping between world systems
- Design visualization data structures for cascade diagrams
- Add effect tracking and historical analysis
- Include effect intensity and duration calculations

---

## Epic 4: Living Character System

**Goal:** NPCs with genuine memories, relationships, and emotional responses to player actions.

### Story 4.1: Character Memory & Relationship Tracking

As a character, I want to remember every interaction with players and other characters, so that I can develop authentic relationships and respond appropriately.

**Acceptance Criteria:**
Given players interact with NPCs in the world,
When those interactions occur,
Then each NPC maintains a complete memory of all player actions affecting them
And NPCs track relationship scores (friendship, hostility, loyalty) with each player
And NPCs develop relationships with other NPCs based on shared experiences
And character memories influence future dialogue and behavior
And relationship changes are permanent and visible to players
And characters have distinct personalities that affect their responses

**Prerequisites:** Epic 3.3

**Technical Notes:**
- Implement Character interface with memories and relationships
- Create relationship scoring system with multiple dimensions
- Add memory persistence in world state storage
- Design personality traits affecting behavior
- Include relationship visualization for players

---

### Story 4.2: Dynamic Dialogue Generation

As a player, I want NPCs to say things that reflect their unique experiences with me and the world, so that conversations feel authentic and meaningful.

**Acceptance Criteria:**
Given I talk to an NPC who remembers my past actions,
When the character responds,
Then their dialogue references specific shared experiences and history
And their emotional tone reflects our current relationship status
And they mention other characters and world events they've experienced
And their dialogue stays consistent with their established personality
And they have unique things to say based on recent world changes
And I can build genuine connections through repeated interactions

**Prerequisites:** Story 4.1

**Technical Notes:**
- Implement AI-driven dialogue generation with character context
- Create dialogue templates reflecting relationship states
- Add emotional tone analysis and response
- Design memory-based conversation topics
- Include dialogue consistency checking

---

## Epic 5: Blockchain Proof & Verification

**Goal:** Immutable action recording with blockchain verification creating authentic digital legacies.

### Story 5.1: Action Recording & Walrus Integration

As a system, I want to record every player action on blockchain storage, so that all world changes are permanently verifiable.

**Acceptance Criteria:**
Given a player action has been processed with consequences,
When the action is recorded to blockchain,
Then the complete action data (intent, consequences, timestamp, player ID) is stored on Walrus
And the action receives a unique blockchain verification link
And the storage is immutable and tamper-proof
And the recording includes cryptographic proof of authenticity
And the system handles storage errors gracefully with retry logic
And the action is accessible through Walrus Gateway for verification

**Prerequisites:** Epic 1.2

**Technical Notes:**
- Implement Walrus storage client with authentication
- Create action serialization for blockchain storage
- Add cryptographic hashing for verification
- Include storage status tracking and confirmation
- Design error handling and recovery procedures

---

### Story 5.2: Proof Card Generation & Display

As a player, I want to see visual proof cards showing my actions are permanently recorded, so that I have tangible evidence of my impact on the world.

**Acceptance Criteria:**
Given my action has been recorded on blockchain,
When I view my action history,
Then I see proof cards with action description and consequences
And each card includes a clickable verification link to Walrus Gateway
And the cards show blockchain confirmation status and timestamp
And the cards use retro gaming aesthetics with neon borders
And I can share proof links with others to demonstrate my actions
And the cards display processing status and world impact summary

**Prerequisites:** Story 5.1

**Technical Notes:**
- Design ProofCard component with blockchain data
- Implement verification link generation
- Add visual status indicators (processing, confirmed, verified)
- Create share functionality for proof links
- Include retro gaming styling and animations

---

### Story 5.3: Demo Reliability & Fallback Systems

As a presenter, I want backup systems ensuring the demo works even if blockchain or AI services fail, so that hackathon success is guaranteed.

**Acceptance Criteria:**
Given I'm demonstrating the system during hackathon presentation,
When technical issues occur with external services,
Then the system automatically switches to cached responses for AI processing
And backup video plays if live demo fails completely
And pre-recorded proof links demonstrate blockchain verification
And the interface continues functioning with local data storage
And all critical demo flows work without internet dependency
And emergency mode provides complete functionality for presentation

**Prerequisites:** Story 5.2

**Technical Notes:**
- Implement cached response library for common actions
- Create offline mode with local fallback data
- Add automatic service failure detection
- Design emergency mode UI indicators
- Include pre-recorded demo video integration

---

## Epic 6: Asynchronous Multiplayer Coordination

**Goal:** Multiple players affecting shared world without real-time coordination requirements.

### Story 6.1: Real-Time Activity Monitoring

As a player, I want to see what other players are doing in the world, so that I feel part of a living, evolving community.

**Acceptance Criteria:**
Given I'm playing the game,
When other players take actions,
Then I see real-time updates showing their activities in an activity feed
And I can filter activities by region, player, or action type
And the updates appear within 1 second of action completion
And I can click on activities to see detailed consequences
And the feed shows the most recent 50 activities
And I can discover interesting world changes created by others

**Prerequisites:** Epic 3.3

**Technical Notes:**
- Implement WebSocket or Server-Sent Events for real-time updates
- Create ActivityFeed component with filtering
- Add activity pagination and search functionality
- Design activity detail views with consequence information
- Include activity subscription and notification systems

---

### Story 6.2: Conflict Resolution & Sequential Processing

As a system, I want to process multiple player actions without conflicts, so that world state remains consistent and logical.

**Acceptance Criteria:**
Given multiple players submit actions simultaneously,
When the system processes these actions,
Then each action is processed sequentially to prevent conflicts
And the system maintains a queue of pending actions with priority ordering
And conflicting actions are resolved using established world rules
And players receive notifications when their actions affect others
And the processing order is based on submission timestamp
And world state remains consistent throughout processing

**Prerequisites:** Story 6.1

**Technical Notes:**
- Implement action queue with priority and ordering
- Create conflict detection and resolution logic
- Add action dependency tracking
- Design processing status communication
- Include rollback capabilities for failed actions

---

### Story 6.3: Offline World Evolution

As a player, I want the world to continue evolving even when I'm offline, so that I return to discover new changes created by others.

**Acceptance Criteria:**
Given I'm logged out of the game,
When other players continue taking actions,
Then the world state continues updating based on their actions
And character relationships evolve even in my absence
And new world events and opportunities are created by other players
And I can review everything that happened while I was gone
And the world shows clear evidence of collective player activity
And I receive notifications about actions that affect my interests

**Prerequisites:** Story 6.2

**Technical Notes:**
- Implement background processing for offline world evolution
- Create world change notification system
- Add offline activity summarization
- Design return experience with world state highlights
- Include persistent world simulation running 24/7

---

## Epic 7: Combat & World Interaction

**Goal:** Basic dragon combat and world-changing triggers demonstrating the living world concept.

### Story 7.1: Dragon Combat Mechanics

As a player, I want to engage in combat with dragons using various strategies, so that I can experience challenging interactions with meaningful consequences.

**Acceptance Criteria:**
Given I encounter a dragon in the world,
When I choose to attack,
Then I can select from different combat approaches (aggressive, defensive, diplomatic)
And the combat uses simple HP/damage calculations with clear outcomes
And dragons have individual personalities affecting their responses
And combat results trigger significant world changes and cascading effects
And I can befriend dragons instead of fighting them through diplomacy
And combat outcomes affect character relationships and world state

**Prerequisites:** Epic 4.2

**Technical Notes:**
- Implement Combat system with HP, damage, and strategy options
- Create Dragon AI with personality-driven responses
- Add combat outcome calculation and world triggers
- Design combat interface with clear feedback
- Include relationship-based combat alternatives

---

### Story 7.2: World-Change Triggers

As a system, I want combat victories and failures to trigger significant world changes, so that player actions have visible, lasting impact.

**Acceptance Criteria:**
Given a player defeats a dragon in combat,
When the combat concludes,
Then the dragon's death triggers cascading world changes across regions
And nearby villagers celebrate and the economy improves
And new opportunities open up for all players in the area
And character relationships evolve based on the outcome
And the world permanently remembers the heroic victory
And future players discover the consequences of this action

**Prerequisites:** Story 7.1

**Technical Notes:**
- Implement world change trigger system
- Create cascading effect calculation for major events
- Design regional impact propagation
- Add historical recording of significant events
- Include discovery mechanics for future players

---

## Epic 8: Retro Gaming Interface & Demo Experience

**Goal:** Polished hackathon demonstration interface with retro gaming aesthetics and reliable demo flow.

### Story 8.1: Retro Gaming UI Design

As a player, I want an arcade-style interface with high-contrast retro aesthetics, so that the game feels nostalgic and professional for hackathon demonstration.

**Acceptance Criteria:**
Given I'm using the game interface,
When I view the UI,
Then the design uses VT323 and Roboto Mono fonts for terminal aesthetics
And color scheme features dark backgrounds with neon green/cyan/pink accents
And interactive elements have glowing effects and pixel borders
And scanline effects simulate CRT monitor appearance
And all text meets WCAG 2.1 AAA contrast requirements
And the interface works seamlessly on desktop (1024px+) and mobile (320px+)

**Prerequisites:** Epic 2.3

**Technical Notes:**
- Implement retro design system with CSS custom properties
- Create consistent component library with retro styling
- Add scanline and glow effects using CSS animations
- Design responsive layouts for all screen sizes
- Include accessibility features with retro aesthetics

---

### Story 8.2: Cascade Visualization Engine

As a player, I want to see visual diagrams showing how my actions create ripple effects through the world, so that I understand the living world mechanics.

**Acceptance Criteria:**
Given my action has been processed with consequences,
When I view the cascade visualization,
Then I see an animated diagram showing cause-and-effect relationships
And the visualization connects my action to direct consequences and butterfly effects
And related world systems are color-coded and clearly labeled
And I can interact with the diagram to explore detailed consequences
And the visualization updates in real-time as new effects emerge
And the retro styling makes it visually appealing for demo presentation

**Prerequisites:** Epic 3.3

**Technical Notes:**
- Implement cascade visualization component with D3.js or similar
- Create animated connection lines and node positioning
- Add interactive hover states and detail views
- Design real-time update system for live effects
- Include retro styling with neon effects and animations

---

### Story 8.3: Demo Flow & Presentation Mode

As a presenter, I want a polished demo experience that showcases all innovations within 5 minutes, so that hackathon judges understand the complete concept quickly.

**Acceptance Criteria:**
Given I'm presenting to hackathon judges,
When I run the demo flow,
Then the complete innovation story is told within 5 minutes
And the demo showcases unlimited player agency with surprising AI consequences
And multi-device coordination proves scalability without technical failures
And blockchain verification links demonstrate permanent impact
And backup systems ensure 100% reliability during presentation
And judges understand core innovation within 2 minutes

**Prerequisites:** Story 8.2

**Technical Notes:**
- Design scripted demo flow with clear narrative
- Create presenter mode with optimized interface
- Add multi-device synchronization for demonstration
- Implement emergency backup systems and offline mode
- Include presenter notes and timing guides

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Players initiate world-changing actions | Epic 2 | 2.1, 2.2 |
| FR2 | Players receive immediate confirmation | Epic 2 | 2.3 |
| FR3 | Players view blockchain verification links | Epic 5 | 5.1, 5.2 |
| FR4 | Players see cascade diagrams | Epic 8 | 8.2 |
| FR5 | Players observe real-time multi-user activity | Epic 6 | 6.1 |
| FR6 | Multiple players affect shared world without coordination | Epic 6 | 6.2, 6.3 |
| FR7 | Players discover actions others created | Epic 6 | 6.1 |
| FR8 | Players contribute without simultaneous participation | Epic 6 | 6.3 |
| FR9 | Players build persistent reputation | Epic 4 | 4.1 |
| FR10 | Players experience offline world evolution | Epic 6 | 6.3 |
| FR11 | Players engage in basic combat with entities | Epic 7 | 7.1 |
| FR12 | Players trigger world-changing events through combat | Epic 7 | 7.2 |
| FR13 | Players observe UI feedback during AI processing | Epic 2 | 2.3 |
| FR14 | Players return to see world results from previous sessions | Epic 6 | 6.3 |
| FR15 | Players experience butterfly effects | Epic 3 | 3.3 |
| FR16 | Players interact with persistent world state | Epic 1 | 1.3 |
| FR17 | Players navigate between different world areas | Epic 1 | 1.3 |
| FR18 | Players observe world rules and cause-effect relationships | Epic 3 | 3.2 |
| FR19 | Players experience intelligent world responses | Epic 4 | 4.2 |
| FR20 | Players verify logical rule processing | Epic 3 | 3.2 |
| FR21 | Players access simple, clean interface | Epic 8 | 8.1 |
| FR22 | Players view visual proof cards | Epic 5 | 5.2 |
| FR23 | Players understand world impact through visual feedback | Epic 8 | 8.2 |
| FR24 | Players navigate demo within hackathon constraints | Epic 8 | 8.3 |
| FR25 | Players access fallback systems for reliability | Epic 5 | 5.3 |

**Total FR Coverage:** 25/25 (100%) ✅

---

## Implementation Strategy

### Development Sequencing

**Phase 1 (Foundation):** Epic 1 → Epic 2 → Epic 8.1
**Phase 2 (Core Logic):** Epic 3 → Epic 5 → Epic 8.2
**Phase 3 (Living World):** Epic 4 → Epic 6 → Epic 7 → Epic 8.3

### Risk Mitigation

- **AI Dependency:** Epic 5.3 provides comprehensive fallback systems
- **Demo Reliability:** Epic 8.3 ensures presentation success under all conditions
- **Technical Complexity:** Epic 1 establishes solid foundation before complex features
- **Integration Challenges:** Each epic delivers independent value

### Story Sizing

All stories are designed for single-session completion by one development agent:
- **Small Stories (1-3 hours):** UI components, basic integrations
- **Medium Stories (3-6 hours):** Core logic, AI integration, combat system
- **Large Stories (6-8 hours):** Multiplayer coordination, demo flow

---

## Next Steps in BMad Method

1. **UX Design Workflow** (Already Complete): Adds interaction details to stories
2. **Architecture Workflow** (Already Complete): Adds technical implementation details
3. **Phase 4 Implementation:** Stories ready for context assembly and development

Each story will pull context from: PRD (why) + epics.md (what/how) + UX Design (interactions) + Architecture (technical).

---

*This epic breakdown transforms SuiSaga's ambitious vision of unlimited player agency + AI consequences into actionable development stories. Each story is vertically sliced, independently valuable, and sized for hackathon development while building toward the complete living world experience.*
