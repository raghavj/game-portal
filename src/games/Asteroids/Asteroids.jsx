import { useEffect, useRef, useState } from 'react';
import './Asteroids.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const SHIP_SIZE = 15;
const ROTATION_SPEED = 0.1;
const THRUST = 0.15;
const FRICTION = 0.99;
const BULLET_SPEED = 8;

function Asteroids() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const createAsteroids = (count = 5) => {
    const asteroids = [];
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      switch (side) {
        case 0: x = 0; y = Math.random() * CANVAS_HEIGHT; break;
        case 1: x = CANVAS_WIDTH; y = Math.random() * CANVAS_HEIGHT; break;
        case 2: x = Math.random() * CANVAS_WIDTH; y = 0; break;
        default: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT;
      }
      asteroids.push({
        x, y,
        vel: { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 },
        size: 40 + Math.random() * 20,
        vertices: Math.floor(Math.random() * 4) + 6,
      });
    }
    return asteroids;
  };

  const gameRef = useRef({
    ship: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, angle: -Math.PI / 2, vel: { x: 0, y: 0 } },
    asteroids: createAsteroids(),
    bullets: [],
    keys: {},
    invincible: 0,
  });

  const resetGame = () => {
    gameRef.current = {
      ship: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, angle: -Math.PI / 2, vel: { x: 0, y: 0 } },
      asteroids: createAsteroids(),
      bullets: [],
      keys: {},
      invincible: 60,
    };
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((gameState === 'ready' || gameState === 'gameover') && e.code === 'Space') {
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
    let lastShot = 0;

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      const now = Date.now();

      if (game.invincible > 0) game.invincible--;

      if (game.keys['ArrowLeft']) game.ship.angle -= ROTATION_SPEED;
      if (game.keys['ArrowRight']) game.ship.angle += ROTATION_SPEED;
      if (game.keys['ArrowUp']) {
        game.ship.vel.x += Math.cos(game.ship.angle) * THRUST;
        game.ship.vel.y += Math.sin(game.ship.angle) * THRUST;
      }
      if (game.keys[' '] && now - lastShot > 200) {
        game.bullets.push({
          x: game.ship.x + Math.cos(game.ship.angle) * SHIP_SIZE,
          y: game.ship.y + Math.sin(game.ship.angle) * SHIP_SIZE,
          vel: {
            x: Math.cos(game.ship.angle) * BULLET_SPEED,
            y: Math.sin(game.ship.angle) * BULLET_SPEED,
          },
          life: 60,
        });
        lastShot = now;
      }

      game.ship.vel.x *= FRICTION;
      game.ship.vel.y *= FRICTION;
      game.ship.x += game.ship.vel.x;
      game.ship.y += game.ship.vel.y;

      if (game.ship.x < 0) game.ship.x = CANVAS_WIDTH;
      if (game.ship.x > CANVAS_WIDTH) game.ship.x = 0;
      if (game.ship.y < 0) game.ship.y = CANVAS_HEIGHT;
      if (game.ship.y > CANVAS_HEIGHT) game.ship.y = 0;

      game.bullets = game.bullets.filter(b => {
        b.x += b.vel.x;
        b.y += b.vel.y;
        b.life--;
        return b.life > 0;
      });

      game.asteroids.forEach(a => {
        a.x += a.vel.x;
        a.y += a.vel.y;
        if (a.x < -a.size) a.x = CANVAS_WIDTH + a.size;
        if (a.x > CANVAS_WIDTH + a.size) a.x = -a.size;
        if (a.y < -a.size) a.y = CANVAS_HEIGHT + a.size;
        if (a.y > CANVAS_HEIGHT + a.size) a.y = -a.size;
      });

      game.bullets.forEach(bullet => {
        game.asteroids.forEach((asteroid, idx) => {
          const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);
          if (dist < asteroid.size / 2) {
            bullet.life = 0;
            setScore(s => s + Math.floor(100 / asteroid.size * 10));
            if (asteroid.size > 25) {
              const newAsteroids = [];
              for (let i = 0; i < 2; i++) {
                newAsteroids.push({
                  x: asteroid.x,
                  y: asteroid.y,
                  vel: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
                  size: asteroid.size / 2,
                  vertices: asteroid.vertices,
                });
              }
              game.asteroids.splice(idx, 1, ...newAsteroids);
            } else {
              game.asteroids.splice(idx, 1);
            }
          }
        });
      });

      if (game.invincible <= 0) {
        game.asteroids.forEach(asteroid => {
          const dist = Math.hypot(game.ship.x - asteroid.x, game.ship.y - asteroid.y);
          if (dist < asteroid.size / 2 + SHIP_SIZE) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState('gameover');
              } else {
                game.ship = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, angle: -Math.PI / 2, vel: { x: 0, y: 0 } };
                game.invincible = 120;
              }
              return newLives;
            });
          }
        });
      }

      if (game.asteroids.length === 0) {
        game.asteroids = createAsteroids(5 + Math.floor(score / 500));
      }

      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (game.invincible % 10 < 5) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          game.ship.x + Math.cos(game.ship.angle) * SHIP_SIZE,
          game.ship.y + Math.sin(game.ship.angle) * SHIP_SIZE
        );
        ctx.lineTo(
          game.ship.x + Math.cos(game.ship.angle + 2.5) * SHIP_SIZE,
          game.ship.y + Math.sin(game.ship.angle + 2.5) * SHIP_SIZE
        );
        ctx.lineTo(
          game.ship.x + Math.cos(game.ship.angle + Math.PI) * (SHIP_SIZE / 2),
          game.ship.y + Math.sin(game.ship.angle + Math.PI) * (SHIP_SIZE / 2)
        );
        ctx.lineTo(
          game.ship.x + Math.cos(game.ship.angle - 2.5) * SHIP_SIZE,
          game.ship.y + Math.sin(game.ship.angle - 2.5) * SHIP_SIZE
        );
        ctx.closePath();
        ctx.stroke();
      }

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      game.asteroids.forEach(a => {
        ctx.beginPath();
        for (let i = 0; i <= a.vertices; i++) {
          const angle = (i / a.vertices) * Math.PI * 2;
          const r = a.size / 2 * (0.8 + Math.sin(i * 3) * 0.2);
          const x = a.x + Math.cos(angle) * r;
          const y = a.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      });

      ctx.fillStyle = '#facc15';
      game.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, score]);

  return (
    <div className="asteroids-game">
      <div className="game-info">
        <span>Score: {score}</span>
        <span>Lives: {'🚀'.repeat(lives)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="asteroids-canvas"
      />
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Asteroids</h2>
          <p>← → to rotate, ↑ to thrust</p>
          <p>SPACE to shoot</p>
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
    </div>
  );
}

export default Asteroids;
