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

export type CurrentMerger = {
  acquiredChain: HotelChainName;
  survivingChain: HotelChainName;
  stocksHeld: number;
  playersWithStocks?: number[];
};

export type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  hotelChains: Record<HotelChainName, HotelChain>;
  availableTiles: Coordinate[];
  placedTiles: Record<Coordinate, BuildingTile>;
  stockMarket: Record<HotelChainName, number>;
  gameMode: GameMode;
  gamePhase: GamePhase;
  setupPhase: SetupPhase;
  availableHeadquarters: HotelChainName[];
  mergerInfo: MergerInfo | null;
  currentMerger?: CurrentMerger;
  tilePool: Coordinate[];
  gameEnded: boolean;
  winner: Player | null;
  winners?: Player[];
  initialTiles: { playerId: number; coordinate: Coordinate }[];
  showWinnerBanner: boolean;
  lastStockPurchase: {
    playerName: string;
    stocks: Record<HotelChainName, number>;
    totalCost: number;
  } | null;
  showStockPurchaseBanner: boolean;
};

export type Action =
  | { type: 'SET_PLAYERS'; payload: { players: Player[] } }
  | { type: 'SET_GAME_MODE'; payload: { gameMode: GameMode } }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerIndex: number } }
  | { type: 'START_GAME'; payload: { playerCount: number; playerNames: string[]; gameMode: GameMode } }
  | { type: 'DRAW_INITIAL_TILE'; payload: { playerId: number } }
  | { type: 'DEAL_STARTING_TILES' }
  | { type: 'PLACE_TILE'; payload: { coordinate: Coordinate; playerId: number } }
  | { type: 'FOUND_HOTEL'; payload: { chainName: HotelChainName; tileCoordinate: Coordinate; connectedTiles: Coordinate[] } }
  | { type: 'BUY_STOCK'; payload: { chainName: HotelChainName; playerId: number; quantity: number } }
  | { type: 'HANDLE_MERGER'; payload: { coordinate: Coordinate; playerId: number; survivingChain: HotelChainName; acquiredChains: HotelChainName[] } }
  | { type: 'HANDLE_MERGER_STOCKS'; payload: { acquiredChain: HotelChainName; stocksToKeep: number; stocksToSell: number; stocksToTrade: number } }
  | { type: 'END_TURN' }
  | { type: 'END_GAME' }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_SAVED_GAME' }
  | { type: 'CLEAR_SAVED_GAME' }
  | { type: 'HIDE_WINNER_BANNER' }
  | { type: 'ADD_TILE_TO_PLAYER_HAND'; payload: { playerId: number; coordinate: Coordinate } }
  | { type: 'PLACE_TILE_AND_ADD_TO_CHAIN'; payload: { coordinate: Coordinate; playerId: number; chainName: HotelChainName } }
  | { type: 'RECORD_STOCK_PURCHASE'; payload: { playerName: string; stocks: Record<HotelChainName, number>; totalCost: number } }
  | { type: 'ACKNOWLEDGE_STOCK_PURCHASE' };
