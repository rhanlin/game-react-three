'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { soundManager } from './soundManager';

interface GameState {
  board: number[][];
  revealed: boolean[][];
  flagged: boolean[][];
  gameOver: boolean;
  gameWon: boolean;
  remainingMines: number;
  foodResult: string | null;
  hasSteppedOnMine: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  favoriteFood: string[];
  normalFood: string[];
}

interface GameContextType {
  gameState: GameState;
  initializeGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
  revealCell: (x: number, y: number) => number;
  toggleFlag: (x: number, y: number) => void;
  resetGame: () => void;
  getRandomLunch: () => string;
  setFoodOptions: (favorite: string[], normal: string[]) => void;
  setEncouragementRef: (fn: () => void) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const FOOD_OPTIONS = [
  '9樓自助餐', '9樓四海遊龍', '9樓義大利麵', '9樓拉亞漢堡'
];

const SPECIAL_FOOD_OPTIONS = [
  '裕隆城美食街', '小樂麵食館', '壽司郎', '麥當勞', `Hiro's らぁ麵Kitchen`, '麵屋達摩', '肉道場'
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    revealed: [],
    flagged: [],
    gameOver: false,
    gameWon: false,
    remainingMines: 0,
    foodResult: null,
    hasSteppedOnMine: false,
    difficulty: 'easy',
    favoriteFood: SPECIAL_FOOD_OPTIONS,
    normalFood: FOOD_OPTIONS
  });

  const encouragementRef = useRef<(() => void) | null>(null);

  const showEncouragement = useCallback(() => {
    encouragementRef.current?.();
  }, []);

  const generateBoard = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    const config = {
      easy: { size: 8, mines: 10 },
      medium: { size: 12, mines: 30 },
      hard: { size: 16, mines: 60 },
    }[difficulty];

    const board = Array(config.size).fill(0).map(() => 
      Array(config.size).fill(0)
    );
    const revealed = Array(config.size).fill(0).map(() => 
      Array(config.size).fill(false)
    );
    const flagged = Array(config.size).fill(0).map(() => 
      Array(config.size).fill(false)
    );

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const x = Math.floor(Math.random() * config.size);
      const y = Math.floor(Math.random() * config.size);
      if (board[y][x] !== -1) {
        board[y][x] = -1;
        minesPlaced++;
      }
    }

    // Calculate numbers
    for (let y = 0; y < config.size; y++) {
      for (let x = 0; x < config.size; x++) {
        if (board[y][x] === -1) continue;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < config.size && nx >= 0 && nx < config.size && board[ny][nx] === -1) {
              count++;
            }
          }
        }
        board[y][x] = count;
      }
    }

    setGameState(prev => ({
      board,
      revealed,
      flagged,
      gameOver: false,
      gameWon: false,
      remainingMines: config.mines,
      foodResult: null,
      hasSteppedOnMine: false,
      difficulty: difficulty,
      favoriteFood: prev.favoriteFood,
      normalFood: prev.normalFood
    }));
  }, []);

  const revealCell = useCallback((x: number, y: number) => {
    if (gameState.gameOver || gameState.gameWon || gameState.flagged[y][x]) return 0;

    showEncouragement();

    let opened = 0;
    setGameState(prev => {
      const newRevealed = prev.revealed.map(row => [...row]);
      const newBoard = prev.board.map(row => [...row]);
      if (newBoard[y][x] === -1) {
        // Game over
        return {
          ...prev,
          revealed: newRevealed.map(row => row.map(() => true)),
          gameOver: true,
          foodResult: FOOD_OPTIONS[Math.floor(Math.random() * FOOD_OPTIONS.length)],
          hasSteppedOnMine: true,
        };
      }
      const revealAdjacent = (x: number, y: number) => {
        if (x < 0 || x >= newBoard[0].length || y < 0 || y >= newBoard.length || newRevealed[y][x]) return;
        newRevealed[y][x] = true;
        opened++;
        if (newBoard[y][x] === 0) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              revealAdjacent(x + dx, y + dy);
            }
          }
        }
      };
      revealAdjacent(x, y);
      // Check win condition
      const totalCells = newBoard.length * newBoard[0].length;
      const totalMines = newBoard.flat().filter(cell => cell === -1).length;
      const revealedCells = newRevealed.flat().filter(cell => cell).length;
      if (revealedCells === totalCells - totalMines) {
        soundManager.play('victory');
        return {
          ...prev,
          revealed: newRevealed,
          gameWon: true,
          foodResult: FOOD_OPTIONS[Math.floor(Math.random() * FOOD_OPTIONS.length)],
          hasSteppedOnMine: false,
        };
      }
      return {
        ...prev,
        revealed: newRevealed,
      };
    });
    return opened;
  }, [gameState, showEncouragement]);

  const toggleFlag = useCallback((x: number, y: number) => {
    if (gameState.gameOver || gameState.gameWon || gameState.revealed[y][x]) return;
    soundManager.play('flag');

    setGameState(prev => {
      const newFlagged = prev.flagged.map(row => [...row]);
      newFlagged[y][x] = !newFlagged[y][x];
      
      return {
        ...prev,
        flagged: newFlagged,
        remainingMines: prev.remainingMines + (newFlagged[y][x] ? -1 : 1),
      };
    });
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      revealed: prev.revealed.map(row => row.map(() => false)),
      flagged: prev.flagged.map(row => row.map(() => false)),
      gameOver: false,
      gameWon: false,
      remainingMines: prev.board.flat().filter(cell => cell === -1).length,
      foodResult: null,
      hasSteppedOnMine: false,
    }));
  }, []);

  const getRandomLunch = useCallback(() => {
    if (gameState.gameWon) {
      return gameState.favoriteFood[Math.floor(Math.random() * gameState.favoriteFood.length)];
    }
    return gameState.normalFood[Math.floor(Math.random() * gameState.normalFood.length)];
  }, [gameState.gameWon, gameState.favoriteFood, gameState.normalFood]);

  const setFoodOptions = useCallback((favorite: string[], normal: string[]) => {
    setGameState(prev => ({
      ...prev,
      favoriteFood: favorite,
      normalFood: normal
    }));
  }, []);

  const value = {
    gameState,
    initializeGame: generateBoard,
    revealCell,
    toggleFlag,
    resetGame,
    getRandomLunch,
    setFoodOptions,
    setEncouragementRef: (fn: () => void) => {
      encouragementRef.current = fn;
    }
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 


