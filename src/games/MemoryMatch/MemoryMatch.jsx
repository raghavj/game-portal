import { useState, useEffect } from 'react';
import './MemoryMatch.css';

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠'];

function MemoryMatch() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('memory-bestscore');
    return saved ? parseInt(saved, 10) : 999;
  });

  const initGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameComplete(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setGameComplete(true);
      if (moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem('memory-bestscore', moves.toString());
      }
    }
  }, [matched, cards.length, moves, bestScore]);

  const handleCardClick = (id) => {
    if (flipped.length === 2) return;
    if (flipped.includes(id)) return;
    if (matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;

      if (cards[first].emoji === cards[second].emoji) {
        setMatched(prev => [...prev, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const isFlipped = (id) => flipped.includes(id) || matched.includes(id);

  return (
    <div className="memory-game">
      <div className="memory-header">
        <div className="stat-box">
          <div className="stat-value">{moves}</div>
          <div className="stat-label">Moves</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{matched.length / 2}/{EMOJIS.length}</div>
          <div className="stat-label">Pairs</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{bestScore === 999 ? '-' : bestScore}</div>
          <div className="stat-label">Best</div>
        </div>
      </div>

      <div className="memory-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`memory-card ${isFlipped(card.id) ? 'flipped' : ''} ${matched.includes(card.id) ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="reset-btn" onClick={initGame}>New Game</button>

      {gameComplete && (
        <div className="overlay">
          <h2>You Win!</h2>
          <div className="final-stats">
            <p>Completed in <strong>{moves}</strong> moves</p>
            {moves <= bestScore && (
              <p className="new-record">New Best Score!</p>
            )}
          </div>
          <button className="start-button" onClick={initGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default MemoryMatch;
