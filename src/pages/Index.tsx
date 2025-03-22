
import React, { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import Header from '@/components/Header';
import GameBoard from '@/components/GameBoard';
import PlayerInfo from '@/components/PlayerInfo';
import StockMarket from '@/components/StockMarket';
import HotelChain from '@/components/HotelChain';
import SetupScreen from '@/components/SetupScreen';
import { HotelChainName } from '@/types/game';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

const GameContent = () => {
  const { state, dispatch } = useGame();
  const { players, currentPlayerIndex, gamePhase, hotelChains } = state;
  
  const handleEndTurn = () => {
    if (gamePhase !== 'buyStock') {
      toast.error("You must complete your current actions before ending your turn");
      return;
    }
    
    dispatch({ type: 'END_TURN' });
    toast.success(`${players[(currentPlayerIndex + 1) % players.length].name}'s turn`);
  };
  
  const chainNames: HotelChainName[] = [
    'luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'
  ];
  
  if (gamePhase === 'setup') {
    return <SetupScreen />;
  }
  
  return (
    <div className="container mx-auto px-4 pb-16">
      <Header />
      
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-8">
          <GameBoard />
          
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Game Phase: <span className="font-medium text-foreground capitalize">{gamePhase}</span>
            </div>
            
            <Button 
              size="lg"
              onClick={handleEndTurn}
              disabled={gamePhase !== 'buyStock'}
            >
              End Turn
            </Button>
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
