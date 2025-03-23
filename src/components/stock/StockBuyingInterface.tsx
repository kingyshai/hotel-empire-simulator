
import React from 'react';
import { Button } from '@/components/ui/button';
import { HotelChainName } from '@/types/game';
import { calculateStockPrice } from '@/utils/gameLogic';
import { PlusCircle, MinusCircle, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

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
  hideAvailableStocks: boolean;
  setHideAvailableStocks: (value: boolean) => void;
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
  canAfford,
  hideAvailableStocks,
  setHideAvailableStocks
}) => {
  if (!currentPlayer) return null;
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50 flex justify-between items-center">
        <h2 className="text-sm font-medium">Stock Market</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground flex items-center">
            <EyeOff size={14} className="mr-1" />
            Hide available
          </span>
          <Switch
            checked={hideAvailableStocks}
            onCheckedChange={setHideAvailableStocks}
            aria-label="Toggle hide available stocks"
          />
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {chainNames.map((chainName) => (
            <div
              key={chainName}
              className="flex flex-col items-center"
            >
              <div 
                className="w-4 h-4 rounded-full mb-1"
                style={{ backgroundColor: hotelChains[chainName].color }}
              />
              <span className="text-xs capitalize">{chainName}</span>
            </div>
          ))}
        </div>
        
        {!hideAvailableStocks && (
          <div className="grid grid-cols-7 gap-2 mb-4">
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
        )}
        
        {currentPlayer && (
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
                    <span className="text-xs capitalize mb-1">{chainName}</span>
                    
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
        )}
      </div>
    </div>
  );
};

export default StockBuyingInterface;
