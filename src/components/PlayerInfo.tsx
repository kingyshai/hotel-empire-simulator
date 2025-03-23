
import React from 'react';
import { useGame } from '@/context/GameContext';
import { HotelChainName, Player } from '@/types/game';
import { motion } from 'framer-motion';
import { 
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/ui/table';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isCurrentPlayer }) => {
  const { state } = useGame();
  const { hotelChains } = state;
  
  const getTotalStocks = () => {
    return Object.values(player.stocks).reduce((sum, current) => sum + current, 0);
  };
  
  return (
    <motion.div 
      className={`glass-panel rounded-lg overflow-hidden ${isCurrentPlayer ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`p-3 ${isCurrentPlayer ? 'bg-primary/5' : 'bg-secondary/50'} border-b border-border/50`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{player.name}</h3>
          {isCurrentPlayer && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Current Turn
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Money</span>
          <span className="font-medium">${player.money.toLocaleString()}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stocks</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
              {getTotalStocks()} total
            </span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 p-0 pl-2">Chain</TableHead>
                <TableHead className="h-7 p-0 text-right pr-2">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(player.stocks)
                .filter(([_, quantity]) => quantity > 0)
                .map(([chainName, quantity]) => {
                  const chain = hotelChains[chainName as HotelChainName];
                  
                  return (
                    <TableRow key={chainName} className="hover:bg-transparent">
                      <TableCell 
                        className="py-1 px-2 flex items-center"
                      >
                        <div 
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: chain.color }}
                        />
                        <span className="capitalize text-xs">{chainName}</span>
                      </TableCell>
                      <TableCell className="py-1 px-2 text-right text-xs font-medium">
                        {quantity}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {getTotalStocks() === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-2 text-center text-xs text-muted-foreground">
                    No stocks
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tiles</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
              {player.tiles.length} tiles
            </span>
          </div>
          
          {isCurrentPlayer && player.tiles.length > 0 && (
            <div className="grid grid-cols-6 gap-1">
              {player.tiles.map(tile => (
                <div 
                  key={tile}
                  className="aspect-square rounded border border-border flex items-center justify-center text-xs p-0.5"
                >
                  {tile}
                </div>
              ))}
            </div>
          )}
          
          {isCurrentPlayer && player.tiles.length === 0 && (
            <div className="text-xs text-center py-2 text-muted-foreground">
              No tiles available
            </div>
          )}
          
          {!isCurrentPlayer && (
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: player.tiles.length }).map((_, i) => (
                <div 
                  key={i}
                  className="w-4 h-5 rounded bg-secondary"
                />
              ))}
              {player.tiles.length === 0 && (
                <div className="text-xs py-2 text-muted-foreground">
                  No tiles
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerInfo;
