import { useEffect, useRef, useState } from 'react';
import './Breakout.css';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 54;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 4;
const BRICK_TOP = 40;

function Breakout() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const createBricks = () => {
    const bricks = [];
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6'];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + 20,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_TOP,
          color: colors[row],
          alive: true,
        });
      }
    }
    return bricks;
  };

  const gameRef = useRef({
    paddle: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 },
    ballVel: { x: 4, y: -4 },
    bricks: createBricks(),
    keys: {},
  });

  const resetBall = () => {
    gameRef.current.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 };
    gameRef.current.ballVel = { x: 4 * (Math.random() > 0.5 ? 1 : -1), y: -4 };
  };

  const resetGame = () => {
    gameRef.current.paddle = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    gameRef.current.bricks = createBricks();
    resetBall();
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((gameState === 'ready' || gameState === 'gameover' || gameState === 'won') && e.code === 'Space') {
        resetGame();
        return;
      }
      gameRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
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

      if (game.keys['ArrowLeft']) {
        game.paddle = Math.max(0, game.paddle - 8);
      }
      if (game.keys['ArrowRight']) {
        game.paddle = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, game.paddle + 8);
      }

      game.ball.x += game.ballVel.x;
      game.ball.y += game.ballVel.y;

      if (game.ball.x <= BALL_RADIUS || game.ball.x >= CANVAS_WIDTH - BALL_RADIUS) {
        game.ballVel.x *= -1;
      }
      if (game.ball.y <= BALL_RADIUS) {
        game.ballVel.y *= -1;
      }

      if (game.ball.y >= CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 10 &&
          game.ball.x >= game.paddle &&
          game.ball.x <= game.paddle + PADDLE_WIDTH) {
        const hitPos = (game.ball.x - game.paddle) / PADDLE_WIDTH - 0.5;
        game.ballVel.x = hitPos * 8;
        game.ballVel.y = -Math.abs(game.ballVel.y);
      }

      if (game.ball.y >= CANVAS_HEIGHT) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('gameover');
          } else {
            resetBall();
          }
          return newLives;
        });
      }

      game.bricks.forEach(brick => {
        if (!brick.alive) return;
        if (game.ball.x >= brick.x &&
            game.ball.x <= brick.x + BRICK_WIDTH &&
            game.ball.y >= brick.y &&
            game.ball.y <= brick.y + BRICK_HEIGHT) {
          brick.alive = false;
          game.ballVel.y *= -1;
          setScore(s => s + 10);
        }
      });

      if (game.bricks.every(b => !b.alive)) {
        setGameState('won');
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      game.bricks.forEach(brick => {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      });

      ctx.fillStyle = '#e94560';
      ctx.fillRect(game.paddle, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(game.ball.x, game.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  return (
    <div className="breakout-game">
      <div className="game-info">
        <span>Score: {score}</span>
        <span>Lives: {'❤️'.repeat(lives)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="breakout-canvas"
      />
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Breakout</h2>
          <p>Use ← → arrow keys to move</p>
          <p>Press SPACE to start</p>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <p>Score: {score}</p>
          <p>Press SPACE to play again</p>
        </div>
      )}
      {gameState === 'won' && (
        <div className="overlay won">
          <h2>You Win!</h2>
          <p>Score: {score}</p>
          <p>Press SPACE to play again</p>
        </div>
      )}
    </div>
  );
}

export default Breakout;
