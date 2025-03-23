
import React, { useMemo } from 'react';
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
  isRecentlyPlaced?: boolean;
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
  isInitialTile = false,
  isRecentlyPlaced = false
}) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  // Use useMemo to prevent unnecessary re-calculations
  const chainColor = useMemo(() => {
    if (belongsToChain && hotelChains[belongsToChain]) {
      return hotelChains[belongsToChain].color || '#6b7280';
    }
    return '';
  }, [belongsToChain, hotelChains]);
  
  const textColor = useMemo(() => {
    return chainColor ? getContrastYIQ(chainColor) : '';
  }, [chainColor]);
  
  const isClickable = !isUnplayable && (
    isSelectable || 
    isAvailable || 
    (state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile') || 
    (!disabled && !isPlaced)
  );

  // Generate a unique key for the component based on its state
  const tileKey = `${coordinate}-${belongsToChain || 'none'}-${isPlaced ? 'placed' : 'unplaced'}`;
  
  return (
    <motion.button
      key={tileKey}
      className={cn(
        "building-tile relative w-full h-full flex items-center justify-center rounded-md",
        isPlaced ? "cursor-default shadow-md" : 
        isSelectable ? "cursor-pointer ring-2 ring-primary/50" : 
        isAvailable ? "bg-white cursor-pointer hover:bg-gray-100" : 
        state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile' ? "cursor-pointer hover:bg-primary/20" :
        "cursor-default",
        isUnplayable ? "bg-red-200 cursor-not-allowed" : "", 
        !belongsToChain && isPlaced && !isInitialTile && !isRecentlyPlaced ? "bg-[#9b87f5]/30 border-[#9b87f5]/50" : "bg-white hover:bg-gray-100",
        isInitialTile ? "bg-yellow-200 border-yellow-400" : "",
        isRecentlyPlaced && !isInitialTile ? "bg-emerald-100 border-emerald-300" : ""
      )}
      style={
        belongsToChain && chainColor 
          ? {
              backgroundColor: chainColor,
              color: textColor,
              borderColor: chainColor
            } 
          : isInitialTile 
            ? {
                backgroundColor: "#F59E0B",  // Even brighter amber-500
                color: "#7C2D12",  // Darker amber-900 for better contrast
                borderColor: "#D97706"  // amber-600
              }
            : isRecentlyPlaced && !isInitialTile
              ? {
                  backgroundColor: "#059669",  // emerald-600 - stronger color
                  color: "#FFFFFF",  // White text for better contrast
                  borderColor: "#10B981"  // emerald-500
                }
              : !belongsToChain && isPlaced && !isInitialTile && !isRecentlyPlaced
                ? {
                    backgroundColor: "#8B5CF6",  // Full opacity purple instead of transparent
                    color: "#FFFFFF",  // White text
                    borderColor: "#7C3AED"  // violet-600
                  }
                : {}
      }
      onClick={isClickable ? onClick : undefined}
      disabled={disabled || isUnplayable || (isPlaced && !isSelectable)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className={cn(
        "text-sm md:text-base font-medium z-10",
        isInitialTile ? "text-white font-bold" : "",
        isRecentlyPlaced && !isInitialTile ? "text-white font-bold" : "",
        !belongsToChain && isPlaced && !isInitialTile && !isRecentlyPlaced ? "text-white font-bold" : ""
      )}>
        {coordinate}
      </span>
      
      {isUnplayable && (
        <div className="absolute inset-0 opacity-70 rounded-md bg-red-500" />
      )}
      
      {state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile' && (
        <div className="absolute inset-0 opacity-20 rounded-md bg-primary hover:opacity-30 transition-opacity" />
      )}
      
      {isSelectable && (
        <div className="absolute inset-0 opacity-40 rounded-md bg-green-500" />
      )}
      
      {isAvailable && !isUnplayable && !isPlaced && (
        <div className="absolute inset-0 opacity-30 rounded-md bg-gray-200" />
      )}
      
      {isInitialTile && (
        <div className="absolute w-5 h-5 top-0 right-0 rounded-full bg-yellow-500 -mt-1 -mr-1 shadow-md border-2 border-yellow-600 flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">★</span>
        </div>
      )}
      
      {isRecentlyPlaced && !isInitialTile && (
        <div className="absolute w-5 h-5 bottom-0 left-0 rounded-full bg-emerald-500 -mb-1 -ml-1 shadow-md border-2 border-emerald-600 flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">✓</span>
        </div>
      )}
    </motion.button>
  );
};

// Helper function to determine whether to use light or dark text based on background color
const getContrastYIQ = (hexcolor: string) => {
  // Default to black if no color is provided
  if (!hexcolor) return '#000000';
  
  // Remove hash if present
  hexcolor = hexcolor.replace('#', '');
  
  // If color is shorthand, expand it
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(c => c + c).join('');
  }
  
  // Handle invalid color format
  if (hexcolor.length !== 6) return '#000000';
  
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default BuildingTile;
