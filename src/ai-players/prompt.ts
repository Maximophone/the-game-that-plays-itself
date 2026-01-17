import { AgentView, AgentIdentity } from "../shared/types.js";

/**
 * Formats the agent's view into a readable text prompt for the LLM.
 */
export function formatPrompt(view: AgentView, identity: AgentIdentity): string {
    const { self, visibleAgents, recentMessages, turn } = view;

    return `You are ${identity.name}, a creature in a world of blocks. You must survive.
${identity.personality ? `\nPERSONALITY:\n${identity.personality}\n` : ""}
=== YOUR STATUS (Turn ${turn}) ===
Position: (${self.position.x}, ${self.position.y})
Hunger: ${Math.round(self.hunger)}/${self.maxHunger || 100}
Inventory: [${self.inventory.join(", ")}]
Inventory Capacity: ${self.inventoryCapacity || 5}

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
THOUGHT: <your brief reasoning>
ACTION: <one action from the list above>

Example:
THOUGHT: I am hungry and see a berry bush to my right.
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
