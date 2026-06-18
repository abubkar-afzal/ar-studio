// pages/games/snake.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

function SnakeGame() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const gridSize = 20;
  const cellSize = 20; // px per cell (canvas internal size fixed)
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 15, y: 10 });
  const gameIntervalRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const generateFood = (snake) => {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    return pos;
  };

  const resetGame = () => {
    const newSnake = [{ x: 10, y: 10 }];
    snakeRef.current = newSnake;
    directionRef.current = { x: 1, y: 0 };
    foodRef.current = generateFood(newSnake);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    drawGame();
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    startLoop();
  };

  const startLoop = () => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    gameIntervalRef.current = setInterval(() => {
      if (!gameOver) moveSnake();
    }, 150);
  };

  const moveSnake = () => {
    const snake = snakeRef.current;
    const head = snake[0];
    const newHead = {
      x: head.x + directionRef.current.x,
      y: head.y + directionRef.current.y,
    };
    if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
      endGame();
      return;
    }
    if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      endGame();
      return;
    }
    const newSnake = [newHead, ...snake];
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      setScore(prev => prev + 1);
      foodRef.current = generateFood(newSnake);
    } else {
      newSnake.pop();
    }
    snakeRef.current = newSnake;
    drawGame();
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    if (score > highScore) setHighScore(score);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    drawGame();
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width / gridSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    grad.addColorStop(0, "#1a1a2e");
    grad.addColorStop(1, "#0f0f1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * size);
      ctx.lineTo(canvas.width, i * size);
      ctx.stroke();
    }

    // snake
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      ctx.shadowColor = isHead ? "#22c55e" : "#16a34a";
      ctx.shadowBlur = isHead ? 20 : 10;
      ctx.fillStyle = isHead ? "#22c55e" : "#16a34a";
      ctx.fillRect(seg.x * size + 1, seg.y * size + 1, size - 2, size - 2);
    });
    ctx.shadowBlur = 0;

    // food
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * size + size/2,
      foodRef.current.y * size + size/2,
      size/2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 30;
      ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "24px sans-serif";
      ctx.fillText(`Score: ${score}  •  Best: ${highScore}`, canvas.width/2, canvas.height/2 + 40);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (gameOver) return;
    const key = e.key;
    if (key === "ArrowUp" && directionRef.current.y !== 1) directionRef.current = { x: 0, y: -1 };
    else if (key === "ArrowDown" && directionRef.current.y !== -1) directionRef.current = { x: 0, y: 1 };
    else if (key === "ArrowLeft" && directionRef.current.x !== 1) directionRef.current = { x: -1, y: 0 };
    else if (key === "ArrowRight" && directionRef.current.x !== -1) directionRef.current = { x: 1, y: 0 };
  }, [gameOver]);

  // Touch controls: swipe
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (e) => {
    if (gameOver) return;
    const touchEnd = e.changedTouches[0];
    const dx = touchEnd.clientX - touchStartRef.current.x;
    const dy = touchEnd.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && directionRef.current.x !== -1) directionRef.current = { x: 1, y: 0 };
      else if (dx < 0 && directionRef.current.x !== 1) directionRef.current = { x: -1, y: 0 };
    } else {
      if (dy > 0 && directionRef.current.y !== -1) directionRef.current = { x: 0, y: 1 };
      else if (dy < 0 && directionRef.current.y !== 1) directionRef.current = { x: 0, y: -1 };
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    drawGame();
  }, []);

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
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={gridSize * cellSize}
          height={gridSize * cellSize}
          className="rounded-xl shadow-2xl border border-gray-700"
          style={{
            width: "min(80vh, 80vw)",
            height: "min(80vh, 80vw)",
            touchAction: "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        <div className="absolute top-2 left-2 text-sm font-semibold text-white drop-shadow-lg">
          🐍 Score: {score}
        </div>
        <div className="absolute top-2 right-2 text-sm text-white drop-shadow-lg">
          Best: {highScore}
        </div>
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-2xl font-bold drop-shadow-lg">Press Start</div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-4 flex-wrap justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="px-6 py-2 rounded-full font-medium shadow-lg"
          style={{ backgroundColor: "#3b82f6", color: "white" }}
        >
          {gameStarted ? "Restart" : "Start"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className="px-6 py-2 rounded-full font-medium shadow-lg"
          style={{ backgroundColor: "#6b7280", color: "white" }}
        >
          {isFullscreen ? "Exit Full" : "Full Screen"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/games")}
          className="px-6 py-2 rounded-full font-medium shadow-lg bg-red-500 text-white"
        >
          ← Back
        </motion.button>
      </div>
    </div>
  );
}

export default SnakeGame;