/**
 * State Management — Initial state generation
 *
 * Pure functions with no side effects.
 */

import type {
    GameState,
    GameConfig,
    Grid,
    Cell,
    Agent,
    AgentIdentity,
    Position,
} from "../shared/types.js";
import { DEFAULT_CONFIG } from "../shared/types.js";
import { shuffleArray } from "./helpers.js";

/**
 * Create the initial game state.
 *
 * - Generates a grid filled with grass terrain
 * - Scatters stone, wood, and berry bushes randomly
 * - Places agents at valid starting positions
 * - Initializes agents with full hunger and empty inventory
 */
export function createInitialState(
    config: Partial<GameConfig> = {},
    agents: AgentIdentity[]
): GameState {
    const fullConfig: GameConfig = { ...DEFAULT_CONFIG, ...config };
    const grid = generateGrid(fullConfig.gridWidth, fullConfig.gridHeight);

    // Scatter resources
    scatterResources(grid);

    // Place agents
    const agentMap = placeAgents(grid, agents, fullConfig);

    return {
        turn: 0,
        grid,
        agents: agentMap,
        messages: [],
        config: fullConfig,
    };
}

/**
 * Generate an empty grid filled with grass terrain.
 */
function generateGrid(width: number, height: number): Grid {
    const cells: Cell[][] = [];

    for (let y = 0; y < height; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({
                terrain: "grass",
                block: null,
            });
        }
        cells.push(row);
    }

    return { width, height, cells };
}

/**
 * Scatter resources (stone, wood, berry bushes) randomly across the grid.
 *
 * Distribution:
 * - ~10% stone
 * - ~10% wood (trees)
 * - ~5% berry bushes
 */
function scatterResources(grid: Grid): void {
    const totalCells = grid.width * grid.height;

    // Calculate resource counts
    const stoneCount = Math.floor(totalCells * 0.1);
    const woodCount = Math.floor(totalCells * 0.1);
    const berryBushCount = Math.floor(totalCells * 0.05);

    // Get all positions and shuffle
    const positions: Position[] = [];
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            positions.push({ x, y });
        }
    }
    const shuffled = shuffleArray(positions);

    // Place resources
    let index = 0;

    // Place stone
    for (let i = 0; i < stoneCount && index < shuffled.length; i++, index++) {
        const pos = shuffled[index];
        grid.cells[pos.y][pos.x].block = "stone";
    }

    // Place wood (trees)
    for (let i = 0; i < woodCount && index < shuffled.length; i++, index++) {
        const pos = shuffled[index];
        grid.cells[pos.y][pos.x].block = "wood";
    }

    // Place berry bushes
    for (let i = 0; i < berryBushCount && index < shuffled.length; i++, index++) {
        const pos = shuffled[index];
        grid.cells[pos.y][pos.x].block = "berry_bush";
    }
}

/**
 * Place agents at random valid (walkable, unoccupied) positions.
 */
function placeAgents(
    grid: Grid,
    agents: AgentIdentity[],
    config: GameConfig
): Map<string, Agent> {
    const agentMap = new Map<string, Agent>();

    // Find all walkable positions
    const walkablePositions: Position[] = [];
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            const cell = grid.cells[y][x];
            if (cell.block === null || cell.block === "berry_bush" || cell.block === "berry") {
                walkablePositions.push({ x, y });
            }
        }
    }

    // Shuffle and pick positions for agents
    const shuffled = shuffleArray(walkablePositions);

    // Default colors for agents
    const defaultColors = [
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#FFE66D", // Yellow
        "#95E1D3", // Mint
        "#F38181", // Coral
        "#AA96DA", // Purple
        "#FCBAD3", // Pink
        "#A8D8EA", // Light Blue
    ];

    for (let i = 0; i < agents.length && i < shuffled.length; i++) {
        const identity = agents[i];
        const position = shuffled[i];

        agentMap.set(identity.id, {
            id: identity.id,
            name: identity.name,
            position: { ...position },
            hunger: config.maxHunger,
            inventory: [],
            color: defaultColors[i % defaultColors.length],
            isAlive: true,
        });
    }

    return agentMap;
}
