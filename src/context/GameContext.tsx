import React, { createContext, useContext, useReducer } from 'react';
import { 
  GameState, 
  Player, 
  HotelChainName, 
  GameMode, 
  BuildingTile, 
  Action,
  Coordinate
} from '@/types/game';
import { toast } from '@/utils/toast';

const generateBoard = (): Coordinate[] => {
  const tiles: Coordinate[] = [];
  for (let row = 1; row <= 9; row++) {
    for (let col = 'A'; col <= 'L'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
      tiles.push(`${row}${col}` as Coordinate);
    }
  }
  return tiles;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const initialGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  hotelChains: {
    luxor: { name: 'luxor', color: '#f97316', tiles: [], isActive: false, isSafe: false },
    tower: { name: 'tower', color: '#0ea5e9', tiles: [], isActive: false, isSafe: false },
    american: { name: 'american', color: '#8b5cf6', tiles: [], isActive: false, isSafe: false },
    festival: { name: 'festival', color: '#ef4444', tiles: [], isActive: false, isSafe: false },
    worldwide: { name: 'worldwide', color: '#10b981', tiles: [], isActive: false, isSafe: false },
    continental: { name: 'continental', color: '#0284c7', tiles: [], isActive: false, isSafe: false },
    imperial: { name: 'imperial', color: '#fbbf24', tiles: [], isActive: false, isSafe: false },
  },
  availableTiles: [],
  placedTiles: {},
  stockMarket: {
    luxor: 25,
    tower: 25,
    american: 25,
    festival: 25,
    worldwide: 25,
    continental: 25,
    imperial: 25,
  },
  gameMode: 'tycoon',
  gamePhase: 'setup',
  setupPhase: 'initial',
  availableHeadquarters: ['luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'],
  mergerInfo: null,
  tilePool: shuffleArray(generateBoard()),
  gameEnded: false,
  winner: null,
  initialTiles: [],
};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload.players,
        setupPhase: 'drawInitialTile',
      };
      
    case 'SET_GAME_MODE':
      return {
        ...state,
        gameMode: action.payload.mode,
      };
      
    case 'DRAW_INITIAL_TILE': {
      const { playerId } = action.payload;
      const tilePool = [...state.tilePool];
      const coordinate = tilePool.pop()!;
      
      const players = [...state.players];
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      const placedTiles = { 
        ...state.placedTiles, 
        [coordinate]: { 
          coordinate, 
          isPlaced: true 
        } 
      };
      
      const initialTiles = [
        ...state.initialTiles,
        { playerId, coordinate }
      ];
      
      let newGamePhase = state.gamePhase;
      let newSetupPhase = state.setupPhase;
      let sortedPlayers = [...players];
      let currentPlayerIndex = state.currentPlayerIndex;
      
      if (initialTiles.length === players.length) {
        const sortedInitialTiles = [...initialTiles].sort((a, b) => {
          const rowA = parseInt(a.coordinate.charAt(0));
          const colA = a.coordinate.charCodeAt(1) - 65;
          const distanceA = rowA + colA;
          
          const rowB = parseInt(b.coordinate.charAt(0));
          const colB = b.coordinate.charCodeAt(1) - 65;
          const distanceB = rowB + colB;
          
          return distanceA - distanceB;
        });
        
        sortedPlayers = sortedInitialTiles.map(tile => 
          players.find(p => p.id === tile.playerId)!
        );
        
        currentPlayerIndex = 0;
        
        newSetupPhase = 'dealTiles';
        
        toast.success(`${sortedPlayers[0].name} goes first!`);
      }
      
      return {
        ...state,
        tilePool,
        placedTiles,
        initialTiles,
        setupPhase: newSetupPhase,
        players: sortedPlayers,
        currentPlayerIndex,
      };
    }
    
    case 'DEAL_STARTING_TILES': {
      const tilePool = [...state.tilePool];
      const players = [...state.players].map(player => ({
        ...player,
        tiles: []
      }));
      
      players.forEach(player => {
        for (let i = 0; i < 6; i++) {
          if (tilePool.length > 0) {
            const coordinate = tilePool.pop()!;
            player.tiles.push(coordinate);
          }
        }
      });
      
      return {
        ...state,
        players,
        tilePool,
        gamePhase: 'placeTile',
        setupPhase: 'complete',
      };
    }
    
    case 'START_GAME': {
      const { playerCount, playerNames, gameMode } = action.payload;
      const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
        id: i,
        name: playerNames[i] || `Player ${i + 1}`,
        money: 6000,
        stocks: {
          luxor: 0,
          tower: 0,
          american: 0,
          festival: 0,
          worldwide: 0,
          continental: 0,
          imperial: 0,
        },
        tiles: [],
      }));
      
      return {
        ...state,
        players,
        gameMode,
        tilePool: shuffleArray(generateBoard()),
        setupPhase: 'drawInitialTile',
      };
    }
    
    case 'PLACE_TILE': {
      const { coordinate, playerId } = action.payload;
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== state.currentPlayerIndex) {
        toast.error("It's not your turn!");
        return state;
      }
      
      const player = { ...state.players[playerIndex] };
      
      const tileIndex = player.tiles.indexOf(coordinate);
      if (tileIndex === -1) {
        toast.error("You don't have this tile!");
        return state;
      }
      
      player.tiles.splice(tileIndex, 1);
      
      const placedTiles = { 
        ...state.placedTiles, 
        [coordinate]: { 
          coordinate, 
          isPlaced: true 
        } 
      };
      
      const players = [...state.players];
      players[playerIndex] = player;
      
      return {
        ...state,
        placedTiles,
        players,
        gamePhase: 'buyStock',
      };
    }
    
    case 'BUY_STOCK': {
      const { chainName, playerId, quantity } = action.payload;
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      const player = { ...state.players[playerIndex] };
      const chain = state.hotelChains[chainName];
      
      if (!chain.isActive) {
        toast.error(`${chainName} is not an active hotel chain!`);
        return state;
      }
      
      const pricePerStock = 100 * chain.tiles.length;
      const totalPrice = pricePerStock * quantity;
      
      if (player.money < totalPrice) {
        toast.error("You don't have enough money!");
        return state;
      }
      
      if (state.stockMarket[chainName] < quantity) {
        toast.error("Not enough stocks available!");
        return state;
      }
      
      player.money -= totalPrice;
      player.stocks[chainName] += quantity;
      
      const stockMarket = { ...state.stockMarket };
      stockMarket[chainName] -= quantity;
      
      const players = [...state.players];
      players[playerIndex] = player;
      
      return {
        ...state,
        players,
        stockMarket,
      };
    }
    
    case 'END_TURN': {
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      
      const player = { ...state.players[state.currentPlayerIndex] };
      const tilePool = [...state.tilePool];
      
      if (tilePool.length > 0) {
        const coordinate = tilePool.pop()!;
        player.tiles.push(coordinate);
      }
      
      const players = [...state.players];
      players[state.currentPlayerIndex] = player;
      
      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        players,
        tilePool,
        gamePhase: 'placeTile',
      };
    }
    
    case 'FOUND_HOTEL': {
      const { chainName, tileCoordinate } = action.payload;
      
      if (!state.availableHeadquarters.includes(chainName)) {
        toast.error(`${chainName} headquarters is not available!`);
        return state;
      }
      
      const hotelChains = { ...state.hotelChains };
      hotelChains[chainName] = {
        ...hotelChains[chainName],
        isActive: true,
        tiles: [...hotelChains[chainName].tiles, tileCoordinate],
      };
      
      const availableHeadquarters = state.availableHeadquarters.filter(hq => hq !== chainName);
      
      const player = { ...state.players[state.currentPlayerIndex] };
      player.stocks[chainName] += 1;
      
      const stockMarket = { ...state.stockMarket };
      stockMarket[chainName] -= 1;
      
      const players = [...state.players];
      players[state.currentPlayerIndex] = player;
      
      return {
        ...state,
        hotelChains,
        availableHeadquarters,
        players,
        stockMarket,
        gamePhase: 'buyStock',
      };
    }
    
    case 'END_GAME': {
      const players = state.players.map(player => {
        let totalMoney = player.money;
        
        Object.entries(player.stocks).forEach(([chainName, quantity]) => {
          const chain = state.hotelChains[chainName as HotelChainName];
          if (chain.isActive) {
            const pricePerStock = 100 * chain.tiles.length;
            totalMoney += pricePerStock * quantity;
          }
        });
        
        return {
          ...player,
          money: totalMoney,
        };
      });
      
      const winner = [...players].sort((a, b) => b.money - a.money)[0];
      
      return {
        ...state,
        players,
        gameEnded: true,
        winner,
      };
    }
    
    default:
      return state;
  }
};

type GameContextType = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
};

const GameContext = createContext<GameContextType>({
  state: initialGameState,
  dispatch: () => null,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
