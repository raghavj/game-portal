import { useEffect, useRef, useState } from 'react';
import './Pong.css';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;

function Pong() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  const gameRef = useRef({
    paddle1: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    paddle2: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    ballVel: { x: INITIAL_BALL_SPEED, y: INITIAL_BALL_SPEED * 0.5 },
    keys: {},
  });

  const resetBall = (direction = 1) => {
    gameRef.current.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    const angle = (Math.random() - 0.5) * Math.PI / 2;
    gameRef.current.ballVel = {
      x: INITIAL_BALL_SPEED * direction * Math.cos(angle),
      y: INITIAL_BALL_SPEED * Math.sin(angle),
    };
  };

  const resetGame = () => {
    gameRef.current.paddle1 = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    gameRef.current.paddle2 = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(1);
    setScores({ p1: 0, p2: 0 });
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'ready' && e.code === 'Space') {
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

      if (game.keys['w'] || game.keys['W']) {
        game.paddle1 = Math.max(0, game.paddle1 - PADDLE_SPEED);
      }
      if (game.keys['s'] || game.keys['S']) {
        game.paddle1 = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, game.paddle1 + PADDLE_SPEED);
      }
      if (game.keys['ArrowUp']) {
        game.paddle2 = Math.max(0, game.paddle2 - PADDLE_SPEED);
      }
      if (game.keys['ArrowDown']) {
        game.paddle2 = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, game.paddle2 + PADDLE_SPEED);
      }

      game.ball.x += game.ballVel.x;
      game.ball.y += game.ballVel.y;

      if (game.ball.y <= 0 || game.ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
        game.ballVel.y *= -1;
      }

      if (game.ball.x <= PADDLE_WIDTH + 20 &&
          game.ball.y + BALL_SIZE >= game.paddle1 &&
          game.ball.y <= game.paddle1 + PADDLE_HEIGHT) {
        const hitPos = (game.ball.y - game.paddle1) / PADDLE_HEIGHT - 0.5;
        game.ballVel.x = Math.abs(game.ballVel.x) * 1.05;
        game.ballVel.y = hitPos * INITIAL_BALL_SPEED * 2;
      }

      if (game.ball.x >= CANVAS_WIDTH - PADDLE_WIDTH - 20 - BALL_SIZE &&
          game.ball.y + BALL_SIZE >= game.paddle2 &&
          game.ball.y <= game.paddle2 + PADDLE_HEIGHT) {
        const hitPos = (game.ball.y - game.paddle2) / PADDLE_HEIGHT - 0.5;
        game.ballVel.x = -Math.abs(game.ballVel.x) * 1.05;
        game.ballVel.y = hitPos * INITIAL_BALL_SPEED * 2;
      }

      if (game.ball.x <= 0) {
        setScores(s => ({ ...s, p2: s.p2 + 1 }));
        resetBall(1);
      }
      if (game.ball.x >= CANVAS_WIDTH) {
        setScores(s => ({ ...s, p1: s.p1 + 1 }));
        resetBall(-1);
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(20, game.paddle1, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(CANVAS_WIDTH - 20 - PADDLE_WIDTH, game.paddle2, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.fillStyle = '#fff';
      ctx.fillRect(game.ball.x, game.ball.y, BALL_SIZE, BALL_SIZE);

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  return (
    <div className="pong-game">
      <div className="pong-scores">
        <span className="p1-score">P1: {scores.p1}</span>
        <span className="p2-score">P2: {scores.p2}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="pong-canvas"
      />
      <div className="controls-hint">
        <span>Player 1: W/S</span>
        <span>Player 2: ↑/↓</span>
      </div>
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Pong</h2>
          <p>Player 1: W / S keys</p>
          <p>Player 2: Arrow Up / Down</p>
          <p>Press SPACE to start</p>
        </div>
      )}
    </div>
  );
}

export default Pong;
