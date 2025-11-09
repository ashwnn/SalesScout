import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import '@/styles/header.css'

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <img src="/logo.png" alt="Sales Scout Logo" className="logo-icon" />
            <h1>Sales Scout</h1>
          </Link>
        </div>
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <ul className="nav-links">
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/deals">Deals</Link>
                </li>
                <li>
                  <Link to="/queries">Queries</Link>
                </li>
                <li className="dropdown">
                  <div className="dropdown-toggle">
                    {user?.username}
                    <span className="dropdown-icon">▼</span>
                  </div>
                  <ul className="dropdown-menu">
                    <li>
                      <Link to="/profile">Profile</Link>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="logout-btn">
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
            </>
          ) : (
            <ul className="nav-links">
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;