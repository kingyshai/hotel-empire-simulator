
import React, { useState } from 'react';
import { Coordinate, HotelChainName } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { getAdjacentTiles, findPotentialMergers, findConnectedTiles, isTileBurned } from '@/utils/gameLogic';
import HotelChainSelector from '../HotelChainSelector';
import MergerDialog from '../MergerDialog';
import TileDestinationDialog from '../TileDestinationDialog';
import { toast } from '@/utils/toast';

interface TileHandlerProps {
  onTileHandled: () => void;
  children: React.ReactNode;
}

const TileHandler: React.FC<TileHandlerProps> = ({ onTileHandled, children }) => {
  const { state, dispatch } = useGame();
  const { 
    players, 
    currentPlayerIndex, 
    placedTiles, 
    hotelChains,
    availableHeadquarters,
    gamePhase
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
  
  const handleTileClick = (coordinate: Coordinate) => {
    if (gamePhase !== 'setup' || state.setupPhase !== 'drawInitialTile') {
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
  
  const isTilePlaceable = (coordinate: Coordinate): boolean => {
    if (gamePhase !== 'placeTile') return false;
    if (placedTiles[coordinate]) return false;
    if (currentPlayer.tiles.indexOf(coordinate) === -1) return false;
    
    if (isTileBurned(coordinate, state)) return false;
    
    return true;
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
  
  // Render dialogs and handle hotel selection UI
  if (selectedFoundingTile) {
    return (
      <HotelChainSelector 
        availableChains={availableHeadquarters}
        onSelect={handleHotelSelection}
        onCancel={handleCancelHotelSelection}
      />
    );
  }
  
  return (
    <>
      {React.cloneElement(children as React.ReactElement, { 
        onTileClick: handleTileClick,
        isTilePlaceable: isTilePlaceable
      })}
      
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
    </>
  );
};

export default TileHandler;
