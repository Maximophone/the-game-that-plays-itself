/**
 * Engine Tests — Core engine function tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
    createInitialState,
    computeNextState,
    validateAction,
    generateAgentView,
    serializeStateForAgent,
} from "./index.ts";
import type {
    GameState,
    GameConfig,
    AgentIdentity,
    Action,
} from "../shared/types.ts";
import { DEFAULT_CONFIG } from "../shared/types.ts";

// =============================================================================
// Test Fixtures
// =============================================================================

const testAgents: AgentIdentity[] = [
    { id: "agent-1", name: "Aria" },
    { id: "agent-2", name: "Bob" },
];

const smallConfig: Partial<GameConfig> = {
    gridWidth: 10,
    gridHeight: 10,
};

// =============================================================================
// createInitialState Tests
// =============================================================================

describe("createInitialState", () => {
    it("creates a grid with correct dimensions", () => {
        const state = createInitialState(smallConfig, testAgents);

        expect(state.grid.width).toBe(10);
        expect(state.grid.height).toBe(10);
        expect(state.grid.cells.length).toBe(10);
        expect(state.grid.cells[0].length).toBe(10);
    });

    it("fills all cells with grass terrain", () => {
        const state = createInitialState(smallConfig, testAgents);

        for (let y = 0; y < state.grid.height; y++) {
            for (let x = 0; x < state.grid.width; x++) {
                expect(state.grid.cells[y][x].terrain).toBe("grass");
            }
        }
    });

    it("scatters resources on the grid", () => {
        const state = createInitialState(smallConfig, testAgents);

        let stoneCount = 0;
        let woodCount = 0;
        let berryBushCount = 0;

        for (let y = 0; y < state.grid.height; y++) {
            for (let x = 0; x < state.grid.width; x++) {
                const block = state.grid.cells[y][x].block;
                if (block === "stone") stoneCount++;
                if (block === "wood") woodCount++;
                if (block === "berry_bush") berryBushCount++;
            }
        }

        // Should have some of each resource type
        expect(stoneCount).toBeGreaterThan(0);
        expect(woodCount).toBeGreaterThan(0);
        expect(berryBushCount).toBeGreaterThan(0);
    });

    it("places agents at valid positions", () => {
        const state = createInitialState(smallConfig, testAgents);

        expect(state.agents.size).toBe(2);

        for (const [, agent] of state.agents) {
            // Position should be within bounds
            expect(agent.position.x).toBeGreaterThanOrEqual(0);
            expect(agent.position.x).toBeLessThan(state.grid.width);
            expect(agent.position.y).toBeGreaterThanOrEqual(0);
            expect(agent.position.y).toBeLessThan(state.grid.height);
        }
    });

    it("initializes agents with full hunger and empty inventory", () => {
        const state = createInitialState(smallConfig, testAgents);

        for (const [, agent] of state.agents) {
            expect(agent.hunger).toBe(DEFAULT_CONFIG.maxHunger);
            expect(agent.inventory).toEqual([]);
            expect(agent.isAlive).toBe(true);
        }
    });

    it("uses default config when partial config provided", () => {
        const state = createInitialState({}, testAgents);

        expect(state.config.gridWidth).toBe(DEFAULT_CONFIG.gridWidth);
        expect(state.config.visionRadius).toBe(DEFAULT_CONFIG.visionRadius);
        expect(state.config.hungerDepletionPerTurn).toBe(DEFAULT_CONFIG.hungerDepletionPerTurn);
    });

    it("starts at turn 0 with empty messages", () => {
        const state = createInitialState(smallConfig, testAgents);

        expect(state.turn).toBe(0);
        expect(state.messages).toEqual([]);
    });
});

// =============================================================================
// validateAction Tests
// =============================================================================

describe("validateAction", () => {
    let state: GameState;

    beforeEach(() => {
        // Create a controlled state for testing
        state = createInitialState(smallConfig, testAgents);

        // Put agent-1 at a known position
        const agent1 = state.agents.get("agent-1")!;
        agent1.position = { x: 5, y: 5 };

        // Clear area around agent for predictable testing
        for (let y = 3; y <= 7; y++) {
            for (let x = 3; x <= 7; x++) {
                state.grid.cells[y][x].block = null;
            }
        }
    });

    describe("move", () => {
        it("allows valid move to empty cell", () => {
            const result = validateAction(state, "agent-1", { type: "move", direction: "up" });
            expect(result.valid).toBe(true);
        });

        it("rejects move off grid", () => {
            const agent = state.agents.get("agent-1")!;
            agent.position = { x: 0, y: 0 };

            const result = validateAction(state, "agent-1", { type: "move", direction: "left" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("off the grid");
        });

        it("rejects move into non-walkable block", () => {
            state.grid.cells[4][5].block = "stone";

            const result = validateAction(state, "agent-1", { type: "move", direction: "up" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("not walkable");
        });
    });

    describe("wait", () => {
        it("is always valid", () => {
            const result = validateAction(state, "agent-1", { type: "wait" });
            expect(result.valid).toBe(true);
        });
    });

    describe("gather", () => {
        it("allows gathering adjacent gatherable block", () => {
            state.grid.cells[4][5].block = "stone";

            const result = validateAction(state, "agent-1", { type: "gather", direction: "up" });
            expect(result.valid).toBe(true);
        });

        it("rejects gathering empty cell", () => {
            const result = validateAction(state, "agent-1", { type: "gather", direction: "up" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("No gatherable");
        });

        it("rejects gathering when inventory is full", () => {
            state.grid.cells[4][5].block = "stone";
            const agent = state.agents.get("agent-1")!;
            agent.inventory = ["stone", "stone", "stone", "stone", "stone"];

            const result = validateAction(state, "agent-1", { type: "gather", direction: "up" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("full");
        });
    });

    describe("build", () => {
        it("allows building with block in inventory", () => {
            const agent = state.agents.get("agent-1")!;
            agent.inventory = ["stone"];

            const result = validateAction(state, "agent-1", {
                type: "build",
                direction: "up",
                block: "stone",
            });
            expect(result.valid).toBe(true);
        });

        it("rejects building without block in inventory", () => {
            const result = validateAction(state, "agent-1", {
                type: "build",
                direction: "up",
                block: "stone",
            });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("No stone in inventory");
        });

        it("rejects building on non-empty cell", () => {
            state.grid.cells[4][5].block = "wood";
            const agent = state.agents.get("agent-1")!;
            agent.inventory = ["stone"];

            const result = validateAction(state, "agent-1", {
                type: "build",
                direction: "up",
                block: "stone",
            });
            expect(result.valid).toBe(false);
        });
    });

    describe("speak", () => {
        it("allows non-empty message", () => {
            const result = validateAction(state, "agent-1", {
                type: "speak",
                message: "Hello!",
            });
            expect(result.valid).toBe(true);
        });

        it("rejects empty message", () => {
            const result = validateAction(state, "agent-1", {
                type: "speak",
                message: "",
            });
            expect(result.valid).toBe(false);
        });
    });

    describe("hit", () => {
        it("allows hitting adjacent agent", () => {
            const agent2 = state.agents.get("agent-2")!;
            agent2.position = { x: 5, y: 4 }; // Above agent-1

            const result = validateAction(state, "agent-1", { type: "hit", direction: "up" });
            expect(result.valid).toBe(true);
        });

        it("rejects hitting empty cell", () => {
            const result = validateAction(state, "agent-1", { type: "hit", direction: "up" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("No agent");
        });
    });

    describe("eat", () => {
        it("allows eating with food in inventory", () => {
            const agent = state.agents.get("agent-1")!;
            agent.inventory = ["berry"];

            const result = validateAction(state, "agent-1", { type: "eat" });
            expect(result.valid).toBe(true);
        });

        it("rejects eating without food", () => {
            const result = validateAction(state, "agent-1", { type: "eat" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("No food");
        });
    });

    describe("think", () => {
        it("is always valid", () => {
            const result = validateAction(state, "agent-1", {
                type: "think",
                thought: "I wonder...",
            });
            expect(result.valid).toBe(true);
        });
    });

    describe("dead agent", () => {
        it("rejects all actions from dead agent", () => {
            const agent = state.agents.get("agent-1")!;
            agent.isAlive = false;

            const result = validateAction(state, "agent-1", { type: "wait" });
            expect(result.valid).toBe(false);
            expect(result.reason).toContain("dead");
        });
    });
});

// =============================================================================
// computeNextState Tests
// =============================================================================

describe("computeNextState", () => {
    let state: GameState;

    beforeEach(() => {
        state = createInitialState(smallConfig, testAgents);

        // Setup controlled positions
        const agent1 = state.agents.get("agent-1")!;
        const agent2 = state.agents.get("agent-2")!;
        agent1.position = { x: 5, y: 5 };
        agent2.position = { x: 2, y: 2 };

        // Clear area around agents
        for (let y = 0; y < state.grid.height; y++) {
            for (let x = 0; x < state.grid.width; x++) {
                state.grid.cells[y][x].block = null;
            }
        }
    });

    it("increments turn counter", () => {
        const actions = new Map<string, Action>();
        const newState = computeNextState(state, actions);

        expect(newState.turn).toBe(state.turn + 1);
    });

    it("depletes hunger each turn", () => {
        const agent = state.agents.get("agent-1")!;
        const initialHunger = agent.hunger;

        const actions = new Map<string, Action>();
        const newState = computeNextState(state, actions);

        const updatedAgent = newState.agents.get("agent-1")!;
        expect(updatedAgent.hunger).toBe(initialHunger - state.config.hungerDepletionPerTurn);
    });

    it("marks agent as dead when hunger reaches 0", () => {
        const agent = state.agents.get("agent-1")!;
        agent.hunger = 1; // Will die after depletion

        const actions = new Map<string, Action>();
        const newState = computeNextState(state, actions);

        const updatedAgent = newState.agents.get("agent-1")!;
        expect(updatedAgent.isAlive).toBe(false);
    });

    it("processes move action correctly", () => {
        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "move", direction: "up" });

        const newState = computeNextState(state, actions);

        const agent = newState.agents.get("agent-1")!;
        expect(agent.position).toEqual({ x: 5, y: 4 });
    });

    it("processes gather action correctly", () => {
        state.grid.cells[4][5].block = "stone";

        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "gather", direction: "up" });

        const newState = computeNextState(state, actions);

        const agent = newState.agents.get("agent-1")!;
        expect(agent.inventory).toContain("stone");
        expect(newState.grid.cells[4][5].block).toBeNull();
    });

    it("berry bush yields berry but stays in place", () => {
        state.grid.cells[4][5].block = "berry_bush";

        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "gather", direction: "up" });

        const newState = computeNextState(state, actions);

        const agent = newState.agents.get("agent-1")!;
        expect(agent.inventory).toContain("berry");
        expect(newState.grid.cells[4][5].block).toBe("berry_bush"); // Bush stays
    });

    it("processes build action correctly", () => {
        const agent = state.agents.get("agent-1")!;
        agent.inventory = ["stone"];

        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "build", direction: "up", block: "stone" });

        const newState = computeNextState(state, actions);

        const updatedAgent = newState.agents.get("agent-1")!;
        expect(updatedAgent.inventory).not.toContain("stone");
        expect(newState.grid.cells[4][5].block).toBe("stone");
    });

    it("processes speak action and adds message", () => {
        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "speak", message: "Hello world!" });

        const newState = computeNextState(state, actions);

        expect(newState.messages.length).toBe(1);
        expect(newState.messages[0].content).toBe("Hello world!");
        expect(newState.messages[0].agentName).toBe("Aria");
    });

    it("processes hit action and damages target", () => {
        const agent2 = state.agents.get("agent-2")!;
        agent2.position = { x: 5, y: 4 }; // Above agent-1
        const initialHunger = agent2.hunger;

        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "hit", direction: "up" });

        const newState = computeNextState(state, actions);

        const updatedAgent2 = newState.agents.get("agent-2")!;
        // Note: hunger depletion also applies, so we need to account for that
        const expectedHunger = initialHunger - state.config.hungerDepletionPerTurn - state.config.hitDamage;
        expect(updatedAgent2.hunger).toBe(Math.max(0, expectedHunger));
    });

    it("processes eat action and restores hunger", () => {
        const agent = state.agents.get("agent-1")!;
        agent.hunger = 50;
        agent.inventory = ["berry"];

        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "eat" });

        const newState = computeNextState(state, actions);

        const updatedAgent = newState.agents.get("agent-1")!;
        // After depletion and eating: 50 - 2 + 30 = 78
        const expected = 50 - state.config.hungerDepletionPerTurn + state.config.berryHungerRestore;
        expect(updatedAgent.hunger).toBe(expected);
        expect(updatedAgent.inventory).not.toContain("berry");
    });

    it("does not mutate original state", () => {
        const originalTurn = state.turn;
        const originalAgentHunger = state.agents.get("agent-1")!.hunger;

        const actions = new Map<string, Action>();
        actions.set("agent-1", { type: "move", direction: "up" });

        computeNextState(state, actions);

        expect(state.turn).toBe(originalTurn);
        expect(state.agents.get("agent-1")!.hunger).toBe(originalAgentHunger);
    });
});

// =============================================================================
// generateAgentView Tests
// =============================================================================

describe("generateAgentView", () => {
    let state: GameState;

    beforeEach(() => {
        state = createInitialState(smallConfig, testAgents);

        const agent1 = state.agents.get("agent-1")!;
        const agent2 = state.agents.get("agent-2")!;
        agent1.position = { x: 5, y: 5 };
        agent2.position = { x: 7, y: 5 }; // Within vision radius
    });

    it("includes agent's own state", () => {
        const view = generateAgentView(state, "agent-1");

        expect(view.self.id).toBe("agent-1");
        expect(view.self.name).toBe("Aria");
        expect(view.self.position).toEqual({ x: 5, y: 5 });
    });

    it("includes cells within vision radius", () => {
        const view = generateAgentView(state, "agent-1");

        // Vision radius of 5 means we should see cells from (-5,-5) to (+5,+5) relative
        // But bounded by grid edges
        expect(view.visibleCells.length).toBeGreaterThan(0);

        // Agent's own cell should be at relative (0,0)
        const selfCell = view.visibleCells.find(
            (c) => c.relativePosition.x === 0 && c.relativePosition.y === 0
        );
        expect(selfCell).toBeDefined();
    });

    it("includes visible agents with relative positions", () => {
        const view = generateAgentView(state, "agent-1");

        expect(view.visibleAgents.length).toBe(1);
        expect(view.visibleAgents[0].name).toBe("Bob");
        expect(view.visibleAgents[0].relativePosition).toEqual({ x: 2, y: 0 });
    });

    it("excludes agents outside vision radius", () => {
        const agent2 = state.agents.get("agent-2")!;
        agent2.position = { x: 0, y: 0 }; // Far from agent-1 at (5,5)

        const view = generateAgentView(state, "agent-1");

        expect(view.visibleAgents.length).toBe(0);
    });

    it("includes current turn number", () => {
        const view = generateAgentView(state, "agent-1");

        expect(view.turn).toBe(state.turn);
    });

    it("includes recent messages from nearby agents", () => {
        state.messages.push({
            turn: 0,
            agentId: "agent-2",
            agentName: "Bob",
            content: "Hello!",
            position: { x: 7, y: 5 },
        });

        const view = generateAgentView(state, "agent-1");

        expect(view.recentMessages.length).toBe(1);
        expect(view.recentMessages[0].content).toBe("Hello!");
    });
});

// =============================================================================
// serializeStateForAgent Tests
// =============================================================================

describe("serializeStateForAgent", () => {
    it("includes all required sections", () => {
        const state = createInitialState(smallConfig, testAgents);
        const view = generateAgentView(state, "agent-1");
        const serialized = serializeStateForAgent(view);

        expect(serialized).toContain("=== YOUR STATUS ===");
        expect(serialized).toContain("=== WHAT YOU SEE ===");
        expect(serialized).toContain("=== MESSAGES HEARD ===");
        expect(serialized).toContain("=== AVAILABLE ACTIONS ===");
        expect(serialized).toContain("=== YOUR TURN ===");
    });

    it("includes agent name and stats", () => {
        const state = createInitialState(smallConfig, testAgents);
        const view = generateAgentView(state, "agent-1");
        const serialized = serializeStateForAgent(view);

        expect(serialized).toContain("Name: Aria");
        expect(serialized).toContain("Hunger:");
        expect(serialized).toContain("Inventory:");
        expect(serialized).toContain("Position:");
    });

    it("shows @ symbol for agent's position in grid", () => {
        const state = createInitialState(smallConfig, testAgents);
        const view = generateAgentView(state, "agent-1");
        const serialized = serializeStateForAgent(view);

        expect(serialized).toContain("@");
    });

    it("includes legend explanation", () => {
        const state = createInitialState(smallConfig, testAgents);
        const view = generateAgentView(state, "agent-1");
        const serialized = serializeStateForAgent(view);

        expect(serialized).toContain("Legend:");
        expect(serialized).toContain("@ = you");
    });

    it("lists all available actions", () => {
        const state = createInitialState(smallConfig, testAgents);
        const view = generateAgentView(state, "agent-1");
        const serialized = serializeStateForAgent(view);

        expect(serialized).toContain("move(");
        expect(serialized).toContain("wait");
        expect(serialized).toContain("gather(");
        expect(serialized).toContain("build(");
        expect(serialized).toContain("speak(");
        expect(serialized).toContain("hit(");
        expect(serialized).toContain("eat");
        expect(serialized).toContain("think(");
    });
});
