import "dotenv/config";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { GameState, AgentIdentity, AgentId } from "../shared/types.js";
import { WebSocket } from "ws";
import { createInitialState } from "../engine/index.js";
import { initializeWebSocket, broadcastState, sendStateToClient } from "./websocket.js";
import { startLoop, getCurrentState } from "./game-loop.js";

/**
 * Server entry point
 */

const PORT = parseInt(process.env.PORT || "3001", 10);

// Initialize Express app
const app = express();
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

// Define agent identities with personalities
const agentIdentities = new Map<AgentId, AgentIdentity>([
    [
        "agent_1",
        {
            id: "agent_1",
            name: "Aria",
            personality:
                "You are friendly and love to build structures. You prefer cooperation over conflict. You enjoy helping others and building shelters.",
        },
    ],
    [
        "agent_2",
        {
            id: "agent_2",
            name: "Rex",
            personality:
                "You are cautious and focused on survival. You prioritize gathering food and resources. You are wary of others but will trade if necessary.",
        },
    ],
    [
        "agent_3",
        {
            id: "agent_3",
            name: "Zara",
            personality:
                "You are curious and adventurous. You like to explore the map and interact with others. You are social and love to chat.",
        },
    ],
    [
        "agent_4",
        {
            id: "agent_4",
            name: "Nova",
            personality:
                "You are strategic and analytical. You plan ahead and try to optimize your actions. You value efficiency and smart resource management.",
        },
    ],
]);

// Create initial game state
console.log("[Server] Creating initial game state...");
const initialState: GameState = createInitialState(
    {}, // Use default config
    Array.from(agentIdentities.values())
);

// Start the game loop
console.log("[Server] Starting game loop...");
startLoop(initialState, agentIdentities, broadcastState);

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
