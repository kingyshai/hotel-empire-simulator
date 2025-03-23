
import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { toast } from '@/utils/toast';
import { calculateStockPrice } from '@/utils/gameLogic';
import StockBuyingInterface from './StockBuyingInterface';

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
    <StockBuyingInterface
      chainNames={chainNames}
      hotelChains={hotelChains}
      stockMarket={stockMarket}
      stocksToBuy={stocksToBuy}
      currentPlayer={currentPlayer}
      incrementStock={incrementStock}
      decrementStock={decrementStock}
      handleBuyStocks={handleBuyStocks}
      totalStocksBought={totalStocksBought}
      totalCost={totalCost}
      canAfford={canAfford}
      hideAvailableStocks={hideAvailableStocks}
      setHideAvailableStocks={setHideAvailableStocks}
    />
  );
};

export default StockMarket;
