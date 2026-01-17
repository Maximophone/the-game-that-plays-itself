/**
 * Validation — Action validation logic
 *
 * Pure functions with no side effects.
 */

import type {
    GameState,
    AgentId,
    Action,
    ValidationResult,
    Agent,
} from "../shared/types.ts";
import {
    getTargetPosition,
    isInBounds,
    isWalkable,
    isGatherable,
    getCell,
    isFood,
    canBuildAt,
} from "./helpers.ts";

/**
 * Validate if an action is legal for a given agent in the current state.
 */
export function validateAction(
    state: GameState,
    agentId: AgentId,
    action: Action
): ValidationResult {
    const agent = state.agents.get(agentId);

    if (!agent) {
        return { valid: false, reason: "Agent not found" };
    }

    if (!agent.isAlive) {
        return { valid: false, reason: "Agent is dead" };
    }

    switch (action.type) {
        case "move":
            return validateMove(state, agent, action.direction);
        case "wait":
            return { valid: true };
        case "gather":
            return validateGather(state, agent, action.direction);
        case "build":
            return validateBuild(state, agent, action.direction, action.block);
        case "speak":
            return validateSpeak(action.message);
        case "hit":
            return validateHit(state, agent, action.direction);
        case "eat":
            return validateEat(agent);
        case "think":
            return { valid: true };
        default:
            return { valid: false, reason: "Unknown action type" };
    }
}

/**
 * Validate a move action.
 */
function validateMove(
    state: GameState,
    agent: Agent,
    direction: string
): ValidationResult {
    const targetPos = getTargetPosition(agent.position, direction as any);

    // Check bounds
    if (!isInBounds(targetPos, state.grid)) {
        return { valid: false, reason: "Cannot move off the grid" };
    }

    // Check if target cell is walkable
    const targetCell = getCell(state.grid, targetPos);
    if (!targetCell || !isWalkable(targetCell)) {
        return { valid: false, reason: "Target cell is not walkable" };
    }

    return { valid: true };
}

/**
 * Validate a gather action.
 */
function validateGather(
    state: GameState,
    agent: Agent,
    direction: string
): ValidationResult {
    const targetPos = getTargetPosition(agent.position, direction as any);

    // Check bounds
    if (!isInBounds(targetPos, state.grid)) {
        return { valid: false, reason: "Cannot gather outside the grid" };
    }

    // Check if target cell has a gatherable block
    const targetCell = getCell(state.grid, targetPos);
    if (!targetCell || !isGatherable(targetCell.block)) {
        return { valid: false, reason: "No gatherable resource at target" };
    }

    // Check inventory space
    if (agent.inventory.length >= state.config.inventorySize) {
        return { valid: false, reason: "Inventory is full" };
    }

    return { valid: true };
}

/**
 * Validate a build action.
 */
function validateBuild(
    state: GameState,
    agent: Agent,
    direction: string,
    block: string
): ValidationResult {
    const targetPos = getTargetPosition(agent.position, direction as any);

    // Check bounds
    if (!isInBounds(targetPos, state.grid)) {
        return { valid: false, reason: "Cannot build outside the grid" };
    }

    // Check if target cell allows building
    const targetCell = getCell(state.grid, targetPos);
    if (!targetCell || !canBuildAt(targetCell)) {
        return { valid: false, reason: "Cannot build at target location" };
    }

    // Check if agent has the block in inventory
    if (!agent.inventory.includes(block as any)) {
        return { valid: false, reason: `No ${block} in inventory` };
    }

    // Check if block is placeable (stone, wood, berry are placeable)
    const placeableBlocks = ["stone", "wood", "berry"];
    if (!placeableBlocks.includes(block)) {
        return { valid: false, reason: `${block} cannot be placed` };
    }

    return { valid: true };
}

/**
 * Validate a speak action.
 */
function validateSpeak(message: string): ValidationResult {
    if (!message || message.trim().length === 0) {
        return { valid: false, reason: "Message cannot be empty" };
    }

    return { valid: true };
}

/**
 * Validate a hit action.
 */
function validateHit(
    state: GameState,
    agent: Agent,
    direction: string
): ValidationResult {
    const targetPos = getTargetPosition(agent.position, direction as any);

    // Check bounds
    if (!isInBounds(targetPos, state.grid)) {
        return { valid: false, reason: "Cannot hit outside the grid" };
    }

    // Check if there's an agent at the target position
    let targetAgent: Agent | undefined;
    for (const [, otherAgent] of state.agents) {
        if (
            otherAgent.isAlive &&
            otherAgent.position.x === targetPos.x &&
            otherAgent.position.y === targetPos.y
        ) {
            targetAgent = otherAgent;
            break;
        }
    }

    if (!targetAgent) {
        return { valid: false, reason: "No agent at target position" };
    }

    return { valid: true };
}

/**
 * Validate an eat action.
 */
function validateEat(agent: Agent): ValidationResult {
    // Check if agent has food in inventory
    const hasFood = agent.inventory.some((item) => isFood(item));
    if (!hasFood) {
        return { valid: false, reason: "No food in inventory" };
    }

    return { valid: true };
}
