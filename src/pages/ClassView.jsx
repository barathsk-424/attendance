import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, ArrowRight } from 'lucide-react'
import supabase from '../lib/supabase'
import './Students.css'

const GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#a855f7)', 'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#06b6d4)', 'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#a855f7)', 'linear-gradient(135deg,#06b6d4,#3b82f6)',
]

function scoreColor(pct) {
  if (pct >= 80) return '#10b981'
  if (pct >= 60) return '#3b82f6'
  if (pct >= 40) return '#f59e0b'
  return '#f43f5e'
}
function gradeClass(g) {
  if (!g) return ''
  if (g.startsWith('A')) return 'grade-A'
  if (g.startsWith('B')) return 'grade-B'
  if (g === 'C') return 'grade-C'
  return 'grade-D'
}

export default function ClassView() {
  const { classId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [classInfo, setClassInfo] = useState(null)
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const subjectName = searchParams.get('subject') || ''

  useEffect(() => { fetchData() }, [classId])

  async function fetchData() {
    const [classRes, enrollRes] = await Promise.all([
      supabase.from('classes').select('*, institution:institutions(name)').eq('id', classId).single(),
      supabase.from('student_enrollments').select(`
        student:students(
          id, full_name, roll_number, email, avatar_url,
          semester_results(percentage, grade, result_status, semester)
        )
      `).eq('class_id', classId)
    ])
    setClassInfo(classRes.data)
    setStudents((enrollRes.data || []).map(e => e.student).filter(Boolean))
    setLoading(false)
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading class...</p></div>

  return (
    <div className="students-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#94a3b8' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>{classInfo?.name || 'Class'}</h1>
            <p className="page-subtitle">{subjectName} · {filtered.length} students</p>
          </div>
        </div>
      </div>

      <div className="students-toolbar">
        <div className="students-search">
          <Search size={18} />
          <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="student-count-badge">{filtered.length} Students</div>
      </div>

      <div className="students-grid">
        {filtered.map((s, i) => {
          const result = s.semester_results?.[0]
          const pct = result?.percentage ?? 0
          const circumference = 2 * Math.PI * 16
          const offset = circumference - (pct / 100) * circumference
          return (
            <div key={s.id} className="student-card" style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => navigate(`/student/${s.id}`)}>
              <div className="card-header">
                <div className="card-avatar" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>{s.full_name?.[0]}</div>
                <div className="card-identity">
                  <div className="card-name">{s.full_name}</div>
                  <div className="card-email">{s.roll_number}</div>
                </div>
              </div>
              <div className="card-meta">
                <div className="meta-item"><div className="meta-label">Roll No</div><div className="meta-value">{s.roll_number}</div></div>
                <div className="meta-item"><div className="meta-label">Status</div><div className="meta-value">{result?.result_status === 'pass' ? '✅ Pass' : result?.result_status === 'fail' ? '❌ Fail' : '—'}</div></div>
              </div>
              <div className="card-footer">
                <div className="score-ring">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle className="ring-bg" cx="22" cy="22" r="16" fill="none" strokeWidth="3" />
                    <circle className="ring-fill" cx="22" cy="22" r="16" fill="none" strokeWidth="3" stroke={scoreColor(pct)} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                  </svg>
                  <span className="score-text">{pct}%</span>
                </div>
                {result?.grade && <span className={`grade-chip ${gradeClass(result.grade)}`}>{result.grade}</span>}
                <span className="view-details-hint">Details <ArrowRight size={12} /></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
