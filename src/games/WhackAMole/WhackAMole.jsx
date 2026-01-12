import { useState, useEffect, useCallback, useRef } from 'react';
import './WhackAMole.css';

const GAME_DURATION = 60;
const GRID_SIZE = 12;

function WhackAMole() {
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeMoles, setActiveMoles] = useState([]);
  const [whackedMoles, setWhackedMoles] = useState([]);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('whackamole-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setActiveMoles([]);
    setWhackedMoles([]);
    setCombo(0);
  }, []);

  const endGame = useCallback(() => {
    setGameState('gameover');
    setActiveMoles([]);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('whackamole-highscore', score.toString());
    }
  }, [score, highScore]);

  const getGridPosition = (index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    return { row, col };
  };

  const getDistance = (index1, index2) => {
    const pos1 = getGridPosition(index1);
    const pos2 = getGridPosition(index2);
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
  };

  const whackMole = (index) => {
    if (gameState !== 'playing') return;

    if (activeMoles.includes(index)) {
      const newCombo = combo + 1;
      const points = 100;

      setScore(prev => prev + points);
      setCombo(newCombo);
      setActiveMoles(prev => prev.filter(i => i !== index));
      setWhackedMoles(prev => [...prev, index]);

      setTimeout(() => {
        setWhackedMoles(prev => prev.filter(i => i !== index));
      }, 200);
    } else {
      setCombo(0);

      // Calculate penalty based on distance to nearest mole
      if (activeMoles.length > 0) {
        const minDistance = Math.min(...activeMoles.map(moleIndex => getDistance(index, moleIndex)));
        const penalty = minDistance * 25; // 25 points per grid space away
        setScore(prev => Math.max(0, prev - penalty));
      } else {
        // No moles visible, big penalty for random clicking
        setScore(prev => Math.max(0, prev - 50));
      }
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, endGame]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnMole = () => {
      const progress = (GAME_DURATION - timeLeft) / GAME_DURATION;
      const maxMoles = Math.min(2 + Math.floor(progress * 4), 5);

      setActiveMoles(prev => {
        if (prev.length >= maxMoles) return prev;

        const available = Array.from({ length: GRID_SIZE }, (_, i) => i)
          .filter(i => !prev.includes(i));

        if (available.length === 0) return prev;

        const newMole = available[Math.floor(Math.random() * available.length)];
        return [...prev, newMole];
      });
    };

    const despawnMole = () => {
      setActiveMoles(prev => {
        if (prev.length === 0) return prev;
        setCombo(0);
        return prev.slice(1);
      });
    };

    const spawnInterval = setInterval(spawnMole, 500 + Math.random() * 300);
    const despawnInterval = setInterval(despawnMole, 1200 + Math.random() * 400);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(despawnInterval);
    };
  }, [gameState, timeLeft]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState !== 'playing') {
        e.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  return (
    <div className="whackamole-game">
      <div className="game-header">
        <div className="stat-box">
          <div className="stat-value">{score}</div>
          <div className="stat-label">Score</div>
        </div>
        <div className="stat-box timer">
          <div className="stat-value">{timeLeft}s</div>
          <div className="stat-label">Time Left</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{highScore}</div>
          <div className="stat-label">Best</div>
        </div>
      </div>

      {combo >= 2 && gameState === 'playing' && (
        <div className="combo-display">
          {combo}x Combo! +100pts
        </div>
      )}

      <div className="mole-grid">
        {Array.from({ length: GRID_SIZE }).map((_, index) => (
          <div
            key={index}
            className={`mole-hole ${activeMoles.includes(index) ? 'has-mole' : ''} ${whackedMoles.includes(index) ? 'whacked' : ''}`}
            onClick={() => whackMole(index)}
          >
            <div className="hole-back"></div>
            <div className="mole">
              <div className="mole-face">
                <div className="mole-eyes">
                  <div className="mole-eye"></div>
                  <div className="mole-eye"></div>
                </div>
                <div className="mole-nose"></div>
                <div className="mole-cheeks">
                  <div className="mole-cheek"></div>
                  <div className="mole-cheek"></div>
                </div>
              </div>
            </div>
            <div className="hole-front"></div>
          </div>
        ))}
      </div>

      <div className="controls-hint">Click or tap the moles!</div>

      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Whack-a-Mole!</h2>
          <div className="instructions">
            <p>Click the moles as they pop up!</p>
            <p>Build <strong>combos</strong> for bonus points</p>
            <p>You have <strong>60 seconds</strong></p>
          </div>
          <p className="start-hint">Press SPACE or click to start</p>
          <button className="start-button" onClick={startGame}>Start Game</button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Time's Up!</h2>
          <div className="final-stats">
            <p>Final Score: <strong>{score}</strong></p>
            {score >= highScore && score > 0 && (
              <p className="new-record">New High Score!</p>
            )}
          </div>
          <p className="start-hint">Press SPACE or click to play again</p>
          <button className="start-button" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default WhackAMole;
