import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Siren, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('operator@emergency.ai')
    setPassword('operator123')
    setError('')
  }

  return (
    <div className="min-h-screen bg-emergency-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emergency-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emergency-red/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emergency-red/20 border border-emergency-red/40 mb-4 glow-red">
            <Siren className="w-8 h-8 text-emergency-red" />
          </div>
          <h1 className="text-2xl font-bold text-white">EmergencyAI</h1>
          <p className="text-gray-400 text-sm mt-1">Call Center Decision Support System</p>
        </div>

        {/* Card */}
        <div className="card-glass p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-emergency-blue" />
            <h2 className="text-lg font-bold text-white">Operator Login</h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@emergency.ai"
                className="input-field"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="input-field pr-12"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emergency-blue hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Login to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Demo login */}
          <div className="mt-5 pt-5 border-t border-emergency-border">
            <p className="text-xs text-gray-500 text-center mb-3">Academic Demo Access</p>
            <button
              id="demo-login-btn"
              onClick={fillDemo}
              className="w-full py-2.5 border border-emergency-border hover:border-emergency-blue/50 rounded-xl text-gray-400 hover:text-white text-sm font-medium transition-all duration-200"
            >
              Use Demo Credentials
            </button>
            <div className="mt-3 bg-emergency-navy/50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
              <div>Email: <span className="text-gray-300 font-mono">operator@emergency.ai</span></div>
              <div>Password: <span className="text-gray-300 font-mono">operator123</span></div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Human–AI Collaboration System · Academic Prototype v1.0
        </p>
      </div>
    </div>
  )
}
