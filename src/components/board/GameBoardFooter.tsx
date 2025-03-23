
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { GamePhase, Coordinate } from '@/types/game';
import AvailableTiles from './AvailableTiles';

interface GameBoardFooterProps {
  tiles: Coordinate[];
  gamePhase: GamePhase;
  onTileClick: (coordinate: Coordinate) => void;
  isTilePlaceable: (coordinate: Coordinate) => boolean;
  onEndTurn: () => void;
}

const GameBoardFooter: React.FC<GameBoardFooterProps> = ({ 
  tiles, 
  gamePhase, 
  onTileClick, 
  isTilePlaceable,
  onEndTurn
}) => {
  return (
    <div className="p-3 bg-secondary/10 border-t border-border/50">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <AvailableTiles 
          tiles={tiles} 
          onTileClick={onTileClick} 
          isTilePlaceable={isTilePlaceable}
        />
        
        {gamePhase !== 'setup' && (
          <div className="flex justify-end">
            <Button 
              variant="default"
              size="lg"
              onClick={onEndTurn}
              className="px-6 bg-primary/80 hover:bg-primary flex items-center gap-2"
            >
              End Turn
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoardFooter;
