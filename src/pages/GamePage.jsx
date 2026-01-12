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
import WhackAMole from '../games/WhackAMole/WhackAMole';
import CookieClicker from '../games/CookieClicker/CookieClicker';
import SimonSays from '../games/SimonSays/SimonSays';
import Game2048 from '../games/Game2048/Game2048';
import TicTacToe from '../games/TicTacToe/TicTacToe';
import MemoryMatch from '../games/MemoryMatch/MemoryMatch';
import DinoRun from '../games/DinoRun/DinoRun';
import SlopeIO from '../games/SlopeIO/SlopeIO';
import RetroBall from '../games/RetroBall/RetroBall';

const gameComponents = {
  'snake': { component: Snake, name: 'Snake' },
  'pong': { component: Pong, name: 'Pong' },
  'breakout': { component: Breakout, name: 'Breakout' },
  'tetris': { component: Tetris, name: 'Tetris' },
  'space-invaders': { component: SpaceInvaders, name: 'Space Invaders' },
  'flappy-bird': { component: FlappyBird, name: 'Flappy Bird' },
  'asteroids': { component: Asteroids, name: 'Asteroids' },
  'tank-battle': { component: TankBattle, name: 'Tank Battle' },
  'whack-a-mole': { component: WhackAMole, name: 'Whack-a-Mole' },
  'cookie-clicker': { component: CookieClicker, name: 'Cookie Clicker' },
  'simon-says': { component: SimonSays, name: 'Simon Says' },
  '2048': { component: Game2048, name: '2048' },
  'tic-tac-toe': { component: TicTacToe, name: 'Tic Tac Toe' },
  'memory-match': { component: MemoryMatch, name: 'Memory Match' },
  'dino-run': { component: DinoRun, name: 'Dino Run' },
  'slope-io': { component: SlopeIO, name: 'Downhill' },
  'retro-ball': { component: RetroBall, name: 'Retro Ball' },
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
