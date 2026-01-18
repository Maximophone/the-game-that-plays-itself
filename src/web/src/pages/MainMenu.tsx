import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReplayCard from '../components/ReplayCard';
import type { ReplayInfo } from '../../../shared/replay-types';
import '../styles/MainMenu.css';

const MainMenu: React.FC = () => {
    const [replays, setReplays] = useState<ReplayInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReplays = async () => {
            try {
                const response = await fetch('/api/replays');
                if (!response.ok) {
                    throw new Error('Failed to fetch replays');
                }
                const data = await response.json();
                setReplays(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchReplays();
    }, []);

    return (
        <div className="main-menu">
            <header className="menu-header">
                <h1>The Game That Plays Itself</h1>
                <p className="subtitle">Replay Viewer</p>
            </header>

            <section className="replays-section">
                <div className="section-header">
                    <h2>Available Replays</h2>
                    <Link to="/live" className="live-link">
                        <span className="live-dot"></span>
                        Watch Live
                    </Link>
                </div>

                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Scanning replays...</p>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <p>⚠️ {error}</p>
                        <button onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                )}

                {!loading && !error && replays.length === 0 && (
                    <div className="empty-state">
                        <p>No replays found.</p>
                        <code>npm run simulate</code>
                        <p className="hint">Run this command to generate a new simulation.</p>
                    </div>
                )}

                {!loading && !error && replays.length > 0 && (
                    <div className="replays-grid">
                        {replays.map((replay) => (
                            <ReplayCard key={replay.fileName} replay={replay} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default MainMenu;
