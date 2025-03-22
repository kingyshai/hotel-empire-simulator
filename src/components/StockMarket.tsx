
import React from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { motion } from 'framer-motion';

const StockMarket: React.FC = () => {
  const { state } = useGame();
  const { hotelChains, stockMarket, players, currentPlayerIndex } = state;
  
  const currentPlayer = players[currentPlayerIndex];
  
  const chainNames: HotelChainName[] = [
    'luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'
  ];
  
  const calculateStockPrice = (chainName: HotelChainName) => {
    const chain = hotelChains[chainName];
    if (!chain.isActive) return { buy: 0, sell: 0 };
    
    // Simplified price calculation based on chain size
    const basePrice = 100;
    const size = chain.tiles.length;
    
    return {
      buy: basePrice * size,
      sell: (basePrice * size) - (basePrice / 2),
    };
  };
  
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50">
        <h2 className="text-sm font-medium">Stock Market</h2>
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
          <div className="grid grid-cols-7 gap-2">
            {chainNames.map((chainName) => {
              const chain = hotelChains[chainName];
              const available = stockMarket[chainName];
              const { buy } = calculateStockPrice(chainName);
              
              return (
                <div 
                  key={chainName}
                  className={`px-3 py-2 rounded-md text-center border ${chain.isActive ? 'border-border/50' : 'border-border/20 opacity-50'}`}
                >
                  <div className="text-sm font-semibold mb-1">{available}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                  {chain.isActive && (
                    <div className="mt-2 text-xs font-medium">${buy}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {chainNames.map((chainName) => {
              const chain = hotelChains[chainName];
              
              return (
                <motion.button
                  key={chainName}
                  disabled={!chain.isActive || stockMarket[chainName] === 0}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md
                    ${chain.isActive && stockMarket[chainName] > 0 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
                  whileHover={{ scale: chain.isActive && stockMarket[chainName] > 0 ? 1.03 : 1 }}
                  whileTap={{ scale: chain.isActive && stockMarket[chainName] > 0 ? 0.97 : 1 }}
                >
                  Buy Stock
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMarket;
