
import React from 'react';
import { motion } from 'framer-motion';
import { HotelChainName } from '@/types/game';

interface ChainLabelsProps {
  chainNames: HotelChainName[];
  hotelChains: Record<HotelChainName, any>;
}

const ChainLabels: React.FC<ChainLabelsProps> = ({ chainNames, hotelChains }) => {
  return (
    <div className="grid grid-cols-7 gap-2 mb-3">
      {chainNames.map((chainName) => (
        <motion.div
          key={chainName}
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 * chainNames.indexOf(chainName) }}
        >
          <div 
            className="w-4 h-4 rounded-full mb-1"
            style={{ backgroundColor: hotelChains[chainName].color }}
          />
          <span className="text-xs capitalize">{chainName}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default ChainLabels;
