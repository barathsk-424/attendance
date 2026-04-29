import { useState, useEffect } from 'react'
import { GraduationCap, Mail, Phone, BookOpen } from 'lucide-react'
import supabase from '../lib/supabase'
import './Teachers.css'

export default function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    const { data } = await supabase.from('teachers').select('*, institution:institutions(name)').order('full_name')
    setTeachers(data || [])
    setLoading(false)
  }

  const gradients = [
    'linear-gradient(135deg,#6366f1,#a855f7)',
    'linear-gradient(135deg,#3b82f6,#06b6d4)',
    'linear-gradient(135deg,#10b981,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#ec4899,#a855f7)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#f43f5e,#f59e0b)',
    'linear-gradient(135deg,#a855f7,#6366f1)',
  ]

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading teachers...</p></div>

  return (
    <div className="teachers-page">
      <div className="page-header">
        <div><h1>Faculty Directory</h1><p className="page-subtitle">{teachers.length} teachers across all institutions</p></div>
      </div>
      <div className="teachers-grid">
        {teachers.map((t, i) => (
          <div key={t.id} className="teacher-card" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="teacher-avatar" style={{ background: gradients[i % gradients.length] }}>
              {t.full_name?.[0]}{t.full_name?.split(' ')[1]?.[0] || ''}
            </div>
            <h4 className="teacher-name">{t.full_name}</h4>
            <span className="teacher-id">{t.employee_id}</span>
            <div className="teacher-details">
              <div className="detail-row"><Mail size={14} /><span>{t.email}</span></div>
              <div className="detail-row"><Phone size={14} /><span>{t.phone}</span></div>
              <div className="detail-row"><GraduationCap size={14} /><span>{t.institution?.name}</span></div>
              {t.specialization?.length > 0 && (
                <div className="specializations">
                  {t.specialization.map((s, j) => <span key={j} className="spec-tag">{s}</span>)}
                </div>
              )}
            </div>
            <div className={`status-indicator ${t.is_active ? 'active' : 'inactive'}`}>
              {t.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
