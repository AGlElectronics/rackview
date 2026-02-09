import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav>
      <div className="logo" onClick={() => window.location.href = '/'}>
        MyHomelab
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/gear" className={location.pathname === '/gear' ? 'active' : ''}>
          Hardware
        </Link>
        <Link to="/network-map" className={location.pathname === '/network-map' ? 'active' : ''}>
          Network Map
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
