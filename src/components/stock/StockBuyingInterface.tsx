
import React from 'react';
import { Button } from '@/components/ui/button';
import { HotelChainName } from '@/types/game';
import { calculateStockPrice } from '@/utils/gameLogic';
import { toast } from '@/utils/toast';

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
    <>
      <div className="grid grid-cols-7 gap-2">
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
            <div key={chainName} className="flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={stocksToBuy[chainName] === 0}
                  onClick={() => decrementStock(chainName)}
                >
                  <span>-</span>
                </Button>
                
                <span className="mx-2 text-sm font-medium">{stocksToBuy[chainName]}</span>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={disableIncrement}
                  onClick={() => incrementStock(chainName)}
                >
                  <span>+</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-col">
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
          disabled={totalStocksBought === 0 || !canAfford}
          onClick={handleBuyStocks}
        >
          Buy Stocks
        </Button>
      </div>
    </>
  );
};

export default StockBuyingInterface;
