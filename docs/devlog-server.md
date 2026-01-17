# Server Devlog

Development log for the **Server** component — game loop orchestration and WebSocket communication.

**Owner**: TBD  
**Status**: Not Started

---

## Responsibilities

- Run the main game loop
- Call AI Players for each agent's action (in parallel)
- Invoke Engine to compute next state
- Broadcast state updates to visualization clients via WebSocket
- Handle pause/step/speed controls

## Dependencies

- `src/shared/types.ts`
- `src/engine/` (imports engine functions)
- `src/ai-players/` (imports AI player interface)

## Log

### 2026-01-17 — Project Created
- Initial project setup
- Architecture defined in idea.md

---

*Add entries above this line as you work on the component.*
