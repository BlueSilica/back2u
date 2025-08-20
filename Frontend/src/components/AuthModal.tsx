import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const { login, signup, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      let success = false
      if (isLogin) {
        success = await login(formData.email, formData.password)
      } else {
        success = await signup(formData.name, formData.email, formData.password)
      }

      if (success) {
        onClose()
        setFormData({ name: '', email: '', password: '' })
      } else {
        setError(isLogin ? 'Invalid email or password' : 'Account creation failed')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>×</button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{isLogin ? 'Welcome Back!' : 'Join Back2U'}</h2>
          <p className="text-gray-600">{isLogin ? 'Sign in to your account' : 'Create your account to start'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={isLogin ? 'john@example.com' : 'Enter your email'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={isLogin ? 'password123' : 'Create a secure password'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              className="text-primary-500 font-medium ml-1 hover:underline"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setFormData({ name: '', email: '', password: '' })
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-2">Demo Accounts (for testing):</p>
            <div className="flex gap-2">
              <button 
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm hover:bg-blue-50"
                onClick={() => setFormData({ ...formData, email: 'john@example.com', password: 'password123' })}
              >
                👨‍💼 John Doe
              </button>
              <button 
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm hover:bg-blue-50"
                onClick={() => setFormData({ ...formData, email: 'sarah@example.com', password: 'password123' })}
              >
                👩‍🦳 Sarah Johnson
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthModal
