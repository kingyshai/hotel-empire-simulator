
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { MergerStockOption } from '@/types/game';
import { calculateStockPrice } from '@/utils/gameLogic';
import { Check, DollarSign, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const MergerStockOptions: React.FC = () => {
  const { state, dispatch } = useGame();
  const { currentMerger, players, currentPlayerIndex, hotelChains } = state;
  
  const [keepCount, setKeepCount] = useState<number>(0);
  const [sellCount, setSellCount] = useState<number>(0);
  const [tradeCount, setTradeCount] = useState<number>(0);
  
  if (!currentMerger) return null;
  
  const { acquiredChain, survivingChain, stocksHeld } = currentMerger;
  const currentPlayer = players[currentPlayerIndex];
  
  const acquiredChainColor = hotelChains[acquiredChain].color;
  const survivingChainColor = hotelChains[survivingChain].color;
  
  const stockPrice = calculateStockPrice(
    acquiredChain, 
    hotelChains[acquiredChain].tiles.length
  );
  
  const getTradeableAmount = (count: number) => {
    return Math.floor(count / 2);
  };
  
  const handleInputChange = (type: 'keep' | 'sell' | 'trade', value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (numValue < 0) return;
    
    if (type === 'keep') {
      setKeepCount(numValue);
      // Adjust other values to ensure total matches stocksHeld
      if (numValue + sellCount + tradeCount > stocksHeld) {
        if (sellCount > 0) {
          setSellCount(Math.max(0, stocksHeld - numValue - tradeCount));
        } else if (tradeCount > 0) {
          setTradeCount(Math.max(0, stocksHeld - numValue - sellCount));
        }
      }
    } else if (type === 'sell') {
      setSellCount(numValue);
      // Adjust other values to ensure total matches stocksHeld
      if (keepCount + numValue + tradeCount > stocksHeld) {
        if (keepCount > 0) {
          setKeepCount(Math.max(0, stocksHeld - numValue - tradeCount));
        } else if (tradeCount > 0) {
          setTradeCount(Math.max(0, stocksHeld - numValue - keepCount));
        }
      }
    } else if (type === 'trade') {
      // Ensure trade count is even
      const adjustedValue = numValue % 2 === 0 ? numValue : numValue - 1;
      setTradeCount(adjustedValue);
      // Adjust other values to ensure total matches stocksHeld
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
      // Make sure trade count is even
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
    
    dispatch({
      type: 'HANDLE_MERGER_STOCKS',
      payload: {
        acquiredChain,
        stocksToKeep: keepCount,
        stocksToSell: sellCount,
        stocksToTrade: tradeCount
      }
    });
  };
  
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merger Stock Options</DialogTitle>
          <DialogDescription>
            You own {stocksHeld} shares of {acquiredChain} which has been acquired by {survivingChain}.
            Decide what to do with your shares.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: acquiredChainColor }}></div>
            <span className="font-medium capitalize">{acquiredChain}</span>
            <span className="text-muted-foreground">→</span>
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: survivingChainColor }}></div>
            <span className="font-medium capitalize">{survivingChain}</span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    <span>Keep</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  Hope chain gets rebuilt
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max={stocksHeld}
                    value={keepCount}
                    onChange={(e) => handleInputChange('keep', e.target.value)}
                    className="w-16 h-8"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMaximize('keep')}
                  >
                    Max
                  </Button>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>Sell</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  ${stockPrice.sell} each
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max={stocksHeld}
                    value={sellCount}
                    onChange={(e) => handleInputChange('sell', e.target.value)}
                    className="w-16 h-8"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMaximize('sell')}
                  >
                    Max
                  </Button>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={16} />
                    <span>Trade</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  2:1 for {survivingChain}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max={stocksHeld}
                    step="2"
                    value={tradeCount}
                    onChange={(e) => handleInputChange('trade', e.target.value)}
                    className="w-16 h-8"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMaximize('trade')}
                  >
                    Max
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="mt-2 flex justify-between items-center text-sm">
            <div>
              <span className="font-medium">Total:</span> {calculateTotal()}/{stocksHeld} shares
            </div>
            <div>
              <span className="font-medium">Get:</span> {getTradeableAmount(tradeCount)} {survivingChain} shares
            </div>
          </div>
          
          {!isValidDistribution() && (
            <div className="text-destructive text-sm mt-1">
              {calculateTotal() !== stocksHeld 
                ? `Must allocate exactly ${stocksHeld} shares`
                : "Trade amount must be an even number"}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidDistribution()}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergerStockOptions;
