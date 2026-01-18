import React from 'react';

interface PlaybackControlsProps {
    currentTurn: number;
    totalTurns: number;
    isPlaying: boolean;
    onFirst: () => void;
    onPrevious: () => void;
    onPlayPause: () => void;
    onNext: () => void;
    onLast: () => void;
    onSeek: (turn: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    currentTurn,
    totalTurns,
    isPlaying,
    onFirst,
    onPrevious,
    onPlayPause,
    onNext,
    onLast,
    onSeek,
}) => {
    const isAtStart = currentTurn === 0;
    const isAtEnd = currentTurn >= totalTurns - 1;
    const progress = totalTurns > 1 ? (currentTurn / (totalTurns - 1)) * 100 : 0;

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        const turn = Math.round(ratio * (totalTurns - 1));
        onSeek(turn);
    };

    return (
        <div className="playback-controls">
            <div className="control-buttons">
                <button
                    className="control-btn"
                    onClick={onFirst}
                    disabled={isAtStart}
                    title="First turn (Home)"
                    aria-label="First turn"
                >
                    ⏮
                </button>
                <button
                    className="control-btn"
                    onClick={onPrevious}
                    disabled={isAtStart}
                    title="Previous turn (←)"
                    aria-label="Previous turn"
                >
                    ◀
                </button>
                <button
                    className="control-btn play-btn"
                    onClick={onPlayPause}
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                    className="control-btn"
                    onClick={onNext}
                    disabled={isAtEnd}
                    title="Next turn (→)"
                    aria-label="Next turn"
                >
                    ▶
                </button>
                <button
                    className="control-btn"
                    onClick={onLast}
                    disabled={isAtEnd}
                    title="Last turn (End)"
                    aria-label="Last turn"
                >
                    ⏭
                </button>
            </div>

            <div className="progress-section">
                <div
                    className="progress-bar"
                    onClick={handleProgressClick}
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={totalTurns - 1}
                    aria-valuenow={currentTurn}
                    aria-label="Playback progress"
                    tabIndex={0}
                >
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                    <div
                        className="progress-thumb"
                        style={{ left: `${progress}%` }}
                    />
                </div>
                <div className="turn-display">
                    Turn {currentTurn + 1} / {totalTurns}
                </div>
            </div>
        </div>
    );
};

export default PlaybackControls;
