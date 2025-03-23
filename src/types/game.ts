
export type Coordinate = `${string}${number}`;

export interface Player {
  id: number;
  name: string;
  money: number;
  stocks: Record<HotelChainName, number>;
  tiles: Coordinate[];
}

export type HotelChainName = 'luxor' | 'tower' | 'american' | 'festival' | 'worldwide' | 'continental' | 'imperial';

export interface HotelChain {
  name: HotelChainName;
  color: string;
  tiles: Coordinate[];
  isActive: boolean;
  isSafe: boolean;
}

export interface BuildingTile {
  coordinate: Coordinate;
  isPlaced: boolean;
  belongsToChain?: HotelChainName;
}

export type GameMode = 'classic';
export type GamePhase = 'setup' | 'placeTile' | 'foundHotel' | 'buyStock' | 'merger' | 'mergerStockOptions' | 'gameOver';
export type SetupPhase = 'initial' | 'drawInitialTile' | 'dealTiles' | 'complete';

export interface StockholderBonus {
  primary: number;
  secondary: number;
  tertiary: number;
}

export interface MergerInfo {
  coordinate: Coordinate;
  playerId: number;
  survivingChain: HotelChainName;
  acquired: HotelChain[];
}

export interface MergerState {
  acquiredChain: HotelChainName;
  survivingChain: HotelChainName;
  stocksHeld: number;
  playersWithStocks: number[];
}

export type PlayerSetup = {
  name: string;
};

export type Action =
  | { type: 'SET_PLAYERS'; payload: { players: PlayerSetup[] } }
  | { type: 'SET_GAME_MODE'; payload: { gameMode: GameMode } }
  | { type: 'START_GAME'; payload: { playerCount: number; playerNames: string[]; gameMode: GameMode } }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerIndex: number } }
  | { type: 'PLACE_TILE'; payload: { coordinate: Coordinate; playerId: number } }
  | { type: 'BUY_STOCK'; payload: { chainName: HotelChainName; playerId: number; quantity: number } }
  | { type: 'END_TURN' }
  | { type: 'FOUND_HOTEL'; payload: { chainName: HotelChainName; tileCoordinate: Coordinate; connectedTiles: Coordinate[] } }
  | { type: 'HANDLE_MERGER'; payload: { coordinate: Coordinate; playerId: number; survivingChain: HotelChainName; acquiredChains: HotelChainName[] } }
  | { type: 'END_GAME' }
  | { type: 'ADD_TILE_TO_PLAYER_HAND'; payload: { playerId: number; coordinate: Coordinate } }
  | { type: 'PLACE_TILE_AND_ADD_TO_CHAIN'; payload: { coordinate: Coordinate; playerId: number; chainName: HotelChainName } }
  | { type: 'DRAW_INITIAL_TILE'; payload: { playerId: number } }
  | { type: 'DEAL_STARTING_TILES' }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_SAVED_GAME' }
  | { type: 'CLEAR_SAVED_GAME' }
  | { type: 'HANDLE_MERGER_STOCKS'; payload: { acquiredChain: HotelChainName; stocksToKeep: number; stocksToSell: number; stocksToTrade: number } }
  | { type: 'HIDE_WINNER_BANNER' }
  | { type: 'END_GAME_MANUALLY' }
  | { type: 'RECORD_STOCK_PURCHASE'; payload: { playerName: string; stocks: Record<HotelChainName, number>; totalCost: number; foundedHotel?: HotelChainName } }
  | { type: 'ACKNOWLEDGE_STOCK_PURCHASE' }
  | { type: 'UNDO_TURN' };

export interface GameState {
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
  currentMerger?: MergerState;
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
    foundedHotel?: HotelChainName;
  } | null;
  showStockPurchaseBanner: boolean;
  lastFoundedHotel?: HotelChainName;
  initialPlayerTurnState?: {
    player: Player;
  } | null;
  turnHistory: GameState[];
}
