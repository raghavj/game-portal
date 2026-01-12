import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        navigate('/games');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="landing">
      <div className="landing-content">
        <div className="landing-logo">
          <span className="logo-icon">🎮</span>
        </div>
        <h1 className="landing-title">GameZone</h1>
        <p className="landing-subtitle">Your ultimate arcade experience</p>
        <div className="landing-features">
          <div className="feature">
            <span>🕹️</span>
            <span>16+ Games</span>
          </div>
          <div className="feature">
            <span>🏆</span>
            <span>High Scores</span>
          </div>
          <div className="feature">
            <span>👥</span>
            <span>Multiplayer</span>
          </div>
        </div>
        <button className="enter-btn" onClick={() => navigate('/games')}>
          Enter Arcade
        </button>
        <p className="landing-hint">Press Enter or click to continue</p>
      </div>
      <div className="landing-bg">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="floating-icon" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}>
            {['🎮', '🕹️', '👾', '🎯', '🏆', '⭐'][i % 6]}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Landing;
