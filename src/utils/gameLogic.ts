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
  
  return (
    (row1 === row2 && Math.abs(col1.charCodeAt(0) - col2.charCodeAt(0)) === 1) ||
    (col1 === col2 && Math.abs(row1 - row2) === 1)
  );
};

export const getAdjacentTiles = (coord: Coordinate, placedTiles: Record<Coordinate, BuildingTile>): Coordinate[] => {
  const row = parseInt(coord.charAt(0));
  const col = coord.charAt(1).charCodeAt(0);
  
  const potentialAdjacents: Coordinate[] = [
    `${row - 1}${String.fromCharCode(col)}` as Coordinate, // Above
    `${row + 1}${String.fromCharCode(col)}` as Coordinate, // Below
    `${row}${String.fromCharCode(col - 1)}` as Coordinate, // Left
    `${row}${String.fromCharCode(col + 1)}` as Coordinate, // Right
  ];
  
  return potentialAdjacents.filter(c => {
    const r = parseInt(c.charAt(0));
    const c1 = c.charAt(1);
    
    if (r < 1 || r > 9 || c1 < 'A' || c1 > 'L') return false;
    
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
  } else {
    basePrice = 0;
  }
  
  const tier = getChainTier(chainName);
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
    return 'expensive';
  }
};

export const calculateStockholderBonus = (
  chainName: HotelChainName, 
  chainSize: number, 
  gameMode: 'classic' | 'tycoon'
): StockholderBonus => {
  const { buy } = calculateStockPrice(chainName, chainSize);
  
  const primary = buy * 10;
  const secondary = buy * 5;
  const tertiary = Math.ceil(buy * 3.3);
  
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
    
    const totalBonus = gameMode === 'classic' 
      ? bonus.primary + bonus.secondary
      : bonus.primary + bonus.tertiary;
    
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
  
  if (secondary.length > 1) {
    const primaryPlayer = primary[0];
    const primaryIndex = players.findIndex(p => p.id === primaryPlayer.id);
    updatedPlayers[primaryIndex] = {
      ...primaryPlayer,
      money: primaryPlayer.money + bonus.primary,
    };
    
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
  }
  
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

export const shouldEndGame = (state: GameState): boolean => {
  const { hotelChains, placedTiles, availableHeadquarters } = state;
  
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
  
  if (availableHeadquarters.length === 0) {
    return true;
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
