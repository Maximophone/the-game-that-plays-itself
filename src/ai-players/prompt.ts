import { AgentView, AgentIdentity } from "../shared/types.js";

/**
 * Generate the initial system prompt for a chat session.
 * This is sent ONCE at the start of the conversation to establish
 * the agent's identity, personality, and the game rules.
 */
export function formatSystemPrompt(identity: AgentIdentity): string {
    return `You are ${identity.name}, a creature in a 2D world of blocks. Your goal is to survive.

${identity.personality ? `YOUR PERSONALITY:\n${identity.personality}\n` : ""}
GAME RULES:
- You have hunger that decreases each turn. At 0 hunger, you die.
- You can gather resources (stone, wood, berries) from adjacent cells.
- You can build structures by placing blocks from your inventory.
- You can speak to other agents within your vision radius.
- You can hit adjacent agents to damage their hunger.
- If you kill another agent, you get the contents of their inventory.
- You can eat berries to restore hunger.
- You cannot move through wood and stone blocks.

AVAILABLE ACTIONS:
- move: Move one cell in a direction (up, down, left, right)
- wait: Do nothing
- gather: Pick up an adjacent block (direction required)
- build: Place a block from inventory (direction and block type required)
- speak: Say something to nearby agents (message required)
- hit: Attack an adjacent player (direction required)
- eat: Consume a berry from your inventory
- think: Record an internal thought (thought required)

Each turn, I will tell you what you see and your current status.

RESPONSE FORMAT:
You must respond with ONLY a JSON object. The "thought" field must come FIRST so you can reason before deciding.

Example responses:
{"thought": "I'm hungry and see a berry bush to my right", "action": "gather", "direction": "right"}
{"thought": "I need to explore the area", "action": "move", "direction": "up"}
{"thought": "I should rest and observe", "action": "wait"}
{"thought": "Time to eat my berry", "action": "eat"}
{"thought": "I want to greet Bob", "action": "speak", "message": "Hello Bob!"}
{"thought": "Building a wall for protection", "action": "build", "direction": "down", "block": "stone"}

Acknowledge that you understand by responding with a JSON object introducing yourself.`;
}

/**
 * Generate the per-turn prompt with current game state.
 * This is sent as a follow-up message each turn.
 * Does NOT include personality or rules (those are in the system prompt).
 */
export function formatTurnPrompt(view: AgentView): string {
    const { self, visibleAgents, recentMessages, turn } = view;

    return `=== TURN ${turn} ===

YOUR STATUS:
- Position: (${self.position.x}, ${self.position.y})
- Hunger: ${Math.round(self.hunger)}/${self.maxHunger || 100}
- Inventory: [${self.inventory.map(slot => `${slot.type} (${slot.count})`).join(", ")}]
- Capacity: ${self.inventoryCapacity || 5} unique slots (max 10 per stack)

WHAT YOU SEE:
${formatGrid(view)}

NEARBY AGENTS:
${visibleAgents.length > 0
            ? visibleAgents.map(a => `${a.name} at (${a.absolutePosition.x}, ${a.absolutePosition.y})`).join("; ")
            : "No other agents visible"}

MESSAGES HEARD:
${recentMessages.length > 0
            ? recentMessages.map(m => `(turn ${m.turn}) ${m.agentName}: "${m.content}" from ${m.relativeDirection}`).join("\n")
            : "Silence."}

Respond with a JSON object. Think first, then decide your action.`;
}

/**
 * Formats the agent's view into a readable text prompt for the LLM.
 * This is the STATELESS version that includes everything in one prompt.
 * Used as a fallback when chat sessions aren't available.
 */
export function formatPrompt(view: AgentView, identity: AgentIdentity): string {
    const { self, visibleAgents, recentMessages, turn } = view;

    return `You are ${identity.name}, a creature in a world of blocks. You must survive.
${identity.personality ? `\nPERSONALITY:\n${identity.personality}\n` : ""}
=== YOUR STATUS (Turn ${turn}) ===
Position: (${self.position.x}, ${self.position.y})
Hunger: ${Math.round(self.hunger)}/${self.maxHunger || 100}
Inventory: [${self.inventory.map(slot => `${slot.type} (${slot.count})`).join(", ")}]
Inventory Capacity: ${self.inventoryCapacity || 5} unique slots (max 10 per stack)

=== WHAT YOU SEE ===
${formatGrid(view)}

Legend: . = grass, stone = stone block, wood = wood block, berry_bush = berry bush, berry = berry item
Agents: ${visibleAgents.map(a => `${a.name} at (${a.absolutePosition.x}, ${a.absolutePosition.y})`).join("; ") || "No other agents visible"}

=== MESSAGES HEARD ===
${recentMessages.length > 0
            ? recentMessages.map(m => `(turn ${m.turn}) ${m.agentName}: "${m.content}" from ${m.relativeDirection}`).join("\n")
            : "Silence."}

=== AVAILABLE ACTIONS ===
move(up|down|left|right) - Move one cell
wait - Do nothing
gather(up|down|left|right) - Pick up adjacent block
build(up|down|left|right, block_type) - Place block from inventory
speak("message") - Say something (others nearby will hear)
hit(up|down|left|right) - Attack adjacent player
eat - Consume berry from inventory
think("thought") - Internal monologue (only you see this)

=== YOUR TURN ===
Think about your situation, your hunger, and your surroundings. 
Then, respond with:
THOUGHT: <your brief reasoning, no longer than 200 words>
ACTION: <one action from the list above>

Example:
THOUGHT: [could be whatever you want]
ACTION: move(right)`;
}

/**
 * Formats the visible grid into a text representation centered on the agent.
 */
function formatGrid(view: AgentView): string {
    const radius = 5;
    const grid: string[][] = Array.from({ length: radius * 2 + 1 }, () =>
        Array.from({ length: radius * 2 + 1 }, () => ".")
    );

    for (const cell of view.visibleCells) {
        const rx = cell.relativePosition.x + radius;
        const ry = cell.relativePosition.y + radius;

        // Check bounds just in case
        if (rx >= 0 && rx < grid[0].length && ry >= 0 && ry < grid.length) {
            if (cell.block) {
                grid[ry][rx] = getCharForBlock(cell.block);
            } else {
                grid[ry][rx] = "."; // grass
            }
        }
    }

    // Mark other agents
    for (const agent of view.visibleAgents) {
        const rx = agent.relativePosition.x + radius;
        const ry = agent.relativePosition.y + radius;
        if (rx >= 0 && rx < grid[0].length && ry >= 0 && ry < grid.length) {
            grid[ry][rx] = "P";
        }
    }

    // Mark self
    grid[radius][radius] = "@";

    // Build the string
    let output = "    -5 -4 -3 -2 -1  0 +1 +2 +3 +4 +5\n";
    for (let y = 0; y < grid.length; y++) {
        const label = (y - radius).toString().padStart(2, " ");
        output += `${label}  ${grid[y].join("  ")}  ${label}\n`;
    }
    output += "    -5 -4 -3 -2 -1  0 +1 +2 +3 +4 +5\n";
    output += "\nLegend: @=you, P=player, S=stone, W=wood, B=bush, b=berry, .=grass";

    return output;
}

function getCharForBlock(type: string): string {
    switch (type) {
        case "stone": return "S";
        case "wood": return "W";
        case "berry_bush": return "B";
        case "berry": return "b";
        default: return ".";
    }
}

