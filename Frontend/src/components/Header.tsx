import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

interface HeaderProps {
  currentView?: 'home' | 'dashboard'
  onNavigate?: (view: 'home' | 'dashboard') => void
}

const Header = ({ currentView = 'home', onNavigate }: HeaderProps) => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleNavClick = (view: 'home' | 'dashboard') => {
    if (onNavigate) {
      onNavigate(view)
    }
    setShowUserMenu(false)
  }

  return (
    <>
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-center flex-wrap">
          <div className="logo cursor-pointer" onClick={() => handleNavClick('home')}>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
              Back2U
            </h1>
            <p className="text-sm opacity-90 italic">Reuniting lost items with their owners</p>
          </div>
          
          <nav className="flex gap-8 items-center">
            <button 
              onClick={() => handleNavClick('home')}
              className={`nav-link hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 font-medium hover:-translate-y-1 ${
                currentView === 'home' ? 'bg-white/20' : ''
              }`}
            >
              Home
            </button>
            <a href="#lost-items" className="nav-link hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 font-medium hover:-translate-y-1">
              Lost Items
            </a>
            <a href="#found-items" className="nav-link hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 font-medium hover:-translate-y-1">
              Found Items
            </a>
            <a href="#report" className="nav-link hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 font-medium hover:-translate-y-1">
              Report Item
            </a>
            
            {user ? (
              <div className="relative">
                <button 
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all duration-300"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="text-2xl">{user.avatar}</span>
                  <span className="font-medium">{user.name}</span>
                  <span className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button 
                      onClick={() => handleNavClick('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors ${
                        currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <span>📊</span> Dashboard
                    </button>
                    <a href="#profile" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                      <span>👤</span> My Profile
                    </a>
                    <a href="#my-items" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                      <span>📋</span> My Items
                    </a>
                    <a href="#settings" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                      <span>⚙️</span> Settings
                    </a>
                    <hr className="my-2 border-gray-200" />
                    <button 
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                        handleNavClick('home')
                      }} 
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-primary-500 px-6 py-2 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}

export default Header
