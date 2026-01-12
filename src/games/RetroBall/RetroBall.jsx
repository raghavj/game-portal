import { useRef, useState, useEffect } from 'react';
import './RetroBall.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const FIELD_GREEN = '#2d5a27';
const ENDZONE_COLOR = '#1e3d1a';
const LINE_COLOR = 'rgba(255, 255, 255, 0.5)';

function RetroBall() {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    qb: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, aimAngle: -Math.PI / 2 },
    receivers: [],
    defenders: [],
    ball: null,
    ballTarget: null,
    ballCarrier: null,
    down: 1,
    yardsToGo: 10,
    fieldPosition: 20,
    playState: 'setup', // setup, running, throwing, rushing, tackled, complete, intercepted, touchdown
    playTimer: 0,
    score: 0,
    mouseX: CANVAS_WIDTH / 2,
    mouseY: 0,
    keys: { left: false, right: false, up: false, down: false },
    catchY: 0,
  });

  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [down, setDown] = useState(1);
  const [yardsToGo, setYardsToGo] = useState(10);
  const [fieldPos, setFieldPos] = useState(20);
  const [message, setMessage] = useState('');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('retroball-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const resetGame = () => {
    const game = gameRef.current;
    game.qb = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, aimAngle: -Math.PI / 2 };
    game.receivers = [];
    game.defenders = [];
    game.ball = null;
    game.ballTarget = null;
    game.ballCarrier = null;
    game.down = 1;
    game.yardsToGo = 10;
    game.fieldPosition = 20;
    game.playState = 'setup';
    game.playTimer = 0;
    game.score = 0;
    game.keys = { left: false, right: false, up: false, down: false };
    game.catchY = 0;
  };

  const setupPlay = () => {
    const game = gameRef.current;
    game.playState = 'setup';
    game.ball = null;
    game.ballTarget = null;
    game.playTimer = 0;

    // Create 3 receivers with different routes
    const routes = ['streak', 'out', 'slant', 'post', 'corner'];
    game.receivers = [];

    const numReceivers = 3;
    const spacing = CANVAS_WIDTH / (numReceivers + 1);

    for (let i = 0; i < numReceivers; i++) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      game.receivers.push({
        x: spacing * (i + 1),
        y: CANVAS_HEIGHT - 100,
        startX: spacing * (i + 1),
        startY: CANVAS_HEIGHT - 100,
        route: route,
        speed: 2.5 + Math.random() * 1,
        open: false,
        caught: false,
        routePhase: 0,
      });
    }

    // Create defenders
    game.defenders = [];
    for (let i = 0; i < numReceivers; i++) {
      game.defenders.push({
        x: game.receivers[i].x + (Math.random() - 0.5) * 40,
        y: game.receivers[i].y - 30 - Math.random() * 20,
        targetReceiver: i,
        speed: 2 + Math.random() * 1.2,
        reaction: 0.3 + Math.random() * 0.4,
      });
    }

    // Add a safety
    game.defenders.push({
      x: CANVAS_WIDTH / 2,
      y: 150,
      targetReceiver: -1,
      speed: 2.8,
      reaction: 0.5,
    });
  };

  const startGame = () => {
    resetGame();
    setScore(0);
    setDown(1);
    setYardsToGo(10);
    setFieldPos(20);
    setMessage('');
    setupPlay();
    setGameState('playing');
  };

  const startPlay = () => {
    const game = gameRef.current;
    if (game.playState === 'setup') {
      game.playState = 'running';
      game.playTimer = 0;
    }
  };

  const throwBall = (targetX, targetY) => {
    const game = gameRef.current;
    if (game.playState !== 'running') return;

    // Find closest receiver to click
    let closestReceiver = null;
    let closestDist = 100;

    for (const receiver of game.receivers) {
      const dist = Math.hypot(receiver.x - targetX, receiver.y - targetY);
      if (dist < closestDist) {
        closestDist = dist;
        closestReceiver = receiver;
      }
    }

    if (closestReceiver) {
      game.playState = 'throwing';
      game.ball = { x: game.qb.x, y: game.qb.y };
      game.ballTarget = closestReceiver;

      // Make defenders react to throw
      for (const def of game.defenders) {
        if (def.targetReceiver === -1) {
          def.targetReceiver = game.receivers.indexOf(closestReceiver);
        }
      }
    }
  };

  const handleCanvasClick = (e) => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.playState === 'setup') {
      startPlay();
    } else if (game.playState === 'running') {
      throwBall(x, y);
    }
  };

  const handleMouseMove = (e) => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    game.mouseX = e.clientX - rect.left;
    game.mouseY = e.clientY - rect.top;

    // Update QB aim angle when running
    if (game.playState === 'running') {
      game.qb.aimAngle = Math.atan2(game.mouseY - game.qb.y, game.mouseX - game.qb.x);
    }
  };

  const endPlay = (result, yards = 0) => {
    const game = gameRef.current;

    if (result === 'touchdown') {
      game.score += 7;
      setScore(game.score);
      setMessage('TOUCHDOWN! +7');
      game.fieldPosition = 20;
      game.down = 1;
      game.yardsToGo = 10;
    } else if (result === 'complete') {
      game.fieldPosition += yards;
      if (game.fieldPosition >= 100) {
        game.score += 7;
        setScore(game.score);
        setMessage('TOUCHDOWN! +7');
        game.fieldPosition = 20;
        game.down = 1;
        game.yardsToGo = 10;
      } else {
        game.yardsToGo -= yards;
        if (game.yardsToGo <= 0) {
          setMessage(`First Down! +${yards} yards`);
          game.down = 1;
          game.yardsToGo = 10;
        } else {
          game.down++;
          setMessage(`Complete! +${yards} yards`);
        }
      }
    } else if (result === 'incomplete' || result === 'intercepted' || result === 'sack') {
      game.down++;
      if (result === 'intercepted') {
        setMessage('INTERCEPTED!');
      } else if (result === 'sack') {
        setMessage('SACKED!');
        game.fieldPosition = Math.max(1, game.fieldPosition - 5);
      } else {
        setMessage('Incomplete');
      }
    }

    setDown(game.down);
    setYardsToGo(game.yardsToGo);
    setFieldPos(game.fieldPosition);

    if (game.down > 4) {
      // Turnover on downs
      setTimeout(() => {
        if (game.score > highScore) {
          setHighScore(game.score);
          localStorage.setItem('retroball-highscore', game.score.toString());
        }
        setGameState('gameover');
      }, 1500);
    } else {
      setTimeout(() => {
        setMessage('');
        setupPlay();
      }, 1500);
    }
  };

  // Keyboard controls for rushing
  useEffect(() => {
    const handleKeyDown = (e) => {
      const game = gameRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') game.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') game.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') game.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') game.keys.down = true;
    };

    const handleKeyUp = (e) => {
      const game = gameRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') game.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') game.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') game.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') game.keys.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const gameLoop = setInterval(() => {
      const game = gameRef.current;

      if (game.playState === 'running' || game.playState === 'throwing') {
        game.playTimer++;

        // Update receivers
        for (const receiver of game.receivers) {
          if (receiver.caught) continue;

          receiver.routePhase += 0.02;

          // Run routes
          switch (receiver.route) {
            case 'streak':
              receiver.y -= receiver.speed;
              break;
            case 'out':
              if (receiver.routePhase < 1) {
                receiver.y -= receiver.speed;
              } else {
                receiver.x += (receiver.startX < CANVAS_WIDTH / 2 ? -1 : 1) * receiver.speed;
              }
              break;
            case 'slant':
              receiver.y -= receiver.speed * 0.7;
              receiver.x += (receiver.startX < CANVAS_WIDTH / 2 ? 1 : -1) * receiver.speed * 0.5;
              break;
            case 'post':
              if (receiver.routePhase < 1) {
                receiver.y -= receiver.speed;
              } else {
                receiver.y -= receiver.speed * 0.7;
                receiver.x += (receiver.startX < CANVAS_WIDTH / 2 ? 1 : -1) * receiver.speed * 0.5;
              }
              break;
            case 'corner':
              if (receiver.routePhase < 1) {
                receiver.y -= receiver.speed;
              } else {
                receiver.y -= receiver.speed * 0.5;
                receiver.x += (receiver.startX < CANVAS_WIDTH / 2 ? -1 : 1) * receiver.speed * 0.7;
              }
              break;
          }

          // Keep in bounds
          receiver.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, receiver.x));
          receiver.y = Math.max(30, receiver.y);
        }

        // Update defenders
        for (const def of game.defenders) {
          let targetX, targetY;

          if (def.targetReceiver >= 0 && def.targetReceiver < game.receivers.length) {
            const receiver = game.receivers[def.targetReceiver];
            targetX = receiver.x;
            targetY = receiver.y + 15;
          } else {
            // Safety plays zone
            if (game.ball) {
              targetX = game.ballTarget.x;
              targetY = game.ballTarget.y;
            } else {
              targetX = CANVAS_WIDTH / 2;
              targetY = 120;
            }
          }

          const dx = targetX - def.x;
          const dy = targetY - def.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 5) {
            const reaction = game.playState === 'throwing' ? 1 : def.reaction;
            def.x += (dx / dist) * def.speed * reaction;
            def.y += (dy / dist) * def.speed * reaction;
          }
        }

        // Update ball
        if (game.ball && game.ballTarget) {
          const dx = game.ballTarget.x - game.ball.x;
          const dy = game.ballTarget.y - game.ball.y;
          const dist = Math.hypot(dx, dy);

          const ballSpeed = 12;
          if (dist > ballSpeed) {
            game.ball.x += (dx / dist) * ballSpeed;
            game.ball.y += (dy / dist) * ballSpeed;
          } else {
            // Ball arrived
            // Check if defender intercepted
            for (const def of game.defenders) {
              const defDist = Math.hypot(def.x - game.ball.x, def.y - game.ball.y);
              if (defDist < 25) {
                game.playState = 'intercepted';
                endPlay('intercepted');
                return;
              }
            }

            // Catch! Start rushing phase
            game.ballTarget.caught = true;
            game.ballCarrier = game.ballTarget;
            game.catchY = game.ballTarget.y;
            game.ball = null;
            game.playState = 'rushing';
          }
        }

        // Handle rushing (after catch)
        if (game.playState === 'rushing' && game.ballCarrier) {
          const carrier = game.ballCarrier;
          const runSpeed = 4;

          // Move ball carrier with arrow keys
          if (game.keys.left) carrier.x -= runSpeed;
          if (game.keys.right) carrier.x += runSpeed;
          if (game.keys.up) carrier.y -= runSpeed;
          if (game.keys.down) carrier.y += runSpeed * 0.5; // Slower going backward

          // Keep in bounds
          carrier.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, carrier.x));
          carrier.y = Math.max(10, Math.min(CANVAS_HEIGHT - 30, carrier.y));

          // Defenders chase ball carrier
          for (const def of game.defenders) {
            const dx = carrier.x - def.x;
            const dy = carrier.y - def.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 5) {
              def.x += (dx / dist) * (def.speed + 0.5);
              def.y += (dy / dist) * (def.speed + 0.5);
            }

            // Tackle check
            if (dist < 20) {
              game.playState = 'tackled';
              const yardsGained = Math.floor((game.catchY - carrier.y) / 4);

              if (carrier.y <= 60) {
                endPlay('touchdown');
              } else {
                endPlay('complete', Math.max(0, yardsGained));
              }
              break;
            }
          }

          // Touchdown check
          if (carrier.y <= 60) {
            game.playState = 'touchdown';
            endPlay('touchdown');
          }

          // Out of bounds check
          if (carrier.x <= 20 || carrier.x >= CANVAS_WIDTH - 20) {
            const yardsGained = Math.floor((game.catchY - carrier.y) / 4);
            game.playState = 'tackled';
            endPlay('complete', Math.max(0, yardsGained));
          }
        }

        // Sack if timer runs out
        if (game.playTimer > 180 && game.playState === 'running') {
          game.playState = 'sack';
          endPlay('sack');
        }

        // Check receiver openness
        for (let i = 0; i < game.receivers.length; i++) {
          const receiver = game.receivers[i];
          let minDefDist = Infinity;
          for (const def of game.defenders) {
            const dist = Math.hypot(def.x - receiver.x, def.y - receiver.y);
            minDefDist = Math.min(minDefDist, dist);
          }
          receiver.open = minDefDist > 40;
        }
      }

      // Render
      render(ctx, game);
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, highScore]);

  const render = (ctx, game) => {
    // Draw field
    ctx.fillStyle = FIELD_GREEN;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // End zone
    ctx.fillStyle = ENDZONE_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 60);

    // End zone text
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('END ZONE', CANVAS_WIDTH / 2, 45);
    ctx.restore();

    // Yard lines
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    for (let y = 60; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Hash marks
    ctx.lineWidth = 1;
    for (let y = 70; y < CANVAS_HEIGHT; y += 10) {
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 3, y);
      ctx.lineTo(CANVAS_WIDTH / 3 + 10, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH * 2 / 3 - 10, y);
      ctx.lineTo(CANVAS_WIDTH * 2 / 3, y);
      ctx.stroke();
    }

    // Sidelines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(15, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH - 15, 0);
    ctx.lineTo(CANVAS_WIDTH - 15, CANVAS_HEIGHT);
    ctx.stroke();

    // Draw receivers
    for (const receiver of game.receivers) {
      // Shadow
      ctx.beginPath();
      ctx.ellipse(receiver.x + 2, receiver.y + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(receiver.x, receiver.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = receiver.caught ? '#fbbf24' : (receiver.open ? '#22c55e' : '#3b82f6');
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Jersey number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WR', receiver.x, receiver.y);
    }

    // Draw defenders
    for (const def of game.defenders) {
      // Shadow
      ctx.beginPath();
      ctx.ellipse(def.x + 2, def.y + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(def.x, def.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Jersey
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DB', def.x, def.y);
    }

    // Draw QB
    ctx.beginPath();
    ctx.ellipse(game.qb.x + 2, game.qb.y + 12, 12, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // QB aiming line (when running)
    if (game.playState === 'running') {
      const aimLength = 50;
      const aimX = game.qb.x + Math.cos(game.qb.aimAngle) * aimLength;
      const aimY = game.qb.y + Math.sin(game.qb.aimAngle) * aimLength;

      ctx.beginPath();
      ctx.moveTo(game.qb.x, game.qb.y);
      ctx.lineTo(aimX, aimY);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Aim arrow
      const arrowSize = 10;
      const arrowAngle = 0.5;
      ctx.beginPath();
      ctx.moveTo(aimX, aimY);
      ctx.lineTo(
        aimX - arrowSize * Math.cos(game.qb.aimAngle - arrowAngle),
        aimY - arrowSize * Math.sin(game.qb.aimAngle - arrowAngle)
      );
      ctx.moveTo(aimX, aimY);
      ctx.lineTo(
        aimX - arrowSize * Math.cos(game.qb.aimAngle + arrowAngle),
        aimY - arrowSize * Math.sin(game.qb.aimAngle + arrowAngle)
      );
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(game.qb.x, game.qb.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QB', game.qb.x, game.qb.y);

    // Draw ball
    if (game.ball) {
      ctx.beginPath();
      ctx.ellipse(game.ball.x, game.ball.y, 8, 5, Math.atan2(
        game.ballTarget.y - game.ball.y,
        game.ballTarget.x - game.ball.x
      ), 0, Math.PI * 2);
      ctx.fillStyle = '#8B4513';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw play clock
    if (game.playState === 'running') {
      const timeLeft = Math.max(0, 180 - game.playTimer);
      const seconds = (timeLeft / 60).toFixed(1);
      ctx.fillStyle = timeLeft < 60 ? '#ef4444' : '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${seconds}s`, CANVAS_WIDTH - 20, 90);
    }

    // Instructions
    if (game.playState === 'setup') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 30, 300, 60);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click to snap the ball!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Arial';
      ctx.fillText('Then click a receiver to throw', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    // Rushing instructions
    if (game.playState === 'rushing') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT - 50, 240, 35);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Use ARROW KEYS to run!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28);
    }

    // Message
    if (message) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 - 25, 240, 50);
      ctx.fillStyle = message.includes('TOUCHDOWN') ? '#22c55e' :
                      message.includes('INTERCEPT') ? '#ef4444' : '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
    }
  };

  return (
    <div className="retro-ball">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="retro-ball-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />
      <div className="retro-ball-hud">
        <span>Score: {score}</span>
        <span>Down: {down}</span>
        <span>To Go: {yardsToGo}</span>
        <span>Field: {fieldPos} yd</span>
      </div>

      {gameState === 'ready' && (
        <div className="retro-ball-overlay">
          <h2>Retro Ball</h2>
          <p>Lead your team down the field!</p>
          <p className="controls">Click to snap, aim with mouse, click receiver to throw</p>
          <p className="controls">After catch: Use ARROW KEYS to run!</p>
          <p className="controls">Green = OPEN | Score before 4th down!</p>
          <p className="high-score">High Score: {highScore}</p>
          <button className="retro-ball-start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="retro-ball-overlay">
          <h2>Game Over!</h2>
          <p className="final-score">Final Score: {score}</p>
          <p className="high-score">High Score: {highScore}</p>
          <button className="retro-ball-start-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default RetroBall;
