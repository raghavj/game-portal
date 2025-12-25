import { useEffect, useRef, useState } from 'react';
import './Tetris.css';

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 24;

const PIECES = [
  { shape: [[1,1,1,1]], color: '#06b6d4' },
  { shape: [[1,1],[1,1]], color: '#eab308' },
  { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
  { shape: [[1,0,0],[1,1,1]], color: '#f97316' },
  { shape: [[0,0,1],[1,1,1]], color: '#3b82f6' },
  { shape: [[1,1,0],[0,1,1]], color: '#22c55e' },
  { shape: [[0,1,1],[1,1,0]], color: '#ef4444' },
];

function Tetris() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const createBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

  const gameRef = useRef({
    board: createBoard(),
    piece: null,
    piecePos: { x: 0, y: 0 },
    dropCounter: 0,
    dropInterval: 1000,
    lastTime: 0,
  });

  const randomPiece = () => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { shape: p.shape.map(row => [...row]), color: p.color };
  };

  const rotatePiece = (shape) => {
    return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
  };

  const collides = (board, piece, pos) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  const merge = (board, piece, pos) => {
    piece.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          const boardY = pos.y + y;
          if (boardY >= 0) {
            board[boardY][pos.x + x] = piece.color;
          }
        }
      });
    });
  };

  const clearLines = (board) => {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(cell => cell)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        linesCleared++;
        y++;
      }
    }
    return linesCleared;
  };

  const spawnPiece = () => {
    const piece = randomPiece();
    const pos = { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: -1 };
    if (collides(gameRef.current.board, piece, pos)) {
      setGameState('gameover');
      return false;
    }
    gameRef.current.piece = piece;
    gameRef.current.piecePos = pos;
    return true;
  };

  const resetGame = () => {
    gameRef.current.board = createBoard();
    gameRef.current.dropInterval = 1000;
    setScore(0);
    setLevel(1);
    spawnPiece();
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((gameState === 'ready' || gameState === 'gameover') && e.code === 'Space') {
        resetGame();
        return;
      }
      if (gameState !== 'playing') return;

      const game = gameRef.current;
      const { piece, piecePos, board } = game;

      switch (e.key) {
        case 'ArrowLeft': {
          const newPos = { ...piecePos, x: piecePos.x - 1 };
          if (!collides(board, piece, newPos)) game.piecePos = newPos;
          break;
        }
        case 'ArrowRight': {
          const newPos = { ...piecePos, x: piecePos.x + 1 };
          if (!collides(board, piece, newPos)) game.piecePos = newPos;
          break;
        }
        case 'ArrowDown': {
          const newPos = { ...piecePos, y: piecePos.y + 1 };
          if (!collides(board, piece, newPos)) game.piecePos = newPos;
          break;
        }
        case 'ArrowUp': {
          const rotated = { ...piece, shape: rotatePiece(piece.shape) };
          if (!collides(board, rotated, piecePos)) {
            game.piece = rotated;
          }
          break;
        }
        case ' ': {
          while (!collides(board, piece, { ...piecePos, y: piecePos.y + 1 })) {
            game.piecePos.y++;
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationId;
    const gameLoop = (time) => {
      const game = gameRef.current;
      const deltaTime = time - game.lastTime;
      game.lastTime = time;
      game.dropCounter += deltaTime;

      if (game.dropCounter > game.dropInterval) {
        game.dropCounter = 0;
        const newPos = { ...game.piecePos, y: game.piecePos.y + 1 };
        if (collides(game.board, game.piece, newPos)) {
          merge(game.board, game.piece, game.piecePos);
          const lines = clearLines(game.board);
          if (lines > 0) {
            const points = [0, 100, 300, 500, 800][lines];
            setScore(s => {
              const newScore = s + points;
              const newLevel = Math.floor(newScore / 1000) + 1;
              setLevel(newLevel);
              game.dropInterval = Math.max(100, 1000 - (newLevel - 1) * 100);
              return newScore;
            });
          }
          spawnPiece();
        } else {
          game.piecePos = newPos;
        }
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      game.board.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        });
      });

      if (game.piece) {
        game.piece.shape.forEach((row, y) => {
          row.forEach((val, x) => {
            if (val) {
              ctx.fillStyle = game.piece.color;
              ctx.fillRect(
                (game.piecePos.x + x) * CELL_SIZE + 1,
                (game.piecePos.y + y) * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
              );
            }
          });
        });
      }

      ctx.strokeStyle = '#333';
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return (
    <div className="tetris-game">
      <div className="game-info">
        <span>Score: {score}</span>
        <span>Level: {level}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
        className="tetris-canvas"
      />
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Tetris</h2>
          <p>← → to move, ↑ to rotate</p>
          <p>↓ soft drop, SPACE hard drop</p>
          <p>Press SPACE to start</p>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <p>Score: {score}</p>
          <p>Level: {level}</p>
          <p>Press SPACE to play again</p>
        </div>
      )}
    </div>
  );
}

export default Tetris;
