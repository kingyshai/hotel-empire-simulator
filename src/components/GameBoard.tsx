
import React, { useState } from 'react';
import BuildingTile from './BuildingTile';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import type { Coordinate, HotelChainName } from '@/types/game';
import { Button } from '@/components/ui/button';
import { getAdjacentTiles, findPotentialMergers, findConnectedTiles, shouldEndGame } from '@/utils/gameLogic';
import HotelChainSelector from './HotelChainSelector';
import MergerDialog from './MergerDialog';
import { toast } from '@/utils/toast';
import { ArrowRight } from 'lucide-react';

const GameBoard = () => {
  const { state, dispatch } = useGame();
  const { 
    players, 
    currentPlayerIndex, 
    placedTiles, 
    hotelChains,
    availableHeadquarters,
    gamePhase, 
    setupPhase,
    initialTiles
  } = state;
  
  const [selectedFoundingTile, setSelectedFoundingTile] = useState<{
    coordinate: Coordinate;
    connectedTiles: Coordinate[];
  } | null>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  const canEndGame = shouldEndGame(state);
  
  const generateAllBoardCoordinates = (): Coordinate[] => {
    const tiles: Coordinate[] = [];
    for (let row = 1; row <= 9; row++) {
      for (let col = 'A'; col <= 'L'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        tiles.push(`${row}${col}` as Coordinate);
      }
    }
    return tiles;
  };
  
  const getTileBackground = (coordinate: Coordinate): string => {
    if (placedTiles[coordinate]?.belongsToChain) {
      return hotelChains[placedTiles[coordinate].belongsToChain]?.color || 'bg-gray-500';
    }
    return 'bg-secondary/50';
  };
  
  const isTilePlaceable = (coordinate: Coordinate): boolean => {
    if (gamePhase !== 'placeTile') return false;
    if (placedTiles[coordinate]) return false;
    if (currentPlayer.tiles.indexOf(coordinate) === -1) return false;
    
    const adjacents = getAdjacentTiles(coordinate, placedTiles);
    
    if (adjacents.length === 0) return true;
    
    const adjacentChains = findPotentialMergers(coordinate, state);
    
    const safeChains = adjacentChains.filter(chain => 
      state.hotelChains[chain].tiles.length >= 11
    );
    
    return safeChains.length < 2;
  };
  
  const handleTileClick = (coordinate: Coordinate) => {
    // This function is no longer needed for the drawInitialTile phase
    if (gamePhase !== 'setup' || setupPhase !== 'drawInitialTile') {
      if (isTilePlaceable(coordinate)) {
        const adjacents = getAdjacentTiles(coordinate, placedTiles);
        const adjacentChains = findPotentialMergers(coordinate, state);
        
        if (adjacentChains.length === 0) {
          // Found new hotel chain
          const connectedTiles = findConnectedTiles(coordinate, state.placedTiles);
          setSelectedFoundingTile({
            coordinate,
            connectedTiles
          });
        } else {
          dispatch({ 
            type: 'PLACE_TILE', 
            payload: { 
              coordinate, 
              playerId: currentPlayer.id 
            } 
          });
        }
      } else {
        toast.error("You can't place a tile here!");
      }
    }
  };
  
  const handleDrawInitialTile = () => {
    dispatch({ 
      type: 'DRAW_INITIAL_TILE', 
      payload: { 
        playerId: currentPlayer.id 
      } 
    });
  };
  
  const handleHotelSelection = (chainName: HotelChainName) => {
    if (!selectedFoundingTile) return;
    
    const { coordinate, connectedTiles } = selectedFoundingTile;
    
    dispatch({
      type: 'FOUND_HOTEL',
      payload: {
        chainName,
        tileCoordinate: coordinate,
        connectedTiles
      }
    });
    
    setSelectedFoundingTile(null);
  };
  
  const handleCancelHotelSelection = () => {
    setSelectedFoundingTile(null);
  };
  
  const handleDealStartingTiles = () => {
    dispatch({ type: 'DEAL_STARTING_TILES' });
  };
  
  const handleEndGame = () => {
    dispatch({ type: 'END_GAME_MANUALLY' });
  };
  
  const handleEndTurn = () => {
    if (gamePhase !== 'buyStock') {
      toast.error("You must complete your current actions before ending your turn");
      return;
    }
    
    dispatch({ type: 'END_TURN' });
    
    if (!shouldEndGame(state)) {
      toast.success(`${players[(currentPlayerIndex + 1) % players.length].name}'s turn`);
    }
  };
  
  const wouldCauseIllegalMerger = (coordinate: Coordinate): boolean => {
    const adjacentChains = findPotentialMergers(coordinate, state);
    const safeChains = adjacentChains.filter(chain => 
      state.hotelChains[chain].tiles.length >= 11
    );
    return safeChains.length >= 2;
  };
  
  // Check if a coordinate is an initial tile
  const isInitialTile = (coordinate: Coordinate): boolean => {
    return initialTiles.some(tile => tile.coordinate === coordinate);
  };

  // Function to get the player's name who drew this initial tile
  const getInitialTilePlayerName = (coordinate: Coordinate): string | undefined => {
    const initialTile = initialTiles.find(tile => tile.coordinate === coordinate);
    if (initialTile) {
      const player = players.find(p => p.id === initialTile.playerId);
      return player?.name;
    }
    return undefined;
  };
  
  // Show hotel chain selector if needed
  if (selectedFoundingTile) {
    return (
      <HotelChainSelector 
        availableChains={availableHeadquarters}
        onSelect={handleHotelSelection}
        onCancel={handleCancelHotelSelection}
      />
    );
  }
  
  // Special display for the initial draw phase
  if (gamePhase === 'setup' && setupPhase === 'drawInitialTile') {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-3 bg-secondary/50 border-b border-border/50">
          <h2 className="text-lg font-medium">Draw Initial Tile</h2>
        </div>
        
        <div className="p-6 text-center">
          <p className="mb-4 text-lg">
            {currentPlayer?.name}, click the button below to draw your initial tile
          </p>
          
          <Button 
            onClick={handleDrawInitialTile}
            size="lg"
            className="mb-8 w-full max-w-lg mx-auto py-6 text-lg bg-primary/80 hover:bg-primary"
          >
            Draw Initial Tile
          </Button>
          
          <div className="grid grid-cols-12 gap-1 max-w-5xl mx-auto p-2 bg-accent/30 rounded-lg aspect-[2/1]">
            {generateAllBoardCoordinates().map((coord, index) => {
              const tileInitial = isInitialTile(coord);
              const playerName = tileInitial ? getInitialTilePlayerName(coord) : undefined;
              
              return (
                <motion.div
                  key={`draw-${coord}-${index}`}
                  className="relative aspect-square flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <BuildingTile
                    coordinate={coord}
                    isSelectable={false}
                    isAvailable={false}
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
          
          <p className="mt-4 text-sm text-muted-foreground">
            Each player draws an initial tile to determine the play order
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50">
        <h2 className="text-sm font-medium">Game Board</h2>
      </div>
      
      <div className="grid grid-cols-12 gap-0.5 p-2 bg-accent/30 aspect-[2/1] overflow-auto">
        {generateAllBoardCoordinates().map((coord, index) => {
          const isPlaced = !!placedTiles[coord];
          const belongsToChain = placedTiles[coord]?.belongsToChain;
          const isSelectable = isTilePlaceable(coord);
          const isUnplayable = wouldCauseIllegalMerger(coord);
          const isAvailable = currentPlayer?.tiles.includes(coord) && !isPlaced;
          const tileInitial = isInitialTile(coord);
          
          return (
            <div
              key={`board-${coord}-${index}`}
              className="aspect-square w-full h-full"
              onClick={() => handleTileClick(coord)}
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
            </div>
          );
        })}
      </div>
      
      <div className="p-3 bg-secondary/10 border-t border-border/50">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Game Status</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-background/50 rounded">
                <span>Phase:</span>
                <span className="font-medium capitalize">{gamePhase}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/50 rounded">
                <span>Current Player:</span>
                <span className="font-medium">{currentPlayer?.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleEndGame}
              disabled={gamePhase === 'setup' || !canEndGame}
              title={!canEndGame ? "End game conditions not met yet" : "End the game now"}
            >
              End Game
            </Button>
            
            <Button 
              size="lg"
              onClick={handleEndTurn}
              disabled={gamePhase !== 'buyStock'}
              className="flex items-center gap-1"
            >
              End Turn
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {setupPhase === 'dealTiles' && (
        <div className="p-6 bg-secondary/20 border-t border-border/50 text-center">
          <p className="mb-4 text-lg">Ready to start the game!</p>
          <Button 
            size="lg" 
            onClick={handleDealStartingTiles}
            className="w-full max-w-lg mx-auto text-lg py-6 animate-pulse bg-emerald-600 hover:bg-emerald-700"
          >
            Deal Starting Tiles to All Players
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
