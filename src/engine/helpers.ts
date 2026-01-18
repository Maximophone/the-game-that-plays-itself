/**
 * Engine Helpers — Shared utility functions
 *
 * Pure functions with no side effects.
 */

import type {
    Position,
    Direction,
    Grid,
    Cell,
    BlockType,
} from "../shared/types.js";

/**
 * Calculate the target position when moving in a direction.
 */
export function getTargetPosition(pos: Position, direction: Direction): Position {
    switch (direction) {
        case "up":
            return { x: pos.x, y: pos.y - 1 };
        case "down":
            return { x: pos.x, y: pos.y + 1 };
        case "left":
            return { x: pos.x - 1, y: pos.y };
        case "right":
            return { x: pos.x + 1, y: pos.y };
    }
}

/**
 * Check if a position is within grid bounds.
 */
export function isInBounds(pos: Position, grid: Grid): boolean {
    return pos.x >= 0 && pos.x < grid.width && pos.y >= 0 && pos.y < grid.height;
}

/**
 * Calculate Manhattan distance between two positions.
 */
export function manhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if a cell is walkable (no blocking blocks).
 */
export function isWalkable(cell: Cell): boolean {
    // Stone and wood blocks are not walkable
    if (cell.block === "stone" || cell.block === "wood") {
        return false;
    }
    return true;
}

/**
 * Check if a block type is gatherable.
 */
export function isGatherable(blockType: BlockType | null): boolean {
    if (blockType === null) return false;
    return blockType === "stone" || blockType === "wood" || blockType === "berry_bush";
}

/**
 * Get what item is yielded when gathering a block type.
 * Most blocks yield themselves, but berry_bush yields berry.
 */
export function getGatherYield(blockType: BlockType): BlockType {
    if (blockType === "berry_bush") {
        return "berry";
    }
    return blockType;
}

/**
 * Check if gathering a block removes it from the world.
 * Berry bushes stay in place; stone and wood are removed.
 */
export function gatherRemovesBlock(blockType: BlockType): boolean {
    return blockType !== "berry_bush";
}

/**
 * Get a relative direction string from one position to another.
 * Returns "here" if same position, or cardinal/intercardinal direction.
 */
export function getRelativeDirection(from: Position, to: Position): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy === 0) {
        return "here";
    }

    let direction = "";

    // Y axis: negative is up (North), positive is down (South)
    if (dy < 0) {
        direction += "North";
    } else if (dy > 0) {
        direction += "South";
    }

    // X axis: negative is left (West), positive is right (East)
    if (dx < 0) {
        direction += "West";
    } else if (dx > 0) {
        direction += "East";
    }

    return direction;
}

/**
 * Get a cell from the grid at the given position.
 * Returns undefined if out of bounds.
 */
export function getCell(grid: Grid, pos: Position): Cell | undefined {
    if (!isInBounds(pos, grid)) {
        return undefined;
    }
    return grid.cells[pos.y][pos.x];
}

/**
 * Create a deep clone of a grid.
 */
export function cloneGrid(grid: Grid): Grid {
    return {
        width: grid.width,
        height: grid.height,
        cells: grid.cells.map((row) =>
            row.map((cell) => ({
                terrain: cell.terrain,
                block: cell.block,
                berriesRemaining: cell.berriesRemaining,
            }))
        ),
    };
}

/**
 * Pick a random item from an array.
 */
export function randomChoice<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

/**
 * Generate a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Check if a block type can be placed (built) at a location.
 */
export function canBuildAt(cell: Cell): boolean {
    // Can only build on grass with no block, or on berry blocks
    return cell.block === null || cell.block === "berry";
}

/**
 * Check if a block type is a food item that can be eaten.
 */
export function isFood(blockType: BlockType): boolean {
    return blockType === "berry";
}

/**
 * Transfer inventory from one agent to another with prioritization and capacity limits.
 * Berries are prioritized. Items that don't fit are lost.
 */
export function transferInventory(
    from: { inventory: { type: BlockType; count: number }[] },
    to: { inventory: { type: BlockType; count: number }[] },
    inventorySize: number
): void {
    // Collect all items to transfer
    const itemsToTransfer = [...from.inventory];

    // Sort: berries first, then others
    itemsToTransfer.sort((a, b) => {
        if (isFood(a.type) && !isFood(b.type)) return -1;
        if (!isFood(a.type) && isFood(b.type)) return 1;
        return 0;
    });

    for (const item of itemsToTransfer) {
        let remaining = item.count;

        // 1. Try to fill existing stacks in 'to' inventory
        for (const slot of to.inventory) {
            if (slot.type === item.type && slot.count < 10) {
                const space = 10 - slot.count;
                const toAdd = Math.min(space, remaining);
                slot.count += toAdd;
                remaining -= toAdd;
            }
            if (remaining <= 0) break;
        }

        // 2. If still remaining and have empty slots, create new slots
        while (remaining > 0 && to.inventory.length < inventorySize) {
            const toAdd = Math.min(10, remaining);
            to.inventory.push({ type: item.type, count: toAdd });
            remaining -= toAdd;
        }

        // Remaining items that didn't fit are implicitly lost
    }
}
