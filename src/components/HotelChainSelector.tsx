
import React from 'react';
import { HotelChainName } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';

interface HotelChainSelectorProps {
  availableChains: HotelChainName[];
  onSelect: (chainName: HotelChainName) => void;
  onCancel: () => void;
}

const HotelChainSelector: React.FC<HotelChainSelectorProps> = ({ 
  availableChains, 
  onSelect,
  onCancel
}) => {
  const { state } = useGame();
  const { hotelChains } = state;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {availableChains.map(chainName => {
          const chain = hotelChains[chainName];
          
          return (
            <button
              key={chainName}
              className="p-3 rounded-lg border transition-all hover:shadow-md flex flex-col items-center"
              style={{ 
                borderColor: `${chain.color}50`,
                backgroundColor: `${chain.color}10` 
              }}
              onClick={() => onSelect(chainName)}
            >
              <div 
                className="w-8 h-8 rounded-md mb-2"
                style={{ backgroundColor: chain.color }}
              />
              <span className="font-medium capitalize">{chainName}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {chain.isActive ? 'Active' : 'Inactive'}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default HotelChainSelector;
