import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { calculateStockPrice } from '@/utils/gameLogic';
import { Check, DollarSign, ArrowRight, AlertTriangle, Info, RefreshCw, Coins } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from '@/utils/toast';

const MergerStockOptions: React.FC = () => {
  const { state, dispatch } = useGame();
  const { currentMerger, players, currentPlayerIndex, hotelChains } = state;
  
  const [keepCount, setKeepCount] = useState<number>(0);
  const [sellCount, setSellCount] = useState<number>(0);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  if (!currentMerger) return null;
  
  const { acquiredChain, survivingChain, stocksHeld } = currentMerger;
  const currentPlayer = players[currentPlayerIndex];
  
  const stockPrice = calculateStockPrice(
    acquiredChain, 
    hotelChains[acquiredChain].tiles.length
  );
  
  useEffect(() => {
    resetForm();
  }, [currentMerger, currentPlayerIndex, stocksHeld]);
  
  const resetForm = () => {
    setKeepCount(stocksHeld);
    setSellCount(0);
    setTradeCount(0);
  };
  
  const getTradeableAmount = (count: number) => {
    return Math.floor(count / 2);
  };
  
  const handleInputChange = (type: 'keep' | 'sell' | 'trade', value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (numValue < 0) return;
    
    if (type === 'keep') {
      setKeepCount(numValue);
      if (numValue + sellCount + tradeCount > stocksHeld) {
        if (sellCount > 0) {
          setSellCount(Math.max(0, stocksHeld - numValue - tradeCount));
        } else if (tradeCount > 0) {
          setTradeCount(Math.max(0, stocksHeld - numValue - sellCount));
        }
      }
    } else if (type === 'sell') {
      setSellCount(numValue);
      if (keepCount + numValue + tradeCount > stocksHeld) {
        if (keepCount > 0) {
          setKeepCount(Math.max(0, stocksHeld - numValue - tradeCount));
        } else if (tradeCount > 0) {
          setTradeCount(Math.max(0, stocksHeld - numValue - keepCount));
        }
      }
    } else if (type === 'trade') {
      const adjustedValue = numValue % 2 === 0 ? numValue : numValue - 1;
      setTradeCount(adjustedValue);
      if (keepCount + sellCount + adjustedValue > stocksHeld) {
        if (keepCount > 0) {
          setKeepCount(Math.max(0, stocksHeld - sellCount - adjustedValue));
        } else if (sellCount > 0) {
          setSellCount(Math.max(0, stocksHeld - keepCount - adjustedValue));
        }
      }
    }
  };
  
  const handleMaximize = (type: 'keep' | 'sell' | 'trade') => {
    if (type === 'keep') {
      setKeepCount(stocksHeld);
      setSellCount(0);
      setTradeCount(0);
    } else if (type === 'sell') {
      setKeepCount(0);
      setSellCount(stocksHeld);
      setTradeCount(0);
    } else if (type === 'trade') {
      const maxTradeCount = stocksHeld - (stocksHeld % 2);
      setKeepCount(stocksHeld - maxTradeCount);
      setSellCount(0);
      setTradeCount(maxTradeCount);
    }
  };
  
  const calculateTotal = () => {
    return keepCount + sellCount + tradeCount;
  };
  
  const isValidDistribution = () => {
    return calculateTotal() === stocksHeld && tradeCount % 2 === 0;
  };
  
  const handleSubmit = () => {
    if (!isValidDistribution()) return;
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      dispatch({
        type: 'HANDLE_MERGER_STOCKS',
        payload: {
          acquiredChain,
          stocksToKeep: keepCount,
          stocksToSell: sellCount,
          stocksToTrade: tradeCount
        }
      });
      
      setIsSubmitting(false);
    }, 300);
  };

  const acquiredChainColor = hotelChains[acquiredChain].color;
  const survivingChainColor = hotelChains[survivingChain].color;

  const sellValue = sellCount * stockPrice.sell;
  const tradeValue = getTradeableAmount(tradeCount);
  
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Stock Options for Merger
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{currentPlayer.name}</span>, decide what to do with your {stocksHeld} shares of {acquiredChain} 
            which has been acquired by {survivingChain}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-md">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: acquiredChainColor }}></div>
            <span className="font-medium capitalize">{acquiredChain}</span>
            <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: survivingChainColor }}></div>
            <span className="font-medium capitalize">{survivingChain}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-secondary/10 rounded-md p-3 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Keep Shares</span>
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleMaximize('keep')}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Keep shares of {acquiredChain} in case it gets rebuilt.</p>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  max={stocksHeld}
                  value={keepCount}
                  onChange={(e) => handleInputChange('keep', e.target.value)}
                  className="w-full"
                />
                <span className="text-xs whitespace-nowrap">of {stocksHeld}</span>
              </div>
            </div>
            
            <div className="bg-secondary/10 rounded-md p-3 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span>Sell Shares</span>
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleMaximize('sell')}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Sell for ${stockPrice.sell} each.</p>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  max={stocksHeld}
                  value={sellCount}
                  onChange={(e) => handleInputChange('sell', e.target.value)}
                  className="w-full"
                />
                <span className="text-xs whitespace-nowrap">= ${sellValue}</span>
              </div>
            </div>
            
            <div className="bg-secondary/10 rounded-md p-3 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-500" />
                  <span>Trade Shares</span>
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleMaximize('trade')}
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Trade 2:1 for shares of {survivingChain}.</p>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  max={stocksHeld}
                  step="2"
                  value={tradeCount}
                  onChange={(e) => handleInputChange('trade', e.target.value)}
                  className="w-full"
                />
                <span className="text-xs whitespace-nowrap">= {tradeValue} shares</span>
              </div>
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span>Summary of your choices:</span>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm flex justify-between">
                <span>Total allocated:</span> 
                <span className={!isValidDistribution() ? "text-red-500 font-medium" : "font-medium"}>
                  {calculateTotal()}/{stocksHeld} shares
                </span>
              </li>
              {keepCount > 0 && (
                <li className="text-sm flex justify-between">
                  <span>Keep {keepCount} shares of {acquiredChain}</span>
                  <span>Potential future value</span>
                </li>
              )}
              {sellCount > 0 && (
                <li className="text-sm flex justify-between">
                  <span>Sell {sellCount} shares</span>
                  <span className="font-medium">${sellValue}</span>
                </li>
              )}
              {tradeCount > 0 && (
                <li className="text-sm flex justify-between">
                  <span>Trade {tradeCount} shares</span>
                  <span className="font-medium">{tradeValue} shares of {survivingChain}</span>
                </li>
              )}
            </ul>
          </div>
          
          {!isValidDistribution() && (
            <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded border border-destructive/20">
              <AlertTriangle size={16} />
              {calculateTotal() !== stocksHeld 
                ? `Must allocate exactly ${stocksHeld} shares`
                : "Trade amount must be an even number"}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button 
            variant="outline"
            onClick={resetForm}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidDistribution() || isSubmitting}
            className="flex items-center gap-2 min-w-[120px]"
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm Choices
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergerStockOptions;
