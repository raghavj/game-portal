import { useState, useEffect, useCallback, useRef } from 'react';
import './CookieClicker.css';

const UPGRADES = [
  { id: 'cursor', name: 'Cursor', baseCost: 15, cps: 0.1, icon: '👆' },
  { id: 'grandma', name: 'Grandma', baseCost: 100, cps: 1, icon: '👵' },
  { id: 'farm', name: 'Farm', baseCost: 1100, cps: 8, icon: '🌾' },
  { id: 'mine', name: 'Mine', baseCost: 12000, cps: 47, icon: '⛏️' },
  { id: 'factory', name: 'Factory', baseCost: 130000, cps: 260, icon: '🏭' },
  { id: 'bank', name: 'Bank', baseCost: 1400000, cps: 1400, icon: '🏦' },
];

const CLICK_UPGRADES = [
  { id: 'click1', name: 'Reinforced Finger', cost: 100, bonus: 1, requirement: 0 },
  { id: 'click2', name: 'Carpal Tunnel Prevention', cost: 500, bonus: 2, requirement: 100 },
  { id: 'click3', name: 'Ambidextrous', cost: 5000, bonus: 5, requirement: 500 },
  { id: 'click4', name: 'Thousand Fingers', cost: 50000, bonus: 10, requirement: 2000 },
];

function CookieClicker() {
  const [cookies, setCookies] = useState(() => {
    const saved = localStorage.getItem('cookieclicker-save');
    return saved ? JSON.parse(saved).cookies || 0 : 0;
  });

  const [totalCookies, setTotalCookies] = useState(() => {
    const saved = localStorage.getItem('cookieclicker-save');
    return saved ? JSON.parse(saved).totalCookies || 0 : 0;
  });

  const [owned, setOwned] = useState(() => {
    const saved = localStorage.getItem('cookieclicker-save');
    return saved ? JSON.parse(saved).owned || {} : {};
  });

  const [clickUpgrades, setClickUpgrades] = useState(() => {
    const saved = localStorage.getItem('cookieclicker-save');
    return saved ? JSON.parse(saved).clickUpgrades || [] : [];
  });

  const [clicks, setClicks] = useState([]);
  const [cookieScale, setCookieScale] = useState(1);

  const cookiesRef = useRef(cookies);
  cookiesRef.current = cookies;

  const getCost = (upgrade) => {
    const count = owned[upgrade.id] || 0;
    return Math.floor(upgrade.baseCost * Math.pow(1.15, count));
  };

  const getCPS = useCallback(() => {
    return UPGRADES.reduce((total, upgrade) => {
      const count = owned[upgrade.id] || 0;
      return total + count * upgrade.cps;
    }, 0);
  }, [owned]);

  const getClickPower = useCallback(() => {
    let power = 1;
    CLICK_UPGRADES.forEach(upgrade => {
      if (clickUpgrades.includes(upgrade.id)) {
        power += upgrade.bonus;
      }
    });
    return power;
  }, [clickUpgrades]);

  const handleCookieClick = (e) => {
    const power = getClickPower();
    setCookies(prev => prev + power);
    setTotalCookies(prev => prev + power);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now() + Math.random();
    setClicks(prev => [...prev, { id, x, y, value: power }]);

    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 1000);

    setCookieScale(0.95);
    setTimeout(() => setCookieScale(1), 100);
  };

  const buyUpgrade = (upgrade) => {
    const cost = getCost(upgrade);
    if (cookies >= cost) {
      setCookies(prev => prev - cost);
      setOwned(prev => ({
        ...prev,
        [upgrade.id]: (prev[upgrade.id] || 0) + 1
      }));
    }
  };

  const buyClickUpgrade = (upgrade) => {
    if (cookies >= upgrade.cost && !clickUpgrades.includes(upgrade.id) && totalCookies >= upgrade.requirement) {
      setCookies(prev => prev - upgrade.cost);
      setClickUpgrades(prev => [...prev, upgrade.id]);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const cps = getCPS();
      if (cps > 0) {
        setCookies(prev => prev + cps / 10);
        setTotalCookies(prev => prev + cps / 10);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [getCPS]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('cookieclicker-save', JSON.stringify({
        cookies: cookiesRef.current,
        totalCookies,
        owned,
        clickUpgrades
      }));
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [totalCookies, owned, clickUpgrades]);

  useEffect(() => {
    return () => {
      localStorage.setItem('cookieclicker-save', JSON.stringify({
        cookies: cookiesRef.current,
        totalCookies,
        owned,
        clickUpgrades
      }));
    };
  }, [totalCookies, owned, clickUpgrades]);

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
  };

  const cps = getCPS();
  const clickPower = getClickPower();

  const resetGame = () => {
    if (confirm('Are you sure you want to reset all progress?')) {
      setCookies(0);
      setTotalCookies(0);
      setOwned({});
      setClickUpgrades([]);
      localStorage.removeItem('cookieclicker-save');
    }
  };

  return (
    <div className="cookie-clicker-game">
      <div className="cookie-section">
        <div className="cookie-count">{formatNumber(cookies)} cookies</div>
        <div className="cps-display">per second: {cps.toFixed(1)}</div>

        <div
          className="big-cookie"
          onClick={handleCookieClick}
          style={{ transform: `scale(${cookieScale})` }}
        >
          <div className="cookie-inner">
            <div className="cookie-chip"></div>
            <div className="cookie-chip"></div>
            <div className="cookie-chip"></div>
            <div className="cookie-chip"></div>
            <div className="cookie-chip"></div>
            <div className="cookie-chip"></div>
            <div className="cookie-chip"></div>
          </div>
          {clicks.map(click => (
            <div
              key={click.id}
              className="click-popup"
              style={{ left: click.x, top: click.y }}
            >
              +{click.value}
            </div>
          ))}
        </div>

        <div className="click-power">Click power: +{clickPower}</div>
      </div>

      <div className="shop-section">
        <div className="shop-header">Shop</div>

        <div className="shop-category">Buildings</div>
        <div className="upgrades-list">
          {UPGRADES.map(upgrade => {
            const cost = getCost(upgrade);
            const count = owned[upgrade.id] || 0;
            const canAfford = cookies >= cost;

            return (
              <div
                key={upgrade.id}
                className={`upgrade-item ${canAfford ? 'can-afford' : ''}`}
                onClick={() => buyUpgrade(upgrade)}
              >
                <div className="upgrade-icon">{upgrade.icon}</div>
                <div className="upgrade-info">
                  <div className="upgrade-name">{upgrade.name}</div>
                  <div className="upgrade-cost">{formatNumber(cost)} cookies</div>
                </div>
                <div className="upgrade-owned">{count}</div>
              </div>
            );
          })}
        </div>

        <div className="shop-category">Click Upgrades</div>
        <div className="upgrades-list">
          {CLICK_UPGRADES.map(upgrade => {
            const owned = clickUpgrades.includes(upgrade.id);
            const canAfford = cookies >= upgrade.cost && totalCookies >= upgrade.requirement;
            const locked = totalCookies < upgrade.requirement;

            return (
              <div
                key={upgrade.id}
                className={`upgrade-item click-upgrade ${owned ? 'owned' : ''} ${canAfford && !owned ? 'can-afford' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => !owned && buyClickUpgrade(upgrade)}
              >
                <div className="upgrade-icon">👆</div>
                <div className="upgrade-info">
                  <div className="upgrade-name">{upgrade.name}</div>
                  {locked ? (
                    <div className="upgrade-cost">Need {formatNumber(upgrade.requirement)} total cookies</div>
                  ) : owned ? (
                    <div className="upgrade-cost owned-text">Owned</div>
                  ) : (
                    <div className="upgrade-cost">{formatNumber(upgrade.cost)} cookies (+{upgrade.bonus} per click)</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button className="reset-button" onClick={resetGame}>Reset Game</button>
      </div>
    </div>
  );
}

export default CookieClicker;
