import { useEffect, useRef, useState } from 'react';
import './TankBattle.css';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;
const TANK_SIZE = 30;
const BULLET_SIZE = 6;
const TANK_SPEED = 3;
const ROTATION_SPEED = 0.08;
const BULLET_SPEED = 6;

function TankBattle() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  const createWalls = () => [
    { x: 150, y: 100, w: 20, h: 100 },
    { x: 430, y: 100, w: 20, h: 100 },
    { x: 150, y: 250, w: 20, h: 100 },
    { x: 430, y: 250, w: 20, h: 100 },
    { x: 250, y: 180, w: 100, h: 20 },
    { x: 250, y: 250, w: 100, h: 20 },
  ];

  const gameRef = useRef({
    tank1: { x: 60, y: CANVAS_HEIGHT / 2, angle: 0 },
    tank2: { x: CANVAS_WIDTH - 60, y: CANVAS_HEIGHT / 2, angle: Math.PI },
    bullets: [],
    walls: createWalls(),
    keys: {},
    lastShot: { p1: 0, p2: 0 },
  });

  const resetRound = () => {
    gameRef.current.tank1 = { x: 60, y: CANVAS_HEIGHT / 2, angle: 0 };
    gameRef.current.tank2 = { x: CANVAS_WIDTH - 60, y: CANVAS_HEIGHT / 2, angle: Math.PI };
    gameRef.current.bullets = [];
  };

  const resetGame = () => {
    gameRef.current = {
      tank1: { x: 60, y: CANVAS_HEIGHT / 2, angle: 0 },
      tank2: { x: CANVAS_WIDTH - 60, y: CANVAS_HEIGHT / 2, angle: Math.PI },
      bullets: [],
      walls: createWalls(),
      keys: {},
      lastShot: { p1: 0, p2: 0 },
    };
    setScores({ p1: 0, p2: 0 });
    setGameState('playing');
  };

  const checkWallCollision = (x, y, size) => {
    return gameRef.current.walls.some(wall =>
      x + size / 2 > wall.x && x - size / 2 < wall.x + wall.w &&
      y + size / 2 > wall.y && y - size / 2 < wall.y + wall.h
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'ready' && e.code === 'Space') {
        resetGame();
        return;
      }
      gameRef.current.keys[e.key.toLowerCase()] = true;
      gameRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
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

      if (game.keys['a']) game.tank1.angle -= ROTATION_SPEED;
      if (game.keys['d']) game.tank1.angle += ROTATION_SPEED;
      if (game.keys['w']) {
        const newX = game.tank1.x + Math.cos(game.tank1.angle) * TANK_SPEED;
        const newY = game.tank1.y + Math.sin(game.tank1.angle) * TANK_SPEED;
        if (!checkWallCollision(newX, newY, TANK_SIZE) &&
            newX > TANK_SIZE / 2 && newX < CANVAS_WIDTH - TANK_SIZE / 2 &&
            newY > TANK_SIZE / 2 && newY < CANVAS_HEIGHT - TANK_SIZE / 2) {
          game.tank1.x = newX;
          game.tank1.y = newY;
        }
      }
      if (game.keys['s']) {
        const newX = game.tank1.x - Math.cos(game.tank1.angle) * TANK_SPEED;
        const newY = game.tank1.y - Math.sin(game.tank1.angle) * TANK_SPEED;
        if (!checkWallCollision(newX, newY, TANK_SIZE) &&
            newX > TANK_SIZE / 2 && newX < CANVAS_WIDTH - TANK_SIZE / 2 &&
            newY > TANK_SIZE / 2 && newY < CANVAS_HEIGHT - TANK_SIZE / 2) {
          game.tank1.x = newX;
          game.tank1.y = newY;
        }
      }
      if (game.keys[' '] && now - game.lastShot.p1 > 500) {
        game.bullets.push({
          x: game.tank1.x + Math.cos(game.tank1.angle) * TANK_SIZE / 2,
          y: game.tank1.y + Math.sin(game.tank1.angle) * TANK_SIZE / 2,
          vel: { x: Math.cos(game.tank1.angle) * BULLET_SPEED, y: Math.sin(game.tank1.angle) * BULLET_SPEED },
          owner: 'p1',
          bounces: 0,
        });
        game.lastShot.p1 = now;
      }

      if (game.keys['arrowleft']) game.tank2.angle -= ROTATION_SPEED;
      if (game.keys['arrowright']) game.tank2.angle += ROTATION_SPEED;
      if (game.keys['arrowup']) {
        const newX = game.tank2.x + Math.cos(game.tank2.angle) * TANK_SPEED;
        const newY = game.tank2.y + Math.sin(game.tank2.angle) * TANK_SPEED;
        if (!checkWallCollision(newX, newY, TANK_SIZE) &&
            newX > TANK_SIZE / 2 && newX < CANVAS_WIDTH - TANK_SIZE / 2 &&
            newY > TANK_SIZE / 2 && newY < CANVAS_HEIGHT - TANK_SIZE / 2) {
          game.tank2.x = newX;
          game.tank2.y = newY;
        }
      }
      if (game.keys['arrowdown']) {
        const newX = game.tank2.x - Math.cos(game.tank2.angle) * TANK_SPEED;
        const newY = game.tank2.y - Math.sin(game.tank2.angle) * TANK_SPEED;
        if (!checkWallCollision(newX, newY, TANK_SIZE) &&
            newX > TANK_SIZE / 2 && newX < CANVAS_WIDTH - TANK_SIZE / 2 &&
            newY > TANK_SIZE / 2 && newY < CANVAS_HEIGHT - TANK_SIZE / 2) {
          game.tank2.x = newX;
          game.tank2.y = newY;
        }
      }
      if (game.keys['enter'] && now - game.lastShot.p2 > 500) {
        game.bullets.push({
          x: game.tank2.x + Math.cos(game.tank2.angle) * TANK_SIZE / 2,
          y: game.tank2.y + Math.sin(game.tank2.angle) * TANK_SIZE / 2,
          vel: { x: Math.cos(game.tank2.angle) * BULLET_SPEED, y: Math.sin(game.tank2.angle) * BULLET_SPEED },
          owner: 'p2',
          bounces: 0,
        });
        game.lastShot.p2 = now;
      }

      game.bullets = game.bullets.filter(bullet => {
        bullet.x += bullet.vel.x;
        bullet.y += bullet.vel.y;

        if (bullet.x <= 0 || bullet.x >= CANVAS_WIDTH) {
          bullet.vel.x *= -1;
          bullet.bounces++;
        }
        if (bullet.y <= 0 || bullet.y >= CANVAS_HEIGHT) {
          bullet.vel.y *= -1;
          bullet.bounces++;
        }

        game.walls.forEach(wall => {
          if (bullet.x > wall.x && bullet.x < wall.x + wall.w &&
              bullet.y > wall.y && bullet.y < wall.y + wall.h) {
            const fromLeft = bullet.x - bullet.vel.x < wall.x;
            const fromRight = bullet.x - bullet.vel.x > wall.x + wall.w;
            if (fromLeft || fromRight) bullet.vel.x *= -1;
            else bullet.vel.y *= -1;
            bullet.bounces++;
          }
        });

        return bullet.bounces < 3;
      });

      game.bullets.forEach((bullet, idx) => {
        const dist1 = Math.hypot(bullet.x - game.tank1.x, bullet.y - game.tank1.y);
        const dist2 = Math.hypot(bullet.x - game.tank2.x, bullet.y - game.tank2.y);

        if (dist1 < TANK_SIZE / 2 && bullet.owner !== 'p1') {
          setScores(s => ({ ...s, p2: s.p2 + 1 }));
          game.bullets.splice(idx, 1);
          resetRound();
        }
        if (dist2 < TANK_SIZE / 2 && bullet.owner !== 'p2') {
          setScores(s => ({ ...s, p1: s.p1 + 1 }));
          game.bullets.splice(idx, 1);
          resetRound();
        }
      });

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#4a4a5e';
      game.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      });

      const drawTank = (tank, color) => {
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);
        ctx.fillStyle = color;
        ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2.5, TANK_SIZE, TANK_SIZE / 1.25);
        ctx.fillRect(0, -3, TANK_SIZE / 1.5, 6);
        ctx.restore();
      };

      drawTank(game.tank1, '#3b82f6');
      drawTank(game.tank2, '#ef4444');

      game.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.owner === 'p1' ? '#60a5fa' : '#f87171';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      });

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  return (
    <div className="tank-battle-game">
      <div className="tank-scores">
        <span className="p1-score">P1: {scores.p1}</span>
        <span className="p2-score">P2: {scores.p2}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="tank-canvas"
      />
      <div className="controls-hint">
        <span>P1: WASD + Space</span>
        <span>P2: Arrows + Enter</span>
      </div>
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Tank Battle</h2>
          <p>Player 1: WASD to move, SPACE to shoot</p>
          <p>Player 2: Arrows to move, ENTER to shoot</p>
          <p>Bullets bounce off walls!</p>
          <p>Press SPACE to start</p>
        </div>
      )}
    </div>
  );
}

export default TankBattle;
