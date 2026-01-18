import type { Agent as AgentType, Action } from '../../../shared/types';

interface AgentInspectorProps {
    agent: AgentType | null;
}

const formatAction = (action: Action | undefined): string => {
    if (!action) return 'Waiting...';
    switch (action.type) {
        case 'move': return `Moving ${action.direction}`;
        case 'gather': return `Gathering ${action.direction}`;
        case 'build': return `Building ${action.block} ${action.direction}`;
        case 'speak': return `Saying: "${action.message}"`;
        case 'hit': return `Hitting ${action.direction}`;
        case 'eat': return `Eating`;
        case 'think': return `Thinking...`;
        case 'wait': return `Waiting`;
        default: return JSON.stringify(action);
    }
};

const AgentInspector: React.FC<AgentInspectorProps> = ({ agent }) => {
    if (!agent) return null;

    const hungerColor = agent.hunger < 30 ? '#ef4444' : agent.hunger < 60 ? '#f59e0b' : '#10b981';

    return (
        <div className="agent-inspector">
            <div className="inspector-header">
                <h2>
                    <span className="agent-color-dot" style={{ backgroundColor: agent.color }} />
                    {agent.name}
                </h2>
            </div>
            <div className="inspector-scroll-area">
                <div className="inspector-section">
                    <h3>Status</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Hunger</span>
                            <div className="stat-bar-container">
                                <div
                                    className="stat-bar-fill"
                                    style={{
                                        width: `${agent.hunger}%`,
                                        backgroundColor: hungerColor
                                    }}
                                />
                                <span className="stat-bar-text">{agent.hunger}/100</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Position</span>
                            <span className="stat-value">({agent.position.x}, {agent.position.y})</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">State</span>
                            <span className={`stat-value ${agent.isAlive ? 'alive' : 'dead'}`}>
                                {agent.isAlive ? 'Alive' : 'Dead'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="inspector-section">
                    <h3>Inventory ({agent.inventory.length}/5)</h3>
                    <div className="inventory-grid">
                        {agent.inventory.length === 0 ? (
                            <div className="empty-inventory">Empty</div>
                        ) : (
                            agent.inventory.map((slot, idx) => (
                                <div key={idx} className="inventory-item">
                                    <span className="inventory-type">{slot.type}</span>
                                    {slot.count > 1 && <span className="inventory-count">x{slot.count}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="inspector-section">
                    <h3>Brain</h3>
                    <div className="brain-snapshot">
                        <div className="snapshot-item">
                            <span className="snapshot-label">Last Thought</span>
                            <p className="snapshot-text">
                                {agent.lastThought ? `"${agent.lastThought}"` : 'No thoughts...'}
                            </p>
                        </div>
                        <div className="snapshot-item">
                            <span className="snapshot-label">Last Action</span>
                            <p className="snapshot-text">
                                {formatAction(agent.lastAction)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentInspector;
