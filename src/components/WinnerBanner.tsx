
import React from 'react';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Player } from '@/types/game';
import { Button } from './ui/button';

interface WinnerBannerProps {
  winner: Player | null;
  winners?: Player[];
  onClose: () => void;
}

const WinnerBanner: React.FC<WinnerBannerProps> = ({ winner, winners, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-amber-500 to-amber-300 text-black shadow-lg"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy size={24} className="text-amber-900" />
            {winner ? (
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">
                  <span className="text-amber-900">{winner.name}</span> receives stockholder bonus!
                </h3>
                <p className="text-sm">Amount: ${winner.money.toLocaleString()}</p>
              </div>
            ) : winners && winners.length > 0 ? (
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">
                  Multiple stockholders receive bonus!
                </h3>
                {winners.map(player => (
                  <p key={player.id} className="text-sm">
                    {player.name}: ${player.money.toLocaleString()}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClose}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            Acknowledge
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WinnerBanner;
