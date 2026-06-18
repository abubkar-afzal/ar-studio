// pages/games/golf.js
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

function GolfGame() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ballRef = useRef({ x: 100, y: 300, vx: 0, vy: 0 });
  const holeRef = useRef({ x: 700, y: 300 });
  const radius = 10;
  const holeRadius = 20;
  const canvasWidth = 800;
  const canvasHeight = 600;

  const resetGame = () => {
    ballRef.current = { x: 100, y: 300, vx: 0, vy: 0 };
    setStrokes(0);
    setGameOver(false);
    setPower(0);
    setAngle(0);
    drawGame();
  };

  const swing = () => {
    if (gameOver) return;
    const speed = power * 10;
    const rad = angle * Math.PI / 180;
    ballRef.current.vx = Math.cos(rad) * speed;
    ballRef.current.vy = Math.sin(rad) * speed;
    setStrokes(strokes + 1);
    setPower(0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOver) return;
      const b = ballRef.current;
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.995;
      b.vy *= 0.995;

      if (b.x < radius || b.x > canvasWidth - radius) { b.vx = -b.vx * 0.5; b.x = Math.max(radius, Math.min(canvasWidth - radius, b.x)); }
      if (b.y < radius || b.y > canvasHeight - radius) { b.vy = -b.vy * 0.5; b.y = Math.max(radius, Math.min(canvasHeight - radius, b.y)); }

      const dx = b.x - holeRef.current.x;
      const dy = b.y - holeRef.current.y;
      if (Math.sqrt(dx*dx + dy*dy) < holeRadius + radius && Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.2) {
        setGameOver(true);
        b.vx = 0;
        b.vy = 0;
      }
      drawGame();
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameOver]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(400, 300, 50, 400, 300, 500);
    grad.addColorStop(0, "#4ade80");
    grad.addColorStop(1, "#22c55e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 10;
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    ctx.shadowColor = "#000";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(holeRef.current.x, holeRef.current.y, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(holeRef.current.x, holeRef.current.y, holeRadius/3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (power > 0) {
      const rad = angle * Math.PI / 180;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(ballRef.current.x, ballRef.current.y);
      ctx.lineTo(ballRef.current.x + Math.cos(rad) * 150, ballRef.current.y + Math.sin(rad) * 150);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "white";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(`🏌️ ${strokes}`, 20, 50);
    if (gameOver) {
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`🎯 Hole in ${strokes}!`, canvas.width/2, 80);
    }
    ctx.shadowBlur = 0;
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
          onClick={resetGame}
          className="px-3 py-1.5 rounded-full text-sm font-medium shadow"
          style={{ backgroundColor: '#3b82f6', color: 'white' }}
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
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="rounded-xl shadow-2xl border border-gray-700 max-w-full"
        style={{ maxHeight: "70vh" }}
      />
      <div className="flex gap-4 mt-4 flex-wrap justify-center">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={power}
          onChange={(e) => setPower(parseFloat(e.target.value))}
          className="w-48"
          style={{ accentColor: "#3b82f6" }}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setAngle(angle - 5); }}
          className="px-3 py-1 rounded shadow"
          style={{ backgroundColor: '#6b7280', color: 'white' }}
        >
          ◀
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setAngle(angle + 5); }}
          className="px-3 py-1 rounded shadow"
          style={{ backgroundColor: '#6b7280', color: 'white' }}
        >
          ▶
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={swing}
          className="px-6 py-2 rounded-full font-medium shadow-lg"
          style={{ backgroundColor: '#22c55e', color: 'white' }}
        >
          🏌️ Swing
        </motion.button>
      </div>
    </div>
  );
}

export default GolfGame;