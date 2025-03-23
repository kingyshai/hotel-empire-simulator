
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
  
  // Safely extract stock purchase info
  const purchasedStocksList = Object.entries(purchaseInfo.stocks || {})
    .filter(([chain, count]) => count > 0)
    .map(([chain, count]) => ({
      chain: chain as HotelChainName,
      count,
      isFreeFounderStock: chain === purchaseInfo.foundedHotel && count === 1
    }));
  
  const totalStocks = purchasedStocksList.reduce((sum, { count, isFreeFounderStock }) => 
    sum + (isFreeFounderStock ? 0 : count), 0);
  const hasFoundedHotel = !!purchaseInfo.foundedHotel;
  const hasPurchasedStocks = totalStocks > 0;
  
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
                {hasFoundedHotel
                  ? ` founded ${purchaseInfo.foundedHotel} hotel chain` 
                  : (hasPurchasedStocks 
                    ? " purchased stocks" 
                    : " ended turn without purchasing stocks")}
                {hasFoundedHotel && hasPurchasedStocks ? " and purchased additional stocks!" : "!"}
              </h3>
              <div className="text-sm">
                {hasFoundedHotel && (
                  <div className="mt-1 font-medium text-white bg-green-500/30 px-2 py-1 rounded-full inline-block mr-2">
                    Received 1 free {purchaseInfo.foundedHotel} founder stock
                  </div>
                )}
                
                {purchasedStocksList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {purchasedStocksList
                      .filter(({ chain, count }) => 
                        // Only show purchased stocks, excluding the free founder stock if that's all they got
                        !(chain === purchaseInfo.foundedHotel && count === 1)
                      )
                      .map(({ chain, count, isFreeFounderStock }) => {
                        // If this is the founded hotel and has more than 1 stock, reduce count by 1 for display
                        const displayCount = (chain === purchaseInfo.foundedHotel) ? count - 1 : count;
                        if (displayCount <= 0) return null;
                        
                        return (
                          <div
                            key={chain}
                            className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: state.hotelChains[chain]?.color || '#888' }}
                            />
                            <span className="capitalize">{chain}</span>
                            <span className="font-bold">×{displayCount}</span>
                          </div>
                        );
                      })}
                    {purchaseInfo.totalCost > 0 && hasPurchasedStocks && (
                      <div className="bg-white/20 px-2 py-1 rounded-full">
                        Total: ${purchaseInfo.totalCost}
                      </div>
                    )}
                  </div>
                ) : (
                  !hasFoundedHotel && <span className="mt-1 inline-block">No stocks purchased</span>
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
