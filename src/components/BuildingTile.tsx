
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
}

const BuildingTile: React.FC<BuildingTileProps> = ({ 
  coordinate, 
  belongsToChain,
  isPlaced = false,
  onClick,
  disabled = false
}) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  const getHotelChainColor = () => {
    if (!belongsToChain) return 'bg-white';
    return `bg-${belongsToChain}`;
  };
  
  return (
    <motion.button
      className={cn(
        "building-tile",
        isPlaced ? "cursor-default" : "cursor-pointer",
        belongsToChain ? `bg-${belongsToChain}/10 border-${belongsToChain}/30` : ""
      )}
      onClick={onClick}
      disabled={disabled || isPlaced}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isPlaced && !disabled ? { scale: 1.05 } : {}}
      whileTap={!isPlaced && !disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className="text-xs font-medium">{coordinate}</span>
      
      {belongsToChain && (
        <div 
          className="absolute inset-0 opacity-20 rounded-md"
          style={{ backgroundColor: hotelChains[belongsToChain].color }}
        />
      )}
    </motion.button>
  );
};

export default BuildingTile;
