export type Coordinate = `${number}${string}`;

export type HotelChainName = 'luxor' | 'tower' | 'american' | 'festival' | 'worldwide' | 'continental' | 'imperial';

export type HotelChain = {
  name: HotelChainName;
  color: string;
  tiles: Coordinate[];
  isActive: boolean;
  isSafe: boolean;
};

export type Player = {
  id: number;
  name: string;
  money: number;
  stocks: Record<HotelChainName, number>;
  tiles: Coordinate[];
};

export type GameMode = 'classic' | 'tycoon';

export type BuildingTile = {
  coordinate: Coordinate;
  isPlaced: boolean;
  belongsToChain?: HotelChainName;
};

export type StockholderBonus = {
  primary: number;
  secondary: number;
  tertiary: number;
};

export type StockPrice = {
  buy: number;
  sell: number;
};

export type MergerInfo = {
  survivor: HotelChain;
  acquired: HotelChain[];
  mergemaker: Player;
};

export type GamePhase = 
  | 'setup' 
  | 'placeTile' 
  | 'foundHotel' 
  | 'buyStock' 
  | 'merger' 
  | 'mergerStockOptions'
  | 'tradeStock' 
  | 'gameEnd';

export type SetupPhase =
  | 'initial'
  | 'drawInitialTile'
  | 'dealTiles'
  | 'complete';

export type InitialTile = {
  playerId: number;
  coordinate: Coordinate;
};

export type MergerStockOption = 'keep' | 'sell' | 'trade';

export type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  hotelChains: Record<HotelChainName, HotelChain>;
  availableTiles: BuildingTile[];
  placedTiles: Record<Coordinate, BuildingTile>;
  stockMarket: Record<HotelChainName, number>;
  gameMode: GameMode;
  gamePhase: GamePhase;
  setupPhase: SetupPhase;
  availableHeadquarters: HotelChainName[];
  mergerInfo: MergerInfo | null;
  currentMerger?: {
    acquiredChain: HotelChainName;
    survivingChain: HotelChainName;
    stocksHeld: number;
    playersWithStocks?: number[];
  };
  tilePool: Coordinate[];
  gameEnded: boolean;
  winner: Player | null;
  winners?: Player[];
  initialTiles: InitialTile[];
  showWinnerBanner: boolean;
};

export type Action =
  | { type: 'SET_PLAYERS'; payload: { players: Player[] } }
  | { type: 'SET_GAME_MODE'; payload: { gameMode: GameMode } }
  | { type: 'DRAW_INITIAL_TILE'; payload: { playerId: number } }
  | { type: 'DEAL_STARTING_TILES' }
  | { 
      type: 'START_GAME'; 
      payload: { 
        playerCount: number; 
        playerNames: string[]; 
        gameMode: GameMode;
      } 
    }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerIndex: number } }
  | { 
      type: 'PLACE_TILE'; 
      payload: { 
        coordinate: Coordinate; 
        playerId: number; 
      } 
    }
  | { 
      type: 'BUY_STOCK'; 
      payload: { 
        chainName: HotelChainName; 
        playerId: number; 
        quantity: number;
      } 
    }
  | { type: 'END_TURN' }
  | { 
      type: 'FOUND_HOTEL'; 
      payload: { 
        chainName: HotelChainName; 
        tileCoordinate: Coordinate;
        connectedTiles: Coordinate[];
      } 
    }
  | {
      type: 'HANDLE_MERGER';
      payload: {
        coordinate: Coordinate;
        playerId: number;
        survivingChain: HotelChainName;
        acquiredChains: HotelChainName[];
      }
    }
  | {
      type: 'HANDLE_MERGER_STOCKS';
      payload: {
        acquiredChain: HotelChainName;
        stocksToKeep: number;
        stocksToSell: number;
        stocksToTrade: number;
      }
    }
  | { type: 'HIDE_WINNER_BANNER' }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'END_GAME' }
  | { 
      type: 'ADD_TILE_TO_PLAYER_HAND'; 
      payload: { 
        playerId: number; 
        coordinate: Coordinate;
      } 
    }
  | { type: 'LOAD_SAVED_GAME' }
  | { type: 'SAVE_GAME' }
  | { type: 'CLEAR_SAVED_GAME' };
