import React from 'react';
import type { Agent as AgentType } from '../../../shared/types';

interface AgentProps {
    agent: AgentType;
    onClick?: () => void;
}

const Agent: React.FC<AgentProps> = ({ agent, onClick }) => {
    if (!agent.isAlive) return null;

    const style: React.CSSProperties = {
        left: `calc(${agent.position.x} * (var(--cell-size) + var(--grid-gap)))`,
        top: `calc(${agent.position.y} * (var(--cell-size) + var(--grid-gap)))`,
        width: 'var(--cell-size)',
        height: 'var(--cell-size)',
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
