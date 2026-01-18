import React from 'react';
import type { Agent as AgentType } from '../../../shared/types';

interface AgentProps {
    agent: AgentType;
    cellSize: number;
    onClick?: () => void;
}

const Agent: React.FC<AgentProps> = ({ agent, cellSize, onClick }) => {
    if (!agent.isAlive) return null;

    const style: React.CSSProperties = {
        left: `${agent.position.x * cellSize}px`,
        top: `${agent.position.y * cellSize}px`,
        backgroundColor: agent.color,
        cursor: onClick ? 'pointer' : 'default',
    };

    return (
        <div
            className="agent"
            style={style}
            title={`${agent.name} (Hunger: ${agent.hunger})`}
            onClick={onClick}
        >
            <div className="agent-name">{agent.name}</div>
        </div>
    );
};

export default Agent;
