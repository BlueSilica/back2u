import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Footer from './components/Footer'
import Dashboard from './components/Dashboard'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

const AppContent = () => {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home')

  const handleNavigation = (view: 'home' | 'dashboard') => {
    setCurrentView(view)
  }

  return (
    <>
      <Header currentView={currentView} onNavigate={handleNavigation} />
      <main>
        {currentView === 'home' ? (
          <>
            <Hero />
            <Features />
          </>
        ) : user ? (
          <Dashboard />
        ) : (
          <>
            <Hero />
            <Features />
          </>
        )}
      </main>
      {currentView === 'home' && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
