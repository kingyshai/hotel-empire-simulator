
import React from 'react';
import { useGame } from '@/context/GameContext';

const Header: React.FC = () => {
  const { state } = useGame();
  const { gamePhase, players, currentPlayerIndex } = state;
  
  const currentPlayer = players[currentPlayerIndex];
  
  return (
    <header className="w-full py-6 px-8 flex items-center justify-between animate-fade-in">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-xl">A</span>
        </div>
        <h1 className="text-2xl font-semibold">Acquire</h1>
      </div>
      
      {players.length > 0 && (
        <div className="flex items-center space-x-6">
          <div className="text-sm text-muted-foreground">
            Game Mode: <span className="font-medium text-foreground capitalize">{state.gameMode}</span>
          </div>
          
          <div className="flex items-center px-4 py-2 rounded-full bg-secondary">
            <span className="text-sm mr-2">Current Turn:</span>
            <span className="font-medium">{currentPlayer?.name || 'Setting up...'}</span>
          </div>
          
          <div className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
            {gamePhase}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
