
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import BoardGrid from './board/BoardGrid';
import InitialTileDrawing from './board/InitialTileDrawing';
import DealTilesPhase from './board/DealTilesPhase';
import GameBoardFooter from './board/GameBoardFooter';
import TileHandler from './board/TileHandler';

const GameBoard = () => {
  const { state, dispatch } = useGame();
  const { 
    players, 
    currentPlayerIndex, 
    hotelChains,
    gamePhase, 
    setupPhase,
  } = state;
  
  const currentPlayer = players[currentPlayerIndex];
  
  const handleDrawInitialTile = () => {
    dispatch({ 
      type: 'DRAW_INITIAL_TILE', 
      payload: { 
        playerId: currentPlayer.id 
      } 
    });
  };
  
  const handleDealStartingTiles = () => {
    dispatch({ type: 'DEAL_STARTING_TILES' });
  };
  
  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' });
  };
  
  const getBoardKey = () => {
    const chainStates = Object.keys(hotelChains).map(chain => {
      return `${chain}:${hotelChains[chain as any].tiles.length}`;
    }).join('|');
    
    return `board-${currentPlayerIndex}-${chainStates}`;
  };
  
  if (gamePhase === 'setup' && setupPhase === 'drawInitialTile') {
    return (
      <TileHandler onTileHandled={() => {}}>
        <InitialTileDrawing 
          onTileClick={() => {}} 
          getBoardKey={getBoardKey}
          onDrawInitialTile={handleDrawInitialTile} 
        />
      </TileHandler>
    );
  }
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50">
        <h2 className="text-sm font-medium">Game Board</h2>
      </div>
      
      {setupPhase === 'dealTiles' && (
        <DealTilesPhase onDealStartingTiles={handleDealStartingTiles} />
      )}
      
      <TileHandler onTileHandled={() => {}}>
        <BoardGrid onTileClick={() => {}} getBoardKey={getBoardKey} />
      </TileHandler>
      
      <GameBoardFooter 
        tiles={currentPlayer?.tiles || []}
        gamePhase={gamePhase}
        onTileClick={() => {}}
        isTilePlaceable={() => false}
        onEndTurn={handleEndTurn}
      />
    </div>
  );
};

export default GameBoard;
