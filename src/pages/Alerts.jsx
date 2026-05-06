import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, TrendingDown, Trophy, CheckCircle } from 'lucide-react'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Alerts.css'

export default function Alerts() {
  const { user, isStudent } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAlerts() }, [user])

  async function fetchAlerts() {
    let query = supabase.from('alerts').select('*, students(full_name, roll_number)')
    
    if (isStudent && user?.student?.id) {
      query = query.eq('student_id', user.student.id)
    }

    const { data } = await query.order('created_at', { ascending: false })
    setAlerts(data || [])
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)

  const iconMap = { low_attendance: AlertTriangle, grade_drop: TrendingDown, achievement: Trophy }
  const colorMap = { critical: '#f43f5e', warning: '#f59e0b', info: '#3b82f6' }

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading alerts...</p></div>

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div><h1>Alerts & Notifications</h1><p className="page-subtitle">{alerts.filter(a => !a.is_read).length} unread alerts</p></div>
      </div>

      <div className="filter-bar">
        {['all', 'critical', 'warning', 'info'].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span className="filter-count">{alerts.filter(a => a.severity === f).length}</span>}
          </button>
        ))}
      </div>

      <div className="alerts-feed">
        {filtered.map((a, i) => {
          const Icon = iconMap[a.alert_type] || Bell
          return (
            <div key={a.id} className={`alert-card ${a.is_read ? 'read' : 'unread'}`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="alert-icon" style={{ background: `${colorMap[a.severity]}20`, color: colorMap[a.severity] }}>
                <Icon size={20} />
              </div>
              <div className="alert-body">
                <div className="alert-top">
                  <span className="alert-student-name">{a.students?.full_name}</span>
                  <span className={`severity-tag sev-${a.severity}`}>{a.severity}</span>
                </div>
                <p className="alert-msg">{a.message}</p>
                <div className="alert-meta">
                  <span className="alert-type">{a.alert_type?.replace(/_/g, ' ')}</span>
                  <span className="alert-time">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {!a.is_read && (
                <button className="mark-read-btn" onClick={() => markRead(a.id)} title="Mark as read">
                  <CheckCircle size={18} />
                </button>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && <div className="empty-state"><Bell size={40} /><p>No alerts found</p></div>}
      </div>
    </div>
  )
}
