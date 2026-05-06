import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, BookOpen, CalendarCheck, AlertTriangle, TrendingUp, Target, HeartHandshake } from 'lucide-react'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './StudentDetail.css'

function scoreColor(p) { return p >= 80 ? '#10b981' : p >= 60 ? '#3b82f6' : p >= 40 ? '#f59e0b' : '#f43f5e' }

function predictOutcome(percentage, attRate, subjectMarks) {
  let score = 0
  if (percentage >= 60) score += 40; else if (percentage >= 40) score += 20
  if (attRate >= 80) score += 30; else if (attRate >= 60) score += 15
  const weakSubjects = subjectMarks.filter(m => (m.marks_obtained / m.max_marks) * 100 < 40).length
  if (weakSubjects === 0) score += 30; else if (weakSubjects <= 2) score += 15
  const label = score >= 70 ? 'LIKELY PASS' : score >= 40 ? 'AT RISK' : 'LIKELY FAIL'
  const cls = score >= 70 ? 'pass' : score >= 40 ? 'at-risk' : 'fail'
  return { score, label, cls }
}

export default function StudentDetail({ isSelf = false }) {
  const { studentId: paramId } = useParams()
  const { user, isStudent } = useAuth()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  const studentId = isSelf ? user?.student?.id : paramId

  useEffect(() => { 
    if (isStudent && !isSelf && paramId !== user?.student?.id) {
      navigate('/student-dashboard')
      return
    }
    if (studentId) fetchStudent() 
  }, [studentId, isSelf])

  async function fetchStudent() {
    if (!studentId) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('students').select(`
        *, institution:institutions(name),
        student_enrollments(class:classes(name, grade_level, section)),
        semester_results(
          percentage, grade, semester, result_status, total_marks, academic_year,
          semester_subject_marks(marks_obtained, max_marks, subjects(name))
        ),
        attendance(status),
        alerts(alert_type, message, severity, is_read, created_at)
      `).eq('id', studentId).maybeSingle()
      
      if (error) throw error
      setStudent(data)
    } catch (err) {
      console.error('Error fetching student details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading student...</p></div>
  if (!student) return <div className="loading-state"><p>Student not found</p></div>

  const s = student
  const enrollment = s.student_enrollments?.[0]
  const result = s.semester_results?.[0]
  const subjectMarks = result?.semester_subject_marks || []
  const att = s.attendance || []
  const attP = att.filter(a => a.status === 'present').length
  const attA = att.filter(a => a.status === 'absent').length
  const attL = att.filter(a => a.status === 'late').length
  const attRate = att.length ? Math.round((attP / att.length) * 100) : 0
  const alerts = s.alerts || []
  const prediction = predictOutcome(result?.percentage || 0, attRate, subjectMarks)

  return (
    <div className="student-detail">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isSelf && (
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#94a3b8' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div><h1>{isSelf ? 'My Dashboard' : 'Student Profile'}</h1><p className="page-subtitle">Performance tracking & analytics</p></div>
        </div>
      </div>

      <div className="detail-hero">
        <div className="hero-content">
          <div className="hero-avatar">{s.full_name?.[0]}{s.full_name?.split(' ')[1]?.[0] || ''}</div>
          <div className="hero-info">
            <h1>{s.full_name}</h1>
            <div className="hero-badges">
              <span className="hero-badge roll">{s.roll_number}</span>
              <span className="hero-badge class">{enrollment?.class?.name || 'N/A'}</span>
              <span className="hero-badge inst">{s.institution?.name || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="info-cards">
        <div className="info-card"><div className="info-label">Email</div><div className="info-value">{s.email || '—'}</div></div>
        <div className="info-card"><div className="info-label">Phone</div><div className="info-value">{s.phone || '—'}</div></div>
        <div className="info-card"><div className="info-label">DOB</div><div className="info-value">{s.date_of_birth || '—'}</div></div>
        <div className="info-card"><div className="info-label">Admission Year</div><div className="info-value">{s.admission_year || '—'}</div></div>
        <div className="info-card"><div className="info-label">Percentage</div><div className="info-value" style={{ color: scoreColor(result?.percentage || 0) }}>{result?.percentage || 0}%</div></div>
        <div className="info-card"><div className="info-label">Grade</div><div className="info-value">{result?.grade || '—'}</div></div>
      </div>

      <div className="two-col">
        <div className="detail-section">
          <h3><BookOpen size={16} /> Subject-wise Performance</h3>
          <div className="subject-bars">
            {subjectMarks.map((m, i) => {
              const pct = m.max_marks ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0
              const needed = pct < 40 ? Math.ceil(m.max_marks * 0.4 - m.marks_obtained) : 0
              return (
                <div key={i} className="subject-row">
                  <span className="subject-name">{m.subjects?.name}</span>
                  <div className="subject-track"><div className="subject-fill" style={{ width: `${pct}%`, background: scoreColor(pct) }} /></div>
                  <span className="subject-score">{m.marks_obtained}/{m.max_marks}</span>
                  <span className={`subject-improve ${needed > 0 ? 'needs' : 'good'}`}>
                    {needed > 0 ? `+${needed} needed` : '✓ Good'}
                  </span>
                </div>
              )
            })}
            {subjectMarks.length === 0 && <p style={{ color: '#475569', fontSize: '0.85rem' }}>No subject data available</p>}
          </div>
        </div>

        <div>
          <div className="detail-section">
            <h3><Target size={16} /> Prediction</h3>
            <div className="prediction-card">
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Predicted Outcome</div>
              <div className={`prediction-result ${prediction.cls}`}>{prediction.label}</div>
              <div className="prediction-confidence">Confidence Score: {prediction.score}%</div>
              <div className="prediction-bar-wrap">
                <div className="prediction-bar-track">
                  <div className="prediction-bar-fill" style={{ width: `${prediction.score}%`, background: prediction.cls === 'pass' ? '#10b981' : prediction.cls === 'at-risk' ? '#f59e0b' : '#f43f5e' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3><CalendarCheck size={16} /> Attendance</h3>
            <div className="att-row">
              <div className="att-chip"><span className="dot p" /><span>Present</span><strong>{attP}</strong></div>
              <div className="att-chip"><span className="dot a" /><span>Absent</span><strong>{attA}</strong></div>
              <div className="att-chip"><span className="dot l" /><span>Late</span><strong>{attL}</strong></div>
              <div className="att-chip"><span>Rate</span><strong>{attRate}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="detail-section">
          <h3><AlertTriangle size={16} /> Alerts ({alerts.length})</h3>
          <div className="detail-alerts">
            {alerts.map((a, i) => (
              <div key={i} className={`detail-alert ${a.severity}`}>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
