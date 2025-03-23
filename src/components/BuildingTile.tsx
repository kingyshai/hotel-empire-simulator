
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
  isAvailable?: boolean;  // Prop to indicate available tile
  isUnplayable?: boolean; // New prop for illegal moves
}

const BuildingTile: React.FC<BuildingTileProps> = ({ 
  coordinate, 
  belongsToChain,
  isPlaced = false,
  onClick,
  disabled = false,
  isSelectable = false,
  isAvailable = false,
  isUnplayable = false // Default to false
}) => {
  const { state } = useGame();
  const { hotelChains, gamePhase, setupPhase } = state;
  
  // Define colors for hotel chains
  const chainColorMap: Record<string, string> = {
    american: '#0ea5e9',  // blue
    worldwide: '#a1855c', // brown
    festival: '#10b981',  // green
    imperial: '#ec4899',  // pink
    continental: '#0f766e', // turquoise
    luxor: '#ef4444',     // red
    tower: '#fbbf24'      // yellow
  };
  
  const isDrawPhase = gamePhase === 'setup' && setupPhase === 'drawInitialTile';
  
  return (
    <motion.button
      className={cn(
        "building-tile relative w-full h-full flex items-center justify-center rounded-md",
        isPlaced ? "cursor-default shadow-md" : 
        isSelectable ? "cursor-pointer ring-2 ring-primary/50" : 
        isAvailable ? "bg-gray-300 cursor-pointer" : 
        isDrawPhase ? "cursor-pointer hover:bg-primary/20" :
        "cursor-default",
        isUnplayable ? "bg-red-200 cursor-not-allowed" : "", 
        belongsToChain 
          ? `border-${belongsToChain}` 
          : isPlaced 
            ? "bg-[#9b87f5]/30 border-[#9b87f5]/50" 
            : "bg-secondary/70 hover:bg-secondary"
      )}
      onClick={!isUnplayable && (isSelectable || isAvailable || isDrawPhase || (!disabled && !isPlaced)) ? onClick : undefined}
      disabled={disabled || isUnplayable || (isPlaced && !isSelectable)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isUnplayable && (isSelectable || isAvailable || isDrawPhase || (!isPlaced && !disabled)) ? { scale: 1.05 } : {}}
      whileTap={!isUnplayable && (isSelectable || isAvailable || isDrawPhase || (!isPlaced && !disabled)) ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className="text-xs md:text-sm font-medium">{coordinate}</span>
      
      {belongsToChain && (
        <div 
          className="absolute inset-0 opacity-50 rounded-md"
          style={{ 
            backgroundColor: chainColorMap[belongsToChain] || hotelChains[belongsToChain]?.color || '#6b7280'
          }}
        />
      )}
      
      {isPlaced && !belongsToChain && (
        <div className="absolute inset-0 opacity-20 rounded-md bg-[#9b87f5]" />
      )}
      
      {isUnplayable && (
        <div className="absolute inset-0 opacity-40 rounded-md bg-red-500" />
      )}
      
      {isDrawPhase && (
        <div className="absolute inset-0 opacity-10 rounded-md bg-primary hover:opacity-20 transition-opacity" />
      )}
      
      {isSelectable && (
        <div className="absolute inset-0 opacity-20 rounded-md bg-green-500" />
      )}
    </motion.button>
  );
};

export default BuildingTile;
