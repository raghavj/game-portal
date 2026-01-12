import { useState, useEffect, useRef, useCallback } from 'react';
import './DinoRun.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 230;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;

function DinoRun() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('dino-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameRef = useRef({
    dino: { x: 80, y: GROUND_Y, vy: 0, width: 40, height: 50, jumping: false },
    obstacles: [],
    speed: 6,
    frameCount: 0,
    score: 0,
  });

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (!game.dino.jumping) {
      game.dino.vy = JUMP_FORCE;
      game.dino.jumping = true;
    }
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = {
      dino: { x: 80, y: GROUND_Y, vy: 0, width: 40, height: 50, jumping: false },
      obstacles: [],
      speed: 6,
      frameCount: 0,
      score: 0,
    };
    setScore(0);
    setGameState('playing');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') {
          jump();
        } else {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, startGame]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      game.frameCount++;

      // Update dino
      game.dino.vy += GRAVITY;
      game.dino.y += game.dino.vy;

      if (game.dino.y >= GROUND_Y) {
        game.dino.y = GROUND_Y;
        game.dino.vy = 0;
        game.dino.jumping = false;
      }

      // Spawn obstacles
      if (game.frameCount % Math.max(60, 100 - Math.floor(game.score / 10)) === 0) {
        const height = 30 + Math.random() * 30;
        game.obstacles.push({
          x: CANVAS_WIDTH,
          y: GROUND_Y + 50 - height,
          width: 20 + Math.random() * 15,
          height: height,
        });
      }

      // Update obstacles
      game.obstacles = game.obstacles.filter(obs => {
        obs.x -= game.speed;
        return obs.x > -50;
      });

      // Increase speed over time
      game.speed = 6 + Math.floor(game.score / 50) * 0.5;

      // Score
      game.score += 0.1;
      setScore(Math.floor(game.score));

      // Collision detection
      const dino = game.dino;
      for (const obs of game.obstacles) {
        if (
          dino.x < obs.x + obs.width &&
          dino.x + dino.width > obs.x &&
          dino.y < obs.y + obs.height &&
          dino.y + dino.height > obs.y
        ) {
          setGameState('gameover');
          const finalScore = Math.floor(game.score);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('dino-highscore', finalScore.toString());
          }
          return;
        }
      }

      // Draw
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, GROUND_Y + 50, CANVAS_WIDTH, 2);

      // Ground details
      ctx.fillStyle = '#475569';
      for (let i = 0; i < 20; i++) {
        const x = ((i * 50 - game.frameCount * 2) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
        ctx.fillRect(x, GROUND_Y + 55, 20, 2);
      }

      // Dino
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

      // Dino eye
      ctx.fillStyle = '#fff';
      ctx.fillRect(dino.x + 25, dino.y + 10, 8, 8);
      ctx.fillStyle = '#000';
      ctx.fillRect(dino.x + 28, dino.y + 12, 4, 4);

      // Dino legs
      if (!dino.jumping) {
        const legOffset = Math.floor(game.frameCount / 5) % 2 === 0 ? 0 : 5;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(dino.x + 8, dino.y + 45 + legOffset, 8, 10);
        ctx.fillRect(dino.x + 24, dino.y + 45 + (5 - legOffset), 8, 10);
      }

      // Obstacles (cacti)
      ctx.fillStyle = '#22c55e';
      game.obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Cactus arms
        ctx.fillRect(obs.x - 5, obs.y + 10, 8, 15);
        ctx.fillRect(obs.x + obs.width - 3, obs.y + 20, 8, 12);
      });

      // Score display
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`Score: ${Math.floor(game.score)}`, CANVAS_WIDTH - 150, 30);

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, highScore]);

  return (
    <div className="dino-game">
      <div className="dino-header">
        <div className="stat-box">
          <div className="stat-value">{score}</div>
          <div className="stat-label">Score</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{highScore}</div>
          <div className="stat-label">Best</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="dino-canvas"
        onClick={() => gameState === 'playing' ? jump() : startGame()}
      />

      <div className="controls-hint">Press SPACE or click to jump</div>

      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Dino Run</h2>
          <div className="dino-icon">🦖</div>
          <div className="instructions">
            <p>Press <strong>SPACE</strong> or click to jump</p>
            <p>Avoid the cacti!</p>
          </div>
          <button className="start-button" onClick={startGame}>Start Game</button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <div className="final-stats">
            <p>Score: <strong>{score}</strong></p>
            {score >= highScore && score > 0 && (
              <p className="new-record">New High Score!</p>
            )}
          </div>
          <button className="start-button" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default DinoRun;
