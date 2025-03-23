
import React from 'react';
import { Button } from '@/components/ui/button';

interface DealTilesPhaseProps {
  onDealStartingTiles: () => void;
}

const DealTilesPhase: React.FC<DealTilesPhaseProps> = ({ onDealStartingTiles }) => {
  return (
    <div className="p-6 bg-secondary/20 border-b border-border/50 text-center">
      <p className="mb-4 text-lg">Ready to start the game!</p>
      <Button 
        size="lg" 
        onClick={onDealStartingTiles}
        className="w-full max-w-lg mx-auto text-lg py-6 animate-pulse bg-emerald-600 hover:bg-emerald-700"
      >
        Deal Starting Tiles to All Players
      </Button>
    </div>
  );
};

export default DealTilesPhase;
