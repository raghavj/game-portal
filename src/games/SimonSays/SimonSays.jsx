import { useState, useEffect, useCallback, useRef } from 'react';
import './SimonSays.css';

const COLORS = ['green', 'red', 'yellow', 'blue'];
const SOUND_FREQS = { green: 392, red: 329.63, yellow: 261.63, blue: 220 };

function SimonSays() {
  const [gameState, setGameState] = useState('ready');
  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeColor, setActiveColor] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('simon-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isShowingSequence, setIsShowingSequence] = useState(false);

  const audioContextRef = useRef(null);

  const playSound = useCallback((color, duration = 300) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = SOUND_FREQS[color];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const flashColor = useCallback((color, duration = 300) => {
    setActiveColor(color);
    playSound(color, duration);
    return new Promise(resolve => {
      setTimeout(() => {
        setActiveColor(null);
        setTimeout(resolve, 100);
      }, duration);
    });
  }, [playSound]);

  const showSequence = useCallback(async (seq) => {
    setIsShowingSequence(true);
    await new Promise(r => setTimeout(r, 500));

    for (const color of seq) {
      await flashColor(color, 400);
    }

    setIsShowingSequence(false);
    setPlayerIndex(0);
  }, [flashColor]);

  const addToSequence = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    showSequence(newSequence);
  }, [sequence, showSequence]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setPlayerIndex(0);
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSequence([firstColor]);
    setTimeout(() => showSequence([firstColor]), 500);
  }, [showSequence]);

  const handleColorClick = useCallback((color) => {
    if (gameState !== 'playing' || isShowingSequence) return;

    flashColor(color, 200);

    if (color === sequence[playerIndex]) {
      const nextIndex = playerIndex + 1;

      if (nextIndex === sequence.length) {
        setScore(prev => prev + 1);
        setTimeout(addToSequence, 1000);
      } else {
        setPlayerIndex(nextIndex);
      }
    } else {
      setGameState('gameover');
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('simon-highscore', score.toString());
      }
    }
  }, [gameState, isShowingSequence, sequence, playerIndex, score, highScore, flashColor, addToSequence]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && (gameState === 'ready' || gameState === 'gameover')) {
        e.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  return (
    <div className="simon-game">
      <div className="simon-stats">
        <div className="stat-box">
          <div className="stat-value">{score}</div>
          <div className="stat-label">Round</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{highScore}</div>
          <div className="stat-label">Best</div>
        </div>
      </div>

      <div className="simon-board">
        {COLORS.map(color => (
          <button
            key={color}
            className={`simon-btn ${color} ${activeColor === color ? 'active' : ''}`}
            onClick={() => handleColorClick(color)}
            disabled={isShowingSequence || gameState !== 'playing'}
          />
        ))}
        <div className="simon-center">
          <div className="simon-label">SIMON</div>
        </div>
      </div>

      <div className="simon-hint">
        {isShowingSequence ? 'Watch the pattern...' : gameState === 'playing' ? 'Your turn!' : ''}
      </div>

      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Simon Says</h2>
          <div className="instructions">
            <p>Watch the pattern of colors</p>
            <p>Repeat the sequence by clicking</p>
            <p>Each round adds one more color!</p>
          </div>
          <p className="start-hint">Press SPACE or click to start</p>
          <button className="start-button" onClick={startGame}>Start Game</button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <div className="final-stats">
            <p>You reached round <strong>{score}</strong></p>
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

export default SimonSays;
