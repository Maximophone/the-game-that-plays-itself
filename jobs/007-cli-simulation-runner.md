# Job: CLI Simulation Runner

**Component**: cli  
**Status**: 🔴 not started

## Context

This is "The Game That Plays Itself" — our AI-driven 2D sandbox simulation.

We have a working system with:
- **Engine**: Game logic and state management
- **AI Players**: Gemini integration for agent decisions
- **Server** (current): Runs game loop with WebSocket broadcasting

**New Architecture**: We're decoupling simulation from visualization. The new flow is:

```
CLI Tool (this job)          Replay File           Web Viewer
    │                            │                      │
    ├─ Runs simulation     ──>  ├─ .json file     ──>  ├─ Visualizes
    ├─ Calls AI                 ├─ Full history         └─ Playback controls
    └─ Writes continuously      └─ Version tracked
```

This CLI tool runs simulations **standalone** (no web server required) and writes replay files that can later be visualized.

## Objective

Build a command-line interface to run autonomous game simulations.

### Core Features

1. **Configuration**: Accept CLI arguments (agent count, grid size, AI type)
2. **Game Loop**: Run continuously, calling AI and engine
3. **Replay Writing**: Write each turn to replay file in real-time
4. **Graceful Shutdown**: Handle Ctrl+C cleanly, finalize replay file
5. **Standalone**: No web server, works independently

### CLI Usage

```bash
# Basic (use defaults: 4 agents, 20x20 grid, Gemini AI)
npm run simulate

# With parameters
npm run simulate -- --agents 6 --width 30 --height 30 --turn-delay 500

# With dummy AI (for testing without API key)
npm run simulate -- --agents 4 --dummy-ai
```

### Command-Line Options

| Flag | Default | Description |
|------|---------|-------------|
| `--agents` | 4 | Number of AI agents |
| `--width` | 20 | Grid width |
| `--height` | 20 | Grid height |
| `--turn-delay` | 1000 | Milliseconds between turns |
| `--output` | `./replays` | Directory for replay files |
| `--dummy-ai` | false | Use dummy AI instead of Gemini |

### Behavior

**Startup:**
1. Parse CLI arguments
2. Generate agent identities with personalities
3. Create initial game state
4. Initialize `ReplayWriter` (from Job 006)
5. Print configuration summary

**Game Loop:**
1. Generate agent views
2. Call AI for each agent (parallel)
3. Compute next state
4. Append turn to replay file
5. Print progress: `Turn 42 | Agents: 3/4 alive`
6. Wait for turn delay
7. Repeat

**Shutdown (Ctrl+C):**
1. Catch SIGINT/SIGTERM signals
2. Call `replayWriter.finalize()`
3. Print summary (turns completed, file location)
4. Exit cleanly

**Error Handling:**
- If AI fails → retry with backoff
- If all retries fail → mark replay as 'crashed', exit
- Log errors clearly

### Files to Create

1. **`src/cli/simulate.ts`** - CLI entry point with argument parsing (use `commander` package)
2. **`src/cli/runner.ts`** - Main simulation loop logic
3. **`package.json`** - Add `"simulate": "tsc && node dist/cli/simulate.js"` script

### Console Output Example

```
[Simulation] Started
[Simulation] Config: 4 agents, 20x20 grid
[Simulation] Replay file: ./replays/replay_20260118_103045.json
[Simulation] Using Gemini AI (gemini-2.0-flash-exp)

Turn 0 | Agents: 4/4 alive
Turn 1 | Agents: 4/4 alive
Turn 2 | Agents: 4/4 alive
...
Turn 58 | Agents: 3/4 alive
^C
[Simulation] Stopped at turn 58
[Simulation] Replay saved: ./replays/replay_20260118_103045.json
```

## Files to Read

1. **`src/server/game-loop.ts`** - Current game loop logic (reuse/refactor as needed)
2. **`src/engine/index.ts`** - `createInitialState`, `computeNextState`, `generateAgentView`
3. **`src/ai-players/index.ts`** - `getAction`
4. **`src/ai-players/dummy.ts`** - `getAction` (dummy AI)
5. **`src/replay/writer.ts`** - (from Job 006) `ReplayWriter` class
6. **`src/shared/types.ts`** - Type definitions

## Acceptance Criteria

- [ ] CLI accepts configuration arguments
- [ ] Simulation runs autonomously
- [ ] Replay file written continuously during execution
- [ ] Graceful shutdown on Ctrl+C (calls `finalize()`)
- [ ] Works with both Gemini AI and dummy AI
- [ ] Console output shows turn progress
- [ ] Errors handled gracefully (crashed status in replay)
- [ ] No web server or WebSocket code
- [ ] All tests pass
- [ ] No lint errors

## Notes

**Code Reuse**: The game loop logic in `src/server/game-loop.ts` is similar to what you need. Extract shared logic if helpful, or duplicate/adapt for now.

**Dependencies**: Add `commander` package for CLI parsing:
```json
{
  "dependencies": {
    "commander": "^11.0.0"
  }
}
```

**Signal Handling**: Use Node.js process events:
```typescript
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
```

**Testing**: Create an integration test that runs a short simulation (10 turns with dummy AI) and verifies the replay file is valid.

**Future Enhancements**:
- `--max-turns <n>` to stop after N turns
- `--seed <value>` for deterministic randomness
- Progress bar instead of text output

---

## 🎯 Completion Report

_To be filled by implementer upon completion._
