import React from 'react';
import type { GameState } from '../../../shared/types';
import Grid from './Grid';
import Agent from './Agent';

interface GameViewProps {
    gameState: GameState;
}

const GameView: React.FC<GameViewProps> = ({ gameState }) => {
    const cellSize = 40; // Should match --cell-size in index.css

    return (
        <div className="game-container">
            <div className="game-header">
                <h1>The Game That Plays Itself</h1>
                <div className="turn-counter">Turn {gameState.turn}</div>
            </div>

            <div className="grid-wrapper">
                <Grid grid={gameState.grid} />
                <div className="agent-layer">
                    {Array.from(gameState.agents.values()).map((agent) => (
                        <Agent key={agent.id} agent={agent} cellSize={cellSize} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameView;
