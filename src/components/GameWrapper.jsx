import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './GameWrapper.css';

function GameWrapper({ children, gameName }) {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Games
        </button>
        <h2 className="game-title">{gameName}</h2>
        <span className="pause-hint">Press ESC to pause</span>
      </div>
      <div className="game-container">
        {isPaused && (
          <div className="pause-overlay">
            <div className="pause-modal">
              <h2>PAUSED</h2>
              <button onClick={() => setIsPaused(false)} className="resume-button">
                Resume
              </button>
              <button onClick={() => navigate('/')} className="quit-button">
                Quit to Menu
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default GameWrapper;
