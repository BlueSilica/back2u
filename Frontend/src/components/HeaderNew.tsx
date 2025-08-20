import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Back2U</h1>
          <p className="tagline">Reuniting lost items with their owners</p>
        </div>
        <nav className="nav">
          <a href="#home" className="nav-link">Home</a>
          <a href="#lost-items" className="nav-link">Lost Items</a>
          <a href="#found-items" className="nav-link">Found Items</a>
          <a href="#report" className="nav-link">Report Item</a>
          
          {user ? (
            <div className="user-menu">
              <button 
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="avatar-icon">{user.avatar}</span>
                <span className="user-name">{user.name}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <a href="#dashboard" className="dropdown-item">
                    <span>📊</span> Dashboard
                  </a>
                  <a href="#profile" className="dropdown-item">
                    <span>👤</span> My Profile
                  </a>
                  <a href="#my-items" className="dropdown-item">
                    <span>📋</span> My Items
                  </a>
                  <a href="#settings" className="dropdown-item">
                    <span>⚙️</span> Settings
                  </a>
                  <button onClick={logout} className="dropdown-item logout-btn">
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="#auth" className="nav-link login-btn">
              Login
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
