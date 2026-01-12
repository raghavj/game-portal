import { useRef, useState, useEffect } from 'react';
import './SlopeIO.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 18;
const TRACK_WIDTH = 300;
const INITIAL_SPEED = 4;
const MAX_SPEED = 12;
const BALL_MOVE_SPEED = 6;

function SlopeIO() {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    ball: { x: 0, targetX: 0 },
    obstacles: [],
    speed: INITIAL_SPEED,
    distance: 0,
    frameCount: 0,
    keys: { left: false, right: false },
  });

  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('slope-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const resetGame = () => {
    const game = gameRef.current;
    game.ball = { x: 0, targetX: 0 };
    game.obstacles = [];
    game.speed = INITIAL_SPEED;
    game.distance = 0;
    game.frameCount = 0;
    game.keys = { left: false, right: false };
  };

  const startGame = () => {
    resetGame();
    setScore(0);
    setGameState('playing');
  };

  const endGame = (finalScore) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('slope-highscore', finalScore.toString());
    }
    setGameState('gameover');
  };

  const spawnObstacle = () => {
    const game = gameRef.current;
    const trackHalf = TRACK_WIDTH / 2;
    const laneWidth = TRACK_WIDTH / 3;

    const type = Math.random() < 0.3 ? 'moving' : 'static';
    const lane = Math.floor(Math.random() * 3) - 1;
    const x = lane * laneWidth;

    game.obstacles.push({
      x: x,
      z: 1000,
      width: 40,
      height: 50,
      type: type,
      direction: Math.random() < 0.5 ? 1 : -1,
      moveSpeed: 1 + Math.random() * 2,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      const game = gameRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        game.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        game.keys.right = true;
      }
    };

    const handleKeyUp = (e) => {
      const game = gameRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        game.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        game.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      game.frameCount++;

      // Update ball position
      if (game.keys.left) {
        game.ball.targetX -= BALL_MOVE_SPEED;
      }
      if (game.keys.right) {
        game.ball.targetX += BALL_MOVE_SPEED;
      }

      // Clamp ball to track
      const trackHalf = TRACK_WIDTH / 2 - BALL_RADIUS - 10;
      game.ball.targetX = Math.max(-trackHalf, Math.min(trackHalf, game.ball.targetX));

      // Smooth ball movement
      game.ball.x += (game.ball.targetX - game.ball.x) * 0.2;

      // Update distance and speed
      game.distance += game.speed;
      game.speed = Math.min(MAX_SPEED, INITIAL_SPEED + game.distance / 2000);

      // Spawn obstacles
      if (game.frameCount % Math.max(40, 80 - Math.floor(game.distance / 500)) === 0) {
        spawnObstacle();
      }

      // Update obstacles
      game.obstacles.forEach((obs) => {
        obs.z -= game.speed * 8;

        if (obs.type === 'moving') {
          obs.x += obs.direction * obs.moveSpeed;
          const trackLimit = TRACK_WIDTH / 2 - obs.width / 2;
          if (Math.abs(obs.x) > trackLimit) {
            obs.direction *= -1;
            obs.x = Math.max(-trackLimit, Math.min(trackLimit, obs.x));
          }
        }
      });

      // Remove off-screen obstacles
      game.obstacles = game.obstacles.filter((obs) => obs.z > -100);

      // Collision detection
      const ballY = CANVAS_HEIGHT - 80;
      const ballScreenX = CANVAS_WIDTH / 2 + game.ball.x;

      for (const obs of game.obstacles) {
        if (obs.z > 0 && obs.z < 150) {
          const scale = getScale(obs.z);
          const obsScreenX = CANVAS_WIDTH / 2 + obs.x * scale;
          const obsScreenY = getScreenY(obs.z);
          const obsWidth = obs.width * scale;
          const obsHeight = obs.height * scale;

          const dx = Math.abs(ballScreenX - obsScreenX);
          const dy = Math.abs(ballY - (obsScreenY - obsHeight / 2));

          if (dx < (BALL_RADIUS + obsWidth / 2) * 0.8 && dy < (BALL_RADIUS + obsHeight / 2) * 0.7) {
            const finalScore = Math.floor(game.distance / 10);
            setScore(finalScore);
            endGame(finalScore);
            return;
          }
        }
      }

      // Update score
      const currentScore = Math.floor(game.distance / 10);
      setScore(currentScore);

      // Render
      render(ctx, game);
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  const getScale = (z) => {
    return Math.max(0.1, 1 - z / 1200);
  };

  const getScreenY = (z) => {
    const horizon = 120;
    const ground = CANVAS_HEIGHT - 60;
    return horizon + (ground - horizon) * getScale(z);
  };

  const render = (ctx, game) => {
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.3, '#1e293b');
    bgGradient.addColorStop(1, '#334155');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + game.frameCount * 0.1) % CANVAS_WIDTH;
      const y = (i * 73) % 150;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw track
    const horizon = 120;
    const trackBottom = CANVAS_HEIGHT - 20;
    const vanishX = CANVAS_WIDTH / 2;

    // Track surface
    ctx.beginPath();
    ctx.moveTo(vanishX - 20, horizon);
    ctx.lineTo(vanishX - TRACK_WIDTH / 2 - 40, trackBottom);
    ctx.lineTo(vanishX + TRACK_WIDTH / 2 + 40, trackBottom);
    ctx.lineTo(vanishX + 20, horizon);
    ctx.closePath();

    const trackGradient = ctx.createLinearGradient(0, horizon, 0, trackBottom);
    trackGradient.addColorStop(0, '#1e3a5f');
    trackGradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = trackGradient;
    ctx.fill();

    // Track grid lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i < 15; i++) {
      const z = (i * 80 + game.frameCount * game.speed * 2) % 1000;
      const scale = getScale(z);
      const y = getScreenY(z);
      const halfWidth = (TRACK_WIDTH / 2 + 20) * scale;

      ctx.beginPath();
      ctx.moveTo(vanishX - halfWidth, y);
      ctx.lineTo(vanishX + halfWidth, y);
      ctx.stroke();
    }

    // Lane dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    for (let lane = -1; lane <= 1; lane++) {
      if (lane === 0) continue;
      ctx.beginPath();
      ctx.moveTo(vanishX + lane * 5, horizon);
      ctx.lineTo(vanishX + lane * (TRACK_WIDTH / 3), trackBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Track edges
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vanishX - 20, horizon);
    ctx.lineTo(vanishX - TRACK_WIDTH / 2 - 40, trackBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vanishX + 20, horizon);
    ctx.lineTo(vanishX + TRACK_WIDTH / 2 + 40, trackBottom);
    ctx.stroke();

    // Draw obstacles (sorted by z, furthest first)
    const sortedObstacles = [...game.obstacles].sort((a, b) => b.z - a.z);

    for (const obs of sortedObstacles) {
      if (obs.z < 0 || obs.z > 1000) continue;

      const scale = getScale(obs.z);
      const screenX = vanishX + obs.x * scale;
      const screenY = getScreenY(obs.z);
      const width = obs.width * scale;
      const height = obs.height * scale;

      // Cube shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(screenX - width / 2 + 3, screenY - height + 3, width, height);

      // Cube body
      const cubeGradient = ctx.createLinearGradient(
        screenX - width / 2, screenY - height,
        screenX + width / 2, screenY
      );
      if (obs.type === 'moving') {
        cubeGradient.addColorStop(0, '#f97316');
        cubeGradient.addColorStop(1, '#ea580c');
      } else {
        cubeGradient.addColorStop(0, '#ef4444');
        cubeGradient.addColorStop(1, '#dc2626');
      }
      ctx.fillStyle = cubeGradient;
      ctx.fillRect(screenX - width / 2, screenY - height, width, height);

      // Cube highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(screenX - width / 2, screenY - height, width * 0.3, height);

      // Cube outline
      ctx.strokeStyle = obs.type === 'moving' ? '#fdba74' : '#fca5a5';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(screenX - width / 2, screenY - height, width, height);
    }

    // Draw ball
    const ballX = vanishX + game.ball.x;
    const ballY = CANVAS_HEIGHT - 80;

    // Ball shadow
    ctx.beginPath();
    ctx.ellipse(ballX + 3, ballY + BALL_RADIUS - 5, BALL_RADIUS * 0.8, BALL_RADIUS * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Ball body
    const ballGradient = ctx.createRadialGradient(
      ballX - BALL_RADIUS * 0.3, ballY - BALL_RADIUS * 0.3, 0,
      ballX, ballY, BALL_RADIUS
    );
    ballGradient.addColorStop(0, '#93c5fd');
    ballGradient.addColorStop(0.5, '#3b82f6');
    ballGradient.addColorStop(1, '#1d4ed8');

    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.fill();

    // Ball shine
    ctx.beginPath();
    ctx.arc(ballX - BALL_RADIUS * 0.3, ballY - BALL_RADIUS * 0.3, BALL_RADIUS * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    // Ball outline
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Score display on canvas
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`Score: ${Math.floor(game.distance / 10)}`, 20, 40);

    // Speed indicator
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(`Speed: ${game.speed.toFixed(1)}`, 20, 65);
  };

  return (
    <div className="slope-io">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="slope-canvas"
        onClick={() => gameState === 'ready' && startGame()}
      />
      <div className="slope-score">Score: {score}</div>

      {gameState === 'ready' && (
        <div className="slope-overlay">
          <h2>Downhill</h2>
          <p>Roll down the slope and avoid obstacles!</p>
          <p className="controls">Use LEFT/RIGHT arrows or A/D to move</p>
          <p className="high-score">High Score: {highScore}</p>
          <button className="slope-start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="slope-overlay">
          <h2>Game Over!</h2>
          <p className="final-score">Score: {score}</p>
          <p className="high-score">High Score: {highScore}</p>
          <button className="slope-start-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default SlopeIO;
