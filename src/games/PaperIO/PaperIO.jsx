import { useEffect, useRef, useState, useCallback } from 'react';
import './PaperIO.css';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const WORLD_SIZE = 200;
const CELL_SIZE = 8;
const PLAYER_SPEED = 0.12;
const BOT_SPEED = 0.1;

const COLORS = {
  player: { main: '#3b82f6', light: '#60a5fa', dark: '#1d4ed8' },
  bot1: { main: '#ef4444', light: '#f87171', dark: '#b91c1c' },
  bot2: { main: '#22c55e', light: '#4ade80', dark: '#15803d' },
  bot3: { main: '#a855f7', light: '#c084fc', dark: '#7c3aed' },
  bot4: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
  bot5: { main: '#ec4899', light: '#f472b6', dark: '#be185d' },
};

function PaperIO() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerPercent, setPlayerPercent] = useState(0);

  const gameRef = useRef(null);

  const createTerritory = (cx, cy, size = 3) => {
    const territory = new Set();
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
          territory.add(`${x},${y}`);
        }
      }
    }
    return territory;
  };

  const createPlayer = (id, name, colorKey, startX, startY, isBot = false) => ({
    id,
    name,
    x: startX,
    y: startY,
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    trail: [],
    territory: createTerritory(startX, startY),
    colors: COLORS[colorKey],
    alive: true,
    isBot,
    botTimer: 0,
    botState: 'expand',
    kills: 0,
  });

  const initGame = useCallback(() => {
    const grid = {};

    const player = createPlayer('player', 'You', 'player', 30, WORLD_SIZE / 2, false);

    const bots = [
      createPlayer('bot1', 'RedKing', 'bot1', WORLD_SIZE - 30, 30, true),
      createPlayer('bot2', 'GreenMachine', 'bot2', WORLD_SIZE - 30, WORLD_SIZE - 30, true),
      createPlayer('bot3', 'PurpleRain', 'bot3', 30, WORLD_SIZE - 30, true),
      createPlayer('bot4', 'GoldRush', 'bot4', WORLD_SIZE / 2, 30, true),
      createPlayer('bot5', 'PinkPanther', 'bot5', WORLD_SIZE / 2, WORLD_SIZE - 30, true),
    ];

    const allPlayers = [player, ...bots];
    allPlayers.forEach(p => {
      p.territory.forEach(key => {
        grid[key] = p.id;
      });
    });

    gameRef.current = {
      player,
      bots,
      grid,
      totalCells: WORLD_SIZE * WORLD_SIZE,
    };
  }, []);

  const resetGame = () => {
    initGame();
    setGameState('playing');
  };

  const getGridKey = (x, y) => `${Math.floor(x)},${Math.floor(y)}`;

  const isInOwnTerritory = (entity) => {
    const key = getGridKey(entity.x, entity.y);
    return entity.territory.has(key);
  };

  const fillTerritory = (entity, grid) => {
    if (entity.trail.length < 2) {
      entity.trail = [];
      return;
    }

    entity.trail.forEach(key => {
      entity.territory.add(key);
      grid[key] = entity.id;
    });

    const trailSet = new Set(entity.trail);
    const allPoints = [...entity.territory];

    if (allPoints.length === 0) {
      entity.trail = [];
      return;
    }

    let minX = WORLD_SIZE, maxX = 0, minY = WORLD_SIZE, maxY = 0;
    allPoints.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    minX = Math.max(0, minX - 1);
    maxX = Math.min(WORLD_SIZE - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(WORLD_SIZE - 1, maxY + 1);

    const isPartOfShape = (x, y) => {
      const key = `${x},${y}`;
      return entity.territory.has(key) || trailSet.has(key);
    };

    const toFill = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (isPartOfShape(x, y)) continue;

        let crossings = 0;
        for (let tx = x + 1; tx <= maxX; tx++) {
          if (trailSet.has(`${tx},${y}`)) crossings++;
        }

        if (crossings % 2 === 1) {
          toFill.push(`${x},${y}`);
        }
      }
    }

    toFill.forEach(key => {
      entity.territory.add(key);
      grid[key] = entity.id;
    });

    entity.trail = [];
  };

  const killEntity = (victim, killer, grid) => {
    victim.alive = false;
    victim.trail = [];
    if (killer) killer.kills++;

    victim.territory.forEach(key => {
      delete grid[key];
    });
    victim.territory.clear();
  };

  const respawnBot = (bot, grid) => {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * (WORLD_SIZE - 20)) + 10;
      const y = Math.floor(Math.random() * (WORLD_SIZE - 20)) + 10;

      let clear = true;
      for (let dy = -4; dy <= 4 && clear; dy++) {
        for (let dx = -4; dx <= 4 && clear; dx++) {
          if (grid[`${x + dx},${y + dy}`]) clear = false;
        }
      }

      if (clear) {
        bot.x = x;
        bot.y = y;
        bot.alive = true;
        bot.trail = [];
        bot.territory = createTerritory(x, y);
        bot.territory.forEach(key => {
          grid[key] = bot.id;
        });
        bot.dir = { x: [1, -1, 0, 0][Math.floor(Math.random() * 4)], y: [0, 0, 1, -1][Math.floor(Math.random() * 4)] };
        if (bot.dir.x === 0 && bot.dir.y === 0) bot.dir.x = 1;
        return;
      }
      attempts++;
    }
  };

  const updateBot = (bot, player, grid) => {
    if (!bot.alive) return;

    bot.botTimer++;

    if (bot.botTimer > 20 + Math.random() * 40) {
      bot.botTimer = 0;

      const inTerritory = isInOwnTerritory(bot);

      if (bot.trail.length > 30 || (inTerritory && bot.trail.length > 5)) {
        const centerX = [...bot.territory].reduce((sum, k) => sum + parseInt(k.split(',')[0]), 0) / Math.max(1, bot.territory.size);
        const centerY = [...bot.territory].reduce((sum, k) => sum + parseInt(k.split(',')[1]), 0) / Math.max(1, bot.territory.size);

        const dx = centerX - bot.x;
        const dy = centerY - bot.y;

        if (Math.abs(dx) > Math.abs(dy)) {
          bot.dir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
          bot.dir = { x: 0, y: dy > 0 ? 1 : -1 };
        }
      } else {
        const dirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 },
          { x: 0, y: 1 }, { x: 0, y: -1 },
        ].filter(d => !(d.x === -bot.dir.x && d.y === -bot.dir.y));

        if (Math.random() < 0.3) {
          bot.dir = dirs[Math.floor(Math.random() * dirs.length)];
        }
      }
    }

    if (bot.x < 5) bot.dir = { x: 1, y: 0 };
    if (bot.x > WORLD_SIZE - 5) bot.dir = { x: -1, y: 0 };
    if (bot.y < 5) bot.dir = { x: 0, y: 1 };
    if (bot.y > WORLD_SIZE - 5) bot.dir = { x: 0, y: -1 };

    bot.x += bot.dir.x * BOT_SPEED;
    bot.y += bot.dir.y * BOT_SPEED;

    const key = getGridKey(bot.x, bot.y);
    const inTerritory = bot.territory.has(key);

    if (!inTerritory) {
      if (!bot.trail.includes(key)) {
        if (bot.trail.some(k => k === key)) {
          killEntity(bot, null, grid);
          return;
        }
        bot.trail.push(key);
      }
    } else if (bot.trail.length > 0) {
      fillTerritory(bot, grid);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if ((gameState === 'ready' || gameState === 'gameover') && e.code === 'Space') {
        resetGame();
        return;
      }

      if (gameState !== 'playing' || !gameRef.current) return;

      const { player } = gameRef.current;

      switch (e.key) {
        case 'ArrowUp':
          if (player.dir.y !== 1) player.nextDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (player.dir.y !== -1) player.nextDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (player.dir.x !== 1) player.nextDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (player.dir.x !== -1) player.nextDir = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing' || !gameRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;
      if (!game) return;

      const { player, bots, grid, totalCells } = game;

      player.dir = player.nextDir;
      player.x += player.dir.x * PLAYER_SPEED;
      player.y += player.dir.y * PLAYER_SPEED;

      player.x = Math.max(0.5, Math.min(WORLD_SIZE - 0.5, player.x));
      player.y = Math.max(0.5, Math.min(WORLD_SIZE - 0.5, player.y));

      const playerKey = getGridKey(player.x, player.y);
      const playerInTerritory = player.territory.has(playerKey);

      if (!playerInTerritory) {
        if (!player.trail.includes(playerKey)) {
          if (player.trail.length > 0 && player.trail.slice(0, -1).includes(playerKey)) {
            setGameState('gameover');
            return;
          }
          player.trail.push(playerKey);
        }
      } else if (player.trail.length > 0) {
        fillTerritory(player, grid);
      }

      bots.forEach(bot => {
        if (bot.alive && bot.trail.length > 0) {
          if (bot.trail.includes(playerKey)) {
            setGameState('gameover');
            return;
          }
        }
      });

      bots.forEach(bot => updateBot(bot, player, grid));

      bots.forEach(bot => {
        if (!bot.alive) return;
        const botKey = getGridKey(bot.x, bot.y);

        if (player.trail.length > 0 && player.trail.includes(botKey)) {
          killEntity(bot, player, grid);
        }
      });

      bots.forEach(bot => {
        if (!bot.alive && Math.random() < 0.01) {
          respawnBot(bot, grid);
        }
      });

      const camX = player.x * CELL_SIZE - CANVAS_WIDTH / 2;
      const camY = player.y * CELL_SIZE - CANVAS_HEIGHT / 2;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const startX = Math.max(0, Math.floor(camX / CELL_SIZE) - 1);
      const endX = Math.min(WORLD_SIZE, Math.ceil((camX + CANVAS_WIDTH) / CELL_SIZE) + 1);
      const startY = Math.max(0, Math.floor(camY / CELL_SIZE) - 1);
      const endY = Math.min(WORLD_SIZE, Math.ceil((camY + CANVAS_HEIGHT) / CELL_SIZE) + 1);

      ctx.strokeStyle = '#252540';
      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x++) {
        const screenX = x * CELL_SIZE - camX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y++) {
        const screenY = y * CELL_SIZE - camY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(CANVAS_WIDTH, screenY);
        ctx.stroke();
      }

      const allEntities = [player, ...bots.filter(b => b.alive)];

      allEntities.forEach(entity => {
        entity.territory.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          if (x >= startX && x <= endX && y >= startY && y <= endY) {
            const screenX = x * CELL_SIZE - camX;
            const screenY = y * CELL_SIZE - camY;
            ctx.fillStyle = entity.colors.light + '70';
            ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
          }
        });
      });

      allEntities.forEach(entity => {
        ctx.fillStyle = entity.colors.main + 'cc';
        entity.trail.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          const screenX = x * CELL_SIZE - camX;
          const screenY = y * CELL_SIZE - camY;
          ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
        });
      });

      allEntities.forEach(entity => {
        const screenX = entity.x * CELL_SIZE - camX;
        const screenY = entity.y * CELL_SIZE - camY;

        ctx.fillStyle = entity.colors.dark;
        ctx.fillRect(screenX - CELL_SIZE * 0.7, screenY - CELL_SIZE * 0.7, CELL_SIZE * 1.4, CELL_SIZE * 1.4);

        ctx.fillStyle = entity.colors.main;
        ctx.fillRect(screenX - CELL_SIZE * 0.6, screenY - CELL_SIZE * 0.6, CELL_SIZE * 1.2, CELL_SIZE * 1.2);

        ctx.fillStyle = entity.colors.light;
        ctx.fillRect(screenX - CELL_SIZE * 0.4, screenY - CELL_SIZE * 0.6, CELL_SIZE * 0.4, CELL_SIZE * 0.3);
      });

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      const worldPixelSize = WORLD_SIZE * CELL_SIZE;
      ctx.strokeRect(-camX, -camY, worldPixelSize, worldPixelSize);

      const stats = allEntities.map(e => ({
        name: e.name,
        percent: ((e.territory.size / totalCells) * 100).toFixed(1),
        color: e.colors.main,
        kills: e.kills,
        isPlayer: e.id === 'player',
      })).sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));

      setLeaderboard(stats);
      setPlayerPercent(stats.find(s => s.isPlayer)?.percent || 0);

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  return (
    <div className="paperio-game">
      <div className="game-hud">
        <div className="player-stats">
          <div className="percent-display">{playerPercent}%</div>
          <div className="percent-label">Territory Captured</div>
        </div>
        <div className="leaderboard">
          <div className="leaderboard-title">Leaderboard</div>
          {leaderboard.slice(0, 6).map((entry, idx) => (
            <div
              key={entry.name}
              className={`leaderboard-entry ${entry.isPlayer ? 'is-player' : ''}`}
            >
              <span className="rank">#{idx + 1}</span>
              <span className="color-dot" style={{ background: entry.color }}></span>
              <span className="name">{entry.name}</span>
              <span className="score">{entry.percent}%</span>
            </div>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="paperio-canvas"
      />
      <div className="controls-hint">Arrow keys to move • Capture territory by making loops • Kill others by crossing their trail!</div>
      {gameState === 'ready' && (
        <div className="overlay">
          <h2>Paper.io</h2>
          <div className="instructions">
            <p>Use <strong>Arrow Keys</strong> to move</p>
            <p>Leave your territory and return to capture area</p>
            <p>Cross enemy trails to <strong>eliminate</strong> them!</p>
            <p>Don't let them cross yours!</p>
          </div>
          <p className="start-hint">Press SPACE to start</p>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="overlay">
          <h2>Game Over!</h2>
          <div className="final-stats">
            <p>Territory: <strong>{playerPercent}%</strong></p>
            <p>Rank: <strong>#{leaderboard.findIndex(e => e.isPlayer) + 1}</strong></p>
          </div>
          <p className="start-hint">Press SPACE to play again</p>
        </div>
      )}
    </div>
  );
}

export default PaperIO;
