# Engine Devlog

Development log for the **Engine** component — pure game logic with no side effects.

**Owner**: TBD  
**Status**: Not Started

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

### 2026-01-17 — Project Created
- Initial project setup
- Architecture defined in idea.md

---

*Add entries above this line as you work on the component.*
