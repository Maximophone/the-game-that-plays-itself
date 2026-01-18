import { GameState, Action, AgentId, AgentIdentity } from "../shared/types.js";
import { computeNextState, generateAgentView } from "../engine/index.js";
import { getAction as getAIAction } from "../ai-players/index.js";
import { getAction as getDummyAction } from "../ai-players/dummy.js";

/**
 * Game loop orchestration
 */

type BroadcastFunction = (state: GameState) => void;

const TURN_DURATION_MS = parseInt(process.env.TURN_DURATION_MS || "5000", 10);
const AI_TIMEOUT_MS = 30000; // 30 seconds timeout per agent
const USE_DUMMY_AI = !process.env.GEMINI_API_KEY;

if (USE_DUMMY_AI) {
    console.log("[Game Loop] ⚠️  GEMINI_API_KEY not set - using dummy AI for testing");
}

let currentState: GameState;
let agentIdentities: Map<AgentId, AgentIdentity>;
let isRunning = false;
let timeoutId: NodeJS.Timeout | null = null;

/**
 * Start the game loop
 */
export function startLoop(
    initialState: GameState,
    identities: Map<AgentId, AgentIdentity>,
    broadcastFn: BroadcastFunction
): void {
    // Stop existing loop if any
    stopLoop();

    currentState = initialState;
    agentIdentities = identities;
    isRunning = true;

    console.log(`[Game Loop] Starting with turn duration: ${TURN_DURATION_MS}ms`);
    console.log(`[Game Loop] Initial agents: ${Array.from(agentIdentities.values()).map(a => a.name).join(", ")}`);

    // Start the first turn
    runTurn(broadcastFn);
}

/**
 * Stop the game loop
 */
export function stopLoop(): void {
    isRunning = false;
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    console.log("[Game Loop] Loop stopped");
}

/**
 * Get current game state (for external access)
 */
export function getCurrentState(): GameState {
    return currentState;
}

/**
 * Execute a single turn
 */
async function runTurn(broadcast: BroadcastFunction): Promise<void> {
    if (!isRunning) return;

    const turnStart = Date.now();
    console.log(`\n[Game Loop] ========== Turn ${currentState.turn} ==========`);

    try {
        // 1. Get all alive agents
        const aliveAgents = Array.from(currentState.agents.entries())
            .filter(([_, agent]) => agent.isAlive);

        if (aliveAgents.length === 0) {
            console.log("[Game Loop] No alive agents remaining. Game over.");
            stopLoop();
            return;
        }

        console.log(`[Game Loop] Alive agents: ${aliveAgents.map(([_, a]) => a.name).join(", ")}`);

        // 2. Generate agent views
        const agentViews = aliveAgents.map(([agentId, _]) => ({
            agentId,
            view: generateAgentView(currentState, agentId),
        }));

        // 3. Get actions from all agents in parallel
        console.log("[Game Loop] Requesting actions from AI players...");
        const actionPromises = agentViews.map(({ agentId, view }) => {
            const identity = agentIdentities.get(agentId)!;
            return getActionWithTimeout(view, identity, agentId);
        });

        const actionResults = await Promise.all(actionPromises);

        // 4. Build actions map and update agent thoughts
        const actions = new Map<AgentId, Action>();
        actionResults.forEach(({ agentId, action, thought }) => {
            actions.set(agentId, action);

            // Update agent's lastThought and lastAction
            const agent = currentState.agents.get(agentId);
            if (agent) {
                agent.lastThought = thought;
                agent.lastAction = action;
            }
        });

        // 5. Compute next state
        console.log("[Game Loop] Computing next state...");
        currentState = computeNextState(currentState, actions);

        // 6. Broadcast the new state
        broadcast(currentState);

        // 7. Log turn summary
        const turnDuration = Date.now() - turnStart;
        const deadCount = Array.from(currentState.agents.values()).filter(a => !a.isAlive).length;
        console.log(`[Game Loop] Turn ${currentState.turn} completed in ${turnDuration}ms`);
        console.log(`[Game Loop] Alive: ${aliveAgents.length}, Dead: ${deadCount}`);

    } catch (error) {
        console.error("[Game Loop] Error during turn execution:", error);
        // Continue to next turn even if this one failed
    }

    // Schedule next turn
    const turnDuration = Date.now() - turnStart;
    const delay = Math.max(0, TURN_DURATION_MS - turnDuration);
    if (isRunning) {
        timeoutId = setTimeout(() => runTurn(broadcast), delay);
    }
}

/**
 * Get action from AI player with timeout
 */
async function getActionWithTimeout(
    view: any,
    identity: AgentIdentity,
    agentId: AgentId
): Promise<{ agentId: AgentId; action: Action; thought: string }> {
    try {
        const getAction = USE_DUMMY_AI ? getDummyAction : getAIAction;
        const result = await Promise.race([
            getAction(view, identity),
            timeoutPromise(AI_TIMEOUT_MS),
        ]);

        return { agentId, action: result.action, thought: result.thought };
    } catch (error) {
        console.error(`[Game Loop] Failed to get action for ${identity.name}:`, error);
        // Default to wait action
        return { agentId, action: { type: "wait" }, thought: "Action timeout" };
    }
}

/**
 * Helper: Create a timeout promise that rejects
 */
function timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), ms);
    });
}
