// pages/games/12-taani.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

function TaaniGame() {
  const router = useRouter();
  const [board, setBoard] = useState(Array(12).fill(4));
  const [turn, setTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState('friend');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playMove = (pit) => {
    if (gameOver || (mode === 'ai' && turn === 1)) return;
    const newBoard = [...board];
    let seeds = newBoard[pit];
    if (seeds === 0) return;
    newBoard[pit] = 0;
    let i = pit + 1;
    while (seeds > 0) {
      if (i === 12) i = 0;
      newBoard[i] += 1;
      seeds--;
      i++;
    }
    setBoard(newBoard);
    const opponentStart = turn === 0 ? 6 : 0;
    const opponentEnd = turn === 0 ? 11 : 5;
    const opponentEmpty = newBoard.slice(opponentStart, opponentEnd+1).every(v => v === 0);
    if (opponentEmpty) setGameOver(true);
    else setTurn(turn === 0 ? 1 : 0);
  };

  const resetGame = () => {
    setBoard(Array(12).fill(4));
    setTurn(0);
    setGameOver(false);
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
      <div className="text-center mb-3 font-semibold text-white">
        {gameOver ? '🏁 Game Over!' : `Turn: Player ${turn+1}`}
      </div>
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {board.map((seeds, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => playMove(idx)}
            className="w-16 h-16 rounded-xl shadow-lg flex flex-col items-center justify-center text-xl font-bold transition-all"
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              border: '2px solid #374151',
            }}
          >
            <span className="text-xs text-gray-400">Pit {idx+1}</span>
            <span className="text-2xl">{seeds}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default TaaniGame;