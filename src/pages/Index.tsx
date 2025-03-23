
import React, { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import Header from '@/components/Header';
import GameBoard from '@/components/GameBoard';
import PlayerInfo from '@/components/PlayerInfo';
import StockMarket from '@/components/StockMarket';
import HotelChain from '@/components/HotelChain';
import SetupScreen from '@/components/SetupScreen';
import WinnerBanner from '@/components/WinnerBanner';
import MergerStockOptions from '@/components/MergerStockOptions';
import { HotelChainName } from '@/types/game';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { shouldEndGame } from '@/utils/gameLogic';
import { Save, ArrowRight } from 'lucide-react';

const GameContent = () => {
  const { state, dispatch, hasSavedGame } = useGame();
  const { 
    players, 
    currentPlayerIndex, 
    gamePhase, 
    hotelChains, 
    gameEnded, 
    winner, 
    winners,
    showWinnerBanner 
  } = state;
  
  const canEndGame = shouldEndGame(state);
  
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
  
  const handleEndGame = () => {
    dispatch({ type: 'END_GAME_MANUALLY' });
  };
  
  const handleLoadGame = () => {
    dispatch({ type: 'LOAD_SAVED_GAME' });
  };
  
  const handleSaveGame = () => {
    dispatch({ type: 'SAVE_GAME' });
    toast.success("Game saved successfully!");
  };
  
  const handleHideWinnerBanner = () => {
    dispatch({ type: 'HIDE_WINNER_BANNER' });
  };
  
  const chainNames: HotelChainName[] = [
    'luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'
  ];
  
  // Show setup screen only during the initial setup phase
  if (gamePhase === 'setup' && state.setupPhase === 'initial') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Header />
        {hasSavedGame && (
          <div className="flex justify-center mb-8">
            <Button 
              size="lg" 
              variant="default" 
              className="w-full max-w-md flex items-center justify-center gap-2"
              onClick={handleLoadGame}
            >
              <ArrowRight size={18} />
              Continue Saved Game
            </Button>
          </div>
        )}
        <SetupScreen />
      </div>
    );
  }
  
  // Show game results if the game has ended
  if (gameEnded) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Header />
        <div className="max-w-2xl mx-auto mt-16 glass-panel rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-8">Game Over!</h2>
          
          {winner ? (
            <div className="mb-6">
              <h3 className="text-xl mb-2">Winner: {winner.name}</h3>
              <p className="text-lg font-medium">${winner.money}</p>
            </div>
          ) : winners && winners.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xl mb-2">It's a tie!</h3>
              <div className="space-y-2 mt-4">
                {winners.map(player => (
                  <div key={player.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded">
                    <span>{player.name}</span>
                    <span className="font-medium">${player.money}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id} className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">{player.name}</h4>
                <p className="text-lg font-bold">${player.money}</p>
              </div>
            ))}
          </div>
          
          <Button 
            className="mt-8"
            onClick={() => window.location.reload()}
          >
            New Game
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 pb-16">
      <Header />
      
      {showWinnerBanner && (
        <WinnerBanner 
          winner={winner} 
          winners={winners} 
          onClose={handleHideWinnerBanner} 
        />
      )}
      
      {gamePhase === 'mergerStockOptions' && (
        <MergerStockOptions />
      )}
      
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-8">
          <GameBoard />
          
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Game Phase: <span className="font-medium text-foreground capitalize">{gamePhase}</span>
              {gamePhase === 'setup' && (
                <span className="ml-2 text-xs">({state.setupPhase})</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleSaveGame}
                disabled={gamePhase === 'setup' || gameEnded}
                className="flex items-center gap-1"
              >
                <Save size={16} />
                Save Game
              </Button>
              
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
              >
                End Turn
              </Button>
            </div>
          </div>
        </div>
        
        <div className="col-span-4 space-y-6">
          {/* Players */}
          <div className="space-y-4">
            {players.map((player, index) => (
              <PlayerInfo 
                key={player.id} 
                player={player}
                isCurrentPlayer={index === currentPlayerIndex}
              />
            ))}
          </div>
          
          {/* Stock Market */}
          <StockMarket />
          
          {/* Hotel Chains */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-3 bg-secondary/50 border-b border-border/50">
              <h2 className="text-sm font-medium">Hotel Chains</h2>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4">
              {chainNames.map(chainName => (
                <HotelChain key={chainName} chainName={chainName} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <GameContent />
      </div>
    </GameProvider>
  );
};

export default Index;
