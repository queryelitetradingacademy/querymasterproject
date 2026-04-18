import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, loading } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter email and password')
    const res = await login(email, password)
    if (res.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(res.message || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 dark:from-dark-950 dark:to-dark-900 flex items-center justify-center p-4">
      <button onClick={toggle} className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-dark-800 shadow text-lg">
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg shadow-primary-600/30">Q</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">QueryMaster</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Professional Management Platform</p>
        </div>

        <div className="card p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Sign In</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" className="input pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Access is managed by administrator only
        </p>
      </div>
    </div>
  )
}
