import React from 'react';
import type { Agent as AgentType } from '../../../shared/types';

interface AgentProps {
    agent: AgentType;
    cellSize: number;
}

const Agent: React.FC<AgentProps> = ({ agent, cellSize }) => {
    const style: React.CSSProperties = {
        left: agent.position.x * cellSize,
        top: agent.position.y * cellSize,
        width: cellSize,
        height: cellSize,
    };

    return (
        <div className="agent" style={style}>
            <div
                className="agent-circle"
                style={{ backgroundColor: agent.color }}
            />
            <div className="agent-tooltip">
                <strong>{agent.name}</strong>
                <div>Hunger: {Math.round(agent.hunger)}%</div>
            </div>
        </div>
    );
};

export default Agent;
