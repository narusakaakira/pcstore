import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password')
      setLoading(false)
      return
    }

    const result = await login(username, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card-surface w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <LogIn className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500">Access your PC Store account</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button className="btn-primary w-full py-4 text-base shadow-lg shadow-brand-primary/20" type="submit" disabled={loading}>
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <button className="font-bold text-brand-primary hover:underline" onClick={() => navigate('/register')}>
            Sign up now
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
