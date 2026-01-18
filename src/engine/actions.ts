/**
 * Actions — Main game loop and action processing
 *
 * Pure functions with no side effects.
 */

import type {
    GameState,
    AgentId,
    Action,
    Agent,
    BlockType,
} from "../shared/types.js";
import {
    getTargetPosition,
    cloneGrid,
    isGatherable,
    getGatherYield,
    gatherRemovesBlock,
    randomChoice,
    isFood,
    transferInventory,
} from "./helpers.js";
import { validateAction } from "./validation.js";

/**
 * Compute the next game state given current state and all agent actions.
 *
 * Turn processing order:
 * 1. Hunger depletion for all agents
 * 2. Death check (mark agents with hunger <= 0 as dead)
 * 3. Process all actions simultaneously with conflict resolution
 * 4. Clean up dead agents from positions
 */
export function computeNextState(
    state: GameState,
    actions: Map<AgentId, Action>
): GameState {
    // Clone the grid (we'll mutate it)
    const newGrid = cloneGrid(state.grid);

    // Clone agents map (we'll mutate it)
    const newAgents = new Map<AgentId, Agent>();
    for (const [id, agent] of state.agents) {
        newAgents.set(id, {
            ...agent,
            inventory: agent.inventory.map((slot) => ({ ...slot })),
        });
    }

    // Copy messages array
    const newMessages = [...state.messages];

    // Step 1: Hunger depletion
    for (const [, agent] of newAgents) {
        if (agent.isAlive) {
            agent.hunger = Math.max(0, agent.hunger - state.config.hungerDepletionPerTurn);
        }
    }

    // Step 2: Death check
    for (const [, agent] of newAgents) {
        if (agent.hunger <= 0) {
            agent.isAlive = false;
        }
    }

    // Step 3: Process actions
    // Collect valid actions
    const validActions: Array<{ agentId: AgentId; action: Action }> = [];
    for (const [agentId, action] of actions) {
        const result = validateAction(
            { ...state, grid: newGrid, agents: newAgents },
            agentId,
            action
        );
        if (result.valid) {
            validActions.push({ agentId, action });
        }
    }

    // Process movement conflicts
    const moveActions = validActions.filter((a) => a.action.type === "move");
    const moveTargets = new Map<string, AgentId[]>(); // position key -> agent IDs

    for (const { agentId, action } of moveActions) {
        if (action.type !== "move") continue;
        const agent = newAgents.get(agentId);
        if (!agent || !agent.isAlive) continue;

        const targetPos = getTargetPosition(agent.position, action.direction);
        const key = `${targetPos.x},${targetPos.y}`;

        if (!moveTargets.has(key)) {
            moveTargets.set(key, []);
        }
        moveTargets.get(key)!.push(agentId);
    }

    // Resolve movement conflicts and apply moves
    const movedAgents = new Set<AgentId>();
    for (const [key, agentIds] of moveTargets) {
        // Pick a random winner if multiple agents try to move to the same cell
        const winnerId = randomChoice(agentIds);
        const [x, y] = key.split(",").map(Number);

        // Check if another agent is already at this position and not moving
        let positionOccupied = false;
        for (const [otherId, otherAgent] of newAgents) {
            if (
                otherAgent.isAlive &&
                otherAgent.position.x === x &&
                otherAgent.position.y === y &&
                !moveActions.some((a) => a.agentId === otherId)
            ) {
                positionOccupied = true;
                break;
            }
        }

        if (!positionOccupied) {
            const winner = newAgents.get(winnerId);
            if (winner) {
                winner.position = { x, y };
                movedAgents.add(winnerId);
            }
        }
    }

    // Process gather conflicts
    const gatherActions = validActions.filter((a) => a.action.type === "gather");
    const gatherTargets = new Map<string, AgentId[]>();

    for (const { agentId, action } of gatherActions) {
        if (action.type !== "gather") continue;
        const agent = newAgents.get(agentId);
        if (!agent || !agent.isAlive) continue;

        const targetPos = getTargetPosition(agent.position, action.direction);
        const key = `${targetPos.x},${targetPos.y}`;

        if (!gatherTargets.has(key)) {
            gatherTargets.set(key, []);
        }
        gatherTargets.get(key)!.push(agentId);
    }

    // Resolve gather conflicts
    for (const [key, agentIds] of gatherTargets) {
        const [x, y] = key.split(",").map(Number);
        const cell = newGrid.cells[y][x];

        if (!cell.block || !isGatherable(cell.block)) continue;

        const winnerId = randomChoice(agentIds);
        const winner = newAgents.get(winnerId);
        if (!winner) continue;

        const gathered = getGatherYield(cell.block);

        // Inventory stacking logic
        const existingSlot = winner.inventory.find(
            (slot) => slot.type === gathered && slot.count < 10
        );

        if (existingSlot) {
            existingSlot.count++;
        } else {
            winner.inventory.push({ type: gathered, count: 1 });
        }

        // Berry bush depletion
        if (cell.block === "berry_bush" && cell.berriesRemaining !== undefined) {
            cell.berriesRemaining--;
            if (cell.berriesRemaining <= 0) {
                cell.block = null;
            }
        } else if (gatherRemovesBlock(cell.block)) {
            cell.block = null;
        }
    }

    // Process build conflicts
    const buildActions = validActions.filter((a) => a.action.type === "build");
    const buildTargets = new Map<string, Array<{ agentId: AgentId; block: BlockType }>>();

    for (const { agentId, action } of buildActions) {
        if (action.type !== "build") continue;
        const agent = newAgents.get(agentId);
        if (!agent || !agent.isAlive) continue;

        const targetPos = getTargetPosition(agent.position, action.direction);
        const key = `${targetPos.x},${targetPos.y}`;

        if (!buildTargets.has(key)) {
            buildTargets.set(key, []);
        }
        buildTargets.get(key)!.push({ agentId, block: action.block });
    }

    // Resolve build conflicts
    for (const [key, builders] of buildTargets) {
        const [x, y] = key.split(",").map(Number);
        const cell = newGrid.cells[y][x];

        // Pick random winner
        const winner = randomChoice(builders);
        const agent = newAgents.get(winner.agentId);
        if (!agent) continue;

        // Remove block from inventory (stacking aware)
        const slotIndex = agent.inventory.findIndex(
            (slot) => slot.type === winner.block && slot.count > 0
        );

        if (slotIndex !== -1) {
            const slot = agent.inventory[slotIndex];
            slot.count--;
            if (slot.count === 0) {
                agent.inventory.splice(slotIndex, 1);
            }
            cell.block = winner.block;
        }
    }

    // Process speak actions
    for (const { agentId, action } of validActions) {
        if (action.type !== "speak") continue;
        const agent = newAgents.get(agentId);
        if (!agent || !agent.isAlive) continue;

        newMessages.push({
            turn: state.turn + 1,
            agentId: agent.id,
            agentName: agent.name,
            content: action.message,
            position: { ...agent.position },
        });
    }

    // Process hit actions
    for (const { agentId, action } of validActions) {
        if (action.type !== "hit") continue;
        const agent = newAgents.get(agentId);
        if (!agent || !agent.isAlive) continue;

        const targetPos = getTargetPosition(agent.position, action.direction);

        // Find target agent
        for (const [, targetAgent] of newAgents) {
            if (
                targetAgent.isAlive &&
                targetAgent.position.x === targetPos.x &&
                targetAgent.position.y === targetPos.y
            ) {
                targetAgent.hunger = Math.max(0, targetAgent.hunger - state.config.hitDamage);
                if (targetAgent.hunger <= 0) {
                    // Loot transfer before target is marked as dead
                    transferInventory(targetAgent, agent, state.config.inventorySize);
                    targetAgent.isAlive = false;
                }
                break;
            }
        }
    }

    // Process eat actions
    for (const { agentId, action } of validActions) {
        if (action.type !== "eat") continue;
        const agent = newAgents.get(agentId);
        if (!agent || !agent.isAlive) continue;

        // Find and remove food from inventory (stacking aware)
        const slotIndex = agent.inventory.findIndex((slot) => isFood(slot.type));
        if (slotIndex !== -1) {
            const slot = agent.inventory[slotIndex];
            slot.count--;
            if (slot.count === 0) {
                agent.inventory.splice(slotIndex, 1);
            }
            agent.hunger = Math.min(
                state.config.maxHunger,
                agent.hunger + state.config.berryHungerRestore
            );
        }
    }

    // Think actions have no effect on state (they're for observers only)

    // Trim old messages (keep last 10 turns worth)
    const messagesToKeep = newMessages.filter((m) => m.turn > state.turn - 10);

    return {
        turn: state.turn + 1,
        grid: newGrid,
        agents: newAgents,
        messages: messagesToKeep,
        config: state.config,
    };
}
