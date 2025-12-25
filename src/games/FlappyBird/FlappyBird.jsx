import { useEffect, useRef, useState } from 'react';
import './FlappyBird.css';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_SPEED = 3;

function FlappyBird() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const gameRef = useRef({
    bird: { x: 80, y: CANVAS_HEIGHT / 2, vel: 0 },
    pipes: [],
    frame: 0,
  });

  const resetGame = () => {
    gameRef.current = {
      bird: { x: 80, y: CANVAS_HEIGHT / 2, vel: 0 },
      pipes: [],
      frame: 0,
    };
    setScore(0);
    setGameState('playing');
  };

  const jump = () => {
    if (gameState === 'ready' || gameState === 'gameover') {
      resetGame();
      return;
    }
    if (gameState === 'playing') {
      gameRef.current.bird.vel = JUMP_FORCE;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => jump();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      game.frame++;

      game.bird.vel += GRAVITY;
      game.bird.y += game.bird.vel;

      if (game.frame % 100 === 0) {
        const gapY = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
        game.pipes.push({
          x: CANVAS_WIDTH,
          gapY: gapY,
          passed: false,
        });
      }

      game.pipes = game.pipes.filter(pipe => {
        pipe.x -= PIPE_SPEED;
        return pipe.x > -PIPE_WIDTH;
      });

      game.pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < game.bird.x) {
          pipe.passed = true;
          setScore(s => s + 1);
        }

        if (game.bird.x + BIRD_SIZE > pipe.x && game.bird.x < pipe.x + PIPE_WIDTH) {
          if (game.bird.y < pipe.gapY || game.bird.y + BIRD_SIZE > pipe.gapY + PIPE_GAP) {
            setGameState('gameover');
            setHighScore(prev => Math.max(prev, score));
          }
        }
      });

      if (game.bird.y < 0 || game.bird.y + BIRD_SIZE > CANVAS_HEIGHT) {
        setGameState('gameover');
        setHighScore(prev => Math.max(prev, score));
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F7FA');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#4ade80';
      game.pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(pipe.x - 3, pipe.gapY - 20, PIPE_WIDTH + 6, 20);
        ctx.fillRect(pipe.x - 3, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 6, 20);
        ctx.fillStyle = '#4ade80';
      });

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(game.bird.x + BIRD_SIZE / 2, game.bird.y + BIRD_SIZE / 2, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(game.bird.x + BIRD_SIZE - 5, game.bird.y + BIRD_SIZE / 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(game.bird.x + BIRD_SIZE - 3, game.bird.y + BIRD_SIZE / 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(game.bird.x + BIRD_SIZE, game.bird.y + BIRD_SIZE / 2);
      ctx.lineTo(game.bird.x + BIRD_SIZE + 8, game.bird.y + BIRD_SIZE / 2);
      ctx.lineTo(game.bird.x + BIRD_SIZE, game.bird.y + BIRD_SIZE / 2 + 4);
      ctx.closePath();
      ctx.fill();

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, score]);

  return (
    <div className="flappy-game">
      <div className="game-info">
        <span>Score: {score}</span>
        <span>Best: {highScore}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="flappy-canvas"
      />
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Flappy Bird</h2>
          <p>Press SPACE or Click to flap</p>
          <p>Avoid the pipes!</p>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <p>Score: {score}</p>
          <p>Press SPACE or Click to play again</p>
        </div>
      )}
    </div>
  );
}

export default FlappyBird;
