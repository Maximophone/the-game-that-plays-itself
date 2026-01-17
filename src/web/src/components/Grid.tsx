import React from 'react';
import type { Grid as GridType, Cell as CellType } from '../../../shared/types';

interface GridProps {
    grid: GridType;
}

const Grid: React.FC<GridProps> = ({ grid }) => {
    const renderCell = (cell: CellType, x: number, y: number) => {
        return (
            <div key={`${x}-${y}`} className={`cell ${cell.terrain}`}>
                {cell.block && (
                    <div className={`block ${cell.block}`}>
                        {cell.block === 'berry_bush' && <div className="berry-dot" />}
                    </div>
                )}
            </div>
        );
    };

    const gridStyle: React.CSSProperties = {
        gridTemplateColumns: `repeat(${grid.width}, var(--cell-size))`,
        gridTemplateRows: `repeat(${grid.height}, var(--cell-size))`,
    };

    return (
        <div className="grid" style={gridStyle}>
            {grid.cells.map((row, y) =>
                row.map((cell, x) => renderCell(cell, x, y))
            )}
        </div>
    );
};

export default Grid;
