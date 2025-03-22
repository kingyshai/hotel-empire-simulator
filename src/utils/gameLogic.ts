
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
  // Base prices per chain (these would typically vary by chain)
  const basePrices: Record<HotelChainName, number> = {
    luxor: 200,
    tower: 200,
    american: 300,
    festival: 300,
    worldwide: 400,
    continental: 400,
    imperial: 500
  };
  
  const basePrice = basePrices[chainName];
  
  // Multiplier based on chain size
  let multiplier = 1;
  
  if (chainSize >= 11) multiplier = 10;
  else if (chainSize >= 6) multiplier = 5;
  else if (chainSize >= 3) multiplier = 2;
  
  return {
    buy: basePrice * multiplier,
    sell: Math.floor(basePrice * multiplier * 0.5),
  };
};

export const calculateStockholderBonus = (
  chainName: HotelChainName, 
  chainSize: number, 
  gameMode: 'classic' | 'tycoon'
): StockholderBonus => {
  const { buy } = calculateStockPrice(chainName, chainSize);
  
  // Calculate bonuses based on price and chain size
  const primary = buy * 10;
  const secondary = primary / 2;
  const tertiary = secondary / 2;
  
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
  
  // Handle primary stockholder(s)
  if (primary.length > 0) {
    const primaryBonus = gameMode === 'classic' && primary.length === 1 && secondary.length === 0
      ? bonus.primary + bonus.secondary // Single stockholder in classic mode
      : bonus.primary / primary.length;
    
    primary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + Math.ceil(primaryBonus),
      };
    });
  }
  
  // Handle secondary stockholder(s)
  if (secondary.length > 0) {
    const secondaryBonus = bonus.secondary / secondary.length;
    
    secondary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + Math.ceil(secondaryBonus),
      };
    });
  }
  
  // Handle tertiary stockholder(s) in Tycoon mode
  if (gameMode === 'tycoon' && tertiary.length > 0) {
    const tertiaryBonus = bonus.tertiary / tertiary.length;
    
    tertiary.forEach(player => {
      const playerIndex = players.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex] = {
        ...player,
        money: player.money + Math.ceil(tertiaryBonus),
      };
    });
  }
  
  return {
    ...state,
    players: updatedPlayers,
  };
};
