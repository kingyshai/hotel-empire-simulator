
import React from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import { ShoppingCart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HotelChainName } from '@/types/game';

interface StockPurchaseBannerProps {
  purchaseInfo: {
    playerName: string;
    stocks: Record<HotelChainName, number>;
    totalCost: number;
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
  
  if (!purchaseInfo) return null;
  
  const purchasedStocksList = Object.entries(purchaseInfo.stocks)
    .filter(([_, count]) => count > 0)
    .map(([chain, count]) => ({
      chain: chain as HotelChainName,
      count
    }));
  
  const totalStocks = purchasedStocksList.reduce((sum, { count }) => sum + count, 0);
  
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
            <ShoppingCart size={24} className="text-white" />
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">
                <span className="text-blue-900">{purchaseInfo.playerName}</span> purchased stocks!
              </h3>
              <div className="text-sm">
                {purchasedStocksList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {purchasedStocksList.map(({ chain, count }) => (
                      <div
                        key={chain}
                        className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: state.hotelChains[chain].color }}
                        />
                        <span className="capitalize">{chain}</span>
                        <span className="font-bold">×{count}</span>
                      </div>
                    ))}
                    <div className="bg-white/20 px-2 py-1 rounded-full">
                      Total: ${purchaseInfo.totalCost}
                    </div>
                  </div>
                ) : (
                  <span>No stocks purchased</span>
                )}
              </div>
            </div>
          </div>
          
          {currentPlayer && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onAcknowledge}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <Check size={16} className="mr-1" />
              OK
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockPurchaseBanner;
