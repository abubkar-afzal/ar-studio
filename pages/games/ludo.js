// pages/games/ludo.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const BOARD_SIZE = 15;

function LudoGame() {
  const router = useRouter();
  const [dice, setDice] = useState(1);
  const [turn, setTurn] = useState('red');
  const [players, setPlayers] = useState({
    red: { pieces: Array(4).fill(0), finished: 0 },
    green: { pieces: Array(4).fill(0), finished: 0 }
  });
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState('friend');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);

  const rollDice = () => {
    if (gameOver || diceRolling) return;
    setDiceRolling(true);
    const val = Math.floor(Math.random() * 6) + 1;
    setDice(val);
    setTimeout(() => {
      if (mode === 'ai' && turn === 'green') {
        const player = players.green;
        for (let i = 0; i < player.pieces.length; i++) {
          if (player.pieces[i] + val <= BOARD_SIZE*4) {
            movePiece('green', i, val);
            break;
          }
        }
        if (!gameOver) nextTurn();
      } else if (turn === 'red') {
        const player = players.red;
        for (let i = 0; i < player.pieces.length; i++) {
          if (player.pieces[i] + val <= BOARD_SIZE*4) {
            movePiece('red', i, val);
            break;
          }
        }
        if (!gameOver) nextTurn();
      }
      setDiceRolling(false);
    }, 300);
  };

  const movePiece = (color, idx, steps) => {
    const newPlayers = { ...players };
    const player = newPlayers[color];
    const oldPos = player.pieces[idx];
    const newPos = oldPos + steps;
    if (newPos >= BOARD_SIZE*4) { player.finished += 1; player.pieces[idx] = BOARD_SIZE*4; }
    else { player.pieces[idx] = newPos; }
    setPlayers(newPlayers);
    if (player.finished === 4) setGameOver(true);
  };

  const nextTurn = () => setTurn(turn === 'red' ? 'green' : 'red');
  const resetGame = () => {
    setPlayers({ red: { pieces: Array(4).fill(0), finished: 0 }, green: { pieces: Array(4).fill(0), finished: 0 } });
    setTurn('red');
    setGameOver(false);
    setDice(1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const renderBoard = () => {
    const cells = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const isLight = (i + j) % 2 === 0;
        const color = isLight ? '#f0d9b5' : '#b58863';
        let pieceColor = null;
        Object.entries(players).forEach(([color, player]) => {
          player.pieces.forEach((pos, idx) => {
            if (pos < BOARD_SIZE*4) {
              const row = Math.floor(pos / BOARD_SIZE);
              const col = pos % BOARD_SIZE;
              if (row === i && col === j) pieceColor = color;
            }
          });
        });
        cells.push(
          <div
            key={`${i}-${j}`}
            className="aspect-square flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {pieceColor && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: pieceColor === 'red' ? '#ef4444' : '#22c55e' }}
              />
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setMode('friend'); resetGame(); }}
          className="px-3 py-1.5 rounded-full text-sm font-medium shadow"
          style={{ backgroundColor: mode === 'friend' ? '#3b82f6' : '#6b7280', color: 'white' }}
        >
          👥 Friend
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setMode('ai'); resetGame(); }}
          className="px-3 py-1.5 rounded-full text-sm font-medium shadow"
          style={{ backgroundColor: mode === 'ai' ? '#3b82f6' : '#6b7280', color: 'white' }}
        >
          🤖 Computer
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="px-3 py-1.5 rounded-full text-sm font-medium shadow"
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          🔄 Reset
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className="px-3 py-1.5 rounded-full text-sm font-medium shadow"
          style={{ backgroundColor: '#6b7280', color: 'white' }}
        >
          {isFullscreen ? '⛶ Exit' : '⛶ Full'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/games")}
          className="px-3 py-1.5 rounded-full text-sm font-medium shadow bg-red-500 text-white"
        >
          ← Back
        </motion.button>
      </div>
      <div className="text-center mb-2 font-semibold text-white">
        {gameOver ? `🎉 Winner: ${turn === 'red' ? 'Green' : 'Red'}` : `Turn: ${turn.toUpperCase()}  |  🎲 Dice: ${dice}`}
      </div>
      <div className="grid grid-cols-15 gap-0 w-full max-w-3xl aspect-square border-2 rounded-lg overflow-hidden shadow-2xl border-gray-700">
        {renderBoard()}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={rollDice}
        disabled={gameOver || diceRolling}
        className="mt-4 px-6 py-2 rounded-full font-medium shadow-lg"
        style={{ backgroundColor: gameOver || diceRolling ? '#6b7280' : '#3b82f6', color: 'white' }}
      >
        {diceRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
      </motion.button>
    </div>
  );
}

export default LudoGame;