import { useState, useEffect, useRef } from 'react';
import type { GameState, AgentId, Agent } from '../../../shared/types';

interface UseGameStateReturn {
    gameState: GameState | null;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    error: string | null;
}

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 3000; // 3 seconds

/**
 * Custom hook to connect to the game server via WebSocket
 * and receive real-time game state updates.
 */
export function useGameState(): UseGameStateReturn {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const shouldReconnect = useRef(true);

    useEffect(() => {
        function connect() {
            try {
                setConnectionStatus('connecting');
                setError(null);

                const ws = new WebSocket(WS_URL);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('[WebSocket] Connected to game server');
                    setConnectionStatus('connected');
                    setError(null);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        // Convert the agents object back to a Map
                        // Server serializes Map as plain object { "id": agent }
                        const agentsMap = new Map<AgentId, Agent>(
                            Object.entries(data.agents)
                        );

                        const state: GameState = {
                            ...data,
                            agents: agentsMap,
                        };

                        setGameState(state);
                    } catch (err) {
                        console.error('[WebSocket] Failed to parse message:', err);
                        setError('Failed to parse game state');
                    }
                };

                ws.onerror = (event) => {
                    console.error('[WebSocket] Error:', event);
                    setConnectionStatus('error');
                    setError('WebSocket connection error');
                };

                ws.onclose = () => {
                    console.log('[WebSocket] Connection closed');
                    setConnectionStatus('disconnected');
                    wsRef.current = null;

                    // Attempt to reconnect after delay
                    if (shouldReconnect.current) {
                        console.log(`[WebSocket] Reconnecting in ${RECONNECT_DELAY}ms...`);
                        reconnectTimeoutRef.current = window.setTimeout(() => {
                            connect();
                        }, RECONNECT_DELAY);
                    }
                };
            } catch (err) {
                console.error('[WebSocket] Connection failed:', err);
                setConnectionStatus('error');
                setError('Failed to connect to server');
            }
        }

        connect();

        // Cleanup function
        return () => {
            shouldReconnect.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    return { gameState, connectionStatus, error };
}
