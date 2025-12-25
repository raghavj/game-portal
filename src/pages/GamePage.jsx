import { useParams, Navigate } from 'react-router-dom';
import GameWrapper from '../components/GameWrapper';
import Snake from '../games/Snake/Snake';
import Pong from '../games/Pong/Pong';
import Breakout from '../games/Breakout/Breakout';
import Tetris from '../games/Tetris/Tetris';
import SpaceInvaders from '../games/SpaceInvaders/SpaceInvaders';
import FlappyBird from '../games/FlappyBird/FlappyBird';
import Asteroids from '../games/Asteroids/Asteroids';
import TankBattle from '../games/TankBattle/TankBattle';
import PaperIO from '../games/PaperIO/PaperIO';

const gameComponents = {
  'snake': { component: Snake, name: 'Snake' },
  'pong': { component: Pong, name: 'Pong' },
  'breakout': { component: Breakout, name: 'Breakout' },
  'tetris': { component: Tetris, name: 'Tetris' },
  'space-invaders': { component: SpaceInvaders, name: 'Space Invaders' },
  'flappy-bird': { component: FlappyBird, name: 'Flappy Bird' },
  'asteroids': { component: Asteroids, name: 'Asteroids' },
  'tank-battle': { component: TankBattle, name: 'Tank Battle' },
  'paper-io': { component: PaperIO, name: 'Paper.io' },
};

function GamePage() {
  const { gameId } = useParams();
  const game = gameComponents[gameId];

  if (!game) {
    return <Navigate to="/" replace />;
  }

  const GameComponent = game.component;

  return (
    <GameWrapper gameName={game.name}>
      <GameComponent />
    </GameWrapper>
  );
}

export default GamePage;
