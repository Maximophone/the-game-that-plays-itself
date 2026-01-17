/**
 * Engine — Main entry point
 *
 * Exports all core engine functions.
 * This module has no side effects and no I/O.
 */

// Re-export core functions
export { createInitialState } from "./state.ts";
export { computeNextState } from "./actions.ts";
export { validateAction } from "./validation.ts";
export { generateAgentView } from "./perception.ts";
export { serializeStateForAgent } from "./serialize.ts";

// Re-export helper utilities that may be useful to consumers
export {
    getTargetPosition,
    isInBounds,
    manhattanDistance,
    isWalkable,
    isGatherable,
    getRelativeDirection,
} from "./helpers.ts";
