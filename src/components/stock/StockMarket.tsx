
import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { toast } from '@/utils/toast';
import { calculateStockPrice } from '@/utils/gameLogic';
import { PlusCircle, MinusCircle, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const StockMarket: React.FC = () => {
  const { state, dispatch } = useGame();
  const { hotelChains, stockMarket, players, currentPlayerIndex, gamePhase } = state;
  const [stocksToBuy, setStocksToBuy] = useState<Record<HotelChainName, number>>({
    luxor: 0,
    tower: 0,
    american: 0,
    festival: 0,
    worldwide: 0,
    continental: 0,
    imperial: 0
  });
  const [hideAvailableStocks, setHideAvailableStocks] = useState(false);
  
  // Reset stocks to buy when player changes
  useEffect(() => {
    setStocksToBuy({
      luxor: 0,
      tower: 0,
      american: 0,
      festival: 0,
      worldwide: 0,
      continental: 0,
      imperial: 0
    });
  }, [currentPlayerIndex]);
  
  const currentPlayer = players[currentPlayerIndex];
  
  const chainNames: HotelChainName[] = [
    'luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'
  ];
  
  const incrementStock = (chainName: HotelChainName) => {
    const chain = hotelChains[chainName];
    if (!chain.isActive) return;
    
    const totalStocksBought = Object.values(stocksToBuy).reduce((sum, count) => sum + count, 0);
    if (totalStocksBought >= 3) {
      toast.error("You can only buy up to 3 stocks per turn");
      return;
    }
    
    if (stockMarket[chainName] <= 0) {
      toast.error("No more stocks available for this chain");
      return;
    }
    
    const price = calculateStockPrice(chainName, chain.tiles.length).buy;
    if (currentPlayer.money < price) {
      toast.error("You don't have enough money for this stock");
      return;
    }
    
    setStocksToBuy({
      ...stocksToBuy,
      [chainName]: stocksToBuy[chainName] + 1
    });
  };
  
  const decrementStock = (chainName: HotelChainName) => {
    if (stocksToBuy[chainName] <= 0) return;
    
    setStocksToBuy({
      ...stocksToBuy,
      [chainName]: stocksToBuy[chainName] - 1
    });
  };
  
  const handleBuyStocks = () => {
    const totalStocksBought = Object.values(stocksToBuy).reduce((sum, count) => sum + count, 0);
    if (totalStocksBought === 0) {
      toast.error("Select at least one stock to buy");
      return;
    }
    
    let totalCost = 0;
    
    // Calculate total cost and check if player can afford it
    for (const chainName of chainNames) {
      if (stocksToBuy[chainName] > 0) {
        const price = calculateStockPrice(chainName, hotelChains[chainName].tiles.length).buy;
        totalCost += price * stocksToBuy[chainName];
      }
    }
    
    if (currentPlayer.money < totalCost) {
      toast.error("You don't have enough money");
      return;
    }
    
    // Buy stocks for each chain
    for (const chainName of chainNames) {
      if (stocksToBuy[chainName] > 0) {
        dispatch({
          type: 'BUY_STOCK',
          payload: {
            chainName,
            playerId: currentPlayer.id,
            quantity: stocksToBuy[chainName]
          }
        });
      }
    }
    
    // Record the purchase for the banner
    dispatch({
      type: 'RECORD_STOCK_PURCHASE',
      payload: {
        playerName: currentPlayer.name,
        stocks: { ...stocksToBuy },
        totalCost
      }
    });
    
    // Reset stocks to buy
    setStocksToBuy({
      luxor: 0,
      tower: 0,
      american: 0,
      festival: 0,
      worldwide: 0,
      continental: 0,
      imperial: 0
    });
    
    toast.success(`Bought ${totalStocksBought} stocks for $${totalCost}`);
  };
  
  const totalStocksBought = Object.values(stocksToBuy).reduce((sum, count) => sum + count, 0);
  const totalCost = chainNames.reduce((sum, chainName) => {
    if (stocksToBuy[chainName] > 0) {
      const price = calculateStockPrice(chainName, hotelChains[chainName].tiles.length).buy;
      return sum + (price * stocksToBuy[chainName]);
    }
    return sum;
  }, 0);
  const canAfford = currentPlayer?.money >= totalCost;
  
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
        <div className="grid grid-cols-7 gap-2">
          {chainNames.map((chainName) => {
            const chain = hotelChains[chainName];
            const price = chain.isActive ? calculateStockPrice(chainName, chain.tiles.length).buy : 0;
            const available = stockMarket[chainName];
            
            return (
              <div key={chainName} className="flex flex-col items-center p-2 border border-border/30 rounded-md bg-secondary/20">
                <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: chain.color }} />
                <span className="text-xs capitalize mb-1">{chainName}</span>
                
                {!hideAvailableStocks && chain.isActive && (
                  <div className="text-xs mb-1">Available: {available}</div>
                )}
                
                {chain.isActive && (
                  <>
                    <div className="text-xs mb-1">${price}</div>
                    
                    {/* Only show buying controls during the buyStock phase */}
                    {gamePhase === 'buyStock' && (
                      <div className="flex items-center justify-between w-full mt-1">
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
                          disabled={
                            !chain.isActive || 
                            available === 0 || 
                            totalStocksBought >= 3 ||
                            currentPlayer?.money < price
                          }
                          onClick={() => incrementStock(chainName)}
                        >
                          <PlusCircle size={16} />
                        </Button>
                      </div>
                    )}
                  </>
                )}
                
                {!chain.isActive && (
                  <div className="text-xs text-muted-foreground mt-2">Inactive</div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Only show the buy button and totals during the buyStock phase */}
        {gamePhase === 'buyStock' && totalStocksBought > 0 && (
          <div className="flex flex-col p-3 bg-secondary/30 rounded-md mt-4">
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
              size="sm"
              disabled={totalStocksBought === 0 || !canAfford}
              onClick={handleBuyStocks}
            >
              Buy Stocks
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMarket;
