
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Save, ArrowRight } from 'lucide-react';
import { toast } from '@/utils/toast';
import { shouldEndGame } from '@/utils/gameLogic';
import { GamePhase } from '@/types/game';

const Header: React.FC = () => {
  const { state, dispatch } = useGame();
  const { gamePhase, players, currentPlayerIndex } = state;
  
  const currentPlayer = players.length > 0 ? players[currentPlayerIndex] : null;
  const canEndGame = shouldEndGame(state);
  
  const handleSaveGame = () => {
    dispatch({ type: 'SAVE_GAME' });
    toast.success("Game saved successfully!");
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
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      toast.success(`${players[nextPlayerIndex].name}'s turn`);
    }
  };
  
  return (
    <header className="w-full py-6 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-xl">A</span>
        </div>
        <h1 className="text-2xl font-semibold">Acquire</h1>
      </div>
      
      {players.length > 0 && gamePhase !== 'setup' && (
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button 
            variant="outline"
            onClick={handleEndGame}
            disabled={!canEndGame}
            title={!canEndGame ? "End game conditions not met yet" : "End the game now"}
            size="sm"
            className="whitespace-nowrap"
          >
            End Game
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleSaveGame}
            size="sm"
            className="whitespace-nowrap flex items-center gap-1"
          >
            <Save size={16} />
            Save
          </Button>
          
          <Button 
            size="sm"
            onClick={handleEndTurn}
            disabled={gamePhase !== 'buyStock'}
            className="whitespace-nowrap flex items-center gap-1"
          >
            End Turn
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
      
      {players.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 md:gap-4 ml-auto">
          <div className="text-sm text-muted-foreground">
            Game Mode: <span className="font-medium text-foreground capitalize">{state.gameMode}</span>
          </div>
          
          <div className="flex items-center px-3 py-1.5 rounded-full bg-secondary">
            <span className="text-sm mr-2">Current Turn:</span>
            <span className="font-medium">{currentPlayer?.name || 'Setting up...'}</span>
          </div>
          
          <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
            {gamePhase}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
