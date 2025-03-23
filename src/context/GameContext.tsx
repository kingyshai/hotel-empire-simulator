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
    case 'SET_PLAYERS':
      newState = { ...state, players: action.payload.players.map((player, index) => ({ ...player, id: index + 1, money: 6000, stocks: { luxor: 0, tower: 0, american: 0, festival: 0, worldwide: 0, continental: 0, imperial: 0 }, tiles: [] })) };
      return newState;
    case 'SET_GAME_MODE':
      newState = { ...state, gameMode: action.payload.gameMode };
      return newState;
    case 'START_GAME':
      const { playerCount, playerNames, gameMode } = action.payload;
      const initialPlayers = Array.from({ length: playerCount }, (_, i) => ({
        id: i + 1,
        name: playerNames[i],
        money: 6000,
        stocks: { luxor: 0, tower: 0, american: 0, festival: 0, worldwide: 0, continental: 0, imperial: 0 },
        tiles: [],
      }));
      
      const shuffledTiles = shuffleArray(state.tilePool);
      const initialTiles = [];
      
      // Deal one initial tile to each player
      for (let i = 0; i < playerCount; i++) {
        const tile = shuffledTiles.pop();
        if (tile) {
          initialPlayers[i].tiles.push(tile);
          initialTiles.push({ playerId: i + 1, coordinate: tile });
        }
      }
      
      newState = {
        ...state,
        players: initialPlayers,
        currentPlayerIndex: 0,
        availableTiles: shuffledTiles,
        gamePhase: 'setup',
        setupPhase: 'drawInitialTile',
        initialTiles: initialTiles,
        gameMode: gameMode,
      };
      return newState;
    case 'SET_CURRENT_PLAYER':
      newState = { ...state, currentPlayerIndex: action.payload.playerIndex };
      return newState;
    case 'PLACE_TILE':
      const { coordinate, playerId } = action.payload;
      const player = state.players.find(p => p.id === playerId);
      if (!player) return state;
      
      const tileIndex = player.tiles.indexOf(coordinate);
      if (tileIndex === -1) return state;
      
      const updatedPlayerTiles = [...player.tiles];
      updatedPlayerTiles.splice(tileIndex, 1);
      
      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, tiles: updatedPlayerTiles } : p
      );
      
      const newPlacedTiles: GameState["placedTiles"] = {
        ...state.placedTiles,
        [coordinate]: { coordinate, isPlaced: true },
      };
      
      newState = {
        ...state,
        players: updatedPlayers,
        placedTiles: newPlacedTiles,
      };
      
      return newState;
    case 'BUY_STOCK':
      const { chainName, playerId, quantity } = action.payload;
      const hotelChain = state.hotelChains[chainName];
      const stockPrice = calculateStockPrice(chainName, hotelChain.tiles.length).buy;
      
      const buyingPlayer = state.players.find(p => p.id === playerId);
      if (!buyingPlayer) return state;
      
      if (buyingPlayer.money < stockPrice * quantity) return state;
      if (state.stockMarket[chainName] < quantity) return state;
      
      const updatedPlayersAfterBuying = state.players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            money: p.money - (stockPrice * quantity),
            stocks: {
              ...p.stocks,
              [chainName]: p.stocks[chainName] + quantity,
            },
          };
        }
        return p;
      });
      
      newState = {
        ...state,
        players: updatedPlayersAfterBuying,
        stockMarket: {
          ...state.stockMarket,
          [chainName]: state.stockMarket[chainName] - quantity,
        },
      };
      return newState;
    case 'END_TURN':
      let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      
      // Check if the next player has any tiles. If not, skip their turn.
      if (state.players[nextPlayerIndex].tiles.length === 0) {
        toast.info(`${state.players[nextPlayerIndex].name} has no tiles and their turn was skipped.`);
        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
      }
      
      // Draw a new tile for the current player
      const tile = state.availableTiles.pop();
      if (!tile) {
        // Handle the case where there are no more tiles to draw
        newState = { ...state, gamePhase: 'buyStock' };
        return newState;
      }
      
      const updatedPlayersAfterTurn = state.players.map((p, index) => {
        if (index === state.currentPlayerIndex) {
          return { ...p, tiles: [...p.tiles, tile] };
        }
        return p;
      });
      
      newState = {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        availableTiles: state.availableTiles,
        gamePhase: 'placeTile',
        players: updatedPlayersAfterTurn,
      };
      return newState;
    case 'FOUND_HOTEL':
      const { chainName, tileCoordinate, connectedTiles } = action.payload;
      
      // Update hotel chain
      const updatedHotelChains = {
        ...state.hotelChains,
        [chainName]: {
          ...state.hotelChains[chainName],
          isActive: true,
          tiles: [...connectedTiles, tileCoordinate],
        },
      };
      
      // Update placed tiles
      const updatedPlacedTilesAfterFounding = {
        ...state.placedTiles,
      };
      [tileCoordinate, ...connectedTiles].forEach(coord => {
        updatedPlacedTilesAfterFounding[coord] = {
          ...updatedPlacedTilesAfterFounding[coord],
          belongsToChain: chainName,
        };
      });
      
      // Remove headquarters from availableHeadquarters
      const updatedAvailableHeadquarters = state.availableHeadquarters.filter(headquarter => headquarter !== chainName);
      
      // Record the last founded hotel
      const lastFoundedHotel = chainName;
      
      newState = {
        ...state,
        hotelChains: updatedHotelChains,
        placedTiles: updatedPlacedTilesAfterFounding,
        availableHeadquarters: updatedAvailableHeadquarters,
        gamePhase: 'buyStock',
        lastFoundedHotel: lastFoundedHotel,
      };
      return newState;
    case 'PLACE_TILE_AND_ADD_TO_CHAIN':
      const { coordinate, playerId, chainName } = action.payload;
      const playerTilePlacement = state.players.find(p => p.id === playerId);
      if (!playerTilePlacement) return state;
      
      const tileIndexPlacement = playerTilePlacement.tiles.indexOf(coordinate);
      if (tileIndexPlacement === -1) return state;
      
      const updatedPlayerTilesPlacement = [...playerTilePlacement.tiles];
      updatedPlayerTilesPlacement.splice(tileIndexPlacement, 1);
      
      const updatedPlayersPlacement = state.players.map(p =>
        p.id === playerId ? { ...p, tiles: updatedPlayerTilesPlacement } : p
      );
      
      const newPlacedTilesPlacement: GameState["placedTiles"] = {
        ...state.placedTiles,
        [coordinate]: { coordinate, isPlaced: true, belongsToChain: chainName },
      };
      
      const updatedHotelChainsPlacement = {
        ...state.hotelChains,
        [chainName]: {
          ...state.hotelChains[chainName],
          tiles: [...state.hotelChains[chainName].tiles, coordinate],
        },
      };
      
      newState = {
        ...state,
        players: updatedPlayersPlacement,
        placedTiles: newPlacedTilesPlacement,
        hotelChains: updatedHotelChainsPlacement,
      };
      return newState;
    case 'HANDLE_MERGER':
      const { coordinate: mergerCoordinate, playerId: mergerPlayerId, survivingChain, acquiredChains } = action.payload;
      
      // Find all tiles that will be part of the new surviving chain
      const survivingChainTiles = findConnectedTiles(mergerCoordinate, state.placedTiles, survivingChain);
      
      // Deactivate and gather the acquired chains
      const acquiredHotelChains = acquiredChains.map(chainName => state.hotelChains[chainName]);
      
      const updatedHotelChainsMerger = {
        ...state.hotelChains,
      };
      acquiredChains.forEach(chainName => {
        updatedHotelChainsMerger[chainName] = {
          ...updatedHotelChainsMerger[chainName],
          isActive: false,
          tiles: [],
        };
      });
      
      // Add acquired tiles to the surviving chain
      const allAcquiredTiles = acquiredChains.reduce((acc, chainName) => {
        acc.push(...state.hotelChains[chainName].tiles);
        return acc;
      }, [] as Coordinate[]);
      
      updatedHotelChainsMerger[survivingChain] = {
        ...updatedHotelChainsMerger[survivingChain],
        tiles: [...updatedHotelChainsMerger[survivingChain].tiles, ...allAcquiredTiles, ...survivingChainTiles],
      };
      
      // Update placed tiles to reflect the surviving chain
      const updatedPlacedTilesMerger = {
        ...state.placedTiles,
      };
      [...allAcquiredTiles, ...survivingChainTiles].forEach(coord => {
        updatedPlacedTilesMerger[coord] = {
          ...updatedPlacedTilesMerger[coord],
          belongsToChain: survivingChain,
        };
      });
      
      const mergerInfo = {
        coordinate: mergerCoordinate,
        playerId: mergerPlayerId,
        survivingChain: survivingChain,
        acquired: acquiredHotelChains,
      };
      
      newState = {
        ...state,
        hotelChains: updatedHotelChainsMerger,
        placedTiles: updatedPlacedTilesMerger,
        gamePhase: 'mergerStockOptions',
        mergerInfo: mergerInfo,
        currentMerger: {
          acquiredChain: acquiredChains[0],
          survivingChain: survivingChain,
          stocksHeld: state.players[state.currentPlayerIndex].stocks[acquiredChains[0]],
          playersWithStocks: [],
        },
      };
      return newState;
    case 'HANDLE_MERGER_STOCKS':
      const { acquiredChain, stocksToKeep, stocksToSell, stocksToTrade } = action.payload;
      
      // Calculate payout from selling stocks
      const stockPrice = calculateStockPrice(acquiredChain, 0).sell;
      const payout = stocksToSell * stockPrice;
      
      // Update player's stocks and money
      const updatedPlayersStocks = state.players.map(player => {
        return {
          ...player,
          money: player.money + (player.id === state.players[state.currentPlayerIndex].id ? payout : 0),
          stocks: {
            ...player.stocks,
            [acquiredChain]: player.stocks[acquiredChain] - (player.id === state.players[state.currentPlayerIndex].id ? (stocksToSell + stocksToTrade) : 0),
            [state.currentMerger?.survivingChain as HotelChainName]: player.stocks[state.currentMerger?.survivingChain as HotelChainName] + (player.id === state.players[state.currentPlayerIndex].id ? stocksToTrade : 0),
          },
        };
      });
      
      // Update stock market with sold stocks
      const updatedStockMarket = {
        ...state.stockMarket,
        [acquiredChain]: state.stockMarket[acquiredChain] + stocksToSell,
      };
      
      // Reset merger info
      
      newState = {
        ...state,
        players: updatedPlayersStocks,
        stockMarket: updatedStockMarket,
        gamePhase: 'buyStock',
        mergerInfo: null,
        currentMerger: undefined,
      };
      return newState;
    case 'END_GAME':
      if (state.gamePhase === 'gameOver') {
        return state;
      }
      
      const { players, hotelChains } = state;
      
      // Deactivate all hotel chains
      const updatedHotelChainsEndGame = {
        ...hotelChains,
      };
      
      Object.keys(updatedHotelChainsEndGame).forEach((chainName: string) => {
        updatedHotelChainsEndGame[chainName as HotelChainName] = {
          ...updatedHotelChainsEndGame[chainName as HotelChainName],
          isActive: false,
        };
      });
      
      // Payout stockholders
      const updatedPlayersEndGame = players.map(player => {
        let newMoney = player.money;
        
        Object.keys(hotelChains).forEach((chainName: string) => {
          if (player.stocks[chainName as HotelChainName] > 0) {
            const chain = hotelChains[chainName as HotelChainName];
            const stockPrice = calculateStockPrice(chainName as HotelChainName, chain.tiles.length).sell;
            newMoney += player.stocks[chainName as HotelChainName] * stockPrice;
            
            const bonus = distributeStockholderBonus(chainName as HotelChainName, players, chain, player.stocks[chainName as HotelChainName]);
            newMoney += bonus;
          }
        });
        
        return {
          ...player,
          money: newMoney,
          stocks: {
            luxor: 0,
            tower: 0,
            american: 0,
            festival: 0,
            worldwide: 0,
            continental: 0,
            imperial: 0,
          },
        };
      });
      
      // Determine the winner
      let winnerEndGame: Player | null = null;
      let winnersEndGame: Player[] | undefined = undefined;
      
      const sortedPlayers = [...updatedPlayersEndGame].sort((a, b) => b.money - a.money);
      
      if (sortedPlayers[0].money > sortedPlayers[1].money) {
        winnerEndGame = sortedPlayers[0];
      } else {
        // It's a tie
        winnersEndGame = sortedPlayers.filter(player => player.money === sortedPlayers[0].money);
      }
      
      newState = {
        ...state,
        hotelChains: updatedHotelChainsEndGame,
        players: updatedPlayersEndGame,
        gamePhase: 'gameOver',
        gameEnded: true,
        winner: winnerEndGame,
        winners: winnersEndGame,
        showWinnerBanner: true,
      };
      return newState;
    case 'END_GAME_MANUALLY':
      const { players: currentPlayers, hotelChains: currentHotelChains } = state;
      
      // Payout stockholders
      const updatedPlayersManualEndGame = currentPlayers.map(player => {
        let newMoney = player.money;
        
        Object.keys(currentHotelChains).forEach((chainName: string) => {
          if (player.stocks[chainName as HotelChainName] > 0) {
            const chain = currentHotelChains[chainName as HotelChainName];
            const stockPrice = calculateStockPrice(chainName as HotelChainName, chain.tiles.length).sell;
            newMoney += player.stocks[chainName as HotelChainName] * stockPrice;
            
            const bonus = distributeStockholderBonus(chainName as HotelChainName, currentPlayers, chain, player.stocks[chainName as HotelChainName]);
            newMoney += bonus;
          }
        });
        
        return {
          ...player,
          money: newMoney,
          stocks: {
            luxor: 0,
            tower: 0,
            american: 0,
            festival: 0,
            worldwide: 0,
            continental: 0,
            imperial: 0,
          },
        };
      });
      
      // Determine the winner
      let winnerManualEndGame: Player | null = null;
      let winnersManualEndGame: Player[] | undefined = undefined;
      
      const sortedPlayersManual = [...updatedPlayersManualEndGame].sort((a, b) => b.money - a.money);
      
      if (sortedPlayersManual[0].money > sortedPlayersManual[1].money) {
        winnerManualEndGame = sortedPlayersManual[0];
      } else {
        // It's a tie
        winnersManualEndGame = sortedPlayersManual.filter(player => player.money === sortedPlayersManual[0].money);
      }
      
      newState = {
        ...state,
        players: updatedPlayersManualEndGame,
        gamePhase: 'gameOver',
        gameEnded: true,
        winner: winnerManualEndGame,
        winners: winnersManualEndGame,
        showWinnerBanner: true,
      };
      return newState;
    case 'ADD_TILE_TO_PLAYER_HAND':
      const { playerId: playerIdAddTile, coordinate: coordinateAddTile } = action.payload;
      const playerAddTile = state.players.find(p => p.id === playerIdAddTile);
      if (!playerAddTile) return state;
      
      const updatedPlayersAddTile = state.players.map(p =>
        p.id === playerIdAddTile ? { ...p, tiles: [...p.tiles, coordinateAddTile] } : p
      );
      
      newState = {
        ...state,
        players: updatedPlayersAddTile,
      };
      return newState;
    case 'DRAW_INITIAL_TILE':
      const { playerId: playerIdDrawTile } = action.payload;
      const playerDrawTile = state.players.find(p => p.id === playerIdDrawTile);
      if (!playerDrawTile) return state;
      
      const tileDrawTile = state.availableTiles.pop();
      if (!tileDrawTile) return state;
      
      const updatedPlayersDrawTile = state.players.map(p =>
        p.id === playerIdDrawTile ? { ...p, tiles: [...p.tiles, tileDrawTile] } : p
      );
      
      const updatedInitialTilesDrawTile = [...state.initialTiles];
      updatedInitialTilesDrawTile.push({ playerId: playerIdDrawTile, coordinate: tileDrawTile });
      
      newState = {
        ...state,
        players: updatedPlayersDrawTile,
        availableTiles: state.availableTiles,
        initialTiles: updatedInitialTilesDrawTile,
      };
      return newState;
    case 'DEAL_STARTING_TILES':
      const updatedPlayersDealTiles = state.players.map(player => {
        const newTiles = [];
        for (let i = 0; i < 5; i++) {
          const tile = state.availableTiles.pop();
          if (tile) {
            newTiles.push(tile);
          }
        }
        return { ...player, tiles: newTiles };
      });
      
      newState = {
        ...state,
        players: updatedPlayersDealTiles,
        availableTiles: state.availableTiles,
        gamePhase: 'placeTile',
        setupPhase: 'complete',
        initialPlayerTurnState: {
          player: updatedPlayersDealTiles[state.currentPlayerIndex],
        },
      };
      return newState;
    case 'SAVE_GAME':
      saveGameState(state);
      return state;
    case 'LOAD_SAVED_GAME':
      const savedGame = loadSavedGame();
      if (savedGame) {
        newState = { ...savedGame };
        return newState;
      }
      return state;
    case 'CLEAR_SAVED_GAME':
      clearSavedGame();
      return state;
    case 'HIDE_WINNER_BANNER':
      newState = { ...state, showWinnerBanner: false };
      return newState;
    case 'RECORD_STOCK_PURCHASE':
      newState = { ...state, lastStockPurchase: action.payload, showStockPurchaseBanner: true };
      return newState;
    case 'ACKNOWLEDGE_STOCK_PURCHASE':
      newState = { ...state, showStockPurchaseBanner: false, lastStockPurchase: null };
      return newState;
    default:
      return state;
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
  
  useEffect(() => {
    if (state.gamePhase !== 'setup' && !state.gameEnded) {
      saveGameState(state);
    }
  }, [state]);
  
  return (
    <GameContext.Provider value={{ state, dispatch, hasSavedGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
