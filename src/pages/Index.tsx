
import React, { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import Header from '@/components/Header';
import GameBoard from '@/components/GameBoard';
import PlayerInfo from '@/components/PlayerInfo';
import StockMarket from '@/components/stock/StockMarket';
import SetupScreen from '@/components/SetupScreen';
import WinnerBanner from '@/components/WinnerBanner';
import MergerStockOptions from '@/components/MergerStockOptions';
import StockPurchaseBanner from '@/components/stock/StockPurchaseBanner';
import { HotelChainName } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
    showWinnerBanner,
    lastStockPurchase,
    showStockPurchaseBanner
  } = state;
  
  // Generate a key that changes when hotel chain ownership changes
  const getGameBoardKey = () => {
    const chainStates = Object.entries(hotelChains)
      .map(([name, chain]) => `${name}:${chain.tiles.length}:${chain.isActive ? 1 : 0}`)
      .join('|');
    return `board-${currentPlayerIndex}-${chainStates}-${gamePhase}`;
  };
  
  const handleLoadGame = () => {
    dispatch({ type: 'LOAD_SAVED_GAME' });
  };
  
  const handleHideWinnerBanner = () => {
    dispatch({ type: 'HIDE_WINNER_BANNER' });
  };
  
  const handleAcknowledgeStockPurchase = () => {
    dispatch({ type: 'ACKNOWLEDGE_STOCK_PURCHASE' });
  };
  
  const chainNames: HotelChainName[] = [
    'luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'
  ];
  
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
                  <div key={`winner-${player.id}`} className="flex justify-between items-center p-2 bg-secondary/20 rounded">
                    <span>{player.name}</span>
                    <span className="font-medium">${player.money}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map(player => (
              <div key={`endgame-${player.id}`} className="p-4 border border-border rounded-lg">
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
    <div className="container max-w-full mx-auto px-1 pb-16">
      <Header key={`header-${currentPlayerIndex}`} />
      
      {showWinnerBanner && (
        <WinnerBanner 
          winner={winner} 
          winners={winners} 
          onClose={handleHideWinnerBanner} 
        />
      )}
      
      {showStockPurchaseBanner && (
        <StockPurchaseBanner 
          purchaseInfo={lastStockPurchase}
          onAcknowledge={handleAcknowledgeStockPurchase}
        />
      )}
      
      {gamePhase === 'mergerStockOptions' && (
        <MergerStockOptions />
      )}
      
      <div className="flex flex-col gap-3 mt-2">
        <div className="w-full">
          <GameBoard key={getGameBoardKey()} />
        </div>
        
        <div>
          <StockMarket key={`stock-market-${currentPlayerIndex}`} />
        </div>
        
        <div className="text-sm text-muted-foreground">
          Game Phase: <span className="font-medium text-foreground capitalize">{gamePhase}</span>
          {gamePhase === 'setup' && (
            <span className="ml-2 text-xs">({state.setupPhase})</span>
          )}
        </div>
        
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-3 bg-secondary/50 border-b border-border/50">
            <h2 className="text-sm font-medium">Players</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
            {players.map((player, index) => (
              <PlayerInfo 
                key={`player-info-${player.id}-${currentPlayerIndex}`} 
                player={player}
                isCurrentPlayer={index === currentPlayerIndex}
              />
            ))}
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
