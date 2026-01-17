/**
 * Engine — Main entry point
 *
 * Exports all core engine functions.
 * This module has no side effects and no I/O.
 */

// Re-export core functions
export { createInitialState } from "./state.js";
export { computeNextState } from "./actions.js";
export { validateAction } from "./validation.js";
export { generateAgentView } from "./perception.js";
export { serializeStateForAgent } from "./serialize.js";

// Re-export helper utilities that may be useful to consumers
export {
    getTargetPosition,
    isInBounds,
    manhattanDistance,
    isWalkable,
    isGatherable,
    getRelativeDirection,
} from "./helpers.js";
