
import React from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import { getTileDistance } from '@/utils/gameLogic';
import BoardGrid from './BoardGrid';

interface InitialTileDrawingProps {
  onTileClick: (coordinate: string) => void;
  getBoardKey: () => string;
  onDrawInitialTile: () => void;
}

const InitialTileDrawing: React.FC<InitialTileDrawingProps> = ({ 
  onTileClick, 
  getBoardKey,
  onDrawInitialTile 
}) => {
  const { state } = useGame();
  const { players, currentPlayerIndex, initialTiles } = state;
  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-3 bg-secondary/50 border-b border-border/50">
        <h2 className="text-lg font-medium">Draw Initial Tile</h2>
      </div>
      
      <div className="p-6 text-center">
        <p className="mb-4 text-lg">
          <span className="font-medium">{currentPlayer.name}</span>, click the button below to draw your initial tile
        </p>
        
        <Button 
          onClick={onDrawInitialTile}
          size="lg"
          className="mb-8 w-full max-w-lg mx-auto py-6 text-lg bg-primary/80 hover:bg-primary"
        >
          Draw Initial Tile
        </Button>
        
        {initialTiles.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Initial Tiles Drawn:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {initialTiles.map((tileInfo, index) => {
                const player = players.find(p => p.id === tileInfo.playerId);
                const distance = getTileDistance(tileInfo.coordinate);
                return (
                  <div key={index} className="px-3 py-2 bg-secondary/30 rounded-md">
                    <span className="font-medium">{player?.name}</span>: {tileInfo.coordinate}
                    <span className="text-xs ml-2 text-muted-foreground">(Distance from A1: {distance})</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The player closest to A1 will go first.
            </p>
          </div>
        )}
        
        <BoardGrid onTileClick={onTileClick} getBoardKey={getBoardKey} />
        
        <p className="mt-4 text-sm text-muted-foreground">
          Each player draws an initial tile to determine the play order
        </p>
      </div>
    </div>
  );
};

export default InitialTileDrawing;
