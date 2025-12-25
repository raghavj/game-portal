import { Link } from 'react-router-dom';
import './GameCard.css';

function GameCard({ id, name, icon, players, color }) {
  return (
    <Link to={`/game/${id}`} className="game-card" style={{ '--card-color': color }}>
      <div className="game-icon">{icon}</div>
      <h3 className="game-name">{name}</h3>
      <span className={`player-badge ${players === 2 ? 'two-player' : ''}`}>
        {players === 2 ? '2P' : '1P'}
      </span>
    </Link>
  );
}

export default GameCard;
