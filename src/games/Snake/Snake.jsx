import { useEffect, useRef, useState } from 'react';
import './Snake.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

function Snake() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const gameRef = useRef({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 15, y: 10 },
    speed: INITIAL_SPEED,
  });

  const generateFood = (snake) => {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
    return food;
  };

  const resetGame = () => {
    gameRef.current = {
      snake: [{ x: 10, y: 10 }],
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      food: { x: 15, y: 10 },
      speed: INITIAL_SPEED,
    };
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'ready' || gameState === 'gameover') {
        if (e.code === 'Space') {
          resetGame();
          return;
        }
      }

      if (gameState !== 'playing') return;

      const { direction } = gameRef.current;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) gameRef.current.nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (direction.y !== -1) gameRef.current.nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) gameRef.current.nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x !== -1) gameRef.current.nextDirection = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      game.direction = game.nextDirection;

      const head = {
        x: game.snake[0].x + game.direction.x,
        y: game.snake[0].y + game.direction.y,
      };

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameover');
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      if (game.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameState('gameover');
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      game.snake.unshift(head);

      if (head.x === game.food.x && head.y === game.food.y) {
        setScore(s => s + 10);
        game.food = generateFood(game.snake);
        game.speed = Math.max(50, game.speed - 2);
      } else {
        game.snake.pop();
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#4ade80';
      game.snake.forEach((seg, i) => {
        const brightness = 1 - (i / game.snake.length) * 0.5;
        ctx.fillStyle = `rgba(74, 222, 128, ${brightness})`;
        ctx.fillRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      });

      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(
        game.food.x * CELL_SIZE + CELL_SIZE / 2,
        game.food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }, gameRef.current.speed);

    return () => clearInterval(gameLoop);
  }, [gameState, score]);

  return (
    <div className="snake-game">
      <div className="game-info">
        <span>Score: {score}</span>
        <span>High Score: {highScore}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="snake-canvas"
      />
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Snake</h2>
          <p>Use arrow keys to move</p>
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
    </div>
  );
}

export default Snake;
