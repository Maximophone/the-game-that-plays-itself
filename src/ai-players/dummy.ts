import { Action, AgentView, AgentIdentity, Direction } from "../shared/types.js";

/**
 * Dummy AI Player - Makes random decisions without calling any LLM API
 * Useful for testing and debugging the game loop and visualization
 */

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random action based on the agent's current state
 */
export async function getAction(view: AgentView, identity: AgentIdentity): Promise<Action> {
    // Simple behavior logic
    const { hunger, inventory } = view.self;

    // If very hungry and has food, eat
    if (hunger < 30 && inventory.some(item => item === "berry")) {
        console.log(`[Dummy AI] ${identity.name}: Eating (hunger ${hunger})`);
        return { type: "eat" };
    }

    // Random action selection with weighted probabilities
    const roll = Math.random();

    if (roll < 0.4) {
        // 40% chance to move
        const direction = randomChoice(DIRECTIONS);
        console.log(`[Dummy AI] ${identity.name}: Moving ${direction}`);
        return { type: "move", direction };
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
        return { type: "speak", message };
    } else if (roll < 0.65) {
        // 15% chance to gather
        const direction = randomChoice(DIRECTIONS);
        console.log(`[Dummy AI] ${identity.name}: Attempting to gather ${direction}`);
        return { type: "gather", direction };
    } else if (roll < 0.75 && inventory.length > 0) {
        // 10% chance to build if has items
        const direction = randomChoice(DIRECTIONS);
        const block = randomChoice(inventory);
        console.log(`[Dummy AI] ${identity.name}: Building ${block} ${direction}`);
        return { type: "build", direction, block };
    } else {
        // 25% chance to wait (or if can't build)
        console.log(`[Dummy AI] ${identity.name}: Waiting`);
        return { type: "wait" };
    }
}
