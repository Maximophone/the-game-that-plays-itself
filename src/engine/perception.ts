/**
 * Perception — Agent view generation
 *
 * Pure functions with no side effects.
 */

import type {
    GameState,
    AgentId,
    AgentView,
    VisibleCell,
    VisibleAgent,
    HeardMessage,
    Position,
} from "../shared/types.ts";
import { manhattanDistance, getRelativeDirection } from "./helpers.ts";

/**
 * Generate the view of the world from an agent's perspective.
 *
 * Includes:
 * - All cells within vision radius (Manhattan distance)
 * - All agents within vision radius
 * - Recent messages from agents that were in range when they spoke
 * - Agent's own state
 */
export function generateAgentView(
    state: GameState,
    agentId: AgentId
): AgentView {
    const agent = state.agents.get(agentId);

    if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
    }

    const visionRadius = state.config.visionRadius;
    const agentPos = agent.position;

    // Gather visible cells
    const visibleCells: VisibleCell[] = [];
    for (let y = 0; y < state.grid.height; y++) {
        for (let x = 0; x < state.grid.width; x++) {
            const cellPos: Position = { x, y };
            if (manhattanDistance(agentPos, cellPos) <= visionRadius) {
                const cell = state.grid.cells[y][x];
                visibleCells.push({
                    relativePosition: {
                        x: x - agentPos.x,
                        y: y - agentPos.y,
                    },
                    absolutePosition: { x, y },
                    terrain: cell.terrain,
                    block: cell.block,
                });
            }
        }
    }

    // Gather visible agents (excluding self)
    const visibleAgents: VisibleAgent[] = [];
    for (const [otherId, otherAgent] of state.agents) {
        if (otherId === agentId) continue;
        if (!otherAgent.isAlive) continue;

        if (manhattanDistance(agentPos, otherAgent.position) <= visionRadius) {
            visibleAgents.push({
                id: otherAgent.id,
                name: otherAgent.name,
                relativePosition: {
                    x: otherAgent.position.x - agentPos.x,
                    y: otherAgent.position.y - agentPos.y,
                },
                absolutePosition: { ...otherAgent.position },
                color: otherAgent.color,
            });
        }
    }

    // Gather recent messages from agents that were in range
    // We check if the message position was within vision radius
    const recentMessages: HeardMessage[] = [];
    const recentTurnThreshold = state.turn - 5; // Last 5 turns

    for (const message of state.messages) {
        if (message.turn < recentTurnThreshold) continue;
        if (message.agentId === agentId) continue; // Don't include own messages

        // Check if message was spoken within hearing range
        if (manhattanDistance(agentPos, message.position) <= visionRadius) {
            recentMessages.push({
                turn: message.turn,
                agentName: message.agentName,
                content: message.content,
                relativeDirection: getRelativeDirection(agentPos, message.position),
            });
        }
    }

    return {
        self: {
            id: agent.id,
            name: agent.name,
            position: { ...agent.position },
            hunger: agent.hunger,
            maxHunger: state.config.maxHunger,
            inventory: [...agent.inventory],
            inventoryCapacity: state.config.inventorySize,
        },
        visibleCells,
        visibleAgents,
        recentMessages,
        turn: state.turn,
    };
}
