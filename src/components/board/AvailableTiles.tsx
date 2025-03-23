
import React from 'react';
import { Coordinate } from '@/types/game';

interface AvailableTilesProps {
  tiles: Coordinate[];
  onTileClick: (coordinate: Coordinate) => void;
  isTilePlaceable: (coordinate: Coordinate) => boolean;
}

const AvailableTiles: React.FC<AvailableTilesProps> = ({ 
  tiles, 
  onTileClick,
  isTilePlaceable
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Your Available Tiles</h3>
      <div className="flex flex-wrap gap-1.5">
        {tiles.map((tile) => (
          <div 
            key={`available-${tile}`}
            className={`
              text-xs font-mono px-1.5 py-0.5 rounded border 
              ${isTilePlaceable(tile) 
                ? 'bg-primary/10 border-primary/30 text-primary cursor-pointer hover:bg-primary/20' 
                : 'bg-muted/30 border-muted/20 text-muted-foreground'
              }
            `}
            onClick={() => isTilePlaceable(tile) && onTileClick(tile)}
          >
            {tile}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableTiles;
