// pages/games/chess.js
import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const pieceSymbols = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

function randomMove(game) {
  const moves = game.moves();
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

function ChessGame() {
  const router = useRouter();
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState('w');
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState(null);
  const [status, setStatus] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isAiThinking = useRef(false);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelected(null);
    setTurn('w');
    setGameOver(false);
    setStatus('');
    isAiThinking.current = false;
  };

  const updateStatus = (g) => {
    if (g.isGameOver()) {
      setGameOver(true);
      if (g.isCheckmate()) setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`);
      else if (g.isDraw()) setStatus('Draw!');
      else if (g.isStalemate()) setStatus('Stalemate!');
      else setStatus('Game Over');
    } else if (g.isCheck()) {
      setStatus(`Check! ${g.turn() === 'w' ? 'White' : 'Black'} to move`);
    } else {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  };

  useEffect(() => { updateStatus(game); }, [game]);

  const handleSquareClick = (row, col) => {
    if (gameOver) return;
    if (mode === 'ai' && turn === 'b') return;
    const square = String.fromCharCode(97 + col) + (8 - row);
    if (selected) {
      try {
        const move = game.move({ from: selected, to: square, promotion: 'q' });
        if (move) {
          setGame(new Chess(game.fen()));
          setSelected(null);
          setTurn(game.turn());
          updateStatus(game);
          if (mode === 'ai' && game.turn() === 'b' && !game.isGameOver()) {
            isAiThinking.current = true;
            setTimeout(() => {
              const aiMove = randomMove(game);
              if (aiMove) {
                game.move(aiMove);
                setGame(new Chess(game.fen()));
                setTurn(game.turn());
                updateStatus(game);
                isAiThinking.current = false;
              }
            }, 300);
          }
        } else {
          const piece = game.get(square);
          if (piece && piece.color === turn) setSelected(square);
          else setSelected(null);
        }
      } catch (e) { setSelected(null); }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === turn) setSelected(square);
    }
  };

  const board = game.board();

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
      <div className="text-center mb-2 font-semibold text-white">{status}</div>
      <div className="relative w-full max-w-2xl aspect-square shadow-2xl rounded-lg overflow-hidden border border-gray-700">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {board.map((row, i) =>
            row.map((piece, j) => {
              const isLight = (i + j) % 2 === 0;
              const color = isLight ? '#f0d9b5' : '#b58863';
              const isSelected = selected === String.fromCharCode(97 + j) + (8 - i);
              return (
                <motion.div
                  key={`${i}-${j}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center text-4xl cursor-pointer transition-all ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}
                  style={{
                    backgroundColor: isSelected ? '#fbbf24' : color,
                    aspectRatio: '1/1',
                  }}
                  onClick={() => handleSquareClick(i, j)}
                >
                  {piece && (
                    <span style={{ color: piece.color === 'w' ? '#fff' : '#000', textShadow: piece.color === 'w' ? '0 0 5px rgba(0,0,0,0.3)' : 'none' }}>
                      {pieceSymbols[piece.color][piece.type]}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ChessGame;