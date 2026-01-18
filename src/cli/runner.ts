import { GameState, Action, AgentId, AgentIdentity } from "../shared/types.js";
import { computeNextState, generateAgentView, createInitialState } from "../engine/index.js";
import { getAction as getAIAction } from "../ai-players/index.js";
import { getAction as getDummyAction, clearDummyMemory } from "../ai-players/dummy.js";
import { clearAllChats } from "../ai-players/sessions.js";
import { ReplayWriter } from "../replay/writer.js";

/**
 * SimulationRunner orchestrates the game loop for a CLI simulation.
 */
export class SimulationRunner {
    private currentState: GameState;
    private agentIdentities: Map<AgentId, AgentIdentity>;
    private isRunning = false;
    private replayWriter: ReplayWriter;
    private turnDelay: number;
    private useDummyAi: boolean;
    private aiTimeoutMs = 30000;

    constructor(options: {
        agents: number;
        width: number;
        height: number;
        turnDelay: number;
        outputDir: string;
        useDummyAi: boolean;
    }) {
        // Clear any stale chat sessions from previous runs
        clearAllChats();
        clearDummyMemory();

        // 1. Generate agent identities
        this.agentIdentities = this.generateIdentities(options.agents);

        // 2. Create initial state
        const config = {
            gridWidth: options.width,
            gridHeight: options.height,
            maxTurns: 1000, // Default limit
        };
        this.currentState = createInitialState(config, Array.from(this.agentIdentities.values()));

        // 3. Initialize ReplayWriter
        this.replayWriter = new ReplayWriter(this.currentState.config, options.outputDir);
        this.replayWriter.initialize(this.currentState);

        this.turnDelay = options.turnDelay;
        this.useDummyAi = options.useDummyAi;
    }

    /**
     * Start the simulation
     */
    public async start(): Promise<void> {
        this.isRunning = true;
        console.log(`[Simulation] Started`);
        console.log(`[Simulation] Config: ${this.agentIdentities.size} agents, ${this.currentState.config.gridWidth}x${this.currentState.config.gridHeight} grid`);
        console.log(`[Simulation] Replay file: ${this.replayWriter.getFilePath()}`);
        console.log(`[Simulation] Using ${this.useDummyAi ? "Dummy AI" : "Gemini AI"}`);

        while (this.isRunning) {
            await this.runTurn();
            if (this.isRunning) {
                await new Promise(resolve => setTimeout(resolve, this.turnDelay));
            }
        }
    }

    /**
     * Stop the simulation gracefully
     */
    public stop(): void {
        this.isRunning = false;
        console.log(`\n[Simulation] Stopping...`);
        this.replayWriter.finalize();
        console.log(`[Simulation] Stopped at turn ${this.currentState.turn}`);
        console.log(`[Simulation] Replay saved: ${this.replayWriter.getFilePath()}`);
    }

    /**
     * Execute a single turn
     */
    private async runTurn(): Promise<void> {
        const aliveAgentsEntries = Array.from(this.currentState.agents.entries())
            .filter(([_, agent]) => agent.isAlive);

        if (aliveAgentsEntries.length === 0) {
            console.log("[Simulation] No alive agents remaining. Game over.");
            this.stop();
            return;
        }

        process.stdout.write(`Turn ${this.currentState.turn} | Agents: ${aliveAgentsEntries.length}/${this.currentState.agents.size} alive\r`);

        try {
            // 1. Generate agent views
            const agentViews = aliveAgentsEntries.map(([agentId, _]) => ({
                agentId,
                view: generateAgentView(this.currentState, agentId),
            }));

            // 2. Get actions in parallel
            const actionPromises = agentViews.map(({ agentId, view }) => {
                const identity = this.agentIdentities.get(agentId)!;
                return this.getActionWithTimeout(view, identity, agentId);
            });

            const actionResults = await Promise.all(actionPromises);

            // 3. Apply actions and update state
            const actionsMap = new Map<AgentId, Action>();
            actionResults.forEach(({ agentId, action, thought }) => {
                actionsMap.set(agentId, action);
                const agent = this.currentState.agents.get(agentId);
                if (agent) {
                    agent.lastThought = thought;
                    agent.lastAction = action;
                }
            });

            // 4. Compute next state
            this.currentState = computeNextState(this.currentState, actionsMap);

            // 5. Append to replay
            this.replayWriter.appendTurn(this.currentState);

        } catch (error) {
            console.error(`\n[Simulation] Error during turn ${this.currentState.turn}:`, error);
            this.replayWriter.markCrashed(error as Error);
            this.isRunning = false;
        }
    }

    /**
     * Get action from AI with timeout
     */
    private async getActionWithTimeout(
        view: any,
        identity: AgentIdentity,
        agentId: AgentId
    ): Promise<{ agentId: AgentId; action: Action; thought: string }> {
        const getAction = this.useDummyAi ? getDummyAction : getAIAction;
        try {
            const result = await Promise.race([
                getAction(view, identity),
                new Promise<{ action: Action; thought: string }>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), this.aiTimeoutMs)
                ),
            ]);
            return { agentId, action: result.action, thought: result.thought };
        } catch (error) {
            return { agentId, action: { type: "wait" }, thought: "Timeout or error getting action" };
        }
    }

    /**
     * Helper: Generate a set of agent identities
     */
    private generateIdentities(count: number): Map<AgentId, AgentIdentity> {
        const identities = new Map<AgentId, AgentIdentity>();
        const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank"];
        const personalities = [
            "No suggestion, as the AI you can be yourself and approach this game as you see fit.",
            "No suggestion, as the AI you can be yourself and approach this game as you see fit.",
            "No suggestion, as the AI you can be yourself and approach this game as you see fit.",
            "A cautious builder focusing on stone structures.",
            "A social agent who prioritizes communication.",
            "A competitive gatherer who works fast.",
            "A mysterious wanderer.",
        ];

        for (let i = 0; i < count; i++) {
            const id = `agent-${i}` as AgentId;
            identities.set(id, {
                id,
                name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length)}` : ""),
                personality: personalities[i % personalities.length],
            });
        }
        return identities;
    }


}
