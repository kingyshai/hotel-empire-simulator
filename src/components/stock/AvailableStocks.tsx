
import React from 'react';
import { HotelChainName } from '@/types/game';
import { calculateStockPrice } from '@/utils/gameLogic';

interface AvailableStocksProps {
  chainNames: HotelChainName[];
  hotelChains: Record<HotelChainName, any>;
  stockMarket: Record<HotelChainName, number>;
  hideAvailableStocks: boolean;
}

const AvailableStocks: React.FC<AvailableStocksProps> = ({ 
  chainNames, 
  hotelChains, 
  stockMarket,
  hideAvailableStocks
}) => {
  if (hideAvailableStocks) {
    return null;
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {chainNames.map((chainName) => {
        const chain = hotelChains[chainName];
        const available = stockMarket[chainName];
        const price = chain.isActive ? calculateStockPrice(chainName, chain.tiles.length).buy : 0;
        
        return (
          <div 
            key={chainName}
            className={`px-3 py-2 rounded-md text-center border ${chain.isActive ? 'border-border/50' : 'border-border/20 opacity-50'}`}
          >
            <div className="text-sm font-semibold mb-1">{available}</div>
            <div className="text-xs text-muted-foreground mb-1">Available</div>
            {chain.isActive && (
              <div className="mt-1 text-xs font-medium">${price}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AvailableStocks;
