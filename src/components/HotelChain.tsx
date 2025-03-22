
import React from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { motion } from 'framer-motion';

interface HotelChainProps {
  chainName: HotelChainName;
}

const HotelChain: React.FC<HotelChainProps> = ({ chainName }) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  const chain = hotelChains[chainName];
  
  // Calculate stock values based on chain size
  const calculateStockPrice = () => {
    if (!chain.isActive) return { buy: 0, sell: 0 };
    
    // Simplified price calculation
    const basePrice = 100;
    const size = chain.tiles.length;
    
    return {
      buy: basePrice * size,
      sell: (basePrice * size) - (basePrice / 2),
    };
  };
  
  const { buy, sell } = calculateStockPrice();
  
  return (
    <motion.div 
      className={`glass-panel rounded-lg overflow-hidden
        ${chain.isActive ? '' : 'opacity-50'}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="p-3 border-b border-border/50 flex items-center"
        style={{ backgroundColor: `${chain.color}10` }}
      >
        <div 
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: chain.color }}
        />
        <h3 className="font-medium capitalize">{chainName}</h3>
        
        {chain.isSafe && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
            Safe
          </span>
        )}
        
        {!chain.isActive && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            Inactive
          </span>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Size</span>
          <span className="font-medium text-sm">{chain.tiles.length} tiles</span>
        </div>
        
        {chain.isActive && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Buy Price</span>
              <span className="font-medium text-sm">${buy}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sell Price</span>
              <span className="font-medium text-sm">${sell}</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default HotelChain;
