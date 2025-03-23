
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { EyeOff } from 'lucide-react';

interface StockHeaderProps {
  hideAvailableStocks: boolean;
  setHideAvailableStocks: (value: boolean) => void;
}

const StockHeader: React.FC<StockHeaderProps> = ({ 
  hideAvailableStocks, 
  setHideAvailableStocks 
}) => {
  return (
    <div className="p-3 bg-secondary/50 border-b border-border/50 flex justify-between items-center">
      <h2 className="text-sm font-medium">Stock Market</h2>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-muted-foreground flex items-center">
          <EyeOff size={14} className="mr-1" />
          Hide available
        </span>
        <Switch
          checked={hideAvailableStocks}
          onCheckedChange={setHideAvailableStocks}
          aria-label="Toggle hide available stocks"
        />
      </div>
    </div>
  );
};

export default StockHeader;
