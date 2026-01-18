import React from 'react';
import type { Agent } from '../../../shared/types';

interface AgentInspectorProps {
    agent: Agent | null;
    onClose: () => void;
}

const AgentInspector: React.FC<AgentInspectorProps> = ({ agent, onClose }) => {
    if (!agent) return null;

    const hungerPercent = (agent.hunger / 100) * 100;
    const hungerColor = agent.hunger > 70 ? '#4ade80' : agent.hunger > 30 ? '#fbbf24' : '#ef4444';

    return (
        <div className="agent-inspector">
            <div className="inspector-header">
                <h2>
                    <span className="agent-color-dot" style={{ backgroundColor: agent.color }} />
                    {agent.name}
                </h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="inspector-content">
                <div className="inspector-section">
                    <h3>Status</h3>
                    <div className="status-item">
                        <span className="label">Alive:</span>
                        <span className={`value ${agent.isAlive ? 'alive' : 'dead'}`}>
                            {agent.isAlive ? '✓ Yes' : '✗ Dead'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="label">Hunger:</span>
                        <div className="hunger-bar">
                            <div
                                className="hunger-fill"
                                style={{
                                    width: `${hungerPercent}%`,
                                    backgroundColor: hungerColor
                                }}
                            />
                            <span className="hunger-text">{agent.hunger}/100</span>
                        </div>
                    </div>
                    <div className="status-item">
                        <span className="label">Position:</span>
                        <span className="value">({agent.position.x}, {agent.position.y})</span>
                    </div>
                </div>

                <div className="inspector-section">
                    <h3>Inventory ({agent.inventory.length}/5)</h3>
                    <div className="inventory-grid">
                        {agent.inventory.length === 0 ? (
                            <div className="empty-inventory">Empty</div>
                        ) : (
                            agent.inventory.map((item, i) => (
                                <div key={i} className="inventory-item">{item}</div>
                            ))
                        )}
                    </div>
                </div>

                {agent.lastThought && (
                    <div className="inspector-section">
                        <h3>💭 Last Thought</h3>
                        <div className="thought-bubble">{agent.lastThought}</div>
                    </div>
                )}

                {agent.lastAction && (
                    <div className="inspector-section">
                        <h3>⚡ Last Action</h3>
                        <div className="action-display">
                            {JSON.stringify(agent.lastAction, null, 2)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentInspector;
