import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/common/Alert'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form.email.trim(), form.password)
    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-icon">C</div>
        <div>
          <h1 className="login-brand-name">COLLABRIX</h1>
          <p className="login-brand-tagline">Enterprise Collaboration Platform</p>
        </div>
      </div>

      <div className="login-card">
        <div className="login-card-header">
          <h2>Welcome back</h2>
          <p className="text-muted">Sign in to continue</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <Alert message={error} type="error" onClose={() => setError('')} />

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@collabrix.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !form.email || !form.password}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <details>
            <summary className="text-muted text-sm">Demo credentials</summary>
            <div className="login-demo-credentials">
              <p><strong>Director:</strong> dilip@collabrix.com</p>
              <p><strong>Manager:</strong> kratika@collabrix.com</p>
              <p><strong>Consultant:</strong> praveen@collabrix.com</p>
              <p><strong>Password:</strong> Admin@123</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
