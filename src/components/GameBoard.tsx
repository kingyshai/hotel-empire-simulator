
import React from 'react';
import { useGame } from '@/context/GameContext';
import BuildingTile from './BuildingTile';
import { toast } from '@/utils/toast';
import { motion } from 'framer-motion';
import type { Coordinate } from '@/types/game';
import { Button } from '@/components/ui/button';

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { placedTiles, gamePhase, setupPhase, currentPlayerIndex, players, initialTiles } = state;
  
  const currentPlayer = players[currentPlayerIndex];
  
  const handleTileClick = (coordinate: Coordinate) => {
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

  const handleInitialTileDraw = () => {
    if (gamePhase !== 'setup' || setupPhase !== 'drawInitialTile') {
      return;
    }

    // Check if current player has already drawn an initial tile
    if (initialTiles.some(tile => tile.playerId === currentPlayer.id)) {
      // Move to next player for initial drawing
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      dispatch({ 
        type: 'SET_CURRENT_PLAYER', 
        payload: { playerIndex: nextPlayerIndex } 
      });
      return;
    }

    dispatch({
      type: 'DRAW_INITIAL_TILE',
      payload: {
        playerId: currentPlayer.id,
      },
    });
  };

  const handleDealStartingTiles = () => {
    if (gamePhase !== 'setup' || setupPhase !== 'dealTiles') {
      return;
    }

    dispatch({ type: 'DEAL_STARTING_TILES' });
  };
  
  // Generate board coordinates
  const generateBoard = () => {
    const rows = [];
    
    for (let row = 1; row <= 9; row++) {
      const cols = [];
      
      for (let col = 'A'; col <= 'L'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const coordinate = `${row}${col}` as Coordinate;
        const placedTile = placedTiles[coordinate];
        
        cols.push(
          <div key={coordinate} className="aspect-square w-full p-0.5">
            {placedTile ? (
              <BuildingTile 
                coordinate={coordinate}
                isPlaced
                belongsToChain={placedTile.belongsToChain}
              />
            ) : currentPlayer?.tiles.includes(coordinate) ? (
              <BuildingTile
                coordinate={coordinate}
                isPlaced={false}
                onClick={() => handleTileClick(coordinate)}
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

  // Render setup phase UI
  const renderSetupControls = () => {
    if (gamePhase !== 'setup') return null;

    switch (setupPhase) {
      case 'drawInitialTile':
        // Check if current player has already drawn
        const hasDrawn = initialTiles.some(tile => tile.playerId === currentPlayer?.id);
        const nextPlayer = hasDrawn ? 
          players[(currentPlayerIndex + 1) % players.length] : 
          currentPlayer;
        
        return (
          <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Initial Tile Draw</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Each player draws one tile to determine turn order.
              {hasDrawn ? 
                ` ${nextPlayer.name}'s turn to draw.` : 
                ` ${currentPlayer?.name}'s turn to draw.`}
            </p>
            <Button 
              onClick={handleInitialTileDraw}
              disabled={hasDrawn && initialTiles.length < players.length}
            >
              Draw Initial Tile
            </Button>
          </div>
        );
      
      case 'dealTiles':
        return (
          <div className="mt-4 p-4 bg-secondary/20 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Turn Order Determined</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {players[0].name} will go first based on initial tile placement.
            </p>
            <Button onClick={handleDealStartingTiles}>
              Deal Starting Tiles (6 per player)
            </Button>
          </div>
        );
      
      default:
        return null;
    }
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
        {renderSetupControls()}
      </div>
    </div>
  );
};

export default GameBoard;
