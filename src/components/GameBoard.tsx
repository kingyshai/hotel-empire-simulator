
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import BuildingTile from './BuildingTile';
import { toast } from '@/utils/toast';
import { motion } from 'framer-motion';
import type { Coordinate, HotelChainName } from '@/types/game';
import { Button } from '@/components/ui/button';
import { getAdjacentTiles, findPotentialMergers, findConnectedTiles } from '@/utils/gameLogic';
import HotelChainSelector from './HotelChainSelector';
import MergerDialog from './MergerDialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const GameBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { placedTiles, gamePhase, setupPhase, currentPlayerIndex, players, initialTiles, availableHeadquarters, hotelChains } = state;
  const [tileToFoundHotel, setTileToFoundHotel] = useState<Coordinate | null>(null);
  const [connectedTiles, setConnectedTiles] = useState<Coordinate[]>([]);
  const [mergerInfo, setMergerInfo] = useState<{
    coordinate: Coordinate;
    potentialMergers: HotelChainName[];
  } | null>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  
  const generateAllBoardCoordinates = (): Coordinate[] => {
    const coords: Coordinate[] = [];
    
    for (let row = 1; row <= 9; row++) {
      for (let col = 'A'; col <= 'L'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        coords.push(`${row}${col}` as Coordinate);
      }
    }
    
    return coords;
  };
  
  const handleTileClick = (coordinate: Coordinate) => {
    if (gamePhase !== 'placeTile') {
      toast("It's not time to place a tile yet");
      return;
    }
    
    if (!currentPlayer.tiles.includes(coordinate)) {
      toast.error("You don't have this tile!");
      return;
    }
    
    const tempPlacedTiles = { 
      ...placedTiles, 
      [coordinate]: { coordinate, isPlaced: true } 
    };
    
    const adjacentTiles = getAdjacentTiles(coordinate, tempPlacedTiles);
    
    if (adjacentTiles.length > 0) {
      const adjacentChains = findPotentialMergers(coordinate, { ...state, placedTiles: tempPlacedTiles });
      
      // Check for merger scenario (multiple chains)
      if (adjacentChains.length > 1) {
        // Set merger info and show merger dialog
        setMergerInfo({
          coordinate,
          potentialMergers: adjacentChains
        });
        return;
      } else if (adjacentChains.length === 1) {
        dispatch({
          type: 'PLACE_TILE',
          payload: {
            coordinate,
            playerId: currentPlayer.id,
          },
        });
      } else if (adjacentTiles.length > 0 && adjacentChains.length === 0 && availableHeadquarters.length > 0) {
        const connected = findConnectedTiles(coordinate, tempPlacedTiles);
        
        if (connected.length >= 2) {
          setTileToFoundHotel(coordinate);
          setConnectedTiles([coordinate, ...connected.filter(t => t !== coordinate)]);
          toast.info("Choose a hotel chain to establish");
        } else {
          dispatch({
            type: 'PLACE_TILE',
            payload: {
              coordinate,
              playerId: currentPlayer.id,
            },
          });
        }
      } else {
        dispatch({
          type: 'PLACE_TILE',
          payload: {
            coordinate,
            playerId: currentPlayer.id,
          },
        });
      }
    } else {
      dispatch({
        type: 'PLACE_TILE',
        payload: {
          coordinate,
          playerId: currentPlayer.id,
        },
      });
    }
  };

  const handleFoundHotel = (chainName: HotelChainName) => {
    if (!tileToFoundHotel) return;
    
    dispatch({
      type: 'FOUND_HOTEL',
      payload: {
        chainName,
        tileCoordinate: tileToFoundHotel,
        connectedTiles: connectedTiles,
      },
    });
    
    setTileToFoundHotel(null);
    setConnectedTiles([]);
  };

  const handleMerger = (survivingChain: HotelChainName) => {
    if (!mergerInfo) return;
    
    const { coordinate, potentialMergers } = mergerInfo;
    
    // Filter out the surviving chain from the list of chains being acquired
    const acquiredChains = potentialMergers.filter(chain => chain !== survivingChain);
    
    dispatch({
      type: 'HANDLE_MERGER',
      payload: {
        coordinate,
        playerId: currentPlayer.id,
        survivingChain,
        acquiredChains
      }
    });
    
    setMergerInfo(null);
  };

  const handleCancelMerger = () => {
    setMergerInfo(null);
  };

  const handleInitialTileDraw = () => {
    if (gamePhase !== 'setup' || setupPhase !== 'drawInitialTile') {
      return;
    }

    if (initialTiles.some(tile => tile.playerId === currentPlayer.id)) {
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
  
  const wouldCauseIllegalMerger = (coordinate: Coordinate): boolean => {
    const tempPlacedTiles = { 
      ...placedTiles, 
      [coordinate]: { coordinate, isPlaced: true } 
    };
    
    const adjacentChains = findPotentialMergers(coordinate, { ...state, placedTiles: tempPlacedTiles });
    
    // Check if multiple chains are safe (11+ tiles)
    const safeChains = adjacentChains.filter(chain => 
      hotelChains[chain].tiles.length >= 11
    );
    
    return safeChains.length >= 2;
  };

  const generateBoard = () => {
    const rows = [];
    
    for (let row = 1; row <= 9; row++) {
      const cols = [];
      
      for (let col = 'A'; col <= 'L'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const coordinate = `${row}${col}` as Coordinate;
        const placedTile = placedTiles[coordinate];
        const isInPlayerHand = currentPlayer?.tiles.includes(coordinate);
        const isIllegalMerger = isInPlayerHand && wouldCauseIllegalMerger(coordinate);
        
        cols.push(
          <div key={coordinate} className="aspect-square w-full p-0.5">
            {placedTile ? (
              <BuildingTile 
                coordinate={coordinate}
                isPlaced
                belongsToChain={placedTile.belongsToChain}
              />
            ) : isInPlayerHand ? (
              <BuildingTile
                coordinate={coordinate}
                isPlaced={false}
                onClick={() => handleTileClick(coordinate)}
                isUnplayable={isIllegalMerger}
                isAvailable={!isIllegalMerger} // Show as available if not illegal
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

  const handlePlayAsAnyPlayer = (playerIndex: number) => {
    if (playerIndex === currentPlayerIndex) return;
    
    dispatch({ 
      type: 'SET_CURRENT_PLAYER', 
      payload: { playerIndex } 
    });
    
    toast.info(`Now playing as ${players[playerIndex].name}`);
  };

  const renderSetupControls = () => {
    if (gamePhase !== 'setup') return null;

    switch (setupPhase) {
      case 'drawInitialTile':
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
  
  const renderTestControls = () => {
    if (players.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 border border-yellow-500/30 bg-yellow-500/5 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-500/80 mb-2">Testing Controls</h3>
        <div className="flex flex-wrap gap-2">
          {players.map((player, index) => (
            <Button 
              key={player.id}
              variant="outline"
              size="sm"
              className={currentPlayerIndex === index ? "border-yellow-500/50 bg-yellow-500/10" : ""}
              onClick={() => handlePlayAsAnyPlayer(index)}
            >
              Play as {player.name}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-sm font-medium">Game Board</h2>
        <div className="text-xs text-muted-foreground">
          {Object.keys(placedTiles).length} / 108 tiles placed
        </div>
      </div>
      
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[500px]"
      >
        <ResizablePanel defaultSize={75} minSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={85} minSize={70}>
              <div className="p-3 overflow-auto max-h-[70vh]">
                {generateBoard()}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={15}>
              <div className="p-3 bg-secondary/10">
                {renderSetupControls()}
                {renderTestControls()}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={20}>
          <div className="p-3 bg-secondary/10 h-full overflow-auto">
            <h3 className="text-sm font-medium mb-3">Game Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-background/50 rounded">
                <span>Phase:</span>
                <span className="font-medium capitalize">{gamePhase}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/50 rounded">
                <span>Current Player:</span>
                <span className="font-medium">{currentPlayer?.name}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/50 rounded">
                <span>Tiles Placed:</span>
                <span className="font-medium">{Object.keys(placedTiles).length}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/50 rounded">
                <span>Active Chains:</span>
                <span className="font-medium">
                  {Object.keys(hotelChains).filter(chain => 
                    hotelChains[chain as HotelChainName].isEstablished
                  ).length}
                </span>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {tileToFoundHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Found a Hotel Chain</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a hotel chain to establish at {tileToFoundHotel}
            </p>
            <HotelChainSelector 
              availableChains={availableHeadquarters}
              onSelect={handleFoundHotel}
              onCancel={() => setTileToFoundHotel(null)}
            />
          </div>
        </div>
      )}
      
      {mergerInfo && (
        <MergerDialog
          open={!!mergerInfo}
          potentialMergers={mergerInfo.potentialMergers}
          tileCoordinate={mergerInfo.coordinate}
          onComplete={handleMerger}
          onCancel={handleCancelMerger}
        />
      )}
    </div>
  );
};

export default GameBoard;
