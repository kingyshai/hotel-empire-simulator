
import React from 'react';
import { Button } from '@/components/ui/button';
import { HotelChainName } from '@/types/game';
import { calculateStockPrice } from '@/utils/gameLogic';
import { toast } from '@/utils/toast';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface StockBuyingInterfaceProps {
  chainNames: HotelChainName[];
  hotelChains: Record<HotelChainName, any>;
  stockMarket: Record<HotelChainName, number>;
  stocksToBuy: Record<HotelChainName, number>;
  currentPlayer: any;
  incrementStock: (chainName: HotelChainName) => void;
  decrementStock: (chainName: HotelChainName) => void;
  handleBuyStocks: () => void;
  totalStocksBought: number;
  totalCost: number;
  canAfford: boolean;
}

const StockBuyingInterface: React.FC<StockBuyingInterfaceProps> = ({
  chainNames,
  hotelChains,
  stockMarket,
  stocksToBuy,
  currentPlayer,
  incrementStock,
  decrementStock,
  handleBuyStocks,
  totalStocksBought,
  totalCost,
  canAfford
}) => {
  if (!currentPlayer) return null;
  
  return (
    <div className="border-t border-border/50 pt-4 mt-4">
      <h3 className="text-sm font-medium mb-3">Buy Stocks (Max 3)</h3>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {chainNames.map((chainName) => {
          const chain = hotelChains[chainName];
          const price = chain.isActive ? calculateStockPrice(chainName, chain.tiles.length).buy : 0;
          const available = stockMarket[chainName];
          
          const disableIncrement = 
            !chain.isActive || 
            available === 0 || 
            totalStocksBought >= 3 ||
            currentPlayer?.money < price;
          
          return (
            <div key={chainName} className="flex flex-col items-center p-2 border border-border/30 rounded-md bg-secondary/20">
              <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: chain.color }} />
              <span className="text-xs capitalize mb-2">{chainName}</span>
              
              {chain.isActive && (
                <>
                  <div className="text-xs mb-1">${price}</div>
                  <div className="flex items-center justify-between w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={stocksToBuy[chainName] === 0}
                      onClick={() => decrementStock(chainName)}
                    >
                      <MinusCircle size={16} />
                    </Button>
                    
                    <span className="mx-1 text-sm font-bold">{stocksToBuy[chainName]}</span>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={disableIncrement}
                      onClick={() => incrementStock(chainName)}
                    >
                      <PlusCircle size={16} />
                    </Button>
                  </div>
                  <div className="text-xs mt-1">
                    Available: {available}
                  </div>
                </>
              )}
              
              {!chain.isActive && (
                <div className="text-xs text-muted-foreground mt-2">Inactive</div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-col p-3 bg-secondary/30 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Total Stocks:</span>
          <span className="font-medium">{totalStocksBought} / 3</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm">Total Cost:</span>
          <span className={`font-medium ${!canAfford ? 'text-red-500' : ''}`}>${totalCost}</span>
        </div>
        
        <Button 
          className="w-full"
          size="lg"
          disabled={totalStocksBought === 0 || !canAfford}
          onClick={handleBuyStocks}
        >
          Buy Stocks
        </Button>
      </div>
    </div>
  );
};

export default StockBuyingInterface;
