
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from '@/utils/toast';

const SetupScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [playerCount, setPlayerCount] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(6).fill(''));
  const gameMode: 'classic' = 'classic';
  
  const handleStartGame = () => {
    // Create array of filled names (or default names if not provided)
    const filledNames = playerNames.slice(0, playerCount).map((name, i) => 
      name.trim() ? name.trim() : `Player ${i + 1}`
    );
    
    // Log the action for debugging
    console.log('Starting game with:', { 
      playerCount, 
      playerNames: filledNames, 
      gameMode 
    });
    
    dispatch({
      type: 'START_GAME',
      payload: {
        playerCount,
        playerNames: filledNames,
        gameMode,
      },
    });
    
    // Show a toast notification to confirm the game has started
    toast.success(`Game started with ${playerCount} players!`);
  };
  
  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div 
        className="glass-panel rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 bg-secondary/50 border-b border-border/50">
          <h2 className="text-xl font-semibold">Game Setup</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure players and game options
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Number of Players</label>
            <div className="flex space-x-2">
              {[2, 3, 4, 5, 6].map((count) => (
                <Button
                  key={count}
                  variant={playerCount === count ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
          
          <motion.div 
            className="space-y-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <label className="text-sm font-medium">Player Names</label>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: playerCount }).map((_, index) => (
                <motion.div key={`player-input-${index}`} variants={item}>
                  <Input
                    placeholder={`Player ${index + 1}`}
                    value={playerNames[index] || ''}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    className="w-full"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <div className="text-xs text-muted-foreground">
            <p>Classic mode: Pays bonuses to top TWO stockholders</p>
          </div>
          
          <Button 
            className="w-full mt-6" 
            size="lg" 
            onClick={handleStartGame}
          >
            Start Game
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupScreen;
