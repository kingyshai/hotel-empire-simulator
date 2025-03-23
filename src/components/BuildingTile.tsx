
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
  isAvailable?: boolean;
  isUnplayable?: boolean;
  isInitialTile?: boolean;
}

const BuildingTile: React.FC<BuildingTileProps> = ({ 
  coordinate, 
  belongsToChain,
  isPlaced = false,
  onClick,
  disabled = false,
  isSelectable = false,
  isAvailable = false,
  isUnplayable = false,
  isInitialTile = false
}) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  // Get the chain's color directly from the hotelChains state
  const getChainBackground = () => {
    if (belongsToChain) {
      return {
        backgroundColor: hotelChains[belongsToChain]?.color || '#6b7280'
      };
    }
    return {};
  };
  
  return (
    <motion.button
      className={cn(
        "building-tile relative w-full h-full flex items-center justify-center rounded-md",
        isPlaced ? "cursor-default shadow-md" : 
        isSelectable ? "cursor-pointer ring-2 ring-primary/50" : 
        isAvailable ? "bg-white cursor-pointer hover:bg-gray-100" : 
        state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile' ? "cursor-pointer hover:bg-primary/20" :
        "cursor-default",
        isUnplayable ? "bg-red-200 cursor-not-allowed" : "", 
        !belongsToChain && isPlaced ? "bg-[#9b87f5]/30 border-[#9b87f5]/50" : "bg-white hover:bg-gray-100",
        isInitialTile ? "bg-yellow-200 border-2 border-yellow-500" : ""
      )}
      onClick={!isUnplayable && (isSelectable || isAvailable || (state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile') || (!disabled && !isPlaced)) ? onClick : undefined}
      disabled={disabled || isUnplayable || (isPlaced && !isSelectable)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isUnplayable && (isSelectable || isAvailable || (state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile') || (!isPlaced && !disabled)) ? { scale: 1.05 } : {}}
      whileTap={!isUnplayable && (isSelectable || isAvailable || (state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile') || (!isPlaced && !disabled)) ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className="text-xs md:text-sm font-medium z-10">{coordinate}</span>
      
      {belongsToChain && (
        <div 
          className="absolute inset-0 opacity-70 rounded-md"
          style={getChainBackground()}
        />
      )}
      
      {isPlaced && !belongsToChain && !isInitialTile && (
        <div className="absolute inset-0 opacity-20 rounded-md bg-[#9b87f5]" />
      )}
      
      {isUnplayable && (
        <div className="absolute inset-0 opacity-40 rounded-md bg-red-500" />
      )}
      
      {state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile' && (
        <div className="absolute inset-0 opacity-10 rounded-md bg-primary hover:opacity-20 transition-opacity" />
      )}
      
      {isSelectable && (
        <div className="absolute inset-0 opacity-20 rounded-md bg-green-500" />
      )}
      
      {isAvailable && !isUnplayable && !isPlaced && (
        <div className="absolute inset-0 opacity-30 rounded-md bg-gray-200" />
      )}
      
      {isInitialTile && (
        <div className="absolute inset-0 opacity-30 rounded-md bg-yellow-500" />
      )}
    </motion.button>
  );
};

export default BuildingTile;
