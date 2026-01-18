import React, { useEffect, useRef, useState } from 'react';
import type { GameState, Agent as AgentType } from '../../../shared/types';
import Grid from './Grid';
import Agent from './Agent';
import AgentInspector from './AgentInspector';
import GameControls from './GameControls';

interface GameViewProps {
    gameState: GameState;
    connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const GameView: React.FC<GameViewProps> = ({ gameState, connectionStatus = 'connected' }) => {
    const cellSize = 40; // Should match --cell-size in index.css
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.messages]);

    // Update selected agent when game state updates
    useEffect(() => {
        if (selectedAgent) {
            const updatedAgent = gameState.agents.get(selectedAgent.id);
            if (updatedAgent) {
                setSelectedAgent(updatedAgent);
            } else {
                setSelectedAgent(null); // Agent no longer exists
            }
        }
    }, [gameState, selectedAgent]);

    const handleRestart = async (agentCount: number) => {
        try {
            await fetch('/api/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentCount }),
            });
            // Selection will clear automatically via effect if agent ID changes/disappears
            setSelectedAgent(null);
        } catch (error) {
            console.error('Failed to restart game:', error);
        }
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#4ade80'; // green
            case 'connecting': return '#fbbf24'; // yellow
            case 'disconnected': return '#f87171'; // red
            case 'error': return '#dc2626'; // dark red
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Connected';
            case 'connecting': return 'Connecting...';
            case 'disconnected': return 'Disconnected';
            case 'error': return 'Connection Error';
        }
    };

    const aliveAgents = Array.from(gameState.agents.values()).filter(a => a.isAlive);

    return (
        <div className="game-container">
            <div className="game-header">
                <h1>The Game That Plays Itself</h1>
                <div className="header-stats">
                    <div className="turn-counter">Turn {gameState.turn}</div>
                    <div className="status-indicator">
                        <div
                            className="status-dot"
                            style={{ backgroundColor: getStatusColor() }}
                        />
                        <span className="status-text">{getStatusText()}</span>
                    </div>
                    <div className="agents-alive">
                        {aliveAgents.length} agent{aliveAgents.length !== 1 ? 's' : ''} alive
                    </div>
                </div>
            </div>

            <div className="game-content">
                <div className="grid-wrapper">
                    <Grid grid={gameState.grid} />
                    <div className="agent-layer">
                        {Array.from(gameState.agents.values()).map((agent) => (
                            <Agent
                                key={agent.id}
                                agent={agent}
                                cellSize={cellSize}
                                onClick={() => setSelectedAgent(agent)}
                            />
                        ))}
                    </div>
                </div>

                {selectedAgent && (
                    <AgentInspector
                        agent={selectedAgent}
                        onClose={() => setSelectedAgent(null)}
                    />
                )}

                <div className="side-panel">
                    <GameControls
                        currentAgentCount={gameState.agents.size}
                        onRestart={handleRestart}
                    />

                    <div className="messages-panel">
                        <h2>Recent Messages</h2>
                        <div className="messages-list">
                            {gameState.messages.length === 0 ? (
                                <div className="no-messages">No messages yet...</div>
                            ) : (
                                gameState.messages.map((msg, index) => (
                                    <div key={index} className="message">
                                        <div className="message-header">
                                            <span className="message-agent">{msg.agentName}</span>
                                            <span className="message-turn">Turn {msg.turn}</span>
                                        </div>
                                        <div className="message-content">{msg.content}</div>
                                        <div className="message-position">
                                            at ({msg.position.x}, {msg.position.y})
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameView;
