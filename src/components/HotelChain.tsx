
import React from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { motion } from 'framer-motion';
import { calculateStockPrice } from '@/utils/gameLogic';

interface HotelChainProps {
  chainName: HotelChainName;
}

const HotelChain: React.FC<HotelChainProps> = ({ chainName }) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  const chain = hotelChains[chainName];
  
  const price = chain.isActive 
    ? calculateStockPrice(chainName, chain.tiles.length).buy 
    : 0;
  
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Stock Price</span>
            <span className="font-medium text-sm">${price}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HotelChain;
