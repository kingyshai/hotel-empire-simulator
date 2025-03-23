
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { calculateStockPrice } from '@/utils/gameLogic';
import { Switch } from '@/components/ui/switch';
import { EyeOff } from 'lucide-react';

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
        <div className="grid grid-cols-7 gap-2 mb-3">
          {chainNames.map((chainName) => (
            <motion.div
              key={chainName}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * chainNames.indexOf(chainName) }}
            >
              <div 
                className="w-4 h-4 rounded-full mb-1"
                style={{ backgroundColor: hotelChains[chainName].color }}
              />
              <span className="text-xs capitalize">{chainName}</span>
            </motion.div>
          ))}
        </div>
        
        <div className="space-y-4">
          {!hideAvailableStocks && (
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
          )}
          
          {gamePhase === 'buyStock' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMarket;
