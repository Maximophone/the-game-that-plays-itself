import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReplayInfo } from '../../../shared/replay-types';
import { ENGINE_VERSION } from '../../../shared/version';

interface ReplayCardProps {
    replay: ReplayInfo;
}

const ReplayCard: React.FC<ReplayCardProps> = ({ replay }) => {
    const navigate = useNavigate();
    const { metadata, fileName } = replay;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const checkVersion = (version: string) => {
        if (version === ENGINE_VERSION) return { level: 'match', text: `✓ Engine v${version}` };

        const [cMajor] = ENGINE_VERSION.split('.').map(Number);
        const [rMajor] = version.split('.').map(Number);

        if (cMajor !== rMajor) {
            return {
                level: 'major-mismatch',
                text: `⚠️ Engine v${version} → Current v${ENGINE_VERSION}`,
                warning: 'Major version mismatch. Playback may fail.'
            };
        }

        return {
            level: 'minor-mismatch',
            text: `⚠️ Engine v${version} → Current v${ENGINE_VERSION}`,
            warning: 'Minor version mismatch. Some issues possible.'
        };
    };

    const versionStatus = checkVersion(metadata.engineVersion);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✅';
            case 'crashed': return '🔴';
            case 'running': return '🟡';
            default: return '❓';
        }
    };

    return (
        <div className="replay-card">
            <div className="card-header">
                <span className="file-icon">📁</span>
                <h3 className="file-name">{fileName}</h3>
                <span className="status-badge" title={metadata.status}>
                    {getStatusIcon(metadata.status)}
                </span>
            </div>

            <div className={`version-warning ${versionStatus.level}`}>
                {versionStatus.text}
            </div>

            <div className="card-details">
                <div className="detail-item">
                    <span className="label">🕐 Date:</span>
                    <span className="value">{formatDate(metadata.createdAt)}</span>
                </div>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="label">🗺️ Map:</span>
                        <span className="value">{metadata.config.gridWidth}x{metadata.config.gridHeight}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">🔄 Turns:</span>
                        <span className="value">{metadata.finalTurn}</span>
                    </div>
                </div>
            </div>

            {versionStatus.warning && (
                <div className="version-alert">
                    {versionStatus.warning}
                </div>
            )}

            <button
                className="watch-button"
                onClick={() => navigate(`/replay/${fileName}`)}
            >
                Watch Replay
            </button>
        </div>
    );
};

export default ReplayCard;
