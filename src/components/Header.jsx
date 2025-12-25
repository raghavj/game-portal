import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-icon">🎮</span>
        <span className="logo-text">GameZone</span>
      </Link>
    </header>
  );
}

export default Header;
