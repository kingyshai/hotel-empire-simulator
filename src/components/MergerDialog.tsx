
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HotelChainName } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { calculateStockPrice } from '@/utils/gameLogic';
import { Info, ArrowRight, AlertTriangle } from 'lucide-react';

interface MergerDialogProps {
  potentialMergers: HotelChainName[];
  tileCoordinate: string;
  onComplete: (survivingChain: HotelChainName) => void;
  onCancel: () => void;
  open: boolean;
}

const MergerDialog: React.FC<MergerDialogProps> = ({ 
  potentialMergers, 
  tileCoordinate, 
  onComplete,
  onCancel,
  open
}) => {
  const { state } = useGame();
  const { hotelChains } = state;
  const [selectedChain, setSelectedChain] = useState<HotelChainName | null>(null);

  // Sort chains by size (largest first)
  const sortedChains = [...potentialMergers].sort((a, b) => 
    hotelChains[b].tiles.length - hotelChains[a].tiles.length
  );

  // Find the largest chain size
  const largestSize = sortedChains.length > 0 ? hotelChains[sortedChains[0]].tiles.length : 0;
  
  // Find chains with the largest size
  const equalLargestChains = sortedChains.filter(chain => 
    hotelChains[chain].tiles.length === largestSize
  );
  
  // Only chains of equal largest size can be selected
  const needsUserSelection = equalLargestChains.length > 1;

  // If there's only one largest chain, it automatically becomes the survivor
  const automaticSurvivor = needsUserSelection ? null : equalLargestChains[0];

  // Set the default selected chain
  useEffect(() => {
    if (automaticSurvivor) {
      setSelectedChain(automaticSurvivor);
    } else if (needsUserSelection && equalLargestChains.length > 0 && !selectedChain) {
      setSelectedChain(equalLargestChains[0]);
    }
  }, [potentialMergers, automaticSurvivor, needsUserSelection, equalLargestChains, selectedChain]);

  const handleConfirm = () => {
    if (selectedChain) {
      onComplete(selectedChain);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {needsUserSelection ? "Select Surviving Hotel Chain" : "Merger Information"}
          </DialogTitle>
          <DialogDescription>
            The tile at {tileCoordinate} would connect {potentialMergers.length} hotel chains.
            {needsUserSelection 
              ? " Multiple chains have the same size. Please select which one should survive."
              : ` The largest chain (${automaticSurvivor}) will automatically be the survivor.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span>{needsUserSelection ? "Available Chains:" : "Chain Information:"}</span>
          </div>
          <div className="grid gap-4">
            {sortedChains.map(chain => {
              const stockPrice = calculateStockPrice(chain, hotelChains[chain].tiles.length);
              const primaryBonus = stockPrice.buy * 10;
              const secondaryBonus = stockPrice.buy * 5;
              const chainColor = hotelChains[chain]?.color || '#6b7280';
              const isLargest = hotelChains[chain].tiles.length === largestSize;
              const isSelectable = needsUserSelection && isLargest;
              
              return (
                <div key={chain} className={`flex items-center justify-between border p-3 rounded-md ${isLargest ? 'border-primary/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-5 h-5 rounded-md"
                      style={{ backgroundColor: chainColor }}
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium capitalize">{chain}</p>
                      <p className="text-xs text-muted-foreground">{hotelChains[chain].tiles.length} tiles</p>
                      <p className="text-xs text-muted-foreground">Stock price: ${stockPrice.buy}</p>
                      <p className="text-xs text-muted-foreground">Primary bonus: ${primaryBonus}</p>
                      <p className="text-xs text-muted-foreground">Secondary bonus: ${secondaryBonus}</p>
                    </div>
                  </div>
                  
                  {isSelectable ? (
                    <Button
                      variant={selectedChain === chain ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedChain(chain)}
                    >
                      {selectedChain === chain ? "Selected as Survivor" : "Select as Survivor"}
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {automaticSurvivor === chain 
                        ? <span className="text-primary font-medium">Will Survive</span> 
                        : <span>Will Merge</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-sm text-muted-foreground mt-4 bg-secondary/20 p-3 rounded-md">
            <p className="flex items-center gap-2"><Info className="h-4 w-4" /> <strong>Important:</strong> The selected chain will survive, and the others will be merged into it.</p>
            <p className="mt-1">This decision impacts stock values and bonuses:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Majority stockholder receives 10× stock price</li>
              <li>Second largest stockholder receives 5× stock price</li>
              <li>If one player holds most stocks, they get both bonuses (15× price)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedChain}>
            <ArrowRight className="mr-2 h-4 w-4" />
            {needsUserSelection ? "Confirm Selection" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergerDialog;
