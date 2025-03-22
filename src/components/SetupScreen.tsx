
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const SetupScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [playerCount, setPlayerCount] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(6).fill(''));
  const [gameMode, setGameMode] = useState<'classic' | 'tycoon'>(state.gameMode);
  
  const handleStartGame = () => {
    dispatch({
      type: 'START_GAME',
      payload: {
        playerCount,
        playerNames,
        gameMode,
      },
    });
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
                <motion.div key={index} variants={item}>
                  <Input
                    placeholder={`Player ${index + 1}`}
                    value={playerNames[index]}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    className="w-full"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch
                id="tycoon-mode"
                checked={gameMode === 'tycoon'}
                onCheckedChange={(checked) => setGameMode(checked ? 'tycoon' : 'classic')}
              />
              <Label htmlFor="tycoon-mode">Tycoon Mode</Label>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {gameMode === 'tycoon' 
                ? 'Pays bonuses to top THREE stockholders' 
                : 'Pays bonuses to top TWO stockholders'}
            </div>
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
