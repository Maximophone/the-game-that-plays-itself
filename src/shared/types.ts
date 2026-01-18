/**
 * Shared Types — The Contract
 *
 * All components import from this file.
 * Changes here affect all components.
 *
 * ⚠️ IMPORTANT: Coordinate with all developers before modifying these types.
 */

// =============================================================================
// Core Primitives
// =============================================================================

export type AgentId = string;

export type BlockType =
  | "grass" // Default terrain, not gatherable
  | "stone" // Gatherable, placeable, blocks movement
  | "wood" // Gatherable, placeable, blocks movement
  | "berry_bush" // Gatherable (yields berry), walkable, stays in place
  | "berry"; // Food item, placeable, walkable

export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
}

// =============================================================================
// Game Configuration
// =============================================================================

export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  visionRadius: number; // Default: 5 (Manhattan distance)
  inventorySize: number; // Default: 5 slots
  hungerDepletionPerTurn: number; // Default: 2
  hitDamage: number; // Default: 20
  berryHungerRestore: number; // Default: 30
  maxHunger: number; // Default: 100
}

export const DEFAULT_CONFIG: GameConfig = {
  gridWidth: 20,
  gridHeight: 20,
  visionRadius: 5,
  inventorySize: 5,
  hungerDepletionPerTurn: 2,
  hitDamage: 20,
  berryHungerRestore: 30,
  maxHunger: 100,
};

// =============================================================================
// World State
// =============================================================================

export interface Cell {
  terrain: BlockType; // Base layer (always "grass" for now)
  block: BlockType | null; // Block on top of terrain (stone, wood, etc.)
}

export interface Grid {
  width: number;
  height: number;
  cells: Cell[][]; // cells[y][x]
}

export interface Agent {
  id: AgentId;
  name: string;
  position: Position;
  hunger: number; // 0-100
  inventory: BlockType[]; // Max items = config.inventorySize
  color: string; // Hex color for visualization
  isAlive: boolean;
  lastThought?: string; // Most recent thought/reasoning from AI
  lastAction?: Action; // Most recent action taken
}

export interface Message {
  turn: number;
  agentId: AgentId;
  agentName: string;
  content: string;
  position: Position;
}

export interface GameState {
  turn: number;
  grid: Grid;
  agents: Map<AgentId, Agent>;
  messages: Message[]; // Messages from recent turns
  config: GameConfig;
}

// =============================================================================
// Agent Perception (What an agent sees)
// =============================================================================

export interface VisibleCell {
  relativePosition: Position; // Relative to agent (0,0 = agent's position)
  absolutePosition: Position;
  terrain: BlockType;
  block: BlockType | null;
}

export interface VisibleAgent {
  id: AgentId;
  name: string;
  relativePosition: Position;
  absolutePosition: Position;
  color: string;
}

export interface HeardMessage {
  turn: number;
  agentName: string;
  content: string;
  relativeDirection: string; // e.g., "NorthWest", "East", "here"
}

export interface AgentView {
  self: {
    id: AgentId;
    name: string;
    position: Position;
    hunger: number;
    maxHunger: number;
    inventory: BlockType[];
    inventoryCapacity: number;
  };
  visibleCells: VisibleCell[];
  visibleAgents: VisibleAgent[];
  recentMessages: HeardMessage[];
  turn: number;
}

// =============================================================================
// Actions
// =============================================================================

export type Action =
  | { type: "move"; direction: Direction }
  | { type: "wait" }
  | { type: "gather"; direction: Direction }
  | { type: "build"; direction: Direction; block: BlockType }
  | { type: "speak"; message: string }
  | { type: "hit"; direction: Direction }
  | { type: "eat" }
  | { type: "think"; thought: string };

export interface ActionResult {
  success: boolean;
  message: string;
  action: Action;
}

// =============================================================================
// Validation
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// =============================================================================
// Agent Identity (for AI players)
// =============================================================================

export interface AgentIdentity {
  id: AgentId;
  name: string;
  personality?: string; // Optional personality prompt
}
