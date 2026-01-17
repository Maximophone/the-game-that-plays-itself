import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { GameState } from "../shared/types.js";

/**
 * WebSocket manager for broadcasting game state to connected clients.
 */

const clients = new Set<WebSocket>();

/**
 * Initialize WebSocket server attached to HTTP server
 */
export function initializeWebSocket(httpServer: Server): WebSocketServer {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws: WebSocket) => {
        console.log("[WebSocket] Client connected");
        clients.add(ws);

        ws.on("close", () => {
            console.log("[WebSocket] Client disconnected");
            clients.delete(ws);
        });

        ws.on("error", (error: Error) => {
            console.error("[WebSocket] Error:", error);
            clients.delete(ws);
        });
    });

    return wss;
}

/**
 * Broadcast game state to all connected clients
 */
export function broadcastState(state: GameState): void {
    const serializedState = serializeGameState(state);
    const message = JSON.stringify(serializedState);

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    console.log(`[WebSocket] Broadcasted state to ${clients.size} client(s)`);
}

/**
 * Send current state to a specific client (e.g., on connection)
 */
export function sendStateToClient(client: WebSocket, state: GameState): void {
    if (client.readyState === WebSocket.OPEN) {
        const serializedState = serializeGameState(state);
        client.send(JSON.stringify(serializedState));
        console.log("[WebSocket] Sent current state to new client");
    }
}

/**
 * Helper function to serialize GameState for JSON transmission.
 * Converts Map<AgentId, Agent> to a plain object.
 */
function serializeGameState(state: GameState): any {
    return {
        ...state,
        agents: Object.fromEntries(state.agents), // Convert Map to object
    };
}
