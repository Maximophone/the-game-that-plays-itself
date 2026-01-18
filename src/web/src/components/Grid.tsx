import React from 'react';
import type { Grid as GridType, Cell as CellType } from '../../../shared/types';

interface GridProps {
    grid: GridType;
}

const Grid: React.FC<GridProps> = ({ grid }) => {
    const getBlockInfo = (cell: CellType) => {
        if (!cell.block) {
            return `Terrain: ${cell.terrain}`;
        }

        const blockInfo: Record<string, string> = {
            'grass': 'Empty grass terrain',
            'stone': 'Stone - Gatherable resource',
            'wood': 'Wood - Gatherable resource',
            'berry_bush': 'Berry Bush - Gather berries (bush remains)',
            'berry': 'Berry - Food item',
        };

        return `${blockInfo[cell.block] || cell.block}`;
    };

    const renderCell = (cell: CellType, x: number, y: number) => {
        const info = getBlockInfo(cell);
        return (
            <div
                key={`${x}-${y}`}
                className={`cell ${cell.terrain}`}
            >
                {cell.block && (
                    <div className={`block ${cell.block}`}>
                        {cell.block === 'berry_bush' && <div className="berry-dot" />}
                    </div>
                )}
                <div className="cell-tooltip">
                    {info}
                </div>
            </div>
        );
    };

    const gridStyle: React.CSSProperties = {
        gridTemplateColumns: `repeat(${grid.width}, var(--cell-size))`,
        gridTemplateRows: `repeat(${grid.height}, var(--cell-size))`,
        '--grid-width': grid.width,
        '--grid-height': grid.height,
    } as React.CSSProperties;

    return (
        <div className="grid" style={gridStyle}>
            {grid.cells.map((row, y) =>
                row.map((cell, x) => renderCell(cell, x, y))
            )}
        </div>
    );
};

export default Grid;
