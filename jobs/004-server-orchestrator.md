# Job: Server Orchestration

**Component**: server  
**Status**: pending

## Context

This is "The Game That Plays Itself" — a 2D sandbox simulation.
We have:
- **Engine**: Pure logic to compute next state.
- **AI Players**: Integration with Gemini to get agent actions.
- **Web**: Visualization (currently using mock data).

The **server** is the heart of the project. It runs the game loop, coordinates between the AI players and the engine, and broadcasts the state to the web client via WebSockets.

## Objective

Implement the server orchestration layer.

### 1. Set up the Server
- Create `src/server/index.ts` using Express and `ws` (WebSocket).
- The server should serve the web app at `src/web/dist` (after build) or ideally just stand alone for now.
- Keep it simple: HTTP server listening on port 3001.

### 2. Implement the Game Loop
- Create `src/server/game-loop.ts`.
- Maintain a `GameState` in memory.
- `startLoop()`: A loop that runs every N seconds (e.g., 5 seconds per turn).
- In each turn:
    1. For each alive agent, call `generateAgentView(state, agentId)` from the engine.
    2. Call `getAction(view, identity)` from `src/ai-players/` for all agents **in parallel**.
    3. Collect actions.
    4. Call `computeNextState(state, actions)` from the engine to get the new state.
    5. Broadcast the new `GameState` to all connected WebSocket clients.

### 3. Implement WebSocket Broadcasting
- Create `src/server/websocket.ts`.
- When a client connects, send them the current `GameState` immediately.
- When the state updates at the end of a turn, broadcast the new state to all connected clients.

### 4. Integration
- Connect everything in `src/server/index.ts`.
- Initialize the game state using `createInitialState()` from the engine.
- Add 3-4 agents with names and simple personalities.

## Files to Read

1. `src/shared/types.ts` — The types.
2. `idea.md` — Specifically the "Architecture" and "Server" sections.
3. `src/engine/index.ts` — Engine functions to use.
4. `src/ai-players/index.ts` — AI Player function to use.

## Acceptance Criteria

- [ ] Server starts and listens on port 3001.
- [ ] Game loop runs correctly, calling Gemini for each agent.
- [ ] State updates according to engine logic.
- [ ] WebSocket clients receive state updates every turn.
- [ ] Dead agents are handled (no turns for them).
- [ ] Updated `docs/devlog-server.md` with implementation details.

## Notes

- Use `ws` for WebSockets.
- Use `express` for the HTTP server.
- The `agents` map in `GameState` uses `AgentId` as keys.
- You'll need to handle the `Map` serialization for JSON (Maps don't serialize to JSON by default, convert to Object or entries array).
- Make sure to handle `GEMINI_API_KEY` environment variable.
