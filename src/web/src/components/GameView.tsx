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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
    const [activeTab, setActiveTab] = useState<'inspector' | 'messages'>('messages');

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

    // Grid Scaling Logic
    const gridContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleResize = () => {
            if (!gridContainerRef.current) return;
            const container = gridContainerRef.current;
            const horizontalPadding = 64;
            const verticalPadding = 64;

            const availableWidth = container.clientWidth - horizontalPadding;
            const availableHeight = container.clientHeight - verticalPadding;

            const gridWidth = gameState.grid.width;
            const gridHeight = gameState.grid.height;

            const cellW = (availableWidth - (gridWidth - 1) * 1) / gridWidth;
            const cellH = (availableHeight - (gridHeight - 1) * 1) / gridHeight;

            const newCellSize = Math.max(20, Math.floor(Math.min(40, cellW, cellH)));

            document.documentElement.style.setProperty('--cell-size', `${newCellSize}px`);
        };

        handleResize();
        const observer = new ResizeObserver(handleResize);
        if (gridContainerRef.current) observer.observe(gridContainerRef.current);

        return () => observer.disconnect();
    }, [gameState.grid.width, gameState.grid.height]);


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
        <div className="replay-viewer live-view">
            <header className="replay-header">
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
            </header>

            <div className="replay-content">
                <div className="grid-section">
                    <div className="grid-container" ref={gridContainerRef}>
                        <div className="grid-wrapper">
                            <Grid grid={gameState.grid} />
                            <div className="agent-layer">
                                {Array.from(gameState.agents.values()).map((agent) => (
                                    <Agent
                                        key={agent.id}
                                        agent={agent}
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            setActiveTab('inspector');
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="playback-controls live-controls">
                        <GameControls
                            currentAgentCount={gameState.agents.size}
                            onRestart={handleRestart}
                        />
                    </div>
                </div>

                <div className="side-panel">
                    <nav className="sidebar-tabs">
                        <button
                            className={`tab-button ${activeTab === 'inspector' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inspector')}
                        >
                            Inspector
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
                            onClick={() => setActiveTab('messages')}
                        >
                            Log & Controls
                        </button>
                    </nav>

                    <div className="tab-content">
                        {activeTab === 'inspector' && (
                            <div className="tab-panel">
                                {selectedAgent ? (
                                    <AgentInspector agent={selectedAgent} />
                                ) : (
                                    <div className="inspector-placeholder">
                                        <p>Select an agent on the grid to view details</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="tab-panel">
                                <div className="messages-panel">
                                    <div className="live-controls-panel">
                                        <GameControls
                                            currentAgentCount={gameState.agents.size}
                                            onRestart={handleRestart}
                                        />
                                    </div>
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameView;
