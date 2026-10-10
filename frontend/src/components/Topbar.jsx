import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Logo from './Logo.jsx';

// Desktop: the sidebar carries brand, profile and theme, so the top bar is only shown on small screens.
export default function Topbar({ onMenu }) {
  return (
    <header className="topbar">
      <button className="icon-btn burger" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <Link to="/" className="top-brand">
        <Logo size={26} />
        <span className="wordmark">ARCHE</span>
      </Link>
    </header>
  );
}
