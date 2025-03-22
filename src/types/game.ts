
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
  | 'tradeStock' 
  | 'gameEnd';

export type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  hotelChains: Record<HotelChainName, HotelChain>;
  availableTiles: BuildingTile[];
  placedTiles: Record<Coordinate, BuildingTile>;
  stockMarket: Record<HotelChainName, number>;
  gameMode: GameMode;
  gamePhase: GamePhase;
  availableHeadquarters: HotelChainName[];
  mergerInfo: MergerInfo | null;
  tilePool: Coordinate[];
  gameEnded: boolean;
  winner: Player | null;
};

export type Action = {
  type: string;
  payload?: any;
};
