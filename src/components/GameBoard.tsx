import React, { useState } from 'react';
import BuildingTile from './BuildingTile';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import type { Coordinate, HotelChainName } from '@/types/game';
import { Button } from '@/components/ui/button';
import { getAdjacentTiles, findPotentialMergers, findConnectedTiles, isTileBurned, getTileDistance } from '@/utils/gameLogic';
import HotelChainSelector from './HotelChainSelector';
import MergerDialog from './MergerDialog';
import { toast } from '@/utils/toast';
import TileDestinationDialog from './TileDestinationDialog';

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
  
  const [mergeDialogInfo, setMergeDialogInfo] = useState<{
    potentialMergers: HotelChainName[];
    tileCoordinate: Coordinate;
    open: boolean;
  } | null>(null);
  
  const [tileDestinationInfo, setTileDestinationInfo] = useState<{
    adjacentChains: HotelChainName[];
    coordinate: Coordinate;
    open: boolean;
  } | null>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  
  const generateAllBoardCoordinates = (): Coordinate[] => {
    const tiles: Coordinate[] = [];
    for (let row = 'A'; row <= 'I'; row = String.fromCharCode(row.charCodeAt(0) + 1)) {
      for (let col = 1; col <= 12; col++) {
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
    
    if (isTileBurned(coordinate, state)) return false;
    
    return true;
  };
  
  const handleTileClick = (coordinate: Coordinate) => {
    if (gamePhase !== 'setup' || setupPhase !== 'drawInitialTile') {
      if (isTilePlaceable(coordinate)) {
        const adjacents = getAdjacentTiles(coordinate, placedTiles);
        const adjacentChains = findPotentialMergers(coordinate, state);
        
        if (adjacentChains.length > 1) {
          setTileDestinationInfo({
            adjacentChains,
            coordinate,
            open: true
          });
          return;
        }
        
        if (adjacentChains.length === 0 && adjacents.length > 0) {
          const connectedTiles = findConnectedTiles(coordinate, state.placedTiles);
          
          if (connectedTiles.length > 1 && availableHeadquarters.length > 0) {
            setSelectedFoundingTile({
              coordinate,
              connectedTiles
            });
            return;
          } else if (connectedTiles.length > 1 && availableHeadquarters.length === 0) {
            toast.info("No hotel chains available to found. Placing tile as-is.");
            dispatch({ 
              type: 'PLACE_TILE', 
              payload: { 
                coordinate, 
                playerId: currentPlayer.id 
              } 
            });
            return;
          }
        }
        
        dispatch({ 
          type: 'PLACE_TILE', 
          payload: { 
            coordinate, 
            playerId: currentPlayer.id 
          } 
        });
      } else {
        if (isTileBurned(coordinate, state)) {
          toast.error("This tile is burned and cannot be placed. It would create an illegal merger between safe hotel chains.");
        } else {
          toast.error("You can't place a tile here!");
        }
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
  
  const handleMergerComplete = (survivingChain: HotelChainName) => {
    if (!mergeDialogInfo) return;
    
    const { tileCoordinate, potentialMergers } = mergeDialogInfo;
    
    const acquiredChains = potentialMergers.filter(chain => chain !== survivingChain);
    
    dispatch({
      type: 'HANDLE_MERGER',
      payload: {
        coordinate: tileCoordinate,
        playerId: currentPlayer.id,
        survivingChain,
        acquiredChains
      }
    });
    
    setMergeDialogInfo(null);
  };
  
  const handleMergerCancel = () => {
    setMergeDialogInfo(null);
  };
  
  const handleTileDestinationSelect = (selectedChain: HotelChainName) => {
    if (!tileDestinationInfo) return;
    
    const { coordinate, adjacentChains } = tileDestinationInfo;
    
    dispatch({
      type: 'PLACE_TILE_AND_ADD_TO_CHAIN',
      payload: {
        coordinate,
        playerId: currentPlayer.id,
        chainName: selectedChain
      }
    });
    
    const remainingChains = adjacentChains.filter(chain => chain !== selectedChain);
    
    if (remainingChains.length > 0) {
      const selectedChainSize = hotelChains[selectedChain].tiles.length + 1;
      
      const chainsToMerge = remainingChains.filter(chain => 
        hotelChains[chain].tiles.length <= selectedChainSize
      );
      
      if (chainsToMerge.length > 0) {
        setMergeDialogInfo({
          potentialMergers: [selectedChain, ...chainsToMerge],
          tileCoordinate: coordinate,
          open: true
        });
      } else {
        setTileDestinationInfo(null);
      }
    } else {
      setTileDestinationInfo(null);
    }
  };
  
  const handleTileDestinationCancel = () => {
    setTileDestinationInfo(null);
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
  
  const getBoardKey = () => {
    const chainStates = Object.keys(hotelChains).map(chain => {
      return `${chain}:${hotelChains[chain as HotelChainName].tiles.length}`;
    }).join('|');
    
    return `board-${currentPlayerIndex}-${chainStates}`;
  };
  
  if (selectedFoundingTile) {
    return (
      <HotelChainSelector 
        availableChains={availableHeadquarters}
        onSelect={handleHotelSelection}
        onCancel={handleCancelHotelSelection}
      />
    );
  }
  
  const currentPlayerName = players[currentPlayerIndex]?.name || `Player ${currentPlayerIndex + 1}`;
  
  const renderGameBoard = () => (
    <div className="grid grid-cols-12 gap-0.5 max-w-5xl mx-auto p-2 bg-accent/30 rounded-lg aspect-[2/1]">
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
  
  if (gamePhase === 'setup' && setupPhase === 'drawInitialTile') {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-3 bg-secondary/50 border-b border-border/50">
          <h2 className="text-lg font-medium">Draw Initial Tile</h2>
        </div>
        
        <div className="p-6 text-center">
          <p className="mb-4 text-lg">
            <span className="font-medium">{currentPlayer.name}</span>, click the button below to draw your initial tile
          </p>
          
          <Button 
            onClick={handleDrawInitialTile}
            size="lg"
            className="mb-8 w-full max-w-lg mx-auto py-6 text-lg bg-primary/80 hover:bg-primary"
          >
            Draw Initial Tile
          </Button>
          
          {initialTiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Initial Tiles Drawn:</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {initialTiles.map((tileInfo, index) => {
                  const player = players.find(p => p.id === tileInfo.playerId);
                  const distance = getTileDistance(tileInfo.coordinate);
                  return (
                    <div key={index} className="px-3 py-2 bg-secondary/30 rounded-md">
                      <span className="font-medium">{player?.name}</span>: {tileInfo.coordinate}
                      <span className="text-xs ml-2 text-muted-foreground">(Distance from 1A: {distance})</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                The player closest to 1A will go first. Note: Row position is more important than column (9A is closer to 1A than 1B).
              </p>
            </div>
          )}
          
          {renderGameBoard()}
          
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
      
      {setupPhase === 'dealTiles' && (
        <div className="p-6 bg-secondary/20 border-b border-border/50 text-center">
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
      
      <div key={getBoardKey()}>
        {renderGameBoard()}
      </div>
      
      <div className="p-3 bg-secondary/10 border-t border-border/50">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Your Available Tiles</h3>
            <div className="flex flex-wrap gap-1.5">
              {currentPlayer?.tiles.map((tile) => (
                <div 
                  key={`available-${tile}`}
                  className={`
                    text-xs font-mono px-1.5 py-0.5 rounded border 
                    ${isTilePlaceable(tile) 
                      ? 'bg-primary/10 border-primary/30 text-primary cursor-pointer hover:bg-primary/20' 
                      : 'bg-muted/30 border-muted/20 text-muted-foreground'
                    }
                  `}
                  onClick={() => isTilePlaceable(tile) && handleTileClick(tile)}
                >
                  {tile}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {mergeDialogInfo && (
        <MergerDialog
          potentialMergers={mergeDialogInfo.potentialMergers}
          tileCoordinate={mergeDialogInfo.tileCoordinate}
          onComplete={handleMergerComplete}
          onCancel={handleMergerCancel}
          open={mergeDialogInfo.open}
        />
      )}
      
      {tileDestinationInfo && (
        <TileDestinationDialog
          adjacentChains={tileDestinationInfo.adjacentChains}
          coordinate={tileDestinationInfo.coordinate}
          onSelect={handleTileDestinationSelect}
          onCancel={handleTileDestinationCancel}
          open={tileDestinationInfo.open}
        />
      )}
    </div>
  );
};

export default GameBoard;
