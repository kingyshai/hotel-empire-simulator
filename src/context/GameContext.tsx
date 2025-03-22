
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
  availableHeadquarters: ['luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'],
  mergerInfo: null,
  tilePool: shuffleArray(generateBoard()),
  gameEnded: false,
  winner: null,
};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload.players,
        gamePhase: 'placeTile',
      };
      
    case 'SET_GAME_MODE':
      return {
        ...state,
        gameMode: action.payload.mode,
      };
      
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
      
      // Deal 6 tiles to each player
      const tilePool = [...state.tilePool];
      const availableTiles: BuildingTile[] = [];
      
      players.forEach(player => {
        for (let i = 0; i < 6; i++) {
          if (tilePool.length > 0) {
            const coordinate = tilePool.pop()!;
            player.tiles.push(coordinate);
            availableTiles.push({
              coordinate,
              isPlaced: false,
            });
          }
        }
      });
      
      return {
        ...state,
        players,
        gameMode,
        availableTiles,
        tilePool,
        gamePhase: 'placeTile',
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
      
      // Remove tile from player's hand
      const tileIndex = player.tiles.indexOf(coordinate);
      if (tileIndex === -1) {
        toast.error("You don't have this tile!");
        return state;
      }
      
      player.tiles.splice(tileIndex, 1);
      
      // Add tile to placed tiles
      const placedTiles = { 
        ...state.placedTiles, 
        [coordinate]: { 
          coordinate, 
          isPlaced: true 
        } 
      };
      
      // Update player in state
      const players = [...state.players];
      players[playerIndex] = player;
      
      // Check if the tile connects any existing hotel chains or founds a new one
      // This is a placeholder - the real implementation would be more complex
      
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
      
      // Calculate price (simplified)
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
      
      // Update player's money and stocks
      player.money -= totalPrice;
      player.stocks[chainName] += quantity;
      
      // Update stock market
      const stockMarket = { ...state.stockMarket };
      stockMarket[chainName] -= quantity;
      
      // Update player in state
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
      
      // Draw a tile for the current player
      const player = { ...state.players[state.currentPlayerIndex] };
      const tilePool = [...state.tilePool];
      
      if (tilePool.length > 0) {
        const coordinate = tilePool.pop()!;
        player.tiles.push(coordinate);
      }
      
      // Update player in state
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
      
      // Check if there are still headquarters available
      if (!state.availableHeadquarters.includes(chainName)) {
        toast.error(`${chainName} headquarters is not available!`);
        return state;
      }
      
      // Update hotel chain
      const hotelChains = { ...state.hotelChains };
      hotelChains[chainName] = {
        ...hotelChains[chainName],
        isActive: true,
        tiles: [...hotelChains[chainName].tiles, tileCoordinate],
      };
      
      // Remove headquarters from available list
      const availableHeadquarters = state.availableHeadquarters.filter(hq => hq !== chainName);
      
      // Give founder's bonus
      const player = { ...state.players[state.currentPlayerIndex] };
      player.stocks[chainName] += 1;
      
      // Update stock market
      const stockMarket = { ...state.stockMarket };
      stockMarket[chainName] -= 1;
      
      // Update player in state
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
      // Calculate final scores and determine winner
      const players = state.players.map(player => {
        let totalMoney = player.money;
        
        // Sell all stocks
        Object.entries(player.stocks).forEach(([chainName, quantity]) => {
          const chain = state.hotelChains[chainName as HotelChainName];
          if (chain.isActive) {
            // Simplified price calculation
            const pricePerStock = 100 * chain.tiles.length;
            totalMoney += pricePerStock * quantity;
          }
        });
        
        return {
          ...player,
          money: totalMoney,
        };
      });
      
      // Find winner
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
