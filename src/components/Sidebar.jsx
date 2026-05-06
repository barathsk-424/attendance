import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, TrendingUp, Bell, GraduationCap, Menu, X, Brain, LogOut, BookOpen, HeartHandshake, ClipboardEdit, Award } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Sidebar.css'

const adminNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/teachers', label: 'Teachers', icon: GraduationCap },
  { path: '/manage-data', label: 'Manage Data', icon: ClipboardEdit },
  { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/performance', label: 'Performance', icon: TrendingUp },
  { path: '/predictions', label: 'Predictions', icon: Brain },
  { path: '/mentorship', label: 'Mentorship', icon: HeartHandshake },
  { path: '/alerts', label: 'Alerts', icon: Bell },
]

const teacherNav = [
  { path: '/teacher-dashboard', label: 'My Classes', icon: BookOpen },
  { path: '/manage-data', label: 'Manage Data', icon: ClipboardEdit },
  { path: '/students', label: 'All Students', icon: Users },
  { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/performance', label: 'Performance', icon: TrendingUp },
  { path: '/predictions', label: 'Predictions', icon: Brain },
  { path: '/mentorship', label: 'Mentorship', icon: HeartHandshake },
  { path: '/alerts', label: 'Alerts', icon: Bell },
]

const studentNav = [
  { path: '/student-dashboard', label: 'Student Details', icon: LayoutDashboard },
  { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/performance', label: 'Marks', icon: Award },
  { path: '/performance', label: 'Performance', icon: TrendingUp },
  { path: '/predictions', label: 'Prediction', icon: Brain },
  { path: '/mentorship', label: 'Mentorship', icon: HeartHandshake },
  { path: '/alerts', label: 'Alerts', icon: Bell },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth()
  const navigate = useNavigate()

  const navItems = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><TrendingUp size={24} /></div>
          <div className="brand-text">
            <h3>GrowthIQ</h3>
            <span>Academic Intelligence</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path} to={item.path}
              end={item.path === '/' || item.path === '/teacher-dashboard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.path === '/alerts' && <span className="alert-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || user?.full_name || 'User'}</span>
              <span className="user-role">{isAdmin ? 'Admin' : isTeacher ? 'Teacher' : 'Student'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  )
}
