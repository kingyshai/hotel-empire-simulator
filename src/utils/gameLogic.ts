
import { 
  GameState, 
  Player, 
  HotelChainName, 
  Coordinate, 
  BuildingTile,
  StockholderBonus
} from '@/types/game';

export const isAdjacent = (coord1: Coordinate, coord2: Coordinate): boolean => {
  const col1 = coord1.charAt(0);
  const row1 = parseInt(coord1.substring(1));
  
  const col2 = coord2.charAt(0);
  const row2 = parseInt(coord2.substring(1));
  
  return (
    (col1 === col2 && Math.abs(row1 - row2) === 1) ||
    (row1 === row2 && Math.abs(col1.charCodeAt(0) - col2.charCodeAt(0)) === 1)
  );
};

export const getAdjacentTiles = (coord: Coordinate, placedTiles: Record<Coordinate, BuildingTile>): Coordinate[] => {
  const col = coord.charAt(0);
  const row = parseInt(coord.substring(1));
  
  const potentialAdjacents: Coordinate[] = [
    `${col}${row - 1}` as Coordinate, // Above (same column, row - 1)
    `${col}${row + 1}` as Coordinate, // Below (same column, row + 1)
    `${String.fromCharCode(col.charCodeAt(0) - 1)}${row}` as Coordinate, // Left (column - 1, same row)
    `${String.fromCharCode(col.charCodeAt(0) + 1)}${row}` as Coordinate, // Right (column + 1, same row)
  ];
  
  return potentialAdjacents.filter(c => {
    const colChar = c.charAt(0);
    const rowNum = parseInt(c.substring(1));
    
    // Make sure the coordinate is within the bounds of the board
    if (colChar < 'A' || colChar > 'I' || rowNum < 1 || rowNum > 12) return false;
    
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
  
  // Count safe chains (11+ tiles)
  const safeChains = adjacentChains.filter(chainName => 
    state.hotelChains[chainName].tiles.length >= 11
  );
  
  // A tile is burned if it would merge 2 or more safe chains
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
  
  // Primary majority stockholder bonus (10x stock price)
  const primary = buy * 10;
  
  // Secondary minority stockholder bonus (5x stock price)
  const secondary = buy * 5;
  
  // In the classic game mode, there's no tertiary bonus
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
  // Create pairs of [player, stockCount] and sort by stock count in descending order
  const playerStocks: [Player, number][] = players.map(player => [player, player.stocks[chainName]]);
  
  playerStocks.sort((a, b) => b[1] - a[1]);
  
  // Filter out players with no stocks
  const playersWithStocks = playerStocks.filter(([_, count]) => count > 0);
  
  const result = {
    primary: [] as Player[],
    secondary: [] as Player[],
    tertiary: [] as Player[],
  };
  
  // If no players have stocks, return empty arrays
  if (playersWithStocks.length === 0) return result;
  
  // Find players with the highest stock count (primary stockholders)
  const primaryStockCount = playersWithStocks[0][1];
  const primaryStockholders = playersWithStocks
    .filter(([_, count]) => count === primaryStockCount)
    .map(([player, _]) => player);
  
  result.primary = primaryStockholders;
  
  // If all players with stocks are primary stockholders, return
  if (primaryStockholders.length === playersWithStocks.length) return result;
  
  // Find players with the second highest stock count (secondary stockholders)
  const remainingPlayers = playersWithStocks.filter(([_, count]) => count !== primaryStockCount);
  const secondaryStockCount = remainingPlayers[0][1];
  const secondaryStockholders = remainingPlayers
    .filter(([_, count]) => count === secondaryStockCount)
    .map(([player, _]) => player);
  
  result.secondary = secondaryStockholders;
  
  // If all remaining players are secondary stockholders, return
  if (secondaryStockholders.length === remainingPlayers.length) return result;
  
  // Find players with the third highest stock count (tertiary stockholders)
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
  
  // Calculate the bonus amounts based on chain size
  const bonus = calculateStockholderBonus(chainName, chain.tiles.length, gameMode);
  
  // Determine primary, secondary, and tertiary stockholders
  const { primary, secondary, tertiary } = determineStockholders(players, chainName);
  
  const updatedPlayers = [...players];
  
  // Special case: If there's only one stockholder, they get both primary and secondary bonuses
  if (primary.length === 1 && secondary.length === 0) {
    const singleStockholder = primary[0];
    const playerIndex = players.findIndex(p => p.id === singleStockholder.id);
    
    const totalBonus = bonus.primary + bonus.secondary;
    
    // Round to the nearest $100
    updatedPlayers[playerIndex] = {
      ...singleStockholder,
      money: singleStockholder.money + Math.ceil(totalBonus / 100) * 100,
    };
    
    return {
      ...state,
      players: updatedPlayers,
    };
  }
  
  // Special case: If there's a tie for primary stockholder, they split the primary and secondary bonuses
  if (primary.length > 1) {
    const splitBonus = (bonus.primary + bonus.secondary) / primary.length;
    // Round to the nearest $100
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
  
  // Normal case: Distribute primary bonus
  if (primary.length === 1) {
    const player = primary[0];
    const playerIndex = players.findIndex(p => p.id === player.id);
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money + bonus.primary,
    };
  }
  
  // Distribute secondary bonus
  if (secondary.length === 1) {
    const player = secondary[0];
    const playerIndex = players.findIndex(p => p.id === player.id);
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money + bonus.secondary,
    };
  } else if (secondary.length > 1) {
    // If there's a tie for secondary, they split the secondary bonus
    const splitSecondary = bonus.secondary / secondary.length;
    // Round to the nearest $100
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
 * Calculates the distance from a tile coordinate to A1
 * Used for determining initial player order
 * Lower number = closer to A1
 */
export const getTileDistance = (coordinate: Coordinate): number => {
  const col = coordinate.charAt(0);
  const row = parseInt(coordinate.substring(1));
  
  // Column distance (A=0, B=1, etc.)
  const colDistance = col.charCodeAt(0) - 'A'.charCodeAt(0);
  
  // Row distance (1=0, 2=1, etc.)
  const rowDistance = row - 1;
  
  // We prioritize column distance over row distance
  // A tile at column B row 1 (B1) is closer to A1 than a tile at column A row 2 (A2)
  return colDistance * 100 + rowDistance;
};
