import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Shield, GraduationCap, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup, mockLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signup(email, password, fullName, role)
        setError('Verification email sent! Please check your inbox.')
      } else {
        const user = await login(email, password)
        if (user) navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleQuickLogin(e, roleType, emailStr) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await mockLogin(emailStr, roleType)
      if (user) navigate('/')
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
            <div className="logo-icon">
              {role === 'admin' ? <Shield size={32} /> : role === 'teacher' ? <GraduationCap size={32} /> : <User size={32} />}
            </div>
            <h1>GrowthIQ</h1>
            <p>
              {role === 'admin' ? 'Institutional Oversight & Management' : 
               role === 'teacher' ? 'Classroom Performance & Analytics' : 
               'Personal Academic Progress Tracking'}
            </p>
          </div>

          <div className="auth-toggle">
            <button 
              className={`toggle-btn ${!isSignUp ? 'active' : ''}`} 
              onClick={() => { setIsSignUp(false); setError(''); }}
            >
              Sign In
            </button>
            <button 
              className={`toggle-btn ${isSignUp ? 'active' : ''}`} 
              onClick={() => { setIsSignUp(true); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          <div className="role-tabs">
            <button className={`role-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              <Shield size={16} /> Admin
            </button>
            <button className={`role-tab ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>
              <GraduationCap size={16} /> Teacher
            </button>
            <button className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
              <User size={16} /> Student
            </button>
          </div>

          {error && (
            <div className={`login-error ${error.includes('sent') ? 'success' : ''}`}>
              {error.toLowerCase().includes('rate limit') 
                ? 'Email limit reached. Please disable "Confirm Email" in Supabase Auth settings for development or try again later.' 
                : error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label>Full Name</label>
                <div className="form-input-wrap">
                  <User size={16} />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <div className="form-input-wrap">
                <Mail size={16} />
                <input 
                  type="email" 
                  placeholder={role === 'student' ? "student@institution.edu" : "name@institution.edu"} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="form-input-wrap">
                <Lock size={16} />
                <input 
                  type="password" 
                  placeholder="Enter password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`)}
            </button>
          </form>

          {!isSignUp && (
            <div className="quick-login">
              <div className="quick-login-divider">
                <span>OR QUICK ACCESS</span>
              </div>
              <div className="quick-login-grid">
                <button 
                  type="button"
                  className="quick-btn admin" 
                  onClick={(e) => handleQuickLogin(e, 'admin', 'skbarath424@gmail.com')}
                  title="Login as Administrator"
                >
                  <Shield size={14} /> Admin Demo
                </button>
                <button 
                  type="button"
                  className="quick-btn teacher" 
                  onClick={(e) => handleQuickLogin(e, 'teacher', 'ramesh@greenfield.edu')}
                  title="Login as Teacher"
                >
                  <GraduationCap size={14} /> Teacher Demo
                </button>
                <button 
                  type="button"
                  className="quick-btn student" 
                  onClick={(e) => handleQuickLogin(e, 'student', 'aditya@student.edu')}
                  title="Login as Student"
                >
                  <User size={14} /> Student Demo
                </button>
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="demo-hint">
              {isSignUp ? 'Join our community to start tracking progress.' : 'Quick Access allows you to explore the platform without credentials.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
