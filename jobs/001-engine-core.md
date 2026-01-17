# Job: Core Engine Functions

**Component**: engine  
**Status**: ✅ complete

## Context

This is "The Game That Plays Itself" — a 2D sandbox simulation where LLM-driven agents gather resources, build structures, survive, and interact on a grid world. Think 2D Minecraft meets ant farm, but played entirely by AI agents.

The **engine** is the pure logic layer. It has no side effects, no I/O, no dependencies. Given a game state and a set of actions from all agents, it computes the next state.

The types are already defined in `src/shared/types.ts`. Your job is to implement the core functions.

## Objective

Implement the following functions in `src/engine/`:

### 1. `createInitialState(config, agents)` → `GameState`
Create the initial game state:
- Generate a grid filled with grass terrain
- Scatter some stone, wood (trees), and berry bushes randomly
- Place agents at starting positions
- Initialize all agents with full hunger (100) and empty inventory

### 2. `computeNextState(state, actions)` → `GameState`
The main game loop function:
- Apply hunger depletion to all agents
- Process all actions simultaneously (handle conflicts with randomness)
- Handle: move, wait, gather, build, speak, hit, eat, think
- Add any speak messages to the messages log
- Return the new state

### 3. `validateAction(state, agentId, action)` → `ValidationResult`
Check if an action is legal:
- Can't move into non-walkable blocks or off-grid
- Can't gather from empty cells or non-gatherable blocks
- Can't build without the block in inventory
- Can't hit if no agent in target cell
- Can't eat without food in inventory
- etc.

### 4. `generateAgentView(state, agentId)` → `AgentView`
Create what an agent can see:
- All cells within vision radius (Manhattan distance 5)
- All agents within vision radius
- Recent messages from agents in range
- Agent's own state (hunger, inventory, position)

### 5. `serializeStateForAgent(view)` → `string`
Convert AgentView to a text prompt that an LLM can understand. See `idea.md` section "Text Representation (For LLM)" for the expected format.

## Files to Read

1. `src/shared/types.ts` — All type definitions (this is your contract)
2. `idea.md` — Full game concept, especially:
   - "Actions (MVP)" section for action details
   - "Blocks (MVP)" section for block behaviors
   - "State Representation" section for data structures
   - "Text Representation (For LLM)" for serialization format

## Acceptance Criteria

- [ ] All 5 functions implemented and exported from `src/engine/index.ts`
- [ ] Functions are pure (no side effects, no I/O)
- [ ] Types match what's defined in `src/shared/types.ts`
- [ ] Collision resolution uses randomness for simultaneous conflicting actions
- [ ] Basic tests in `src/engine/engine.test.ts` covering key scenarios
- [ ] Updated `docs/devlog-engine.md` with what was implemented

## Notes

- Keep functions small and focused. Extract helpers as needed.
- The engine should be runnable in both browser and Node.js (no Node-specific APIs).
- For randomness, you can use `Math.random()` — we're not worried about determinism for now.
- Don't over-engineer. Start simple, we can refine later.

---

## Completion Report

**Implemented by**: Antigravity (AI Coding Assistant)  
**Date**: 2026-01-17

### Summary of Work
Implemented all 5 core engine functions across 6 modular TypeScript files. The engine is pure, thread-safe (due to immutability), and handles simultaneous action resolution using a random-winner strategy for conflicts. A comprehensive suite of 47 unit tests was added to ensure reliability across all survival and interaction mechanics.

### Architecture & Design
- **Modularity**: Split logic into `state.ts`, `actions.ts`, `validation.ts`, `perception.ts`, and `serialize.ts` to keep the codebase maintainable.
- **Conflict Resolution**: Implemented a "gather phase," "move phase," etc., within `computeNextState` where potentially conflicting actions are grouped by target position and resolved randomly.
- **LLM Serialization**: Created a robust text renderer that provides agents with a centered relative grid and cardinal directions for heard messages.

### Problems & Solutions
- **TS Extension Lints**: Encountered linter errors regarding `.ts` extensions in imports (standard for Vite/Vitest projects using `moduleResolution: "bundler"`). Fixed by updating `tsconfig.json` with `allowImportingTsExtensions: true` and `emitDeclarationOnly: true`.
- **Berry Bushes**: Clarified behavior where gathering from a bush yields a berry but the bush remains (renewable resource), whereas stone/wood are consumed.

### Critical Notes for the Architect
- **Performance**: The grid scanning in `generateAgentView` is $O(W \times H)$ per agent per turn. For very large grids, this might need optimization (e.g., spatial partitioning), but for the MVP (20x20), it is perfectly efficient.
- **Randomness**: Used `Math.random()`. If determinism is required for replays later, we should switch to a seeded PRNG.

**Verification**: All 47 tests passed successfully.

