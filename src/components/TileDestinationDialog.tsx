
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HotelChainName } from '@/types/game';
import { useGame } from '@/context/GameContext';
import { ArrowRight, MapPin } from 'lucide-react';

interface TileDestinationDialogProps {
  adjacentChains: HotelChainName[];
  coordinate: string;
  onSelect: (chain: HotelChainName) => void;
  onCancel: () => void;
  open: boolean;
}

const TileDestinationDialog: React.FC<TileDestinationDialogProps> = ({
  adjacentChains,
  coordinate,
  onSelect,
  onCancel,
  open
}) => {
  const { state } = useGame();
  const { hotelChains } = state;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Choose Destination Chain
          </DialogTitle>
          <DialogDescription>
            Select which hotel chain the tile at {coordinate} should be added to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground mb-2">
            Adding this tile may trigger mergers between chains. You'll be able to choose which chain survives in the next step.
          </div>
          
          <div className="grid gap-3">
            {adjacentChains.map(chain => {
              const chainColor = hotelChains[chain]?.color || '#6b7280';
              
              return (
                <Button
                  key={chain}
                  variant="outline"
                  className="flex items-center justify-between h-auto py-3 px-4"
                  onClick={() => onSelect(chain)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-5 h-5 rounded-md"
                      style={{ backgroundColor: chainColor }}
                    />
                    <div className="text-left">
                      <p className="font-medium capitalize">{chain}</p>
                      <p className="text-xs text-muted-foreground">{hotelChains[chain].tiles.length} tiles</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TileDestinationDialog;
