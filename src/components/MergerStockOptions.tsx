
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MergerStockOption } from '@/types/game';
import { calculateStockPrice } from '@/utils/gameLogic';

const MergerStockOptions: React.FC = () => {
  const { state, dispatch } = useGame();
  const { currentMerger, players, currentPlayerIndex, hotelChains } = state;
  
  const [stockOption, setStockOption] = useState<MergerStockOption>('keep');
  const [quantity, setQuantity] = useState<number>(0);
  
  if (!currentMerger) return null;
  
  const { acquiredChain, survivingChain, stocksHeld } = currentMerger;
  const currentPlayer = players[currentPlayerIndex];
  
  const acquiredChainColor = hotelChains[acquiredChain].color;
  const survivingChainColor = hotelChains[survivingChain].color;
  
  const stockPrice = calculateStockPrice(
    acquiredChain, 
    hotelChains[acquiredChain].tiles.length
  );
  
  const handleSubmit = () => {
    dispatch({
      type: 'HANDLE_MERGER_STOCKS',
      payload: {
        acquiredChain,
        stockOption,
        quantity: stockOption === 'trade' ? quantity : undefined
      }
    });
  };
  
  const stockOptions = [];
  for (let i = 0; i <= Math.floor(stocksHeld / 2) * 2; i += 2) {
    stockOptions.push(i);
  }
  
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
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Choose an option:</h4>
            
            <div className="space-y-1">
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="stockOption" 
                  value="keep" 
                  checked={stockOption === 'keep'}
                  onChange={() => setStockOption('keep')}
                  className="h-4 w-4"
                />
                <span>Keep all shares (hoping chain gets rebuilt)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="stockOption" 
                  value="sell" 
                  checked={stockOption === 'sell'}
                  onChange={() => setStockOption('sell')}
                  className="h-4 w-4"
                />
                <span>Sell all shares (${stockPrice.sell} each)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="stockOption" 
                  value="trade" 
                  checked={stockOption === 'trade'}
                  onChange={() => setStockOption('trade')}
                  className="h-4 w-4"
                />
                <span>Trade 2:1 for {survivingChain} shares</span>
              </label>
            </div>
            
            {stockOption === 'trade' && stocksHeld >= 2 && (
              <div className="pt-2">
                <Select value={quantity.toString()} onValueChange={(val) => setQuantity(parseInt(val))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Number of shares to trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockOptions.map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Trade {num} shares ({num > 0 ? Math.floor(num / 2) : 0} {survivingChain} shares)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll keep {stocksHeld - quantity} shares of {acquiredChain}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergerStockOptions;
