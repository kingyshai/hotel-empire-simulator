
import React from 'react';
import { Coordinate } from '@/types/game';
import { cn } from '@/lib/utils';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';

interface BuildingTileProps {
  coordinate: Coordinate;
  belongsToChain?: string;
  isPlaced?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isSelectable?: boolean;
}

const BuildingTile: React.FC<BuildingTileProps> = ({ 
  coordinate, 
  belongsToChain,
  isPlaced = false,
  onClick,
  disabled = false,
  isSelectable = false
}) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  return (
    <motion.button
      className={cn(
        "building-tile",
        isPlaced ? "cursor-default shadow-md" : isSelectable ? "cursor-pointer ring-2 ring-primary/50" : "cursor-default",
        belongsToChain 
          ? `bg-${belongsToChain}/20 border-${belongsToChain}/50` 
          : isPlaced 
            ? "bg-[#9b87f5]/30 border-[#9b87f5]/50" 
            : ""
      )}
      onClick={isSelectable || (!disabled && !isPlaced) ? onClick : undefined}
      disabled={disabled || (isPlaced && !isSelectable)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isSelectable || (!isPlaced && !disabled) ? { scale: 1.05 } : {}}
      whileTap={isSelectable || (!isPlaced && !disabled) ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className="text-xs font-medium">{coordinate}</span>
      
      {belongsToChain && (
        <div 
          className="absolute inset-0 opacity-30 rounded-md"
          style={{ backgroundColor: hotelChains[belongsToChain].color }}
        />
      )}
      
      {isPlaced && !belongsToChain && (
        <div className="absolute inset-0 opacity-20 rounded-md bg-[#9b87f5]" />
      )}
    </motion.button>
  );
};

export default BuildingTile;
