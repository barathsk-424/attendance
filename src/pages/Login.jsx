import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Shield, GraduationCap, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/' : '/teacher-dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function demoLogin(demoRole) {
    setError('')
    setLoading(true)
    try {
      const e = demoRole === 'admin' ? 'admin@growthiq.edu' : 'ramesh@greenfield.edu'
      const p = demoRole === 'admin' ? 'admin123' : 'teacher123'
      setEmail(e)
      setPassword(p)
      const user = await login(e, p)
      navigate(user.role === 'admin' ? '/' : '/teacher-dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">🎓</div>
            <h1>GrowthIQ</h1>
            <p>Academic Growth Intelligence System</p>
          </div>

          <div className="role-tabs">
            <button className={`role-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              <Shield size={16} /> Admin
            </button>
            <button className={`role-tab ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>
              <GraduationCap size={16} /> Teacher
            </button>
          </div>

          {/* Quick Demo Login Buttons */}
          <div className="demo-buttons">
            <button className="demo-btn admin-demo" onClick={() => demoLogin('admin')} disabled={loading}>
              <Zap size={14} /> Quick Admin Login
            </button>
            <button className="demo-btn teacher-demo" onClick={() => demoLogin('teacher')} disabled={loading}>
              <Zap size={14} /> Quick Teacher Login
            </button>
          </div>

          <div className="divider"><span>or sign in manually</span></div>

          {error && <div className="login-error">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="form-input-wrap">
                <Mail size={16} />
                <input type="email" placeholder={role === 'admin' ? 'admin@growthiq.edu' : 'ramesh@greenfield.edu'} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="form-input-wrap">
                <Lock size={16} />
                <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Teacher'}`}
            </button>
          </form>

          <div className="demo-hint">
            <strong>Demo Credentials:</strong><br />
            Admin: <code>admin@growthiq.edu</code> / <code>admin123</code><br />
            Teacher: <code>ramesh@greenfield.edu</code> / <code>teacher123</code>
          </div>
        </div>
      </div>
    </div>
  )
}
