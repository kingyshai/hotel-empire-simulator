
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HotelChainName } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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

  // Automatically select the largest chain
  React.useEffect(() => {
    if (potentialMergers.length > 0 && !selectedChain) {
      setSelectedChain(sortedChains[0]);
    }
  }, [potentialMergers, sortedChains, selectedChain]);

  const handleConfirm = () => {
    if (selectedChain) {
      onComplete(selectedChain);
    }
  };

  // Get chain color for display
  const chainColorMap = {
    american: 'blue',
    worldwide: 'brown',
    festival: 'green',
    imperial: 'pink',
    continental: 'turquoise',
    luxor: 'red',
    tower: 'yellow'
  };

  // Check if there's more than one largest chain
  const largestSize = sortedChains.length > 0 ? hotelChains[sortedChains[0]].tiles.length : 0;
  const equalLargestChains = sortedChains.filter(chain => 
    hotelChains[chain].tiles.length === largestSize
  );
  const needsUserSelection = equalLargestChains.length > 1;
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hotel Chain Merger</DialogTitle>
          <DialogDescription>
            The tile at {tileCoordinate} would connect {potentialMergers.length} hotel chains.
            {needsUserSelection 
              ? " Multiple chains have the same size. Please select which one should survive."
              : " The largest chain will be the survivor."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            {sortedChains.map(chain => (
              <div key={chain} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: chainColorMap[chain as keyof typeof chainColorMap] || hotelChains[chain].color }}
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium capitalize">{chain}</p>
                    <p className="text-xs text-muted-foreground">{hotelChains[chain].tiles.length} tiles</p>
                  </div>
                </div>
                
                {needsUserSelection && (
                  <Button
                    variant={selectedChain === chain ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedChain(chain)}
                  >
                    {selectedChain === chain ? "Selected" : "Select"}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {needsUserSelection && (
            <div className="text-sm text-muted-foreground mt-4">
              The selected chain will survive, and the others will be merged into it.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedChain}>
            Confirm Merger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergerDialog;
