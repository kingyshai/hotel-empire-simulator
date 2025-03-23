
import React from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import { ShoppingCart, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HotelChainName } from '@/types/game';

interface StockPurchaseBannerProps {
  purchaseInfo: {
    playerName: string;
    stocks: Record<HotelChainName, number>;
    totalCost: number;
    foundedHotel?: HotelChainName;
  } | null;
  onAcknowledge: () => void;
}

const StockPurchaseBanner: React.FC<StockPurchaseBannerProps> = ({ 
  purchaseInfo, 
  onAcknowledge
}) => {
  const { state } = useGame();
  const { currentPlayerIndex, players } = state;
  const currentPlayer = players[currentPlayerIndex];
  
  // Early return if purchaseInfo is null
  if (!purchaseInfo) return null;
  
  // Check if any non-founder stocks were purchased
  const hasNonFounderStocksPurchased = Object.entries(purchaseInfo.stocks || {})
    .some(([chain, count]) => {
      if (chain === purchaseInfo.foundedHotel) {
        // If this is the founded chain, check if more than just the free stock was purchased
        return count > 1;
      }
      // For other chains, any purchase counts
      return count > 0;
    });
  
  // Check if a hotel was founded
  const hasFoundedHotel = !!purchaseInfo.foundedHotel;
  
  // Create a list of purchased stocks to display
  const purchasedStocksList = Object.entries(purchaseInfo.stocks || {})
    .filter(([chain, count]) => count > 0)
    .map(([chain, count]) => ({
      chain: chain as HotelChainName,
      count,
      isFounderStock: chain === purchaseInfo.foundedHotel && count === 1
    }));
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-blue-500 to-blue-300 text-white shadow-lg"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasFoundedHotel ? (
              <Building2 size={24} className="text-white" />
            ) : (
              <ShoppingCart size={24} className="text-white" />
            )}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">
                <span className="text-blue-900">{purchaseInfo.playerName}</span> 
                {hasFoundedHotel && hasNonFounderStocksPurchased
                  ? ` founded ${purchaseInfo.foundedHotel} hotel chain and purchased additional stocks!` 
                  : hasFoundedHotel && !hasNonFounderStocksPurchased
                    ? ` founded ${purchaseInfo.foundedHotel} hotel chain and received free founder stock!`
                    : hasNonFounderStocksPurchased 
                      ? " purchased stocks!" 
                      : " ended turn without purchasing any stocks!"}
              </h3>
              <div className="text-sm">
                {/* Display free founder stock if applicable */}
                {hasFoundedHotel && (
                  <div className="mt-1 font-medium text-white bg-green-500/30 px-2 py-1 rounded-full inline-block mr-2">
                    Received 1 free {purchaseInfo.foundedHotel} founder stock
                  </div>
                )}
                
                {/* Display purchased stocks (excluding the free founder stock) */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(purchaseInfo.stocks)
                    .filter(([chain, count]) => {
                      // Skip free founder stock in this section
                      if (chain === purchaseInfo.foundedHotel && count === 1) return false;
                      // Include all other purchased stocks
                      return count > 0;
                    })
                    .map(([chain, count]) => {
                      const chainName = chain as HotelChainName;
                      // For the founded hotel, show count minus 1 (for the free stock)
                      const displayCount = chainName === purchaseInfo.foundedHotel ? count - 1 : count;
                      
                      if (displayCount <= 0) return null;
                      
                      return (
                        <div
                          key={chain}
                          className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: state.hotelChains[chainName]?.color || '#888' }}
                          />
                          <span className="capitalize">{chain}</span>
                          <span className="font-bold">×{displayCount}</span>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                    
                  {purchaseInfo.totalCost > 0 && (
                    <div className="bg-white/20 px-2 py-1 rounded-full">
                      Total: ${purchaseInfo.totalCost}
                    </div>
                  )}
                </div>
                
                {!hasNonFounderStocksPurchased && !hasFoundedHotel && (
                  <span className="mt-1 inline-block">No stocks purchased during this turn</span>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onAcknowledge}
            className="bg-white text-blue-700 hover:bg-blue-50"
          >
            <Check size={16} className="mr-1" />
            OK
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockPurchaseBanner;
