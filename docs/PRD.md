# saga - Product Requirements Document

**Author:** Tenny
**Date:** November 14, 2025
**Version:** 1.0

---

## Executive Summary

SuiSaga is an AI-driven "Living World" built on Sui blockchain that fundamentally transforms multiplayer gaming through asynchronous processing, provable world history, and intelligent world responses. Unlike static games where player actions have isolated consequences, SuiSaga creates a persistent universe where thousands of players can collaboratively shape a world that evolves independently and remembers everything permanently.

### What Makes This Special

**The Living World Revolution:** SuiSaga creates a seamless multiplayer RPG experience where AI-generated unexpected events make the world feel truly alive. Unlike traditional games with predetermined outcomes, players can attempt unlimited actions - anything they can imagine - and watch as AI generates consequences that create emergent narratives no designer could predict.

**Core Innovation - Unlimited Agency + AI Consequences:**
- **Seamless Experience:** Players input any action ("I want to burn the village tavern and marry the dragon") and AI processes the intent within game logic
- **Unexpected Events:** AI generates surprising but logical consequences that create genuine "what if" curiosity loops
- **Deep Character Relationships:** NPCs remember everything, form real opinions, develop relationships with players and each other
- **Addictive Exploration:** Players constantly wonder "what happens if I do X?" leading to endless experimentation and discovery

---

## Project Classification

**Technical Type:** Multiplayer Gaming Platform with Blockchain Integration
**Domain:** Gaming & Digital Entertainment
**Complexity:** High - Innovative architecture requiring AI integration, blockchain storage, and asynchronous processing

### Domain Context

**Post-Covid Gaming Behaviors:** Modern players exhibit short-session behaviors (5-15 minutes), demand immediate meaningful impact, and seek authentic digital communities. Traditional games fail to address these behavioral shifts, creating disengagement and churn.

**Blockchain Gaming Limitations:** Current "blockchain games" are architecturally static - worlds don't meaningfully evolve, actions are temporary, and the technology serves as decoration rather than enabling fundamentally new gameplay experiences.

---

## Success Criteria

### Hackathon Success Metrics

**Innovation Demonstration:**
- Judges understand core innovation (async + AI + blockchain = living world) within 2 minutes
- "15-Second Wonder" demo flows smoothly with no technical glitches
- Multi-device coordination proves scalability potential without failure
- Proof links demonstrate blockchain integration value convincingly

**Technical Validation:**
- Async processing completes successfully within 15 seconds
- Blockchain verification links are functional and impressive
- Multi-device coordination works without conflicts
- World state persists correctly across sessions

### Player Success Metrics

**Immediate Experience:**
- 90% of players understand their action created permanent world change
- 80% of players engage with blockchain proof verification links
- Players rate 15-minute sessions as "meaningful" or "impactful"

**Long-term Engagement:**
- 60% return within 24 hours to see world evolution
- 70% explore actions other players have made
- 40% attempt actions that create permanent world changes

---

## Product Scope

### MVP Scope (Hackathon Must-Haves)

**Core Innovation Systems:**
- Action Recording & Proof Display System: Blockchain verification showing permanent player impact
- Basic Combat & Dragon Interaction: Simple HP system for narrative demo (attack dragon → world changes)
- Cascade Visualization Engine: Real-time diagrams showing butterfly effects and world responses
- Multi-Device Activity Monitor: Proves asynchronous multiplayer capability
- Simple World State Management: Foundation Layer 3 state files for village, lair, forest shards

### Growth Features (Post-Hackathon)

**Enhanced World Systems:**
- Expanded world with multiple regions and storylines
- Advanced reputation and legacy creation systems
- AI-generated quests and dynamic content
- Complex multiplayer collaboration mechanics

### Vision Features (Full Product)

**Complete Living World:**
- Thousands of concurrent players
- Player-created content and modding support
- Cross-platform accessibility and mobile optimization
- Advanced social features and community building tools

### Out of Scope for MVP

**Complex Game Mechanics:**
- Energy/time systems, weather effects, advanced NPC dialogue
- Complex inventory and equipment systems
- Multi-layered reputation systems
- Extended economic simulation

---

## Innovation Patterns

### Asynchronous Processing Innovation

**Problem Solved:** Traditional real-time multiplayer requires coordination and creates technical complexity at scale

**Solution:** Two-speed architecture where player actions are immediately confirmed but processed asynchronously, enabling thousands of concurrent players without scheduling requirements

**Validation Approach:** Demonstrate 3+ devices simultaneously affecting shared world, with each action provably recorded and processed

### Provable History Innovation

**Problem Solved:** Player achievements feel temporary and meaningless in digital worlds

**Solution:** Every action creates blockchain-verified proof cards showing permanent world impact, enabling authentic digital legacy creation

**Validation Approach:** Clickable verification links that demonstrate immutable action history on Walrus Gateway

### AI World Logic Innovation

**Problem Solved:** Worlds feel static and unresponsive to player collective behavior

**Solution:** AI fine-tuned to understand "World Logic" rather than just generate prose, creating intelligent butterfly effects and cascading world changes

**Validation Approach:** Demonstrate dragon defeat triggering coordinated village blessing, shop opening, and forest peacefulness cascade

---

## Functional Requirements

### World Action & Impact System

**FR1: Players can initiate world-changing actions that create permanent, verifiable impact**
**FR2: Players receive immediate confirmation that their action has been recorded and is being processed**
**FR3: Players can view blockchain verification links proving their actions are immutably stored**
**FR4: Players can see visual cascade diagrams showing how their actions trigger world changes**
**FR5: Players can observe real-time activity showing how multiple users affect the shared world simultaneously**

### Asynchronous Multiplayer Coordination

**FR6: Multiple players can affect shared world state without real-time coordination requirements**
**FR7: Players can discover and appreciate actions other players have created in the world**
**FR8: Players can contribute to collaborative projects without simultaneous participation**
**FR9: Players can build persistent reputation through consistent meaningful world-changing actions**
**FR10: Players can experience world evolution that occurs even when they are offline**

### Combat & World Interaction

**FR11: Players can engage in basic combat with entities using simple HP and damage systems**
**FR12: Players can trigger world-changing events through combat victories**
**FR13: Players can observe immediate UI feedback while background AI processes world changes**
**FR14: Players can return to see world results from actions taken in previous sessions**
**FR15: Players can experience butterfly effects where their actions influence multiple world systems**

### World State Management

**FR16: Players can interact with persistent world state that remembers all previous changes**
**FR17: Players can navigate between different world areas (village, lair, forest) with consistent state**
**FR18: Players can observe how world rules create logical cause-and-effect relationships**
**FR19: Players can experience world systems that respond intelligently to collective player behavior**
**FR20: Players can verify that world state changes are based on logical rule processing rather than randomness**

### User Interface & Experience

**FR21: Players can access simple, clean interface focused on demonstrating innovation rather than complex game mechanics**
**FR22: Players can view visual proof cards showing action status and blockchain verification**
**FR23: Players can understand world impact through clear visual feedback and cascade diagrams**
**FR24: Players can navigate demo experience smoothly within hackathon time constraints**
**FR25: Players can access fallback systems ensuring demo reliability even if technical issues occur**

---

## Non-Functional Requirements

### Performance Requirements

**UI Response Time:** < 100ms for hot cache queries to ensure immediate feedback
**Action Processing:** < 30 seconds end-to-end for complete world change processing
**Concurrent User Support:** MVP supports 3+ devices, architecture scales to 1,000+ concurrent players
**Success Rate:** 100% with comprehensive fallback and backup systems

### Integration Requirements

**Blockchain Integration:** Seamless Walrus storage integration for action recording and state persistence
**AI Integration:** OpenAI API integration with custom prompt templates for world logic processing
**Multi-Device Coordination:** Localhost server architecture enabling simultaneous device interaction
**Proof Verification:** Walrus Gateway integration for blockchain verification display

### Technical Constraints

**Hackathon Timeline:** Core functionality implementable within 3-day development window
**Demo Reliability:** Multiple fallback systems including pre-recorded video and cached responses
**Resource Limits:** MAX_API_CALLS safety mechanism to control costs and prevent runaway processing
**Simplicity Focus:** Interface and mechanics prioritized over complex features to ensure demo success

**Critical Risk Management:**
**AI Fine-Tuning Dependency:** The entire project hinges on AI model generating coherent, engaging world responses. Failure of AI fine-tuning could brick the project.

**Mitigation Strategy:**
- **Comprehensive Fallback System:** Pre-written logical consequence rules that activate if AI fails
- **Rule-Based Backup:** Deterministic world logic that maintains core functionality without AI
- **Progressive Enhancement:** Start with simple rules, add AI sophistication incrementally
- **Offline Demo Mode:** Complete demo functionality without requiring live AI processing
- **Cached Response Library:** Pre-generated responses for common action patterns during demo

---

## Project Type Requirements

### Gaming Platform Architecture

**Multiplayer Coordination:** Systems enabling thousands of players to affect shared world without real-time requirements
**Persistent World State:** 3-layer architecture (Rules, Actions, State) supporting permanent world evolution
**Asynchronous Processing:** Background AI processing enabling instant feedback with deep world analysis
**Blockchain Integration:** Verification systems making every player action provably permanent

### Hackathon Demonstration Focus

**Innovation Showcase:** Systems specifically designed to demonstrate unique architectural advantages
**Technical Reliability:** Comprehensive backup systems ensuring successful demo under all conditions
**Judge Communication:** Visual systems clearly communicating technical innovation to non-technical audiences
**Time Management:** Complete demonstration within standard hackathon presentation time limits

---

## Success Validation

### MVP Success Criteria

**Technical Completion:**
- ✅ Async processing completes successfully within 15 seconds
- ✅ Blockchain proof links are verifiable and functional
- ✅ Multi-device coordination works without conflicts
- ✅ World state persists correctly across sessions
- ✅ No critical crashes or technical failures during demo

**Innovation Demonstration:**
- ✅ Judges understand core innovation within 2 minutes
- ✅ "15-second wonder" showcase flows smoothly
- ✅ Butterfly effects are visible and understandable
- ✅ Multiple device coordination proves scalability potential
- ✅ Proof links demonstrate blockchain integration value

---

_This PRD captures the innovation-focused requirements for SuiSaga, prioritizing the demonstration of unique architectural advantages over traditional gaming features. The functional requirements specifically support the "Asynchronous World" innovation that enables thousands of players to create permanent, verifiable impact in living, evolving worlds._

_The requirements are designed for 3-day hackathon implementation while establishing foundation for full product development. All requirements directly support the core value proposition of creating authentic digital legacies through blockchain-verified player actions._