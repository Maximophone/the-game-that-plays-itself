import "dotenv/config";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { AgentIdentity, AgentId } from "../shared/types.js";
import { WebSocket } from "ws";
import { createInitialState } from "../engine/index.js";
import { initializeWebSocket, broadcastState, sendStateToClient } from "./websocket.js";
import { startLoop, getCurrentState } from "./game-loop.js";
import { listReplays, loadReplay } from "../replay/reader.js";

/**
 * Server entry point
 */

const PORT = parseInt(process.env.PORT || "3001", 10);

// Initialize Express app
const app = express();
app.use(express.json()); // Enable JSON body parsing
const httpServer = createServer(app);

// Basic health check endpoint
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", port: PORT });
});

// Initialize WebSocket server
const wss = initializeWebSocket(httpServer);

// Send current state to new WebSocket connections
wss.on("connection", (ws: WebSocket) => {
    const state = getCurrentState();
    if (state) {
        sendStateToClient(ws, state);
    }
});

// Helper to generate agent identities
function generateAgentIdentities(count: number): Map<AgentId, AgentIdentity> {
    const identities = new Map<AgentId, AgentIdentity>();
    const basePersonalities = [
        { name: "Aria", p: "You are friendly and love to build structures. You prefer cooperation over conflict." },
        { name: "Rex", p: "You are cautious and focused on survival. You prioritize gathering food and resources." },
        { name: "Zara", p: "You are curious and observant. You like to explore the map and interact with others." },
        { name: "Nova", p: "You are energetic and efficient. You try to optimize your actions for maximum gathering." },
        { name: "Luna", p: "You are peaceful and avoid crowded areas. You like to maintain your own space." },
        { name: "Orion", p: "You are assertive and protective of your territory." },
        { name: "Atlas", p: "You are a builder at heart, always looking for materials to construct." },
        { name: "Sage", p: "You are wise and patient, often waiting to see what others do before acting." },
    ];

    for (let i = 0; i < count; i++) {
        const id = `agent_${i + 1}`;
        // Use base personality or generate generic one if we run out
        const base = basePersonalities[i % basePersonalities.length];
        const suffix = i >= basePersonalities.length ? ` ${Math.floor(i / basePersonalities.length) + 1}` : "";

        identities.set(id, {
            id,
            name: `${base.name}${suffix}`,
            personality: base.p,
        });
    }
    return identities;
}

// Global state for identities
let agentIdentities = generateAgentIdentities(parseInt(process.env.AGENT_COUNT || "4", 10));

// Replay API
app.get("/api/replays", async (_req: Request, res: Response) => {
    try {
        const replays = await listReplays("./replays");
        res.json(replays);
    } catch (error) {
        console.error("[Server] Failed to list replays:", error);
        res.status(500).json({ error: "Failed to list replays" });
    }
});

app.get("/api/replays/:filename", async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const replay = await loadReplay(`./replays/${filename}`);
        res.json(replay);
    } catch (error) {
        console.error(`[Server] Failed to load replay ${req.params.filename}:`, error);
        res.status(404).json({ error: "Replay not found" });
    }
});

// Restart endpoint
app.post("/api/restart", (req: Request, res: Response) => {
    const { agentCount } = req.body;
    const count = typeof agentCount === 'number' ? Math.max(1, Math.min(20, agentCount)) : 4;

    console.log(`[Server] Restarting game with ${count} agents...`);

    // Stop current loop (we'll need to export a stop function from game-loop, 
    // but for now startLoop with new state effectively resets if we handle logic right)
    // Actually, we need to be careful about not having two loops.
    // Let's modify game-loop to export a stopGame function.

    startGame(count);

    res.json({ status: "restarted", agentCount: count });
});

function startGame(agentCount: number) {
    // Generate fresh identities
    agentIdentities = generateAgentIdentities(agentCount);

    // Create initial state
    const initialState = createInitialState(
        {
            gridWidth: 20,
            gridHeight: 20,
        },
        Array.from(agentIdentities.values())
    );

    // Start game loop (this should ideally cancel previous loop)
    startLoop(initialState, agentIdentities, (state) => {
        broadcastState(state);
    });
}

// Initial start
startGame(agentIdentities.size);

// Start HTTP server
httpServer.listen(PORT, () => {
    console.log(`[Server] HTTP server listening on port ${PORT}`);
    console.log(`[Server] WebSocket server ready at ws://localhost:${PORT}`);
    console.log(`[Server] Game is running!`);
});

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n[Server] Shutting down gracefully...");
    httpServer.close(() => {
        console.log("[Server] Server closed");
        process.exit(0);
    });
});

process.on("SIGTERM", () => {
    console.log("\n[Server] Received SIGTERM. Shutting down...");
    httpServer.close(() => {
        console.log("[Server] Server closed");
        process.exit(0);
    });
});
