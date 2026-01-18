import { Action, AgentView, AgentIdentity, Direction, AgentId } from "../shared/types.js";

/**
 * Dummy AI Player - Makes random decisions without calling any LLM API
 * Useful for testing and debugging the game loop and visualization
 */

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

// Track turn counts per agent (for consistent interface with real AI sessions)
const turnCounts = new Map<AgentId, number>();

/**
 * Clear dummy memory (turn counts).
 * Called when simulation resets for consistent interface with chat sessions.
 */
export function clearDummyMemory(): void {
    turnCounts.clear();
}


function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random action based on the agent's current state
 */
export async function getAction(view: AgentView, identity: AgentIdentity): Promise<{ action: Action; thought: string }> {
    // Simple behavior logic
    const { hunger, inventory } = view.self;

    // If very hungry and has food, eat
    if (hunger < 30 && inventory.some(item => item === "berry")) {
        console.log(`[Dummy AI] ${identity.name}: Eating (hunger ${hunger})`);
        return {
            action: { type: "eat" },
            thought: `I'm hungry (${hunger}/100), eating a berry`
        };
    }

    // Random action selection with weighted probabilities
    const roll = Math.random();

    if (roll < 0.4) {
        // 40% chance to move
        const direction = randomChoice(DIRECTIONS);
        console.log(`[Dummy AI] ${identity.name}: Moving ${direction}`);
        return {
            action: { type: "move", direction },
            thought: `Moving ${direction} to explore`
        };
    } else if (roll < 0.5) {
        // 10% chance to speak
        const messages = [
            "Hello!",
            "Anyone there?",
            "Looking for food...",
            "Nice weather today!",
            "Let's cooperate!",
        ];
        const message = randomChoice(messages);
        console.log(`[Dummy AI] ${identity.name}: Speaking`);
        return {
            action: { type: "speak", message },
            thought: "Trying to communicate with others"
        };
    } else if (roll < 0.65) {
        // 15% chance to gather
        const direction = randomChoice(DIRECTIONS);
        console.log(`[Dummy AI] ${identity.name}: Attempting to gather ${direction}`);
        return {
            action: { type: "gather", direction },
            thought: `Attempting to gather resources ${direction}`
        };
    } else if (roll < 0.75 && inventory.length > 0) {
        // 10% chance to build if has items
        const direction = randomChoice(DIRECTIONS);
        const block = randomChoice(inventory);
        console.log(`[Dummy AI] ${identity.name}: Building ${block} ${direction}`);
        return {
            action: { type: "build", direction, block },
            thought: `Placing ${block} to build something`
        };
    } else {
        // 25% chance to wait (or if can't build)
        console.log(`[Dummy AI] ${identity.name}: Waiting`);
        return {
            action: { type: "wait" },
            thought: "Resting and observing the environment"
        };
    }
}
