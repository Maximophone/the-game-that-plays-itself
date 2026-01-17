# Engine Devlog

Development log for the **Engine** component — pure game logic with no side effects.

**Owner**: TBD  
**Status**: ✅ Complete

---

## Responsibilities

- Define core types (`GameState`, `Agent`, `Action`, etc.)
- Implement `computeNextState(state, actions) → newState`
- Implement `validateAction(state, agentId, action) → ValidationResult`
- Implement `generateAgentView(state, agentId) → AgentView`
- Implement `serializeStateForAgent(view) → string`

## Dependencies

- `src/shared/types.ts` (imports types)

## Log

### 2026-01-17 — Core Functions Implemented

**Files Created:**
- `helpers.ts` — Shared utilities (position calculations, cell checks, randomness)
- `state.ts` — `createInitialState()` with grid generation and resource scattering
- `validation.ts` — `validateAction()` for all 8 action types
- `actions.ts` — `computeNextState()` with simultaneous action processing
- `perception.ts` — `generateAgentView()` with vision radius filtering
- `serialize.ts` — `serializeStateForAgent()` for LLM prompt formatting
- `index.ts` — Main exports
- `engine.test.ts` — 47 test cases covering all functions

**Design Decisions:**
- Resource distribution: 10% stone, 10% wood, 5% berry bushes
- Conflict resolution: Random winner for simultaneous move/gather/build
- Berry bushes yield berries but stay in place
- Messages kept for last 10 turns, filtered by vision radius at time of speaking
- Agents start with pastel colors from a predefined palette

**Test Coverage:**
- `createInitialState`: Grid dimensions, terrain, resources, agent placement
- `validateAction`: All action types, edge cases, dead agent rejection
- `computeNextState`: Turn increment, hunger, death, all action effects, immutability
- `generateAgentView`: Self state, visible cells, agents, messages, radius filtering
- `serializeStateForAgent`: All sections, symbols, legend, actions list

---

### 2026-01-17 — Project Created
- Initial project setup
- Architecture defined in idea.md

---

*Add entries above this line as you work on the component.*

