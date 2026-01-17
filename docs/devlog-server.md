# Server Devlog

Development log for the **Server** component — game loop orchestration and WebSocket communication.

**Owner**: AI Developer  
**Status**: ✅ Complete

---

## Implementation Overview

Successfully implemented the server orchestration layer for "The Game That Plays Itself" simulation.

## Architecture

The server component consists of three main modules:

### 1. `src/server/index.ts` - Main Entry Point

**Responsibilities:**
- Express HTTP server setup on port 3001 (configurable via `PORT` env var)
- WebSocket server initialization
- Initial game state creation with 4 AI agents
- Game loop orchestration
- Graceful shutdown handling

**Agent Configuration:**
- **Aria**: Cooperative builder who loves to build structures and prefers cooperation
- **Rex**: Cautious survivalist focused on gathering food and resources
- **Zara**: Curious explorer who likes to interact with others
- **Nova**: Strategic and analytical agent who plans ahead

Each agent has unique ID, name, personality, random spawn position, full hunger, empty inventory, and distinct color.

### 2. `src/server/game-loop.ts` - Game Loop Logic

**Turn Sequence:**
1. Filter for alive agents only
2. Generate `AgentView` for each alive agent using `generateAgentView()`
3. Call `getAction()` for all agents **in parallel** using `Promise.all()`
4. Collect actions into `Map<AgentId, Action>`
5. Call `computeNextState()` to compute new state
6. Broadcast new state to all WebSocket clients
7. Log turn completion with statistics

**Configuration:**
- Turn duration: 5000ms (5 seconds) by default, configurable via `TURN_DURATION_MS`
- AI timeout: 30 seconds per agent

**Error Handling:**
- Failed/timeout actions default to `{ type: "wait" }`
- Errors logged but don't stop the game loop
- Game continues even if individual agents fail

### 3. `src/server/websocket.ts` - WebSocket Broadcasting

**Responsibilities:**
- Initialize WebSocket server attached to HTTP server
- Track connected clients
- Send current state to new clients immediately upon connection
- Broadcast state updates to all connected clients after each turn

**State Serialization:**
- Converts `GameState.agents` Map to plain object for JSON compatibility
- Ensures compatibility with web client

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | HTTP server port |
| `TURN_DURATION_MS` | 5000 | Milliseconds between turns |
| `GEMINI_API_KEY` | *(required)* | API key for Gemini 3.0 Flash |

## Dependencies Added

- `express@^4.18.2` - HTTP server framework
- `ws@^8.16.0` - WebSocket library
- `@types/express@^4.17.21` - TypeScript definitions
- `@types/ws@^8.5.10` - TypeScript definitions

## Key Design Decisions

1. **Parallel AI Calls**: All agents' AI calls happen in parallel using `Promise.all()` to minimize turn duration
2. **Map Serialization**: `GameState.agents` Map converted to plain object for JSON transmission
3. **Graceful Degradation**: Failed AI calls default to `wait` action to keep game running
4. **Turn Timing**: Game loop adjusts delay between turns to account for AI call duration
5. **State Broadcasting**: Current state sent to new clients immediately upon connection

## Known Limitations

1. **In-Memory Only**: Game state stored in memory only; server restart resets the game
2. **Single Game**: Only one game instance runs at a time
3. **No Persistence**: No history saved to disk or database
4. **No Client Commands**: Clients can only observe; cannot send commands

## Log

### 2026-01-17 — Server Implementation Complete

**Completed:**
- ✅ Created `src/server/index.ts` with Express and WebSocket setup
- ✅ Created `src/server/game-loop.ts` for game orchestration
- ✅ Created `src/server/websocket.ts` for state broadcasting
- ✅ Added 4 diverse AI agents with unique personalities
- ✅ Implemented parallel AI action requests
- ✅ Implemented turn-based game loop with configurable timing
- ✅ Handled Map serialization for JSON compatibility
- ✅ Added error handling and timeout protection
- ✅ Implemented dead agent filtering
- ✅ Added dependencies to `package.json`
- ✅ Fixed all TypeScript compilation errors
- ✅ Updated devlog documentation

**Testing Status:**
- Build successful with `npm run build`
- Ready for manual testing with `npm run dev`

---

*Last updated: 2026-01-17*
