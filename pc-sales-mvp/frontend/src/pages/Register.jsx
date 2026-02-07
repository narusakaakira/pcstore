import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/')
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const result = await register(formData.username, formData.email, formData.password)
    
    if (result.success) {
      // Redirect to login with success message
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } })
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="card-surface w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
            <p className="text-sm text-slate-500">Join the PC Store community</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm"
              placeholder="Choose a username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              autoFocus
            />
            <p className="text-[10px] text-slate-400 font-medium ml-1">At least 3 characters</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm"
              placeholder="Enter your email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm"
                placeholder="Enter a password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
            <p className="text-[10px] text-slate-400 font-medium ml-1">At least 6 characters</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm"
                placeholder="Repeat your password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button className="btn-primary w-full py-4 text-base shadow-lg shadow-brand-primary/20 mt-4" type="submit" disabled={loading}>
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <button className="font-bold text-brand-primary hover:underline" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default Register
