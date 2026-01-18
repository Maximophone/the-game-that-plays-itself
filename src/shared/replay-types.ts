import type { GameConfig, GameState, AgentId, Agent } from "./types.js";

/**
 * Replay Metadata
 *
 * Information about the simulation run.
 */
export interface ReplayMetadata {
    engineVersion: string;
    createdAt: string;
    lastUpdatedAt: string;
    config: GameConfig;
    finalTurn: number;
    status: "running" | "completed" | "crashed";
    error?: string;
}

/**
 * Serialized Agent
 *
 * Same as Agent but without methods (if any) and ready for JSON.
 * GameState.agents (Map) needs to be converted to Object for JSON.
 */
export interface SerializedAgent extends Omit<Agent, ""> { }

/**
 * Replay Turn
 *
 * Snapshot of the GameState at a specific turn,
 * with Map converted to Object for JSON serialization.
 */
export interface ReplayTurn extends Omit<GameState, "agents"> {
    agents: { [id: AgentId]: SerializedAgent };
}

/**
 * Replay File Format
 */
export interface ReplayFile {
    metadata: ReplayMetadata;
    turns: ReplayTurn[];
}

/**
 * Brief info about a replay (for listing)
 */
export interface ReplayInfo {
    filePath: string;
    fileName: string;
    metadata: ReplayMetadata;
}
