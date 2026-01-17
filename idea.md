# The Game That Plays Itself

> A 2D sandbox simulation where LLM-driven agents gather, build, survive, and interact — with no explicit goals, just emergent behavior.

---

## Core Vision

**What is it?**  
A turn-based simulation on a square grid where each "player" is an AI agent driven by an LLM. Think 2D Minecraft meets ant farm. Agents can gather resources, build structures, communicate, and fight — all while trying to survive.

**Why?**  
To observe what emerges when AIs have both **social tools** (talking) and **physical tools** (building, hitting) in a survival context. Will they cooperate? War? Build cities? Hoard resources?

---

## World Design

### The Grid
- 2D square grid
- Each cell contains: terrain/block type + optionally one agent
- Blocks can be gathered, placed, and walked on (or not, depending on type)

### Vision & Interaction Radii

```
        5 5 5 5 5 5 5 5 5 5 5
        5 4 4 4 4 4 4 4 4 4 5
        5 4 3 3 3 3 3 3 3 4 5
        5 4 3 2 2 2 2 2 3 4 5
        5 4 3 2 1 1 1 2 3 4 5
        5 4 3 2 1 @ 1 2 3 4 5    @ = Agent
        5 4 3 2 1 1 1 2 3 4 5
        5 4 3 2 2 2 2 2 3 4 5
        5 4 3 3 3 3 3 3 3 4 5
        5 4 4 4 4 4 4 4 4 4 5
        5 5 5 5 5 5 5 5 5 5 5
```

| Radius | Manhattan Distance | Used For |
|--------|-------------------|----------|
| **1** (adjacent) | 1 | Hit, Gather, Build |
| **5** (vision) | 5 | See, Talk |

- **See**: Agent perceives all blocks and agents within radius 5
- **Talk**: Messages broadcast to all agents within radius 5
- **Gather/Build/Hit**: Must be adjacent (radius 1)

---

## Agents

### State
Each agent has:
- **Position** (x, y)
- **Hunger** (0-100, depletes each turn, dies at 0)
- **Inventory** (list of held blocks, finite capacity?)
- **Identity** (name, personality prompt?)

### Perception
Each turn, an agent receives:
- Grid snapshot within vision radius (what blocks/agents are where)
- Recent messages heard (who said what, from which direction?)
- Own state (hunger, inventory)
- Memory of recent turns (configurable depth)

---

## Actions (MVP)

| Action | Range | Description |
|--------|-------|-------------|
| `move(direction)` | — | Move up/down/left/right |
| `wait` | — | Do nothing |
| `gather(direction)` | Adjacent | Pick up block from adjacent cell, add to inventory |
| `build(direction, block_type)` | Adjacent | Place block from inventory onto adjacent cell |
| `speak(message)` | Vision (5) | Broadcast message to nearby agents |
| `hit(direction)` | Adjacent | Attack agent in adjacent cell (damage hunger?) |
| `eat` | — | Consume food item from inventory to restore hunger |
| `think(thought)` | — | Internal monologue (visible to observers only) |

### Action Notes
- **Gather**: Target cell must have a gatherable block. Block is removed from world, added to inventory.
- **Build**: Target cell must be empty (or have terrain that allows building on it). Block removed from inventory, placed in world.
- **Hit**: Deals damage to target's hunger? Knocks them back? To be defined.
- **Eat**: Requires food item in inventory (e.g., "berry" block type).

---

## Blocks (MVP)

Start minimal. Can expand later.

| Block Type | Gatherable | Placeable | Walkable | Notes |
|------------|-----------|-----------|----------|-------|
| `grass` | ✗ | ✗ | ✓ | Default terrain |
| `stone` | ✓ | ✓ | ✗ | Basic building material |
| `wood` | ✓ | ✓ | ✗ | Can be gathered from trees |
| `berry_bush` | ✓ | ✗ | ✓ | Gathering gives `berry` (food). Bush stays. |
| `berry` | — | ✓ | ✓ | Food item. Can eat or place. |

### Block Ideas for Later
- `water` — not walkable, maybe deadly?
- `door` — walkable but only by builder?
- `sign` — displays text, placed by agent
- Crafted blocks (stone wall, wooden floor, etc.)

---

## Survival Mechanics

### Hunger
- Starts at 100
- Depletes by X per turn (e.g., 2)
- Restored by eating food
- **At 0**: Agent dies

### Death
- On death: Agent is removed from the grid
- **Options to decide**:
  - Permanent death (population shrinks)
  - Respawn elsewhere (memory wiped or preserved?)
  - Drop inventory on death?

---

## Combat

### Hit Mechanic
- **Range**: Adjacent only (must be standing next to target)
- **Effect**: Reduces target's hunger by Y (e.g., 20)
- **Alternative effects to consider**:
  - Knockback (push target one cell away)
  - Stun (target loses next turn)
  - Steal (take item from target inventory)

This creates tension: you can threaten someone, but you have to get *close* first.

---

## Crafting (Post-MVP)

Defer for now. Possible approach:
- Simple recipes: `wood + wood → plank`, `stone + stone → wall`
- `craft(recipe_name)` action
- Requires materials in inventory
- Unlocks more block types for building

---

## Observation UI

### Main View
- 2D grid visualization (top-down)
- Agents shown as colored squares with icons/faces?
- Blocks shown with distinct colors/textures
- Speech bubbles for recent `speak` actions
- Thought bubbles (different style) for `think` actions

### Agent Inspector (click on agent)
- Current state (hunger, inventory)
- Recent memory / thought history
- Last N actions taken
- Who they've interacted with

### Event Log
- Scrolling timeline of all actions
- Filterable by agent, action type

### Controls
- Speed: Pause / Step / Slow / Fast
- Zoom: In/out on grid
- Follow: Lock camera to specific agent

---

## LLM Integration

### Prompt Structure
Each turn, agent receives a prompt like:

```
You are [Agent Name], a creature in a world of blocks. You must survive.

YOUR STATE:
- Position: (12, 8)
- Hunger: 67/100
- Inventory: [stone, stone, berry]

WHAT YOU SEE (radius 5):
[Grid representation]

RECENT MESSAGES:
- "Hello, is anyone there?" — from NorthWest
- "I found berries!" — from East

ACTIONS AVAILABLE:
- move(up|down|left|right)
- wait
- gather(up|down|left|right)
- build(up|down|left|right, block_type)
- speak("message")
- hit(up|down|left|right)
- eat
- think("thought")

What do you do? You may think first, then choose ONE action.
```

### Output Parsing
- Agent responds with thought + action
- Parse action into structured format
- Validate action is legal (can't gather empty cell, can't build without materials, etc.)

---

## MVP Scope

### Must Have
- [ ] Grid world with 4-5 block types
- [ ] 2-4 agents controlled by LLM
- [ ] Basic actions: move, gather, build, speak, eat, hit
- [ ] Hunger system
- [ ] Vision radius (5 Manhattan)
- [ ] Web-based visualization
- [ ] Turn-by-turn execution

### Nice to Have
- [ ] Agent inspector panel
- [ ] Event log
- [ ] Speed controls
- [ ] Multiple LLM models (different personalities?)

### Deferred
- [ ] Crafting system
- [ ] More block types
- [ ] Agent death/respawn
- [ ] Saving/loading simulation state

---

## Configuration Decisions

| Parameter | Value | Notes |
|-----------|-------|-------|
| Inventory size | 5 slots | Configurable |
| Hit damage | TBD | Easily configurable, tune later |
| Turn order | Simultaneous | Resolve conflicts with randomness |
| Collision resolution | Random winner | If two agents move to same cell |

---

## Architecture

### Overview

Three cleanly separated layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    VISUALIZATION                            │
│                 (React/TypeScript Web App)                  │
│                                                             │
│  • Renders game state                                       │
│  • Shows speech/thought bubbles                             │
│  • Agent inspector, event log                               │
│  • Playback controls (pause/step/speed)                     │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ WebSocket / Polling
                              │ (subscribes to state updates)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER                                │
│                   (Node.js/TypeScript)                      │
│                                                             │
│  • Orchestrates game loop                                   │
│  • Calls AI Players for each agent's action                 │
│  • Invokes Engine to compute next state                     │
│  • Broadcasts state updates to clients                      │
│  • Stores game history (in memory or DB)                    │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           │ import                             │ HTTP
           ▼                                    ▼
┌─────────────────────────┐      ┌─────────────────────────────┐
│         ENGINE          │      │        AI PLAYERS           │
│   (Pure TypeScript)     │      │      (Gemini 3 Flash)       │
│                         │      │                             │
│ • GameState type        │      │ • Formats prompt for agent  │
│ • Action types          │      │ • Calls LLM API             │
│ • computeNextState()    │      │ • Parses response → Action  │
│ • validateAction()      │      │ • Handles retries/errors    │
│ • generateAgentView()   │      │                             │
│                         │      │                             │
│ Zero side effects       │      │ Stateless                   │
│ Zero dependencies       │      │ One agent at a time         │
└─────────────────────────┘      └─────────────────────────────┘
```

### Layer 1: Engine (Pure Logic)

**Location**: `packages/engine/` or `src/engine/`

**Responsibility**: Given a game state and a set of actions, compute the next state. No side effects, no I/O, no dependencies.

**Key Functions**:
```typescript
// Core state transition
function computeNextState(state: GameState, actions: Map<AgentId, Action>): GameState

// Validation
function validateAction(state: GameState, agentId: AgentId, action: Action): ValidationResult

// Perception (what an agent can see)
function generateAgentView(state: GameState, agentId: AgentId): AgentView

// Serialize state to text (for LLM prompts)
function serializeStateForAgent(view: AgentView): string
```

**Why pure?**
- Easy to test (no mocks needed)
- Easy to reason about
- Can run in browser OR server
- Future: deterministic replays, save/load

### Layer 2: Server (Orchestration)

**Location**: `packages/server/` or `src/server/`

**Responsibility**: Run the game loop, call AI, broadcast state.

**Game Loop**:
```
1. For each agent, generate their view from current state
2. Call AI Players in parallel for all agents
3. Collect actions (with timeout handling)
4. Pass state + actions to Engine
5. Broadcast new state to visualization clients
6. Repeat
```

**Why server-side?**
- API keys stay secret
- Can run headless (no browser needed)
- Can persist game history
- Can scale to many concurrent games later

### Layer 3: AI Players

**Location**: `packages/ai-players/` or `src/ai-players/`

**Responsibility**: Given an agent's view, produce an action.

**Interface**:
```typescript
interface AIPlayer {
  getAction(agentView: AgentView, agentIdentity: AgentIdentity): Promise<Action>
}
```

**Implementation**:
1. Convert `AgentView` → text prompt (using `serializeStateForAgent`)
2. Call Gemini 3 Flash API
3. Parse response → structured `Action`
4. Validate action format (retry if malformed)

**Model**: Gemini 3 Flash (fast, cheap, good enough for simple decisions)

### Layer 4: Visualization (Web Client)

**Location**: `packages/web/` or `src/web/`

**Stack**: React + TypeScript + Vite

**Responsibility**: Render the game beautifully.

**Features**:
- 2D grid canvas (or DOM-based)
- Agents with colors/icons
- Speech bubbles (fade over time)
- Thought bubbles (different style, for observers)
- Agent inspector panel
- Event log / timeline
- Playback controls

**Communication**: 
- WebSocket connection to server
- Receives `GameState` updates in real-time
- Can send commands (pause, step, change speed)

---

## State Representation

### GameState (Structured)

The canonical state format. Used internally by all components.

```typescript
interface GameState {
  turn: number
  grid: Grid                    // 2D array of cells
  agents: Map<AgentId, Agent>
  messages: Message[]           // Recent messages (last N turns)
  config: GameConfig            // Static config (grid size, constants)
}

interface Grid {
  width: number
  height: number
  cells: Cell[][]               // cells[y][x]
}

interface Cell {
  terrain: BlockType            // e.g., "grass"
  block: BlockType | null       // e.g., "stone" placed on top
}

interface Agent {
  id: AgentId
  name: string
  position: Position
  hunger: number                // 0-100
  inventory: BlockType[]        // max 5 items
  color: string                 // for visualization
}

interface Message {
  turn: number
  agentId: AgentId
  content: string
  position: Position            // where it was said
}
```

### AgentView (What an Agent Sees)

Derived from GameState, scoped to one agent's perception.

```typescript
interface AgentView {
  self: {
    name: string
    hunger: number
    inventory: BlockType[]
    position: Position
  }
  visibleCells: VisibleCell[]   // All cells within radius 5
  visibleAgents: VisibleAgent[] // Other agents within radius 5  
  recentMessages: HeardMessage[]
  availableActions: string[]    // Valid actions this turn
}
```

### Text Representation (For LLM)

The `serializeStateForAgent()` function converts `AgentView` → string.

Example output:
```
=== YOUR STATUS ===
Name: Aria
Hunger: 72/100
Inventory: [stone, berry, berry]
Position: (5, 8)

=== WHAT YOU SEE ===
    -2  -1   0  +1  +2
+2   .   .   T   .   .
+1   .   S   .   .   .
 0   .   .   @   B   .     @ = you, T = tree, S = stone, B = berry bush
-1   .   .   .   P   .     P = other player
-2   .   .   .   .   .

Legend: . = grass, T = tree (wood), S = stone, B = berry bush
Player at (+1, -1): "Bob" (hunger unknown)

=== MESSAGES HEARD ===
(turn 42) Bob: "I'm hungry, do you have food?"

=== AVAILABLE ACTIONS ===
move(up|down|left|right) - Move one cell
wait - Do nothing
gather(up|down|left|right) - Pick up adjacent block
build(up|down|left|right, <block>) - Place block from inventory
speak("<message>") - Say something (others nearby will hear)
hit(up|down|left|right) - Attack adjacent player
eat - Consume berry from inventory (+30 hunger)
think("<thought>") - Think to yourself (only you see this)

=== YOUR TURN ===
Think about what to do, then respond with ONE action.
```

---

## Project Structure

```
the-game-that-plays-itself/
├── packages/
│   ├── engine/              # Pure game logic
│   │   ├── src/
│   │   │   ├── types.ts     # All type definitions
│   │   │   ├── state.ts     # State management
│   │   │   ├── actions.ts   # Action processing
│   │   │   ├── validation.ts
│   │   │   └── serialize.ts # Text representation
│   │   └── tests/
│   │
│   ├── server/              # Game orchestration
│   │   ├── src/
│   │   │   ├── game-loop.ts
│   │   │   ├── websocket.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ai-players/          # LLM integration
│   │   ├── src/
│   │   │   ├── gemini.ts    # Gemini 3 Flash client
│   │   │   ├── prompt.ts    # Prompt formatting
│   │   │   └── parser.ts    # Response parsing
│   │   └── package.json
│   │
│   └── web/                 # Visualization
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── App.tsx
│       └── package.json
│
├── package.json             # Monorepo root
├── tsconfig.json
└── idea.md                  # This file
```

**Alternative**: If monorepo feels heavy, can start with flat structure:
```
src/
├── engine/
├── server/
├── ai-players/
└── web/
```

---

## Parallel Development

The architecture is designed so **multiple developers (AI or human) can work on different components simultaneously**.

### Shared Types (The Contract)

All components import from a single `types.ts` file. This is the **interface contract**:

```typescript
// src/shared/types.ts — THE SOURCE OF TRUTH

// Core types
export type AgentId = string
export type BlockType = 'grass' | 'stone' | 'wood' | 'berry_bush' | 'berry'
export type Direction = 'up' | 'down' | 'left' | 'right'
export interface Position { x: number; y: number }

// State types
export interface GameState { ... }
export interface Agent { ... }
export interface AgentView { ... }

// Action types
export type Action = 
  | { type: 'move'; direction: Direction }
  | { type: 'wait' }
  | { type: 'gather'; direction: Direction }
  | { type: 'build'; direction: Direction; block: BlockType }
  | { type: 'speak'; message: string }
  | { type: 'hit'; direction: Direction }
  | { type: 'eat' }
  | { type: 'think'; thought: string }
```

### Component Independence

| Component | Depends On | Can Be Built Independently |
|-----------|------------|---------------------------|
| **Engine** | `shared/types.ts` only | ✅ Yes — pure functions, no external deps |
| **AI Players** | `shared/types.ts` + Gemini SDK | ✅ Yes — mock AgentView for testing |
| **Server** | `shared/types.ts`, Engine, AI Players | ⚠️ After interfaces stabilize |
| **Web** | `shared/types.ts` only | ✅ Yes — mock GameState for UI dev |

### Development Order Recommendation

```
Phase 1 (Parallel):
├── Developer A: Engine (state transitions, validation)
├── Developer B: Web visualization (mock data)
└── Developer C: AI Players (prompt/parse logic)

Phase 2 (Integration):
└── Developer D: Server (wire everything together)
```

### Interface Stability Rule

> **Types in `shared/types.ts` should be finalized before parallel work begins.**  
> Changes to shared types require coordination across all components.

---

## Open Questions

1. **Berry regeneration**: Do bushes naturally regrow berries over time?
2. **Agent personalities**: Same base prompt for all? Unique personalities?
3. **Starting conditions**: Random spawn? Resources distribution?
4. **Death handling**: Drop inventory? Respawn? Permanent?
5. **History storage**: In-memory only? Persist to file/DB?

---

## Inspiration

- **Minecraft**: Gather, craft, build loop
- **Dwarf Fortress / Rimworld**: Emergent stories from simple systems
- **Conway's Game of Life**: Complexity from minimal rules
- **The Sims**: Watching autonomous agents live their lives
- **Stanford Generative Agents**: LLM-driven social simulation

---

*Last updated: 2026-01-17*
