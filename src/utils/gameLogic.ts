import { 
  GameState, 
  Player, 
  HotelChainName, 
  Coordinate, 
  BuildingTile,
  StockholderBonus
} from '@/types/game';

export const isAdjacent = (coord1: Coordinate, coord2: Coordinate): boolean => {
  const row1 = parseInt(coord1.match(/^\d+/)?.[0] || '0');
  const col1 = coord1.match(/[A-Z]$/)?.[0] || '';
  
  const row2 = parseInt(coord2.match(/^\d+/)?.[0] || '0');
  const col2 = coord2.match(/[A-Z]$/)?.[0] || '';
  
  return (
    (row1 === row2 && Math.abs(col1.charCodeAt(0) - col2.charCodeAt(0)) === 1) ||
    (col1 === col2 && Math.abs(row1 - row2) === 1)
  );
};

export const getAdjacentTiles = (coord: Coordinate, placedTiles: Record<Coordinate, BuildingTile>): Coordinate[] => {
  const row = parseInt(coord.match(/^\d+/)?.[0] || '0');
  const col = coord.match(/[A-Z]$/)?.[0] || '';
  
  if (!row || !col) return [];
  
  const potentialAdjacents: Coordinate[] = [
    `${row - 1}${col}` as Coordinate, // Above
    `${row + 1}${col}` as Coordinate, // Below
    `${row}${String.fromCharCode(col.charCodeAt(0) - 1)}` as Coordinate, // Left
    `${row}${String.fromCharCode(col.charCodeAt(0) + 1)}` as Coordinate, // Right
  ];
  
  return potentialAdjacents.filter(c => {
    const r = parseInt(c.match(/^\d+/)?.[0] || '0');
    const c1 = c.match(/[A-Z]$/)?.[0] || '';
    
    if (r < 1 || r > 12 || c1 < 'A' || c1 > 'I') return false;
    
    return placedTiles[c] !== undefined;
  });
};

export const findConnectedTiles = (startCoord: Coordinate, placedTiles: Record<Coordinate, BuildingTile>): Coordinate[] => {
  const visited: Record<Coordinate, boolean> = {};
  const connected: Coordinate[] = [];
  
  const tempPlacedTiles = { ...placedTiles };
  if (!tempPlacedTiles[startCoord]) {
    tempPlacedTiles[startCoord] = { coordinate: startCoord, isPlaced: true };
  }
  
  const dfs = (coord: Coordinate) => {
    if (visited[coord]) return;
    visited[coord] = true;
    
    if (!connected.includes(coord)) {
      connected.push(coord);
    }
    
    const adjacents = getAdjacentTiles(coord, tempPlacedTiles);
    
    for (const adj of adjacents) {
      if (tempPlacedTiles[adj] && !tempPlacedTiles[adj].belongsToChain) {
        dfs(adj);
      }
    }
  };
  
  connected.push(startCoord);
  
  const adjacents = getAdjacentTiles(startCoord, tempPlacedTiles);
  for (const adj of adjacents) {
    if (placedTiles[adj] && !placedTiles[adj].belongsToChain) {
      dfs(adj);
    }
  }
  
  return connected;
};

export const findPotentialMergers = (coord: Coordinate, state: GameState): HotelChainName[] => {
  const { placedTiles, hotelChains } = state;
  
  const adjacents = getAdjacentTiles(coord, placedTiles);
  
  const adjacentChains: HotelChainName[] = [];
  
  for (const adj of adjacents) {
    if (!placedTiles[adj]) continue;
    
    const tile = placedTiles[adj];
    if (tile.belongsToChain && !adjacentChains.includes(tile.belongsToChain)) {
      adjacentChains.push(tile.belongsToChain);
    }
  }
  
  return adjacentChains;
};

/**
 * Determines if a tile would create an illegal merger between safe chains
 * @param coord The coordinate to check
 * @param state The current game state
 * @returns True if the tile is "burned" (would create illegal merger)
 */
export const isTileBurned = (coord: Coordinate, state: GameState): boolean => {
  const adjacentChains = findPotentialMergers(coord, state);
  
  const safeChains = adjacentChains.filter(chainName => 
    state.hotelChains[chainName].tiles.length >= 11
  );
  
  return safeChains.length >= 2;
};

export const calculateStockPrice = (chainName: HotelChainName, chainSize: number): { buy: number, sell: number } => {
  let basePrice = 0;
  
  if (chainSize >= 41) {
    basePrice = 1000;
  } else if (chainSize >= 31) {
    basePrice = 900;
  } else if (chainSize >= 21) {
    basePrice = 800;
  } else if (chainSize >= 11) {
    basePrice = 700;
  } else if (chainSize >= 6) {
    basePrice = 600;
  } else if (chainSize === 5) {
    basePrice = 500;
  } else if (chainSize === 4) {
    basePrice = 400;
  } else if (chainSize === 3) {
    basePrice = 300;
  } else if (chainSize === 2) {
    basePrice = 200;
  } else if (chainSize === 1) {
    basePrice = 100;
  }
  
  const chainTier = getChainTier(chainName);
  if (chainTier === 'medium') {
    basePrice += 100;
  } else if (chainTier === 'expensive') {
    basePrice += 200;
  }
  
  return {
    buy: basePrice,
    sell: Math.floor(basePrice / 2),
  };
};

const getChainTier = (chainName: HotelChainName): 'cheap' | 'medium' | 'expensive' => {
  if (chainName === 'luxor' || chainName === 'tower') {
    return 'cheap';
  } else if (chainName === 'american' || chainName === 'festival' || chainName === 'worldwide') {
    return 'medium';
  } else {
    return 'expensive';
  }
};

export const calculateStockholderBonus = (
  chainName: HotelChainName, 
  chainSize: number, 
  gameMode: 'classic'
): StockholderBonus => {
  const { buy } = calculateStockPrice(chainName, chainSize);
  
  const primary = buy * 10;
  const secondary = buy * 5;
  
  return {
    primary,
    secondary,
    tertiary: 0,
  };
};

export const determineStockholders = (
  players: Player[],
  chainName: HotelChainName
): { primary: Player[], secondary: Player[], tertiary: Player[] } => {
  const playerStocks: [Player, number][] = players.map(player => [player, player.stocks[chainName]]);
  
  playerStocks.sort((a, b) => b[1] - a[1]);
  
  const playersWithStocks = playerStocks.filter(([_, count]) => count > 0);
  
  const result = {
    primary: [] as Player[],
    secondary: [] as Player[],
    tertiary: [] as Player[],
  };
  
  if (playersWithStocks.length === 0) return result;
  
  const primaryStockCount = playersWithStocks[0][1];
  const primaryStockholders = playersWithStocks
    .filter(([_, count]) => count === primaryStockCount)
    .map(([player, _]) => player);
  
  result.primary = primaryStockholders;
  
  if (primaryStockholders.length === playersWithStocks.length) return result;
  
  const remainingPlayers = playersWithStocks.filter(([_, count]) => count !== primaryStockCount);
  const secondaryStockCount = remainingPlayers[0][1];
  const secondaryStockholders = remainingPlayers
    .filter(([_, count]) => count === secondaryStockCount)
    .map(([player, _]) => player);
  
  result.secondary = secondaryStockholders;
  
  if (secondaryStockholders.length === remainingPlayers.length) return result;
  
  const tertiaryPlayers = remainingPlayers.filter(([_, count]) => count !== secondaryStockCount);
  const tertiaryStockCount = tertiaryPlayers[0][1];
  const tertiaryStockholders = tertiaryPlayers
    .filter(([_, count]) => count === tertiaryStockCount)
    .map(([player, _]) => player);
  
  result.tertiary = tertiaryStockholders;
  
  return result;
};

export const distributeStockholderBonus = (
  state: GameState,
  chainName: HotelChainName
): GameState => {
  const { players, hotelChains, gameMode } = state;
  const chain = hotelChains[chainName];
  
  const bonus = calculateStockholderBonus(chainName, chain.tiles.length, gameMode);
  
  const { primary, secondary, tertiary } = determineStockholders(players, chainName);
  
  const updatedPlayers = [...players];
  
  if (primary.length === 1 && secondary.length === 0) {
    const singleStockholder = primary[0];
    const playerIndex = players.findIndex(p => p.id === singleStockholder.id);
    
    const totalBonus = bonus.primary + bonus.secondary;
    
    updatedPlayers[playerIndex] = {
      ...singleStockholder,
      money: singleStockholder.money + Math.ceil(totalBonus / 100) * 100,
    };
    
    return {
      ...state,
      players: updatedPlayers,
    };
  }
  
  if (primary.length > 1) {
    const splitBonus = (bonus.primary + bonus.secondary) / primary.length;
    const roundedBonus = Math.ceil(splitBonus / 100) * 100;
    
    primary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + roundedBonus,
      };
    });
    
    return {
      ...state,
      players: updatedPlayers,
    };
  }
  
  if (primary.length === 1) {
    const player = primary[0];
    const playerIndex = players.findIndex(p => p.id === player.id);
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money + bonus.primary,
    };
  }
  
  if (secondary.length === 1) {
    const player = secondary[0];
    const playerIndex = players.findIndex(p => p.id === player.id);
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money + bonus.secondary,
    };
  } else if (secondary.length > 1) {
    const splitSecondary = bonus.secondary / secondary.length;
    const roundedSecondary = Math.ceil(splitSecondary / 100) * 100;
    
    secondary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + roundedSecondary,
      };
    });
  }
  
  return {
    ...state,
    players: updatedPlayers,
  };
};

export const shouldEndGame = (state: GameState): boolean => {
  const { hotelChains, placedTiles } = state;
  
  for (const chainName in hotelChains) {
    const chain = hotelChains[chainName as HotelChainName];
    if (chain.isActive && chain.tiles.length >= 41) {
      return true;
    }
  }
  
  const activeChains = Object.values(hotelChains).filter(chain => chain.isActive);
  if (activeChains.length > 0 && activeChains.every(chain => chain.tiles.length >= 11)) {
    return true;
  }
  
  let freeStandingTiles = 0;
  for (const key in placedTiles) {
    const tile = placedTiles[key as Coordinate];
    if (tile && !tile.belongsToChain) {
      freeStandingTiles++;
      if (freeStandingTiles >= 2) {
        return false;
      }
    }
  }
  
  const totalPlayerTiles = state.players.reduce((total, player) => total + player.tiles.length, 0);
  if (freeStandingTiles + totalPlayerTiles < 2) {
    let potentialMergers = false;
    
    for (const player of state.players) {
      for (const tile of player.tiles) {
        const mergerCandidates = findPotentialMergers(tile, state);
        if (mergerCandidates.length >= 2) {
          potentialMergers = true;
          break;
        }
      }
      if (potentialMergers) break;
    }
    
    if (!potentialMergers) {
      return true;
    }
  }
  
  return false;
};

export const endGame = (state: GameState): GameState => {
  let updatedState = { ...state };
  
  for (const chainName in state.hotelChains) {
    const chain = state.hotelChains[chainName as HotelChainName];
    if (chain.isActive) {
      updatedState = distributeStockholderBonus(updatedState, chainName as HotelChainName);
    }
  }
  
  const updatedPlayers = updatedState.players.map(player => {
    let totalMoney = player.money;
    
    for (const chainName in player.stocks) {
      const chain = updatedState.hotelChains[chainName as HotelChainName];
      if (chain.isActive) {
        const stockCount = player.stocks[chainName as HotelChainName];
        const { sell } = calculateStockPrice(chainName as HotelChainName, chain.tiles.length);
        totalMoney += sell * stockCount;
      }
    }
    
    return {
      ...player,
      money: totalMoney
    };
  });
  
  const sortedPlayers = [...updatedPlayers].sort((a, b) => b.money - a.money);
  const highestMoney = sortedPlayers[0].money;
  const winners = sortedPlayers.filter(player => player.money === highestMoney);
  
  return {
    ...updatedState,
    players: updatedPlayers,
    gameEnded: true,
    winner: winners.length === 1 ? winners[0] : null,
    winners: winners.length > 1 ? winners : undefined
  };
};

/**
 * Calculates the distance from a tile coordinate to 1A
 * Used for determining initial player order
 * Lower number = closer to 1A
 */
export const getTileDistance = (coordinate: Coordinate): number => {
  const row = parseInt(coordinate.match(/^\d+/)?.[0] || '1');
  const colChar = coordinate.match(/[A-Z]$/)?.[0] || 'A';
  const col = colChar.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  
  return (row - 1) + (col - 1) * 100;
};
