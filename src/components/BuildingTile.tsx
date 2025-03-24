
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
  
  // Define colors for different tile states with increased vibrancy
  const STANDALONE_PURPLE = "#8B5CF6"; // Purple for standalone/initial tiles
  const AVAILABLE_BLUE = "#3B82F6";    // Blue for available tiles
  const DARK_BLUE = "#2563EB";         // Darker blue for borders
  
  return (
    <motion.button
      key={tileKey}
      className={cn(
        "building-tile relative w-full h-full flex items-center justify-center rounded-md",
        isPlaced ? "cursor-default shadow-md" : 
        isSelectable ? "cursor-pointer ring-2 ring-primary/50" : 
        isAvailable ? "cursor-pointer" : 
        state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile' ? "cursor-pointer" :
        "cursor-default",
        isUnplayable ? "bg-red-200 cursor-not-allowed" : "", 
        !belongsToChain && isPlaced && !isInitialTile && !isRecentlyPlaced ? "bg-[#9b87f5]/30 border-[#9b87f5]/50" : ""
      )}
      style={
        belongsToChain && chainColor 
          ? {
              backgroundColor: chainColor,
              color: textColor,
              borderColor: chainColor
            } 
          : isAvailable
            ? {
                backgroundColor: AVAILABLE_BLUE,
                color: "#FFFFFF",
                borderColor: DARK_BLUE,
                boxShadow: `0 0 0 2px ${DARK_BLUE}`,
                opacity: 1 // Ensure full opacity
              }
          : isInitialTile
            ? {
                backgroundColor: STANDALONE_PURPLE,
                color: "#FFFFFF",
                borderColor: "#7C3AED",
                boxShadow: `0 0 0 2px #7C3AED`,
                opacity: 1 // Ensure full opacity
              }
            : isRecentlyPlaced && !isInitialTile
              ? {
                  backgroundColor: "#212121",
                  color: "#FFFFFF",
                  borderColor: "#000000",
                  boxShadow: "0 0 0 2px #000000"
                }
              : !belongsToChain && isPlaced && !isInitialTile && !isRecentlyPlaced
                ? {
                    backgroundColor: STANDALONE_PURPLE,
                    color: "#FFFFFF",
                    borderColor: "#7C3AED"
                  }
                : (state.gamePhase === 'setup' && state.setupPhase === 'drawInitialTile')
                  ? {
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E7EB"
                    }
                  : {
                      backgroundColor: "#FFFFFF"
                    }
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
        (isInitialTile || isAvailable) ? "text-white font-bold" : "",
        isRecentlyPlaced && !isInitialTile ? "text-white font-bold" : "",
        !belongsToChain && isPlaced && !isInitialTile && !isRecentlyPlaced ? "text-white font-bold" : ""
      )}>
        {coordinate}
      </span>
      
      {isUnplayable && (
        <div className="absolute inset-0 opacity-70 rounded-md bg-red-500" />
      )}
      
      {isSelectable && (
        <div className="absolute inset-0 opacity-40 rounded-md bg-green-500" />
      )}
      
      {isInitialTile && (
        <div className="absolute w-8 h-8 top-0 right-0 rounded-full bg-purple-800 -mt-3 -mr-3 shadow-md border-2 border-purple-900 flex items-center justify-center z-20">
          <span className="text-[12px] text-white font-bold">★</span>
        </div>
      )}
      
      {isRecentlyPlaced && !isInitialTile && (
        <div className="absolute w-6 h-6 bottom-0 left-0 rounded-full bg-black -mb-2 -ml-2 shadow-md border-2 border-gray-700 flex items-center justify-center z-20">
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
