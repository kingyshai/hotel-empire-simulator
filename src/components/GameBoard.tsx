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
    setupPhase 
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
    if (gamePhase === 'setup') return;
    
    if (isTilePlaceable(coordinate)) {
      const adjacents = getAdjacentTiles(coordinate, placedTiles);
      const adjacentChains = findPotentialMergers(coordinate, state);
      
      if (adjacentChains.length === 0) {
        // Found new hotel chain
        setSelectedFoundingTile({
          coordinate,
          connectedTiles: [coordinate]
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
  };
  
  const handleHotelSelection = (chainName: HotelChainName) => {
    if (!selectedFoundingTile) return;
    
    const { coordinate } = selectedFoundingTile;
    const connectedTiles = findConnectedTiles(coordinate, state.placedTiles);
    
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
  
  // Show hotel chain selector if needed
  if (selectedFoundingTile) {
    return (
      <HotelChainSelector 
        coordinate={selectedFoundingTile.coordinate}
        availableHeadquarters={availableHeadquarters}
        onHotelSelected={handleHotelSelection}
      />
    );
  }
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50">
        <h2 className="text-sm font-medium">Game Board</h2>
      </div>
      
      <div className="grid grid-cols-12">
        {generateAllBoardCoordinates().map(coord => (
          <motion.div
            key={coord}
            className={`
              relative
              w-8 h-8
              flex items-center justify-center
              text-xs font-medium uppercase
              border border-border/50
              ${getTileBackground(coord)}
              ${isTilePlaceable(coord) ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}
              ${wouldCauseIllegalMerger(coord) ? 'cursor-not-allowed' : ''}
            `}
            onClick={() => handleTileClick(coord)}
            whileHover={{ scale: isTilePlaceable(coord) ? 1.1 : 1 }}
            whileTap={{ scale: isTilePlaceable(coord) ? 0.9 : 1 }}
          >
            <BuildingTile coordinate={coord} />
          </motion.div>
        ))}
      </div>
      
      <div className="p-3 bg-secondary/10 border-t border-border/50">
        <div className="flex justify-between items-center">
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
        <div className="p-4 bg-secondary/20 border-t border-border/50">
          <Button 
            size="lg" 
            onClick={handleDealStartingTiles}
            className="w-full"
          >
            Deal Starting Tiles
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
