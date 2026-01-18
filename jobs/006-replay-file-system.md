# Job: Replay File System

**Component**: shared/replay  
**Status**: 🔴 not started

## Context

This is "The Game That Plays Itself" — a 2D sandbox simulation where LLM-driven agents survive, gather, build, and interact.

We have implemented:
- **Engine**: Pure game logic (state transitions, actions, validation)
- **AI Players**: Gemini integration for agent decisions
- **Server**: Game loop orchestration
- **Web**: Live game visualization with agent inspector and controls

**New Direction**: We're transitioning from live-only gameplay to a **replay system**. The simulation will run as a standalone CLI tool that writes replay files. The web UI will then visualize these replays with full playback controls (forward/backward navigation).

This job creates the **foundation**: the replay file format and I/O utilities.

## Objective

Create a robust replay file system that:
1. Defines the replay JSON format with metadata and full state snapshots
2. Implements `ReplayWriter` to write files incrementally during simulation
3. Implements `ReplayReader` to load and validate replay files
4. Tracks engine version for compatibility warnings

### Key Requirements

**File Format**: Single JSON file per simulation
```jsonc
{
  "metadata": {
    "engineVersion": "0.1.0",
    "createdAt": "2026-01-18T10:05:00Z",
    "lastUpdatedAt": "2026-01-18T10:15:30Z",
    "config": { /* GameConfig */ },
    "finalTurn": 142,
    "status": "completed"  // "running" | "completed" | "crashed"
  },
  "turns": [
    { /* GameState at turn 0 */ },
    { /* GameState at turn 1 */ },
    // ... full snapshots
  ]
}
```

**Storage**: Local filesystem in `./replays/` directory  
**Naming**: `replay_YYYYMMDD_HHMMSS.json`

### Files to Create

1. **`src/shared/replay-types.ts`** - TypeScript interfaces for replay format
2. **`src/shared/version.ts`** - Engine version constant (single source of truth)
3. **`src/replay/writer.ts`** - `ReplayWriter` class for incremental writing
4. **`src/replay/reader.ts`** - Functions to list/load replays and check compatibility
5. **`src/replay/replay.test.ts`** - Test coverage for all functionality

### ReplayWriter Class

```typescript
export class ReplayWriter {
  constructor(config: GameConfig, outputDir?: string);
  initialize(initialState: GameState): string;  // Returns file path
  appendTurn(state: GameState): void;           // Append turn to file
  finalize(): void;                              // Mark status = 'completed'
  markCrashed(error?: Error): void;             // Mark status = 'crashed'
  getFilePath(): string;                         // Get current replay path
}
```

**Behavior**:
- Atomic writes (write to `.tmp` file, then rename)
- Updates `lastUpdatedAt` and `finalTurn` on each append
- Handles errors gracefully (disk full, permissions)

### ReplayReader Functions

```typescript
export async function listReplays(dir?: string): Promise<ReplayInfo[]>;
export async function loadReplay(filePath: string): Promise<ReplayFile>;
export async function loadReplayMetadata(filePath: string): Promise<ReplayMetadata>;
export function checkCompatibility(metadata: ReplayMetadata): {
  compatible: boolean;
  warning?: string;
};
```

**Compatibility Logic**:
- Exact version match → compatible
- Minor/patch diff (e.g., 0.1.0 vs 0.1.1) → compatible with warning
- Major version diff (e.g., 0.1.0 vs 1.0.0) → warning about potential issues

## Files to Read

1. **`src/shared/types.ts`** - `GameState`, `GameConfig`, `Agent` types
2. **`idea.md`** - Overall project architecture (though the replay system is new)
3. **`src/engine/state.ts`** - How `GameState` is structured

## Acceptance Criteria

- [ ] Replay files can be written incrementally without data loss
- [ ] Replay files can be read and parsed correctly
- [ ] Engine version embedded in all replay files
- [ ] Compatibility checking warns on version mismatches
- [ ] Atomic writes prevent corrupted files on crash
- [ ] Map serialization handled (GameState.agents is a Map)
- [ ] All tests pass with good coverage
- [ ] No lint errors

## Notes

**Map Serialization**: `GameState.agents` is a `Map<AgentId, Agent>`. Use `Object.fromEntries()` when writing JSON, and reconstruct the Map when reading.

**Performance**: Full state snapshots create ~5-10MB files for 1000-turn simulations (20x20 grid, 4 agents). This is acceptable for MVP. Future optimizations could include delta encoding or compression.

**Error Handling**: Be defensive about file I/O:
- Create `./replays/` directory if it doesn't exist
- Handle disk full, permission denied gracefully
- Catch JSON parse errors for corrupted files
- Log errors clearly

**Future Enhancements**:
- Delta encoding (store only state diffs)
- gzip compression
- Checkpointing (full state every N turns)

---

## 🎯 Completion Report

_To be filled by implementer upon completion._

