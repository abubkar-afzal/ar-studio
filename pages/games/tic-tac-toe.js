// pages/games/tic-tac-toe.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let line of lines) {
    const [a,b,c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
  }
  return null;
}

function minimax(newBoard, depth, isMaximizing, player, aiPlayer) {
  const winner = calculateWinner(newBoard);
  if (winner === aiPlayer) return { score: 10 - depth };
  if (winner === (player === 'X' ? 'O' : 'X')) return { score: depth - 10 };
  if (newBoard.every(s => s !== null)) return { score: 0 };
  if (isMaximizing) {
    let best = -Infinity, bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i]) continue;
      newBoard[i] = aiPlayer;
      const result = minimax(newBoard, depth+1, false, player, aiPlayer);
      newBoard[i] = null;
      if (result.score > best) { best = result.score; bestMove = i; }
    }
    return { score: best, move: bestMove };
  } else {
    let best = Infinity, bestMove = -1;
    const humanPlayer = player === 'X' ? 'O' : 'X';
    for (let i = 0; i < 9; i++) {
      if (newBoard[i]) continue;
      newBoard[i] = humanPlayer;
      const result = minimax(newBoard, depth+1, true, player, aiPlayer);
      newBoard[i] = null;
      if (result.score < best) { best = result.score; bestMove = i; }
    }
    return { score: best, move: bestMove };
  }
}

function TicTacToeBoard() {
  const router = useRouter();
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [mode, setMode] = useState('friend');
  const [gameOver, setGameOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleClick = (index) => {
    if (winner || squares[index] || (!isXNext && mode === 'ai')) return;
    const newSquares = squares.slice();
    newSquares[index] = isXNext ? 'X' : 'O';
    setSquares(newSquares);
    const win = calculateWinner(newSquares);
    if (win) { setWinner(win); setGameOver(true); }
    else if (newSquares.every(s => s !== null)) setGameOver(true);
    else setIsXNext(!isXNext);
  };

  useEffect(() => {
    if (mode === 'ai' && !isXNext && !winner && !gameOver) {
      const aiPlayer = 'O', player = 'X';
      const result = minimax(squares, 0, true, player, aiPlayer);
      if (result.move !== -1) {
        setTimeout(() => handleClick(result.move), 300);
      }
    }
  }, [isXNext, mode, squares, winner, gameOver]);

  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setGameOver(false);
  };

  const status = winner ? `🏆 Winner: ${winner}` : gameOver ? '🤝 Draw!' : `Next: ${isXNext ? 'X' : 'O'}`;

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
      <div className="text-center mb-3 font-semibold text-white">{status}</div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-md aspect-square">
        {squares.map((square, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(idx)}
            className="text-6xl font-bold rounded-xl shadow-lg transition-all"
            style={{
              backgroundColor: square ? (square === 'X' ? '#3b82f6' : '#ef4444') : '#1e293b',
              color: 'white',
              border: '2px solid #374151',
              boxShadow: square ? '0 0 20px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {square}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default TicTacToeBoard;