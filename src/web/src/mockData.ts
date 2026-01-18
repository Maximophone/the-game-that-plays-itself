import type { GameState, Agent } from '../../shared/types';
import { DEFAULT_CONFIG } from '../../shared/types';

const mockAgents: Map<string, Agent> = new Map();

mockAgents.set('agent-1', {
    id: 'agent-1',
    name: 'Aria',
    position: { x: 5, y: 5 },
    hunger: 80,
    inventory: [{ type: 'wood', count: 5 }, { type: 'stone', count: 2 }],
    color: '#3b82f6', // blue
    isAlive: true,
});

mockAgents.set('agent-2', {
    id: 'agent-2',
    name: 'Bob',
    position: { x: 10, y: 10 },
    hunger: 45,
    inventory: [{ type: 'berry', count: 3 }],
    color: '#ef4444', // red
    isAlive: true,
});

mockAgents.set('agent-3', {
    id: 'agent-3',
    name: 'Charlie',
    position: { x: 2, y: 12 },
    hunger: 95,
    inventory: [],
    color: '#10b981', // green
    isAlive: true,
});

const width = 15;
const height = 15;
const cells = Array.from({ length: height }, (_, _y) =>
    Array.from({ length: width }, (_, _x) => ({
        terrain: 'grass' as const,
        block: null as any,
    }))
);

// Add some blocks
cells[3][3].block = 'stone';
cells[3][4].block = 'stone';
cells[7][8].block = 'wood';
cells[12][2].block = 'berry_bush';
cells[10][10].block = 'berry_bush';

export const mockGameState: GameState = {
    turn: 42,
    grid: {
        width,
        height,
        cells,
    },
    agents: mockAgents,
    messages: [
        {
            turn: 41,
            agentId: 'agent-1',
            agentName: 'Aria',
            content: 'Hello Bob!',
            position: { x: 5, y: 5 },
        },
        {
            turn: 42,
            agentId: 'agent-2',
            agentName: 'Bob',
            content: 'Hi Aria, found any food?',
            position: { x: 10, y: 10 },
        },
    ],
    config: {
        ...DEFAULT_CONFIG,
        gridWidth: width,
        gridHeight: height,
    },
};
