import { useState, useEffect, useCallback } from 'react';
import './Game2048.css';

const SIZE = 4;

function Game2048() {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('2048-bestscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  function createEmptyGrid() {
    return Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  }

  function addRandomTile(grid) {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return grid;

    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }

  function initGame() {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }

  useEffect(() => {
    initGame();
  }, []);

  function slideRow(row) {
    let arr = row.filter(x => x !== 0);
    let points = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        points += arr[i];
        if (arr[i] === 2048) setWon(true);
        arr.splice(i + 1, 1);
      }
    }

    while (arr.length < SIZE) arr.push(0);
    return { row: arr, points };
  }

  function move(direction) {
    if (gameOver) return;

    let newGrid = grid.map(row => [...row]);
    let totalPoints = 0;
    let moved = false;

    const rotateGrid = (g, times) => {
      let result = g;
      for (let t = 0; t < times; t++) {
        result = result[0].map((_, i) => result.map(row => row[i]).reverse());
      }
      return result;
    };

    let rotations = { left: 0, up: 1, right: 2, down: 3 };
    let rot = rotations[direction];

    newGrid = rotateGrid(newGrid, rot);

    for (let r = 0; r < SIZE; r++) {
      const original = [...newGrid[r]];
      const { row, points } = slideRow(newGrid[r]);
      newGrid[r] = row;
      totalPoints += points;
      if (original.join(',') !== row.join(',')) moved = true;
    }

    newGrid = rotateGrid(newGrid, (4 - rot) % 4);

    if (moved) {
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(prev => {
        const newScore = prev + totalPoints;
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('2048-bestscore', newScore.toString());
        }
        return newScore;
      });

      if (!canMove(newGrid)) {
        setGameOver(true);
      }
    }
  }

  function canMove(g) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
        if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  }

  const handleKeyDown = useCallback((e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      move(dirs[e.key]);
    }
  }, [grid, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getTileColor = (value) => {
    const colors = {
      0: '#3c3a32',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
    };
    return colors[value] || '#3c3a32';
  };

  const getTextColor = (value) => {
    return value <= 4 ? '#776e65' : '#f9f6f2';
  };

  return (
    <div className="game-2048">
      <div className="game-header">
        <div className="score-box">
          <div className="score-label">Score</div>
          <div className="score-value">{score}</div>
        </div>
        <div className="score-box">
          <div className="score-label">Best</div>
          <div className="score-value">{bestScore}</div>
        </div>
        <button className="new-game-btn" onClick={initGame}>New Game</button>
      </div>

      <div className="grid-2048">
        {grid.map((row, r) =>
          row.map((value, c) => (
            <div
              key={`${r}-${c}`}
              className={`tile ${value > 0 ? 'has-value' : ''}`}
              style={{
                backgroundColor: getTileColor(value),
                color: getTextColor(value),
              }}
            >
              {value > 0 ? value : ''}
            </div>
          ))
        )}
      </div>

      <div className="controls-hint">Use arrow keys to move tiles</div>

      {(gameOver || won) && (
        <div className="overlay">
          <h2>{won ? 'You Win!' : 'Game Over!'}</h2>
          <p className="final-score">Score: <strong>{score}</strong></p>
          <button className="start-button" onClick={initGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default Game2048;
