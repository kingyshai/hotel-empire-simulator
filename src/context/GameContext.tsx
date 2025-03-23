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
    case 'SAVE_GAME': {
      saveGameState(state);
      return state;
    }
    
    case 'LOAD_SAVED_GAME': {
      const savedGame = loadSavedGame();
      if (savedGame) {
        toast.success('Game loaded successfully!');
        return savedGame;
      }
      return state;
    }
    
    case 'CLEAR_SAVED_GAME': {
      clearSavedGame();
      return initialGameState;
    }
    
    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload.players,
        setupPhase: 'drawInitialTile',
      };
      
    case 'SET_GAME_MODE':
      return {
        ...state,
        gameMode: 'classic',
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
      
      if (initialTiles.length < players.length) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      } else {
        const sortedInitialTiles = [...initialTiles].sort((a, b) => {
          const rowA = parseInt(a.coordinate.charAt(0));
          const colA = a.coordinate.charCodeAt(1) - 65;
          const distanceA = rowA + colA;
          
          const rowB = parseInt(b.coordinate.charAt(0));
          const colB = b.coordinate.charCodeAt(1) - 65;
          const distanceB = rowB + colB;
          
          return distanceA - distanceB;
        });
        
        sortedPlayers = sortedInitialTiles.map(tile => {
          const player = players.find(p => p.id === tile.playerId);
          if (!player) {
            console.error(`Player with ID ${tile.playerId} not found!`);
            return players[0];
          }
          return player;
        });
        
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
      clearSavedGame();
      
      const { playerCount, playerNames, gameMode } = action.payload;
      
      const validatedNames = playerNames.slice(0, playerCount).map((name, i) => 
        name.trim() ? name.trim() : `Player ${i + 1}`
      );
      
      const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
        id: i,
        name: validatedNames[i],
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
      
      console.log('Starting game with players:', players);
      
      toast.success(`Game started with ${playerCount} players!`);
      
      return {
        ...state,
        players,
        gameMode,
        gamePhase: 'setup',
        setupPhase: 'drawInitialTile',
        tilePool: shuffleArray(generateBoard()),
        currentPlayerIndex: 0,
      };
    }
    
    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayerIndex: action.payload.playerIndex,
      };
    
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
      
      const adjacentTiles = getAdjacentTiles(coordinate, placedTiles);
      const adjacentChains = findPotentialMergers(coordinate, state);
      
      const safeChains = adjacentChains.filter(chain => 
        state.hotelChains[chain].tiles.length >= 11
      );
      
      if (safeChains.length >= 2) {
        toast.error("Cannot place tile that would merge safe hotel chains!");
        player.tiles.splice(tileIndex, 0, coordinate);
        return {
          ...state,
          players: [
            ...state.players.slice(0, playerIndex),
            player,
            ...state.players.slice(playerIndex + 1)
          ]
        };
      }
      
      if (adjacentChains.length === 1) {
        const chainName = adjacentChains[0];
        const hotelChains = { ...state.hotelChains };
        
        const connectedFreeTiles = findConnectedTiles(coordinate, placedTiles);
        
        hotelChains[chainName] = {
          ...hotelChains[chainName],
          tiles: [...hotelChains[chainName].tiles, coordinate, ...connectedFreeTiles.filter(t => t !== coordinate)],
          isSafe: hotelChains[chainName].tiles.length + connectedFreeTiles.length >= 11,
        };
        
        placedTiles[coordinate].belongsToChain = chainName;
        connectedFreeTiles.forEach(tile => {
          if (tile !== coordinate && placedTiles[tile]) {
            placedTiles[tile].belongsToChain = chainName;
          }
        });
        
        const updatedPlayers = [...state.players];
        updatedPlayers[playerIndex] = player;
        
        return {
          ...state,
          hotelChains,
          placedTiles,
          players: updatedPlayers,
          gamePhase: 'buyStock',
        };
      }
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = player;
      
      return {
        ...state,
        placedTiles,
        players: updatedPlayers,
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
      
      const pricePerStock = calculateStockPrice(chainName, chain.tiles.length).buy;
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
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = player;
      
      return {
        ...state,
        players: updatedPlayers,
        stockMarket,
      };
    }
    
    case 'RECORD_STOCK_PURCHASE': {
      const { playerName, stocks, totalCost, foundedHotel } = action.payload;
      
      return {
        ...state,
        lastStockPurchase: {
          playerName,
          stocks,
          totalCost,
          foundedHotel
        },
        showStockPurchaseBanner: true
      };
    }
    
    case 'ACKNOWLEDGE_STOCK_PURCHASE': {
      return {
        ...state,
        showStockPurchaseBanner: false,
        lastFoundedHotel: undefined
      };
    }
    
    case 'END_TURN': {
      if (shouldEndGame(state)) {
        newState = endGame(state);
        clearSavedGame();
        return newState;
      }
      
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      
      const player = { ...state.players[state.currentPlayerIndex] };
      const tilePool = [...state.tilePool];
      
      if (tilePool.length > 0 && player.tiles.length < 6) {
        const coordinate = tilePool.pop()!;
        player.tiles.push(coordinate);
      }
      
      const updatedPlayers = [...state.players];
      updatedPlayers[state.currentPlayerIndex] = player;
      
      console.log(`Changing from player ${state.currentPlayerIndex} to player ${nextPlayerIndex}`);
      console.log(`Current player name: ${state.players[state.currentPlayerIndex].name}, Next player name: ${state.players[nextPlayerIndex].name}`);
      
      newState = {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        players: updatedPlayers,
        tilePool,
        gamePhase: 'placeTile',
        lastFoundedHotel: undefined,
      };
      
      saveGameState(newState);
      return newState;
    }
    
    case 'FOUND_HOTEL': {
      const { chainName, tileCoordinate, connectedTiles } = action.payload;
      
      if (!state.availableHeadquarters.includes(chainName)) {
        toast.error(`${chainName} headquarters is not available!`);
        return state;
      }
      
      if (!connectedTiles || connectedTiles.length < 2) {
        toast.error("You need at least 2 connected tiles to found a hotel!");
        return state;
      }
      
      const hotelChains = { ...state.hotelChains };
      hotelChains[chainName] = {
        ...hotelChains[chainName],
        isActive: true,
        tiles: connectedTiles,
      };
      
      const availableHeadquarters = state.availableHeadquarters.filter(hq => hq !== chainName);
      
      const player = { ...state.players[state.currentPlayerIndex] };
      player.stocks[chainName] += 1;
      
      const stockMarket = { ...state.stockMarket };
      stockMarket[chainName] -= 1;
      
      const updatedPlayers = [...state.players];
      updatedPlayers[state.currentPlayerIndex] = player;
      
      const placedTiles = { ...state.placedTiles };
      
      for (const tile of connectedTiles) {
        if (placedTiles[tile]) {
          placedTiles[tile] = {
            ...placedTiles[tile],
            belongsToChain: chainName,
          };
        } else {
          placedTiles[tile] = {
            coordinate: tile,
            isPlaced: true,
            belongsToChain: chainName,
          };
        }
      }
      
      const isSafe = connectedTiles.length >= 11;
      
      hotelChains[chainName].isSafe = isSafe;
      
      toast.success(`Founded ${chainName} hotel chain with ${connectedTiles.length} tiles! Received 1 free stock.`);
      
      return {
        ...state,
        hotelChains,
        availableHeadquarters,
        players: updatedPlayers,
        stockMarket,
        placedTiles,
        lastFoundedHotel: chainName,
        gamePhase: 'buyStock',
      };
    }
    
    case 'HANDLE_MERGER': {
      const { coordinate, playerId, survivingChain, acquiredChains } = action.payload;
      
      if (acquiredChains.length === 0) {
        toast.error("No chains to merge!");
        return state;
      }
      
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      const player = { ...state.players[playerIndex] };
      
      const tileIndex = player.tiles.indexOf(coordinate);
      if (tileIndex === -1) {
        toast.error("You don't have this tile!");
        return state;
      }
      player.tiles.splice(tileIndex, 1);
      
      const hotelChains = { ...state.hotelChains };
      const placedTiles = { ...state.placedTiles };
      
      placedTiles[coordinate] = { 
        coordinate, 
        isPlaced: true,
        belongsToChain: survivingChain
      };
      
      const connectedFreeTiles = findConnectedTiles(coordinate, placedTiles);
      
      hotelChains[survivingChain] = {
        ...hotelChains[survivingChain],
        tiles: [...hotelChains[survivingChain].tiles, coordinate, ...connectedFreeTiles.filter(t => t !== coordinate)]
      };
      
      connectedFreeTiles.forEach(tile => {
        if (tile !== coordinate && placedTiles[tile] && !placedTiles[tile].belongsToChain) {
          placedTiles[tile].belongsToChain = survivingChain;
        }
      });
      
      let updatedState = { ...state, placedTiles, hotelChains };
      
      let winnerPlayers: Player[] = [];
      let currentMergerChain: HotelChainName | null = null;
      
      for (const chainName of acquiredChains) {
        const bonusState = distributeStockholderBonus(updatedState, chainName);
        updatedState = { ...bonusState };
        
        const possibleBonusReceivers = bonusState.players.map((player, idx) => ({
          player,
          originalMoney: state.players[idx].money
        }));
        
        const bonusReceivers = possibleBonusReceivers
          .filter(({ player, originalMoney }) => player.money > originalMoney)
          .map(({ player }) => player);
          
        if (bonusReceivers.length > 0) {
          winnerPlayers = [...winnerPlayers, ...bonusReceivers];
        }
        
        if (!currentMergerChain) {
          currentMergerChain = chainName;
        }
        
        for (const tile of hotelChains[chainName].tiles) {
          placedTiles[tile] = {
            ...placedTiles[tile],
            belongsToChain: survivingChain
          };
          
          if (!hotelChains[survivingChain].tiles.includes(tile)) {
            hotelChains[survivingChain].tiles.push(tile);
          }
        }
        
        hotelChains[chainName] = {
          ...hotelChains[chainName],
          tiles: [],
          isActive: false,
          isSafe: false
        };
        
        updatedState.availableHeadquarters.push(chainName);
      }
      
      hotelChains[survivingChain].isSafe = hotelChains[survivingChain].tiles.length >= 11;
      
      updatedState.availableHeadquarters.sort();
      
      const updatedPlayers = [...updatedState.players];
      updatedPlayers[playerIndex] = player;
      
      toast.success(`Merged ${acquiredChains.join(', ')} into ${survivingChain}`);
      
      const mergerPlayer = updatedPlayers[playerIndex];
      const currentPlayerStocks = mergerPlayer.stocks[currentMergerChain as HotelChainName];
      
      if (currentMergerChain && currentPlayerStocks > 0) {
        return {
          ...updatedState,
          hotelChains,
          placedTiles,
          players: updatedPlayers,
          showWinnerBanner: winnerPlayers.length > 0,
          winner: winnerPlayers.length === 1 ? winnerPlayers[0] : null,
          winners: winnerPlayers.length > 1 ? winnerPlayers : undefined,
          gamePhase: 'mergerStockOptions',
          currentMerger: {
            acquiredChain: currentMergerChain,
            survivingChain,
            stocksHeld: currentPlayerStocks,
            playersWithStocks: updatedPlayers
              .filter(p => p.id !== mergerPlayer.id && p.stocks[currentMergerChain as HotelChainName] > 0)
              .map(p => p.id)
          }
        };
      }
      
      return {
        ...updatedState,
        hotelChains,
        placedTiles,
        players: updatedPlayers,
        showWinnerBanner: winnerPlayers.length > 0,
        winner: winnerPlayers.length === 1 ? winnerPlayers[0] : null,
        winners: winnerPlayers.length > 1 ? winnerPlayers : undefined,
        gamePhase: 'buyStock'
      };
    }
    
    case 'HANDLE_MERGER_STOCKS': {
      const { acquiredChain, stocksToKeep, stocksToSell, stocksToTrade } = action.payload;
      
      if (!state.currentMerger) {
        return state;
      }
      
      const { survivingChain, stocksHeld, playersWithStocks } = state.currentMerger;
      const currentPlayer = { ...state.players[state.currentPlayerIndex] };
      
      const updatedPlayers = [...state.players];
      const stockMarket = { ...state.stockMarket };
      
      if (stocksToKeep + stocksToSell + stocksToTrade !== stocksHeld) {
        toast.error("Total stocks don't match stocks held");
        return state;
      }
      
      if (stocksToTrade % 2 !== 0) {
        toast.error("Trade amount must be even");
        return state;
      }
      
      if (stocksToKeep > 0) {
        currentPlayer.stocks[acquiredChain] = stocksToKeep;
      } else {
        currentPlayer.stocks[acquiredChain] = 0;
      }
      
      if (stocksToSell > 0) {
        const chain = state.hotelChains[acquiredChain];
        const { sell } = calculateStockPrice(acquiredChain, chain.tiles.length);
        const totalSale = sell * stocksToSell;
        
        currentPlayer.money += totalSale;
        stockMarket[acquiredChain] += stocksToSell;
        
        toast.success(`Sold ${stocksToSell} shares of ${acquiredChain} for $${totalSale}`);
      }
      
      if (stocksToTrade > 0) {
        const tradedStocks = Math.floor(stocksToTrade / 2);
        
        if (stockMarket[survivingChain] < tradedStocks) {
          toast.error(`Not enough ${survivingChain} stocks available for trade`);
          return state;
        }
        
        currentPlayer.stocks[survivingChain] += tradedStocks;
        stockMarket[survivingChain] -= tradedStocks;
        stockMarket[acquiredChain] += stocksToTrade;
        
        toast.success(`Traded ${stocksToTrade} shares of ${acquiredChain} for ${tradedStocks} shares of ${survivingChain}`);
      }
      
      updatedPlayers[state.currentPlayerIndex] = currentPlayer;
      
      if (playersWithStocks && playersWithStocks.length > 0) {
        const nextPlayerId = playersWithStocks[0];
        const nextPlayerIndex = updatedPlayers.findIndex(p => p.id === nextPlayerId);
        const nextPlayer = updatedPlayers[nextPlayerIndex];
        const remainingPlayers = playersWithStocks.slice(1);
        
        return {
          ...state,
          players: updatedPlayers,
          stockMarket,
          currentPlayerIndex: nextPlayerIndex,
          currentMerger: {
            acquiredChain,
            survivingChain,
            stocksHeld: nextPlayer.stocks[acquiredChain],
            playersWithStocks: remainingPlayers
          }
        };
      }
      
      const allMergedChains = [...state.mergerInfo?.acquired.map(c => c.name) || []].filter(c => c !== acquiredChain);
      const nextChain = allMergedChains[0];
      
      if (nextChain && currentPlayer.stocks[nextChain] > 0) {
        return {
          ...state,
          players: updatedPlayers,
          stockMarket,
          currentPlayerIndex: state.currentPlayerIndex,
          currentMerger: {
            acquiredChain: nextChain,
            survivingChain,
            stocksHeld: currentPlayer.stocks[nextChain],
            playersWithStocks: updatedPlayers
              .filter(p => p.id !== currentPlayer.id && p.stocks[nextChain] > 0)
              .map(p => p.id)
          }
        };
      }
      
      return {
        ...state,
        players: updatedPlayers,
        stockMarket,
        currentMerger: undefined,
        currentPlayerIndex: state.currentPlayerIndex,
        gamePhase: 'buyStock'
      };
    }
    
    case 'HIDE_WINNER_BANNER': {
      return {
        ...state,
        showWinnerBanner: false
      };
    }
    
    case 'END_GAME_MANUALLY': {
      clearSavedGame();
      newState = endGame(state);
      toast.success("Game has ended!");
      return newState;
    }
    
    case 'END_GAME': {
      clearSavedGame();
      
      const updatedPlayers = state.players.map(player => {
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
      
      const winner = [...updatedPlayers].sort((a, b) => b.money - a.money)[0];
      
      return {
        ...state,
        players: updatedPlayers,
        gameEnded: true,
        winner,
      };
    }
    
    case 'ADD_TILE_TO_PLAYER_HAND': {
      const { playerId, coordinate } = action.payload;
      const updatedPlayers = [...state.players];
      const playerIndex = updatedPlayers.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        toast.error("Player not found!");
        return state;
      }
      
      if (state.placedTiles[coordinate]) {
        toast.error("This tile is already placed on the board!");
        return state;
      }
      
      for (const player of updatedPlayers) {
        if (player.tiles.includes(coordinate)) {
          toast.error("This tile is already in a player's hand!");
          return state;
        }
      }
      
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        tiles: [...updatedPlayers[playerIndex].tiles, coordinate]
      };
      
      return {
        ...state,
        players: updatedPlayers
      };
    }

    case 'PLACE_TILE_AND_ADD_TO_CHAIN': {
      const { coordinate, playerId, chainName } = action.payload;
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
      
      const hotelChains = { ...state.hotelChains };
      const placedTiles = { ...state.placedTiles };
      
      placedTiles[coordinate] = {
        coordinate,
        isPlaced: true,
        belongsToChain: chainName
      };
      
      hotelChains[chainName] = {
        ...hotelChains[chainName],
        tiles: [...hotelChains[chainName].tiles, coordinate]
      };
      
      const connectedFreeTiles = findConnectedTiles(coordinate, placedTiles)
        .filter(tile => tile !== coordinate && !placedTiles[tile]?.belongsToChain);
      
      connectedFreeTiles.forEach(tile => {
        if (placedTiles[tile]) {
          placedTiles[tile].belongsToChain = chainName;
        } else {
          placedTiles[tile] = {
            coordinate: tile,
            isPlaced: true,
            belongsToChain: chainName
          };
        }
        
        hotelChains[chainName].tiles.push(tile);
      });
      
      hotelChains[chainName].isSafe = hotelChains[chainName].tiles.length >= 11;
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = player;
      
      return {
        ...state,
        hotelChains,
        placedTiles,
        players: updatedPlayers,
        gamePhase: 'buyStock',
      };
    }
    
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
  
  return (
    <GameContext.Provider value={{ state, dispatch, hasSavedGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
