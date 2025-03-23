import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
import { 
  shouldEndGame, 
  endGame, 
  getAdjacentTiles, 
  findPotentialMergers,
  findConnectedTiles,
  distributeStockholderBonus,
  calculateStockPrice
} from '@/utils/gameLogic';

const generateBoard = (): Coordinate[] => {
  const tiles: Coordinate[] = [];
  for (let row = 1; row <= 12; row++) {
    for (let col = 'A'; col <= 'I'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
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

const GAME_STORAGE_KEY = 'acquireio_saved_game';

const initialGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  hotelChains: {
    luxor: { name: 'luxor', color: '#ef4444', tiles: [], isActive: false, isSafe: false },
    tower: { name: 'tower', color: '#fbbf24', tiles: [], isActive: false, isSafe: false },
    american: { name: 'american', color: '#0ea5e9', tiles: [], isActive: false, isSafe: false },
    festival: { name: 'festival', color: '#10b981', tiles: [], isActive: false, isSafe: false },
    worldwide: { name: 'worldwide', color: '#a1855c', tiles: [], isActive: false, isSafe: false },
    continental: { name: 'continental', color: '#0f766e', tiles: [], isActive: false, isSafe: false },
    imperial: { name: 'imperial', color: '#ec4899', tiles: [], isActive: false, isSafe: false },
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
  gameMode: 'classic',
  gamePhase: 'setup',
  setupPhase: 'initial',
  availableHeadquarters: ['luxor', 'tower', 'american', 'festival', 'worldwide', 'continental', 'imperial'],
  mergerInfo: null,
  currentMerger: undefined,
  tilePool: shuffleArray(generateBoard()),
  gameEnded: false,
  winner: null,
  winners: undefined,
  initialTiles: [],
  showWinnerBanner: false,
  lastStockPurchase: null,
  showStockPurchaseBanner: false,
  lastFoundedHotel: undefined,
  initialPlayerTurnState: null,
  
};

const loadSavedGame = (): GameState | null => {
  try {
    const savedGameJson = localStorage.getItem(GAME_STORAGE_KEY);
    if (savedGameJson) {
      const savedGame = JSON.parse(savedGameJson) as GameState;
      return savedGame;
    }
  } catch (error) {
    console.error('Error loading saved game:', error);
  }
  return null;
};

const saveGameState = (state: GameState) => {
  try {
    if (state.gamePhase === 'setup' || state.gameEnded) {
      return;
    }
    
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving game:', error);
  }
};

const clearSavedGame = () => {
  try {
    localStorage.removeItem(GAME_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing saved game:', error);
  }
};

const gameReducer = (state: GameState, action: Action): GameState => {
  let newState: GameState;
  
  switch (action.type) {
    // ... keep existing code (reducer logic)
  }
};

type GameContextType = {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  hasSavedGame: boolean;
};

const GameContext = createContext<GameContextType>({
  state: initialGameState,
  dispatch: () => null,
  hasSavedGame: false,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasSavedGame, setHasSavedGame] = React.useState(false);
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  
  useEffect(() => {
    const savedGame = loadSavedGame();
    setHasSavedGame(!!savedGame);
  }, []);
  
  return (
    <GameContext.Provider value={{ state, dispatch, hasSavedGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
