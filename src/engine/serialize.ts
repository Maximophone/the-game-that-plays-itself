/**
 * Serialize — Text representation for LLM prompts
 *
 * Pure functions with no side effects.
 */

import type { AgentView, BlockType, VisibleCell } from "../shared/types.js";

/**
 * Block type to display symbol mapping.
 */
const BLOCK_SYMBOLS: Record<BlockType | "empty", string> = {
    grass: ".",
    stone: "S",
    wood: "T",
    berry_bush: "B",
    berry: "b",
    empty: ".",
};

/**
 * Serialize an agent's view into a text prompt for an LLM.
 *
 * Format follows the specification in idea.md.
 */
export function serializeStateForAgent(view: AgentView): string {
    const lines: string[] = [];

    // === YOUR STATUS ===
    lines.push("=== YOUR STATUS ===");
    lines.push(`Name: ${view.self.name}`);
    lines.push(`Hunger: ${view.self.hunger}/${view.self.maxHunger}`);
    lines.push(`Inventory: [${view.self.inventory.join(", ") || "empty"}]`);
    lines.push(`Position: (${view.self.position.x}, ${view.self.position.y})`);
    lines.push("");

    // === WHAT YOU SEE ===
    lines.push("=== WHAT YOU SEE ===");
    lines.push(renderVisibleGrid(view));
    lines.push("");

    // List visible agents
    if (view.visibleAgents.length > 0) {
        for (const agent of view.visibleAgents) {
            const relX = agent.relativePosition.x >= 0 ? `+${agent.relativePosition.x}` : `${agent.relativePosition.x}`;
            const relY = agent.relativePosition.y >= 0 ? `+${agent.relativePosition.y}` : `${agent.relativePosition.y}`;
            lines.push(`Player at (${relX}, ${relY}): "${agent.name}"`);
        }
        lines.push("");
    }

    // === MESSAGES HEARD ===
    lines.push("=== MESSAGES HEARD ===");
    if (view.recentMessages.length === 0) {
        lines.push("(none)");
    } else {
        for (const message of view.recentMessages) {
            lines.push(`(turn ${message.turn}) ${message.agentName} [${message.relativeDirection}]: "${message.content}"`);
        }
    }
    lines.push("");

    // === AVAILABLE ACTIONS ===
    lines.push("=== AVAILABLE ACTIONS ===");
    lines.push("move(up|down|left|right) - Move one cell");
    lines.push("wait - Do nothing");
    lines.push("gather(up|down|left|right) - Pick up adjacent block");
    lines.push("build(up|down|left|right, <block>) - Place block from inventory");
    lines.push('speak("<message>") - Say something (others nearby will hear)');
    lines.push("hit(up|down|left|right) - Attack adjacent player");
    lines.push("eat - Consume berry from inventory (+30 hunger)");
    lines.push('think("<thought>") - Think to yourself (only you see this)');
    lines.push("");

    // === YOUR TURN ===
    lines.push("=== YOUR TURN ===");
    lines.push("Think about what to do, then respond with ONE action.");

    return lines.join("\n");
}

/**
 * Render the visible grid as a text representation.
 */
function renderVisibleGrid(view: AgentView): string {
    // Build a map of relative positions to cells
    const cellMap = new Map<string, VisibleCell>();
    for (const cell of view.visibleCells) {
        const key = `${cell.relativePosition.x},${cell.relativePosition.y}`;
        cellMap.set(key, cell);
    }

    // Build a map of agent positions
    const agentMap = new Map<string, string>();
    for (const agent of view.visibleAgents) {
        const key = `${agent.relativePosition.x},${agent.relativePosition.y}`;
        agentMap.set(key, "P"); // P for player
    }

    // Determine the bounds of visible area
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (const cell of view.visibleCells) {
        minX = Math.min(minX, cell.relativePosition.x);
        maxX = Math.max(maxX, cell.relativePosition.x);
        minY = Math.min(minY, cell.relativePosition.y);
        maxY = Math.max(maxY, cell.relativePosition.y);
    }

    const lines: string[] = [];

    // Header row (x coordinates)
    const headerCells = ["    "]; // Indent for y labels
    for (let x = minX; x <= maxX; x++) {
        const label = x >= 0 ? `+${x}` : `${x}`;
        headerCells.push(label.padStart(3));
    }
    lines.push(headerCells.join(" "));

    // Grid rows (from top to bottom, so y from minY to maxY)
    for (let y = minY; y <= maxY; y++) {
        const rowLabel = y >= 0 ? `+${y}` : `${y}`;
        const row = [rowLabel.padStart(3) + " "];

        for (let x = minX; x <= maxX; x++) {
            const key = `${x},${y}`;
            let symbol: string;

            if (x === 0 && y === 0) {
                symbol = "@"; // Agent's position
            } else if (agentMap.has(key)) {
                symbol = "P"; // Another player
            } else if (cellMap.has(key)) {
                const cell = cellMap.get(key)!;
                symbol = cell.block ? BLOCK_SYMBOLS[cell.block] : BLOCK_SYMBOLS.empty;
            } else {
                symbol = " "; // Not visible
            }

            row.push(symbol.padStart(3));
        }

        lines.push(row.join(" "));
    }

    // Legend
    lines.push("");
    lines.push("Legend: . = grass, T = tree (wood), S = stone, B = berry bush, b = berry, @ = you, P = player");

    return lines.join("\n");
}
