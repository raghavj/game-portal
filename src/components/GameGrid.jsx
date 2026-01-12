import GameCard from './GameCard';
import './GameGrid.css';

const games = [
  { id: 'snake', name: 'Snake', icon: '🐍', players: 1, color: '#4ade80' },
  { id: 'pong', name: 'Pong', icon: '🏓', players: 2, color: '#f59e0b' },
  { id: 'breakout', name: 'Breakout', icon: '🧱', players: 1, color: '#e94560' },
  { id: 'tetris', name: 'Tetris', icon: '🟦', players: 1, color: '#06b6d4' },
  { id: 'space-invaders', name: 'Space Invaders', icon: '👾', players: 1, color: '#a855f7' },
  { id: 'flappy-bird', name: 'Flappy Bird', icon: '🐦', players: 1, color: '#facc15' },
  { id: 'asteroids', name: 'Asteroids', icon: '🚀', players: 1, color: '#64748b' },
  { id: 'tank-battle', name: 'Tank Battle', icon: '🎯', players: 2, color: '#ef4444' },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', icon: '🔨', players: 1, color: '#22c55e' },
  { id: 'cookie-clicker', name: 'Cookie Clicker', icon: '🍪', players: 1, color: '#d97706' },
  { id: 'simon-says', name: 'Simon Says', icon: '🎵', players: 1, color: '#a855f7' },
  { id: '2048', name: '2048', icon: '🔢', players: 1, color: '#edc22e' },
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', icon: '⭕', players: 2, color: '#3b82f6' },
  { id: 'memory-match', name: 'Memory Match', icon: '🃏', players: 1, color: '#6366f1' },
  { id: 'dino-run', name: 'Dino Run', icon: '🦖', players: 1, color: '#22c55e' },
  { id: 'slope-io', name: 'Downhill', icon: '🎱', players: 1, color: '#3b82f6' },
];

function GameGrid() {
  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} {...game} />
      ))}
    </div>
  );
}

export default GameGrid;
