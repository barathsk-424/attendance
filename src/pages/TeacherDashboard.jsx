import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Hash, BookOpen, Users, ArrowRight, Building } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import './TeacherDashboard.css'

const GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#a855f7)', 'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#06b6d4)', 'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#a855f7)', 'linear-gradient(135deg,#06b6d4,#3b82f6)',
]

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user?.teacher_id) fetchAssignments() }, [user])

  async function fetchAssignments() {
    const { data } = await supabase
      .from('class_subjects')
      .select(`
        id, academic_year,
        class:classes(id, name, grade_level, section),
        subject:subjects(id, name, code)
      `)
      .eq('teacher_id', user.teacher_id)

    // Get student counts per class
    const classIds = [...new Set((data || []).map(d => d.class?.id).filter(Boolean))]
    let studentCounts = {}
    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .in('class_id', classIds)
      ;(enrollments || []).forEach(e => {
        studentCounts[e.class_id] = (studentCounts[e.class_id] || 0) + 1
      })
    }

    setAssignments((data || []).map(d => ({ ...d, studentCount: studentCounts[d.class?.id] || 0 })))
    setLoading(false)
  }

  const teacher = user?.teacher
  const initials = user?.name?.split(' ').map(w => w[0]).join('') || '?'

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading dashboard...</p></div>

  return (
    <div className="teacher-dash">
      <div className="page-header">
        <div><h1>Teacher Dashboard</h1><p className="page-subtitle">Welcome back, {user?.name}</p></div>
      </div>

      <div className="teacher-profile-card">
        <div className="teacher-profile-avatar">{initials}</div>
        <div className="teacher-profile-info">
          <h2>{user?.name}</h2>
          <div className="teacher-meta">
            <div className="teacher-meta-item"><Mail size={14} /><span>{user?.email}</span></div>
            <div className="teacher-meta-item"><Hash size={14} /><span>{teacher?.employee_id || 'N/A'}</span></div>
            <div className="teacher-meta-item"><Building size={14} /><span>{teacher?.institution?.name || 'N/A'}</span></div>
          </div>
        </div>
      </div>

      <div className="classes-section">
        <h3><BookOpen size={18} /> My Classes ({assignments.length})</h3>
        <div className="classes-grid">
          {assignments.map((a, i) => (
            <div
              key={a.id}
              className="class-card"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => navigate(`/class-view/${a.class?.id}?subject=${a.subject?.name}`)}
            >
              <div className="class-card-header">
                <div className="class-icon" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                  <BookOpen size={20} />
                </div>
                <ArrowRight size={18} className="class-arrow" />
              </div>
              <h4>{a.class?.name}</h4>
              <div className="class-subject">{a.subject?.name} ({a.subject?.code})</div>
              <div className="class-card-stats">
                <div className="class-stat"><strong>{a.studentCount}</strong>Students</div>
                <div className="class-stat"><strong>{a.academic_year}</strong>Year</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
