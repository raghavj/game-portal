import { useEffect, useRef, useState } from 'react';
import './SpaceInvaders.css';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 400;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const INVADER_SIZE = 30;
const BULLET_SIZE = 4;

function SpaceInvaders() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const createInvaders = () => {
    const invaders = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        invaders.push({
          x: col * 50 + 40,
          y: row * 40 + 40,
          alive: true,
        });
      }
    }
    return invaders;
  };

  const gameRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2 },
    invaders: createInvaders(),
    bullets: [],
    enemyBullets: [],
    invaderDir: 1,
    invaderSpeed: 1,
    keys: {},
    lastShot: 0,
  });

  const resetGame = () => {
    gameRef.current = {
      player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2 },
      invaders: createInvaders(),
      bullets: [],
      enemyBullets: [],
      invaderDir: 1,
      invaderSpeed: 1,
      keys: {},
      lastShot: 0,
    };
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((gameState === 'ready' || gameState === 'gameover' || gameState === 'won') && e.code === 'Space') {
        resetGame();
        return;
      }
      gameRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      const now = Date.now();

      if (game.keys['ArrowLeft']) {
        game.player.x = Math.max(0, game.player.x - 5);
      }
      if (game.keys['ArrowRight']) {
        game.player.x = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, game.player.x + 5);
      }
      if (game.keys[' '] && now - game.lastShot > 300) {
        game.bullets.push({
          x: game.player.x + PLAYER_WIDTH / 2,
          y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
        });
        game.lastShot = now;
      }

      game.bullets = game.bullets.filter(b => {
        b.y -= 8;
        return b.y > 0;
      });

      game.enemyBullets = game.enemyBullets.filter(b => {
        b.y += 4;
        return b.y < CANVAS_HEIGHT;
      });

      let moveDown = false;
      game.invaders.forEach(inv => {
        if (!inv.alive) return;
        if ((inv.x <= 10 && game.invaderDir < 0) ||
            (inv.x >= CANVAS_WIDTH - INVADER_SIZE - 10 && game.invaderDir > 0)) {
          moveDown = true;
        }
      });

      if (moveDown) {
        game.invaderDir *= -1;
        game.invaders.forEach(inv => {
          inv.y += 20;
        });
      }

      game.invaders.forEach(inv => {
        if (inv.alive) {
          inv.x += game.invaderDir * game.invaderSpeed;
        }
      });

      const aliveInvaders = game.invaders.filter(i => i.alive);
      if (aliveInvaders.length > 0 && Math.random() < 0.02) {
        const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        game.enemyBullets.push({
          x: shooter.x + INVADER_SIZE / 2,
          y: shooter.y + INVADER_SIZE,
        });
      }

      game.bullets.forEach(bullet => {
        game.invaders.forEach(inv => {
          if (!inv.alive) return;
          if (bullet.x >= inv.x && bullet.x <= inv.x + INVADER_SIZE &&
              bullet.y >= inv.y && bullet.y <= inv.y + INVADER_SIZE) {
            inv.alive = false;
            bullet.y = -100;
            setScore(s => s + 10);
          }
        });
      });

      game.enemyBullets.forEach(bullet => {
        if (bullet.x >= game.player.x && bullet.x <= game.player.x + PLAYER_WIDTH &&
            bullet.y >= CANVAS_HEIGHT - PLAYER_HEIGHT - 10) {
          bullet.y = CANVAS_HEIGHT + 100;
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) setGameState('gameover');
            return newLives;
          });
        }
      });

      game.invaders.forEach(inv => {
        if (inv.alive && inv.y >= CANVAS_HEIGHT - PLAYER_HEIGHT - 30) {
          setGameState('gameover');
        }
      });

      if (game.invaders.every(i => !i.alive)) {
        setGameState('won');
      }

      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(game.player.x, CANVAS_HEIGHT - 10);
      ctx.lineTo(game.player.x + PLAYER_WIDTH, CANVAS_HEIGHT - 10);
      ctx.lineTo(game.player.x + PLAYER_WIDTH / 2, CANVAS_HEIGHT - PLAYER_HEIGHT - 10);
      ctx.closePath();
      ctx.fill();

      game.invaders.forEach(inv => {
        if (!inv.alive) return;
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(inv.x + 5, inv.y, INVADER_SIZE - 10, INVADER_SIZE - 5);
        ctx.fillRect(inv.x, inv.y + 5, INVADER_SIZE, INVADER_SIZE - 15);
        ctx.fillStyle = '#fff';
        ctx.fillRect(inv.x + 6, inv.y + 8, 4, 4);
        ctx.fillRect(inv.x + INVADER_SIZE - 10, inv.y + 8, 4, 4);
      });

      ctx.fillStyle = '#facc15';
      game.bullets.forEach(b => {
        ctx.fillRect(b.x - BULLET_SIZE / 2, b.y, BULLET_SIZE, BULLET_SIZE * 2);
      });

      ctx.fillStyle = '#ef4444';
      game.enemyBullets.forEach(b => {
        ctx.fillRect(b.x - BULLET_SIZE / 2, b.y, BULLET_SIZE, BULLET_SIZE * 2);
      });

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  return (
    <div className="space-invaders-game">
      <div className="game-info">
        <span>Score: {score}</span>
        <span>Lives: {'❤️'.repeat(lives)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="space-invaders-canvas"
      />
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Space Invaders</h2>
          <p>← → to move, SPACE to shoot</p>
          <p>Press SPACE to start</p>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <p>Score: {score}</p>
          <p>Press SPACE to play again</p>
        </div>
      )}
      {gameState === 'won' && (
        <div className="overlay won">
          <h2>Victory!</h2>
          <p>Score: {score}</p>
          <p>Press SPACE to play again</p>
        </div>
      )}
    </div>
  );
}

export default SpaceInvaders;
