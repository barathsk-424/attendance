import { useState, useEffect } from 'react'
import { TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import './Performance.css'

function predict(pct, attRate) {
  let s = 0
  if (pct >= 60) s += 45; else if (pct >= 40) s += 20
  if (attRate >= 80) s += 30; else if (attRate >= 60) s += 15
  s += Math.min(25, Math.round(pct / 4))
  return { score: Math.min(100, s), label: s >= 70 ? 'Pass' : s >= 40 ? 'At Risk' : 'Fail', cls: s >= 70 ? 'pass' : s >= 40 ? 'at-risk' : 'fail' }
}

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#a855f7', '#3b82f6']

export default function Predictions() {
  const { user, isStudent } = useAuth()
  const [students, setStudents] = useState([])
  const [distro, setDistro] = useState([])
  const [subjectRisk, setSubjectRisk] = useState([])
  const [stats, setStats] = useState({ pass: 0, atRisk: 0, fail: 0, avg: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [user])

  async function fetchData() {
    let semQuery = supabase.from('semester_results').select('student_id, percentage, grade, result_status, students(full_name, roll_number)')
    let attQuery = supabase.from('attendance').select('student_id, status')
    let marksQuery = supabase.from('semester_subject_marks').select('marks_obtained, max_marks, subjects(name), semester_results!inner(student_id)')

    if (isStudent && user?.student?.id) {
      semQuery = semQuery.eq('student_id', user.student.id)
      attQuery = attQuery.eq('student_id', user.student.id)
      marksQuery = marksQuery.eq('semester_results.student_id', user.student.id)
    }

    const [semRes, attRes, marksRes] = await Promise.all([
      semQuery,
      attQuery,
      marksQuery
    ])

    // Per-student attendance rates
    const attMap = {}
    ;(attRes.data || []).forEach(a => {
      if (!attMap[a.student_id]) attMap[a.student_id] = { p: 0, t: 0 }
      attMap[a.student_id].t++
      if (a.status === 'present') attMap[a.student_id].p++
    })

    // Predictions
    const predicted = (semRes.data || []).map(r => {
      const att = attMap[r.student_id]
      const attRate = att ? Math.round((att.p / att.t) * 100) : 50
      const pred = predict(r.percentage, attRate)
      return { ...r, attRate, prediction: pred }
    })

    const pass = predicted.filter(p => p.prediction.cls === 'pass').length
    const atRisk = predicted.filter(p => p.prediction.cls === 'at-risk').length
    const fail = predicted.filter(p => p.prediction.cls === 'fail').length
    const avg = predicted.length ? Math.round(predicted.reduce((s, p) => s + p.prediction.score, 0) / predicted.length) : 0

    setStudents(predicted.sort((a, b) => a.prediction.score - b.prediction.score))
    setStats({ pass, atRisk, fail, avg })
    setDistro([
      { name: 'Likely Pass', value: pass, color: '#10b981' },
      { name: 'At Risk', value: atRisk, color: '#f59e0b' },
      { name: 'Likely Fail', value: fail, color: '#f43f5e' },
    ])

    // Subject risk
    const subjMap = {}
    ;(marksRes.data || []).forEach(m => {
      const n = m.subjects?.name || 'Unknown'
      if (!subjMap[n]) subjMap[n] = { total: 0, count: 0, below: 0 }
      subjMap[n].total += m.marks_obtained
      subjMap[n].count++
      if (m.max_marks && (m.marks_obtained / m.max_marks) * 100 < 40) subjMap[n].below++
    })
    setSubjectRisk(Object.entries(subjMap).map(([name, d]) => ({
      subject: name, average: Math.round(d.total / d.count), atRisk: d.below, fullMark: 100
    })))
    setLoading(false)
  }

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Analyzing data...</p></div>

  return (
    <div className="performance-page">
      <div className="page-header">
        <div><h1>Predictive Analytics</h1><p className="page-subtitle">AI-powered performance predictions</p></div>
      </div>

      <div className="stats-grid">
        <StatCard title="Likely Pass" value={stats.pass} icon={CheckCircle} color="emerald" trend="Students predicted to pass" trendUp />
        <StatCard title="At Risk" value={stats.atRisk} icon={AlertTriangle} color="amber" trend="Need intervention" />
        <StatCard title="Likely Fail" value={stats.fail} icon={XCircle} color="rose" trend="Immediate attention" />
        <StatCard title="Avg Confidence" value={`${stats.avg}%`} icon={TrendingUp} color="indigo" />
      </div>

      {!isStudent && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Prediction Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={distro} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {distro.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Subject Risk Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={subjectRisk}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <Radar name="Average" dataKey="average" stroke="#6366f1" fill="rgba(99,102,241,0.2)" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isStudent && students[0] && (
        <div className="prediction-focus-card">
          <div className={`status-badge big status-${students[0].prediction.cls === 'pass' ? 'present' : students[0].prediction.cls === 'fail' ? 'absent' : 'late'}`}>
            {students[0].prediction.label}
          </div>
          <div className="confidence-label">AI Confidence Score: {students[0].prediction.score}%</div>
          <div className="prediction-advice">
            {students[0].prediction.cls === 'pass' 
              ? "Keep up the great work! Your consistent performance and attendance suggest a strong outcome." 
              : "Focus on improving your attendance and reviewing weak subjects to boost your chances of success."}
          </div>
        </div>
      )}

      <div className="table-section">
        <h3>Student Predictions (Sorted by Risk)</h3>
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Score</th><th>Attendance</th><th>Confidence</th><th>Prediction</th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id}>
                  <td><div className="student-cell"><div className="avatar">{s.students?.full_name?.[0]}</div><div><div className="cell-name">{s.students?.full_name}</div><div className="cell-email">{s.students?.roll_number}</div></div></div></td>
                  <td><span className="score-pill">{s.percentage}%</span></td>
                  <td>{s.attRate}%</td>
                  <td><span className="score-pill">{s.prediction.score}%</span></td>
                  <td><span className={`status-badge status-${s.prediction.cls === 'pass' ? 'present' : s.prediction.cls === 'fail' ? 'absent' : 'late'}`}>{s.prediction.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
