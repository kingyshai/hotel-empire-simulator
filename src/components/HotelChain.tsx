
import React from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName } from '@/types/game';
import { motion } from 'framer-motion';
import { calculateStockPrice, calculateStockholderBonus } from '@/utils/gameLogic';

interface HotelChainProps {
  chainName: HotelChainName;
}

const HotelChain: React.FC<HotelChainProps> = ({ chainName }) => {
  const { state } = useGame();
  const { hotelChains, gameMode } = state;
  
  const chain = hotelChains[chainName];
  
  const price = chain.isActive 
    ? calculateStockPrice(chainName, chain.tiles.length).buy 
    : 0;
  
  // Calculate stockholder bonuses
  const bonuses = chain.isActive
    ? calculateStockholderBonus(chainName, chain.tiles.length, gameMode)
    : { primary: 0, secondary: 0, tertiary: 0 };
  
  // Determine if chain is safe (11 or more tiles)
  const isSafe = chain.tiles.length >= 11;
  
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
        
        {isSafe && (
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
              <span className="text-xs text-muted-foreground">Stock Price</span>
              <span className="font-medium text-sm">${price}</span>
            </div>
            
            <div className="space-y-1 mt-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Primary Bonus</span>
                <span className="font-medium text-sm">${bonuses.primary}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Secondary Bonus</span>
                <span className="font-medium text-sm">${bonuses.secondary}</span>
              </div>
              
              {gameMode === 'tycoon' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tertiary Bonus</span>
                  <span className="font-medium text-sm">${bonuses.tertiary}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default HotelChain;
