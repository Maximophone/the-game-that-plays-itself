import React, { useState } from 'react';

interface GameControlsProps {
    currentAgentCount: number;
    onRestart: (agentCount: number) => void;
}

const GameControls: React.FC<GameControlsProps> = ({ currentAgentCount, onRestart }) => {
    const [agentCount, setAgentCount] = useState(currentAgentCount);
    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = async () => {
        setIsRestarting(true);
        await onRestart(agentCount);
        setIsRestarting(false);
    };

    return (
        <div className="game-controls">
            <h3>Game Controls</h3>

            <div className="control-group">
                <label htmlFor="agent-count">Agent Count:</label>
                <div className="range-wrapper">
                    <input
                        id="agent-count"
                        type="range"
                        min="1"
                        max="12"
                        value={agentCount}
                        onChange={(e) => setAgentCount(parseInt(e.target.value))}
                    />
                    <span className="count-value">{agentCount}</span>
                </div>
            </div>

            <button
                className="restart-button"
                onClick={handleRestart}
                disabled={isRestarting}
            >
                {isRestarting ? 'Restarting...' : 'Restart Game'}
            </button>
        </div>
    );
};

export default GameControls;
