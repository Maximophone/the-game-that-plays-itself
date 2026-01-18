import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReplayFile, ReplayTurn } from '../../../shared/replay-types';
import type { GameState, Agent as AgentType, AgentId } from '../../../shared/types';
import Grid from '../components/Grid';
import Agent from '../components/Agent';
import AgentInspector from '../components/AgentInspector';
import PlaybackControls from '../components/PlaybackControls';
import '../styles/ReplayViewer.css';

/**
 * Convert a ReplayTurn (with agents as object) to GameState (with agents as Map)
 */
function turnToGameState(turn: ReplayTurn): GameState {
    const agents = new Map<AgentId, AgentType>();
    for (const [id, agent] of Object.entries(turn.agents)) {
        agents.set(id, agent);
    }
    return {
        ...turn,
        agents,
    };
}

const ReplayViewer: React.FC = () => {
    const { filename } = useParams<{ filename: string }>();
    const navigate = useNavigate();

    const [replay, setReplay] = useState<ReplayFile | null>(null);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const cellSize = 40;

    // Load replay file
    useEffect(() => {
        const fetchReplay = async () => {
            if (!filename) {
                setError('No replay file specified');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/replays/${filename}`);
                if (!response.ok) {
                    throw new Error(`Failed to load replay: ${response.statusText}`);
                }
                const data: ReplayFile = await response.json();
                setReplay(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load replay');
            } finally {
                setLoading(false);
            }
        };

        fetchReplay();
    }, [filename]);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentTurn]);

    // Navigation handlers
    const handleFirst = useCallback(() => {
        setCurrentTurn(0);
        setIsPlaying(false);
    }, []);

    const handlePrevious = useCallback(() => {
        setCurrentTurn(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        if (!replay) return;
        setCurrentTurn(prev => Math.min(replay.turns.length - 1, prev + 1));
    }, [replay]);

    const handleLast = useCallback(() => {
        if (!replay) return;
        setCurrentTurn(replay.turns.length - 1);
        setIsPlaying(false);
    }, [replay]);

    const handlePlayPause = useCallback(() => {
        if (!replay) return;
        // Don't start playing if already at the end
        if (!isPlaying && currentTurn >= replay.turns.length - 1) {
            setCurrentTurn(0); // Reset to beginning
        }
        setIsPlaying(prev => !prev);
    }, [replay, isPlaying, currentTurn]);

    const handleSeek = useCallback((turn: number) => {
        if (!replay) return;
        setCurrentTurn(Math.max(0, Math.min(replay.turns.length - 1, turn)));
        setIsPlaying(false);
    }, [replay]);

    // Auto-play effect
    useEffect(() => {
        if (!isPlaying || !replay) return;

        const interval = setInterval(() => {
            setCurrentTurn(prev => {
                if (prev >= replay.turns.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, replay]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    break;
                case ' ':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'Home':
                    e.preventDefault();
                    handleFirst();
                    break;
                case 'End':
                    e.preventDefault();
                    handleLast();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleFirst, handlePrevious, handleNext, handleLast, handlePlayPause]);

    // Update selected agent when turn changes
    useEffect(() => {
        if (!replay) return;

        const currentAgents = replay.turns[currentTurn]?.agents;
        if (!currentAgents) return;

        setSelectedAgent(prev => {
            if (!prev) return null;
            if (currentAgents[prev.id]) {
                return currentAgents[prev.id];
            }
            return null;
        });
    }, [currentTurn, replay]);

    // Loading state
    if (loading) {
        return (
            <div className="replay-viewer">
                <div className="replay-loading">
                    <div className="spinner"></div>
                    <p>Loading replay...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !replay) {
        return (
            <div className="replay-viewer">
                <div className="replay-error">
                    <p>⚠️ {error || 'Failed to load replay'}</p>
                    <button onClick={() => navigate('/')}>Back to Menu</button>
                </div>
            </div>
        );
    }

    // Get current game state
    const currentReplayTurn = replay.turns[currentTurn];
    const gameState = turnToGameState(currentReplayTurn);
    const totalTurns = replay.turns.length;
    const aliveAgents = Array.from(gameState.agents.values()).filter(a => a.isAlive);

    return (
        <div className="replay-viewer">
            <header className="replay-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← Back to Menu
                </button>
                <div className="replay-title">
                    <span className="file-icon">📁</span>
                    <h1>{filename}</h1>
                </div>
                <div className="replay-info">
                    <span className="turn-indicator">Turn {currentTurn + 1} / {totalTurns}</span>
                    <span className="agents-count">{aliveAgents.length} agents alive</span>
                </div>
            </header>

            <div className="replay-content">
                <div className="grid-section">
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

                    <PlaybackControls
                        currentTurn={currentTurn}
                        totalTurns={totalTurns}
                        isPlaying={isPlaying}
                        onFirst={handleFirst}
                        onPrevious={handlePrevious}
                        onPlayPause={handlePlayPause}
                        onNext={handleNext}
                        onLast={handleLast}
                        onSeek={handleSeek}
                    />
                </div>

                {selectedAgent && (
                    <AgentInspector
                        agent={selectedAgent}
                        onClose={() => setSelectedAgent(null)}
                    />
                )}

                <div className="side-panel">
                    <div className="messages-panel">
                        <h2>Messages (Turn {currentTurn + 1})</h2>
                        <div className="messages-list">
                            {gameState.messages.length === 0 ? (
                                <div className="no-messages">No messages this turn...</div>
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

                    <div className="keyboard-hints">
                        <h3>Keyboard Shortcuts</h3>
                        <div className="hint-grid">
                            <kbd>←</kbd><span>Previous</span>
                            <kbd>→</kbd><span>Next</span>
                            <kbd>Space</kbd><span>Play/Pause</span>
                            <kbd>Home</kbd><span>First</span>
                            <kbd>End</kbd><span>Last</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReplayViewer;
