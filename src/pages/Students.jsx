import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, X, User, BookOpen, CalendarCheck, AlertTriangle, Award, ArrowRight } from 'lucide-react'
import supabase from '../lib/supabase'
import './Students.css'

const GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#a855f7)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#a855f7)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#f43f5e,#f59e0b)',
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
]

function gradeClass(grade) {
  if (!grade) return ''
  if (grade.startsWith('A')) return 'grade-A'
  if (grade.startsWith('B')) return 'grade-B'
  if (grade === 'C') return 'grade-C'
  return 'grade-D'
}

function scoreColor(pct) {
  if (pct >= 80) return '#10b981'
  if (pct >= 60) return '#3b82f6'
  if (pct >= 40) return '#f59e0b'
  return '#f43f5e'
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const perPage = 12

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    const { data } = await supabase.from('students').select(`
      *, institution:institutions(name),
      student_enrollments(class:classes(name, grade_level, section)),
      semester_results(percentage, grade, semester, result_status)
    `).order('roll_number')
    setStudents(data || [])
    setLoading(false)
  }

  const openDetail = useCallback(async (student) => {
    setSelected(student)
    setDetailLoading(true)
    const { data } = await supabase.from('students').select(`
      *, institution:institutions(name),
      student_enrollments(class:classes(name, grade_level, section)),
      semester_results(
        percentage, grade, semester, result_status, total_marks, academic_year,
        semester_subject_marks(marks_obtained, max_marks, subjects(name))
      ),
      attendance(status),
      alerts(alert_type, message, severity, is_read, created_at)
    `).eq('id', student.id).single()
    setDetail(data)
    setDetailLoading(false)
  }, [])

  const closeDetail = useCallback(() => { setSelected(null); setDetail(null) }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeDetail() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDetail])

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

  if (loading) return (
    <div className="loading-state"><div className="spinner" /><p>Loading students...</p></div>
  )

  return (
    <div className="students-page">
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p className="page-subtitle">Academic Growth Intelligence System</p>
        </div>
      </div>

      <div className="students-toolbar">
        <div className="students-search">
          <Search size={18} />
          <input
            placeholder="Search by name, roll number, or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className="student-count-badge">{filtered.length} Students</div>
      </div>

      <div className="students-grid">
        {paginated.map((s, i) => {
          const enrollment = s.student_enrollments?.[0]
          const result = s.semester_results?.[0]
          const pct = result?.percentage ?? 0
          const circumference = 2 * Math.PI * 16
          const offset = circumference - (pct / 100) * circumference

          return (
            <div
              key={s.id}
              className="student-card"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => openDetail(s)}
            >
              <div className="card-header">
                <div className="card-avatar" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                  {s.full_name?.[0]}
                </div>
                <div className="card-identity">
                  <div className="card-name">{s.full_name}</div>
                  <div className="card-email">{s.email || s.roll_number}</div>
                </div>
              </div>

              <div className="card-meta">
                <div className="meta-item">
                  <div className="meta-label">Roll No</div>
                  <div className="meta-value">{s.roll_number || '—'}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Class</div>
                  <div className="meta-value">{enrollment?.class?.name || '—'}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Institution</div>
                  <div className="meta-value">{s.institution?.name || '—'}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Status</div>
                  <div className="meta-value">{result?.result_status === 'pass' ? '✅ Pass' : result?.result_status === 'fail' ? '❌ Fail' : '—'}</div>
                </div>
              </div>

              <div className="card-footer">
                <div className="score-ring">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle className="ring-bg" cx="22" cy="22" r="16" fill="none" strokeWidth="3" />
                    <circle
                      className="ring-fill" cx="22" cy="22" r="16" fill="none"
                      strokeWidth="3" stroke={scoreColor(pct)}
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="score-text">{pct}%</span>
                </div>
                {result?.grade && (
                  <span className={`grade-chip ${gradeClass(result.grade)}`}>{result.grade}</span>
                )}
                <span className="view-details-hint">View <ArrowRight size={12} /></span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state"><User size={48} /><p>No students found</p></div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
          <span className="page-info">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
        </div>
      )}

      {selected && (
        <StudentDetailModal
          student={selected}
          detail={detail}
          loading={detailLoading}
          onClose={closeDetail}
          gradient={GRADIENTS[students.indexOf(selected) % GRADIENTS.length]}
        />
      )}
    </div>
  )
}

function StudentDetailModal({ student, detail, loading, onClose, gradient }) {
  const s = detail || student
  const enrollment = s.student_enrollments?.[0]
  const result = s.semester_results?.[0]
  const subjectMarks = result?.semester_subject_marks || []

  // Attendance stats
  const att = s.attendance || []
  const attPresent = att.filter(a => a.status === 'present').length
  const attAbsent = att.filter(a => a.status === 'absent').length
  const attLate = att.filter(a => a.status === 'late').length

  const alerts = s.alerts || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-hero">
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
          <div className="modal-profile">
            <div className="modal-avatar" style={{ background: gradient }}>
              {s.full_name?.[0]}{s.full_name?.split(' ')[1]?.[0] || ''}
            </div>
            <div className="modal-identity">
              <h2>{s.full_name}</h2>
              <span className="modal-roll">{s.roll_number}</span>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state"><div className="spinner" /><p>Loading details...</p></div>
          ) : (
            <>
              {/* Personal Info */}
              <div className="modal-section">
                <div className="section-title"><User size={14} /> Personal Information</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{s.email || '—'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Phone</div>
                    <div className="detail-value">{s.phone || '—'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Date of Birth</div>
                    <div className="detail-value">{s.date_of_birth || '—'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Admission Year</div>
                    <div className="detail-value">{s.admission_year || '—'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Class</div>
                    <div className="detail-value">{enrollment?.class?.name || '—'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Institution</div>
                    <div className="detail-value">{s.institution?.name || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Subject Performance */}
              {subjectMarks.length > 0 && (
                <div className="modal-section">
                  <div className="section-title"><BookOpen size={14} /> Subject Performance</div>
                  <div className="performance-bars">
                    {subjectMarks.map((m, i) => {
                      const pct = m.max_marks ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0
                      return (
                        <div key={i} className="perf-bar-row">
                          <span className="perf-bar-label">{m.subjects?.name || 'Subject'}</span>
                          <div className="perf-bar-track">
                            <div
                              className="perf-bar-fill"
                              style={{ width: `${pct}%`, background: scoreColor(pct) }}
                            />
                          </div>
                          <span className="perf-bar-value">{m.marks_obtained}/{m.max_marks}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Overall Result */}
              {result && (
                <div className="modal-section">
                  <div className="section-title"><Award size={14} /> Semester Result</div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Percentage</div>
                      <div className="detail-value" style={{ color: scoreColor(result.percentage) }}>{result.percentage}%</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Grade</div>
                      <div className="detail-value">{result.grade}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Total Marks</div>
                      <div className="detail-value">{result.total_marks || '—'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Status</div>
                      <div className="detail-value">{result.result_status === 'pass' ? '✅ Pass' : '❌ Fail'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance */}
              {att.length > 0 && (
                <div className="modal-section">
                  <div className="section-title"><CalendarCheck size={14} /> Attendance Overview</div>
                  <div className="attendance-summary">
                    <div className="att-stat"><span className="att-dot present" /><span className="att-stat-label">Present</span><span className="att-stat-value">{attPresent}</span></div>
                    <div className="att-stat"><span className="att-dot absent" /><span className="att-stat-label">Absent</span><span className="att-stat-value">{attAbsent}</span></div>
                    <div className="att-stat"><span className="att-dot late" /><span className="att-stat-label">Late</span><span className="att-stat-value">{attLate}</span></div>
                    <div className="att-stat"><span className="att-stat-label">Rate</span><span className="att-stat-value">{att.length ? Math.round((attPresent / att.length) * 100) : 0}%</span></div>
                  </div>
                </div>
              )}

              {/* Alerts */}
              {alerts.length > 0 && (
                <div className="modal-section">
                  <div className="section-title"><AlertTriangle size={14} /> Alerts ({alerts.length})</div>
                  <div className="modal-alerts">
                    {alerts.slice(0, 5).map((a, i) => (
                      <div key={i} className={`modal-alert-item ${a.severity}`}>
                        <span className="modal-alert-msg">{a.message}</span>
                        <span className="modal-alert-time">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
