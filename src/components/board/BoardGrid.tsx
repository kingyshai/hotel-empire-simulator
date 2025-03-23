
import React from 'react';
import { motion } from 'framer-motion';
import BuildingTile from '../BuildingTile';
import { Coordinate, HotelChainName } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { isTileBurned } from '@/utils/gameLogic';

interface BoardGridProps {
  onTileClick: (coordinate: Coordinate) => void;
  getBoardKey: () => string;
}

const BoardGrid: React.FC<BoardGridProps> = ({ onTileClick, getBoardKey }) => {
  const { state } = useGame();
  const { 
    players, 
    currentPlayerIndex, 
    placedTiles, 
    hotelChains,
    gamePhase, 
    initialTiles
  } = state;
  
  const currentPlayer = players[currentPlayerIndex];
  
  const generateAllBoardCoordinates = (): Coordinate[] => {
    const tiles: Coordinate[] = [];
    for (let col = 'A'; col <= 'I'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
      for (let row = 1; row <= 12; row++) {
        tiles.push(`${col}${row}` as Coordinate);
      }
    }
    return tiles;
  };
  
  const isTilePlaceable = (coordinate: Coordinate): boolean => {
    if (gamePhase !== 'placeTile') return false;
    if (placedTiles[coordinate]) return false;
    if (currentPlayer.tiles.indexOf(coordinate) === -1) return false;
    
    if (isTileBurned(coordinate, state)) return false;
    
    return true;
  };
  
  const wouldCauseIllegalMerger = (coordinate: Coordinate): boolean => {
    return isTileBurned(coordinate, state);
  };
  
  const isInitialTile = (coordinate: Coordinate): boolean => {
    return initialTiles.some(tile => tile.coordinate === coordinate);
  };

  const getInitialTilePlayerName = (coordinate: Coordinate): string | undefined => {
    if (gamePhase !== 'setup') return undefined;
    
    const initialTile = initialTiles.find(tile => tile.coordinate === coordinate);
    if (!initialTile) return undefined;
    
    const player = players.find(p => p.id === initialTile.playerId);
    return player?.name;
  };
  
  return (
    <div key={getBoardKey()} className="grid grid-cols-9 gap-0.5 max-w-5xl mx-auto p-2 bg-accent/30 rounded-lg aspect-[2/1]">
      {generateAllBoardCoordinates().map((coord) => {
        const isPlaced = !!placedTiles[coord];
        const belongsToChain = placedTiles[coord]?.belongsToChain;
        const isSelectable = isTilePlaceable(coord);
        const isUnplayable = wouldCauseIllegalMerger(coord);
        const isAvailable = currentPlayer?.tiles.includes(coord) && !isPlaced;
        const tileInitial = isInitialTile(coord);
        const playerName = tileInitial ? getInitialTilePlayerName(coord) : undefined;
        
        return (
          <motion.div
            key={`tile-${coord}-${belongsToChain || 'none'}`}
            className="relative aspect-square flex items-center justify-center scale-95"
            whileHover={isSelectable ? { scale: 1.0 } : {}}
            whileTap={isSelectable ? { scale: 0.9 } : {}}
            onClick={() => onTileClick(coord)}
          >
            <BuildingTile 
              coordinate={coord} 
              belongsToChain={belongsToChain}
              isPlaced={isPlaced}
              isSelectable={isSelectable}
              isAvailable={isAvailable}
              isUnplayable={isUnplayable}
              isInitialTile={tileInitial}
            />
            {playerName && (
              <div className="absolute top-full mt-1 text-xs bg-yellow-100 text-yellow-800 rounded px-1 whitespace-nowrap">
                {playerName}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default BoardGrid;
