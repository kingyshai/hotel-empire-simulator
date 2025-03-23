import { 
  GameState, 
  Player, 
  HotelChainName, 
  Coordinate, 
  BuildingTile,
  StockholderBonus
} from '@/types/game';

export const isAdjacent = (coord1: Coordinate, coord2: Coordinate): boolean => {
  const row1 = parseInt(coord1.charAt(0));
  const col1 = coord1.charAt(1);
  
  const row2 = parseInt(coord2.charAt(0));
  const col2 = coord2.charAt(1);
  
  // Check if they're orthogonally adjacent
  return (
    (row1 === row2 && Math.abs(col1.charCodeAt(0) - col2.charCodeAt(0)) === 1) ||
    (col1 === col2 && Math.abs(row1 - row2) === 1)
  );
};

export const getAdjacentTiles = (coord: Coordinate, placedTiles: Record<Coordinate, BuildingTile>): Coordinate[] => {
  const row = parseInt(coord.charAt(0));
  const col = coord.charAt(1).charCodeAt(0);
  
  // Generate potential adjacent coordinates
  const potentialAdjacents: Coordinate[] = [
    `${row - 1}${String.fromCharCode(col)}` as Coordinate, // Above
    `${row + 1}${String.fromCharCode(col)}` as Coordinate, // Below
    `${row}${String.fromCharCode(col - 1)}` as Coordinate, // Left
    `${row}${String.fromCharCode(col + 1)}` as Coordinate, // Right
  ];
  
  // Filter out invalid coordinates and those without placed tiles
  return potentialAdjacents.filter(c => {
    const r = parseInt(c.charAt(0));
    const c1 = c.charAt(1);
    
    // Check if coordinate is valid
    if (r < 1 || r > 9 || c1 < 'A' || c1 > 'L') return false;
    
    // Check if there's a tile placed at this coordinate
    return placedTiles[c] !== undefined;
  });
};

export const findConnectedTiles = (startCoord: Coordinate, placedTiles: Record<Coordinate, BuildingTile>): Coordinate[] => {
  const visited: Record<Coordinate, boolean> = {};
  const connected: Coordinate[] = [];
  
  const dfs = (coord: Coordinate) => {
    if (visited[coord]) return;
    
    visited[coord] = true;
    connected.push(coord);
    
    // Find adjacent tiles and continue DFS
    const adjacents = getAdjacentTiles(coord, placedTiles);
    for (const adj of adjacents) {
      dfs(adj);
    }
  };
  
  dfs(startCoord);
  return connected;
};

export const findPotentialMergers = (coord: Coordinate, state: GameState): HotelChainName[] => {
  const { placedTiles, hotelChains } = state;
  
  // Get adjacent tiles
  const adjacents = getAdjacentTiles(coord, placedTiles);
  
  // Find which hotel chains these tiles belong to
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

export const calculateStockPrice = (chainName: HotelChainName, chainSize: number): { buy: number, sell: number } => {
  // Base price calculation based on chain type and size
  let basePrice = 0;
  
  // Determine tier based on chain name
  const tier = getChainTier(chainName);
  
  // Calculate base price based on tiles
  if (chainSize >= 38) {
    basePrice = 1000;
  } else if (chainSize >= 28) {
    basePrice = 900;
  } else if (chainSize >= 18) {
    basePrice = 800;
  } else if (chainSize >= 8) {
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
  } else {
    basePrice = 0; // Inactive chains
  }
  
  // Apply tier modifiers
  if (tier === 'medium') {
    basePrice += 100;
  } else if (tier === 'expensive') {
    basePrice += 200;
  }
  
  return {
    buy: basePrice,
    sell: Math.floor(basePrice * 0.5),
  };
};

const getChainTier = (chainName: HotelChainName): 'cheap' | 'medium' | 'expensive' => {
  if (chainName === 'luxor' || chainName === 'tower') {
    return 'cheap';
  } else if (chainName === 'american' || chainName === 'festival' || chainName === 'worldwide') {
    return 'medium';
  } else {
    return 'expensive'; // Continental and Imperial
  }
};

export const calculateStockholderBonus = (
  chainName: HotelChainName, 
  chainSize: number, 
  gameMode: 'classic' | 'tycoon'
): StockholderBonus => {
  const { buy } = calculateStockPrice(chainName, chainSize);
  
  // Calculate bonuses based on price chart in the image
  // Primary bonus is 10 times stock price
  const primary = buy * 10;
  // Secondary bonus is 5 times stock price
  const secondary = buy * 5;
  // Tertiary bonus is provided in classic mode for completeness, though not used in classic mode
  const tertiary = Math.ceil(buy * 3.3); // Approximately 1/3 of primary bonus

  return {
    primary,
    secondary,
    tertiary: gameMode === 'tycoon' ? tertiary : 0,
  };
};

export const determineStockholders = (
  players: Player[],
  chainName: HotelChainName
): { primary: Player[], secondary: Player[], tertiary: Player[] } => {
  // Create a map of player to stock count
  const playerStocks: [Player, number][] = players.map(player => [player, player.stocks[chainName]]);
  
  // Sort by stock count in descending order
  playerStocks.sort((a, b) => b[1] - a[1]);
  
  // Filter out players with no stocks
  const playersWithStocks = playerStocks.filter(([_, count]) => count > 0);
  
  // Initialize result
  const result = {
    primary: [] as Player[],
    secondary: [] as Player[],
    tertiary: [] as Player[],
  };
  
  // No stockholders
  if (playersWithStocks.length === 0) return result;
  
  // First, determine primary stockholders
  const primaryStockCount = playersWithStocks[0][1];
  const primaryStockholders = playersWithStocks
    .filter(([_, count]) => count === primaryStockCount)
    .map(([player, _]) => player);
  
  result.primary = primaryStockholders;
  
  // If all players are tied for primary, no secondary or tertiary
  if (primaryStockholders.length === playersWithStocks.length) return result;
  
  // Determine secondary stockholders
  const remainingPlayers = playersWithStocks.filter(([_, count]) => count !== primaryStockCount);
  const secondaryStockCount = remainingPlayers[0][1];
  const secondaryStockholders = remainingPlayers
    .filter(([_, count]) => count === secondaryStockCount)
    .map(([player, _]) => player);
  
  result.secondary = secondaryStockholders;
  
  // If all remaining players are tied for secondary, no tertiary
  if (secondaryStockholders.length === remainingPlayers.length) return result;
  
  // Determine tertiary stockholders
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
  
  // Calculate bonuses
  const bonus = calculateStockholderBonus(chainName, chain.tiles.length, gameMode);
  
  // Determine stockholders
  const { primary, secondary, tertiary } = determineStockholders(players, chainName);
  
  // Clone players array to modify
  const updatedPlayers = [...players];
  
  // Handle special cases based on the rules in the image:
  
  // SINGLE STOCKHOLDER CASE
  if (primary.length === 1 && secondary.length === 0) {
    const singleStockholder = primary[0];
    const playerIndex = players.findIndex(p => p.id === singleStockholder.id);
    
    // In Classic mode: single stockholder gets primary + secondary
    // In Tycoon mode: single stockholder gets primary + tertiary
    const totalBonus = gameMode === 'classic' 
      ? bonus.primary + bonus.secondary
      : bonus.primary + bonus.tertiary;
    
    updatedPlayers[playerIndex] = {
      ...singleStockholder,
      money: singleStockholder.money + Math.ceil(totalBonus / 100) * 100, // Round up to nearest 100
    };
    
    return {
      ...state,
      players: updatedPlayers,
    };
  }
  
  // TIE FOR PRIMARY STOCKHOLDER
  if (primary.length > 1) {
    const splitBonus = (bonus.primary + bonus.secondary) / primary.length;
    const roundedBonus = Math.ceil(splitBonus / 100) * 100; // Round up to nearest 100
    
    primary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + roundedBonus,
      };
    });
    
    // No secondary bonus in this case
    
    // Handle tertiary in Tycoon mode (if applicable)
    if (gameMode === 'tycoon' && tertiary.length > 0) {
      const tertiaryBonus = Math.ceil(bonus.tertiary / tertiary.length / 100) * 100;
      
      tertiary.forEach(player => {
        const playerIndex = players.findIndex(p => p.id === player.id);
        updatedPlayers[playerIndex] = {
          ...player,
          money: player.money + tertiaryBonus,
        };
      });
    }
    
    return {
      ...state,
      players: updatedPlayers,
    };
  }
  
  // TIE FOR SECONDARY STOCKHOLDER
  if (secondary.length > 1) {
    // Primary gets normal bonus
    const primaryPlayer = primary[0];
    const primaryIndex = players.findIndex(p => p.id === primaryPlayer.id);
    updatedPlayers[primaryIndex] = {
      ...primaryPlayer,
      money: primaryPlayer.money + bonus.primary,
    };
    
    // Secondary shareholders split the secondary bonus
    const splitSecondary = (bonus.secondary + (gameMode === 'tycoon' ? bonus.tertiary : 0)) / secondary.length;
    const roundedSecondary = Math.ceil(splitSecondary / 100) * 100;
    
    secondary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + roundedSecondary,
      };
    });
    
    return {
      ...state,
      players: updatedPlayers,
    };
  }
  
  // NORMAL CASE - NO TIES
  // Handle primary stockholder
  if (primary.length === 1) {
    const player = primary[0];
    const playerIndex = players.findIndex(p => p.id === player.id);
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money + bonus.primary,
    };
  }
  
  // Handle secondary stockholder
  if (secondary.length === 1) {
    const player = secondary[0];
    const playerIndex = players.findIndex(p => p.id === player.id);
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money + bonus.secondary,
    };
  }
  
  // Handle tertiary stockholder in Tycoon mode
  if (gameMode === 'tycoon' && tertiary.length > 0) {
    const tertiaryBonus = Math.ceil(bonus.tertiary / tertiary.length / 100) * 100;
    
    tertiary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + tertiaryBonus,
      };
    });
  }
  
  return {
    ...state,
    players: updatedPlayers,
  };
};
