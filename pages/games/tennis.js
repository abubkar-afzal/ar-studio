// pages/games/tennis.js
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

function TennisGame() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState('friend');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ballRef = useRef({ x: 400, y: 300, vx: 0, vy: 0 });
  const paddlePlayer = useRef({ x: 30, y: 250 });
  const paddleOpponent = useRef({ x: 750, y: 250 });
  const keysRef = useRef({ up: false, down: false });

  const canvasWidth = 800;
  const canvasHeight = 600;
  const paddleWidth = 10;
  const paddleHeight = 80;
  const ballSize = 10;
  const speed = 5;

  const resetBall = () => {
    ballRef.current = {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * speed,
      vy: (Math.random() - 0.5) * speed * 0.8,
    };
  };

  const resetGame = () => {
    setScore({ player: 0, opponent: 0 });
    setGameOver(false);
    paddlePlayer.current = { x: 30, y: 250 };
    paddleOpponent.current = { x: 750, y: 250 };
    resetBall();
  };

  useEffect(() => {
    resetBall();
    const interval = setInterval(() => {
      if (gameOver) return;

      if (keysRef.current.up) paddlePlayer.current.y = Math.max(0, paddlePlayer.current.y - speed * 1.5);
      if (keysRef.current.down) paddlePlayer.current.y = Math.min(canvasHeight - paddleHeight, paddlePlayer.current.y + speed * 1.5);

      if (mode === 'ai') {
        const diff = ballRef.current.y - (paddleOpponent.current.y + paddleHeight/2);
        const aiSpeed = speed * 0.8;
        if (Math.abs(diff) > 20) {
          paddleOpponent.current.y += Math.sign(diff) * Math.min(Math.abs(diff) * 0.1, aiSpeed);
        }
        paddleOpponent.current.y = Math.max(0, Math.min(canvasHeight - paddleHeight, paddleOpponent.current.y));
      }

      const b = ballRef.current;
      b.x += b.vx;
      b.y += b.vy;

      if (b.y < 0 || b.y > canvasHeight - ballSize) {
        b.vy = -b.vy;
        b.y = Math.max(0, Math.min(canvasHeight - ballSize, b.y));
      }

      const p = paddlePlayer.current;
      if (b.vx < 0 && b.x < p.x + paddleWidth && b.x > p.x &&
          b.y + ballSize > p.y && b.y < p.y + paddleHeight) {
        b.vx = -b.vx * 1.05;
        b.x = p.x + paddleWidth;
        b.vy += (b.y - (p.y + paddleHeight/2)) * 0.1;
      }

      const o = paddleOpponent.current;
      if (b.vx > 0 && b.x + ballSize > o.x && b.x < o.x + paddleWidth &&
          b.y + ballSize > o.y && b.y < o.y + paddleHeight) {
        b.vx = -b.vx * 1.05;
        b.x = o.x - ballSize;
        b.vy += (b.y - (o.y + paddleHeight/2)) * 0.1;
      }

      if (b.x < -ballSize) {
        setScore(s => ({ ...s, opponent: s.opponent + 1 }));
        resetBall();
      } else if (b.x > canvasWidth + ballSize) {
        setScore(s => ({ ...s, player: s.player + 1 }));
        resetBall();
      }

      drawGame();
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameOver, mode]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#1a1a2e");
    grad.addColorStop(1, "#16213e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowColor = "#3b82f6";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(paddlePlayer.current.x, paddlePlayer.current.y, paddleWidth, paddleHeight);
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(paddleOpponent.current.x, paddleOpponent.current.y, paddleWidth, paddleHeight);
    ctx.shadowBlur = 0;

    ctx.shadowColor = "white";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballRef.current.x + ballSize/2, ballRef.current.y + ballSize/2, ballSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "white";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255,255,255,0.3)";
    ctx.shadowBlur = 10;
    ctx.fillText(`${score.player}  -  ${score.opponent}`, canvas.width/2, 50);
    ctx.shadowBlur = 0;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") keysRef.current.up = true;
      if (e.key === "ArrowDown") keysRef.current.down = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp") keysRef.current.up = false;
      if (e.key === "ArrowDown") keysRef.current.down = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Touch controls: drag to move paddle
  const handleTouchMove = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const y = (touch.clientY - rect.top) / rect.height * canvasHeight;
    paddlePlayer.current.y = Math.max(0, Math.min(canvasHeight - paddleHeight, y - paddleHeight/2));
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
      <div className="text-center mb-2 text-white">⬆️⬇️ / Touch drag</div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="rounded-xl shadow-2xl border border-gray-700 max-w-full"
        style={{ maxHeight: "70vh", touchAction: "none" }}
        onTouchMove={handleTouchMove}
      />
    </div>
  );
}

export default TennisGame;