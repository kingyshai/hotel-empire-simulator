
import React from 'react';
import { useGame } from '@/context/GameContext';
import BuildingTile from './BuildingTile';
import { toast } from '@/components/ui/sonner';
import { motion } from 'framer-motion';

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { placedTiles, gamePhase, currentPlayerIndex, players } = state;
  
  const currentPlayer = players[currentPlayerIndex];
  
  const handleTileClick = (coordinate: string) => {
    if (gamePhase !== 'placeTile') {
      toast("It's not time to place a tile yet");
      return;
    }
    
    if (!currentPlayer.tiles.includes(coordinate)) {
      toast.error("You don't have this tile!");
      return;
    }
    
    dispatch({
      type: 'PLACE_TILE',
      payload: {
        coordinate,
        playerId: currentPlayer.id,
      },
    });
  };
  
  // Generate board coordinates
  const generateBoard = () => {
    const rows = [];
    
    for (let row = 1; row <= 9; row++) {
      const cols = [];
      
      for (let col = 'A'; col <= 'L'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const coordinate = `${row}${col}`;
        const placedTile = placedTiles[coordinate];
        
        cols.push(
          <div key={coordinate} className="aspect-square w-full p-0.5">
            {placedTile ? (
              <BuildingTile 
                coordinate={coordinate}
                isPlaced
                belongsToChain={placedTile.belongsToChain}
              />
            ) : (
              <motion.div 
                className="w-full h-full rounded-md border border-border/30 bg-secondary/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * (row + col.charCodeAt(0) % 12) / 20 }}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  {coordinate}
                </div>
              </motion.div>
            )}
          </div>
        );
      }
      
      rows.push(
        <div key={row} className="grid grid-cols-12 w-full">
          {cols}
        </div>
      );
    }
    
    return rows;
  };
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-sm font-medium">Game Board</h2>
        <div className="text-xs text-muted-foreground">
          {Object.keys(placedTiles).length} / 108 tiles placed
        </div>
      </div>
      
      <div className="p-3">
        {generateBoard()}
      </div>
    </div>
  );
};

export default GameBoard;
