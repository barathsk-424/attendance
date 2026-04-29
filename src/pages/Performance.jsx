import { useState, useEffect } from 'react'
import { TrendingUp, Award, BarChart3, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import supabase from '../lib/supabase'
import StatCard from '../components/StatCard'
import './Performance.css'

export default function Performance() {
  const [results, setResults] = useState([])
  const [subjectAvgs, setSubjectAvgs] = useState([])
  const [classAvgs, setClassAvgs] = useState([])
  const [stats, setStats] = useState({ avg: 0, top: 0, pass: 0, fail: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [semRes, marksRes] = await Promise.all([
      supabase.from('semester_results').select('*, students(full_name, roll_number), classes:class_id(name)').order('percentage', { ascending: false }),
      supabase.from('semester_subject_marks').select('marks_obtained, max_marks, subjects(name), semester_results!inner(classes:class_id(name))')
    ])

    const sem = semRes.data || []
    setResults(sem)

    const avg = sem.length ? Math.round(sem.reduce((s, r) => s + r.percentage, 0) / sem.length) : 0
    const pass = sem.filter(r => r.result_status === 'pass').length
    const fail = sem.filter(r => r.result_status === 'fail').length
    setStats({ avg, top: sem[0]?.percentage || 0, pass, fail })

    // Subject averages
    const subjMap = {}
    ;(marksRes.data || []).forEach(m => {
      const name = m.subjects?.name || 'Unknown'
      if (!subjMap[name]) subjMap[name] = { total: 0, count: 0 }
      subjMap[name].total += m.marks_obtained
      subjMap[name].count++
    })
    setSubjectAvgs(Object.entries(subjMap).map(([name, d]) => ({
      subject: name, average: Math.round(d.total / d.count), fullMark: 100
    })))

    // Class averages
    const classMap = {}
    sem.forEach(r => {
      const cn = r.classes?.name || 'Unknown'
      if (!classMap[cn]) classMap[cn] = { total: 0, count: 0 }
      classMap[cn].total += r.percentage
      classMap[cn].count++
    })
    setClassAvgs(Object.entries(classMap).map(([name, d]) => ({
      class: name, avg: Math.round(d.total / d.count)
    })))
    setLoading(false)
  }

  const COLORS = ['#6366f1','#a855f7','#3b82f6','#06b6d4','#10b981','#f59e0b']

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading performance...</p></div>

  return (
    <div className="performance-page">
      <div className="page-header">
        <div><h1>Academic Performance</h1><p className="page-subtitle">Semester results & subject analytics</p></div>
      </div>

      <div className="stats-grid">
        <StatCard title="Average Score" value={`${stats.avg}%`} icon={TrendingUp} color="indigo" trend="Semester 1" trendUp />
        <StatCard title="Highest Score" value={`${stats.top}%`} icon={Award} color="emerald" />
        <StatCard title="Pass Rate" value={`${stats.pass > 0 ? Math.round((stats.pass/(stats.pass+stats.fail))*100) : 0}%`} icon={Target} color="blue" trend={`${stats.pass} passed`} trendUp />
        <StatCard title="At Risk" value={stats.fail} icon={BarChart3} color="rose" trend="Need attention" />
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Subject Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={subjectAvgs}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
              <Radar name="Average" dataKey="average" stroke="#6366f1" fill="rgba(99,102,241,0.2)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Class-wise Average</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classAvgs} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="class" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Bar dataKey="avg" name="Average %" radius={[6, 6, 0, 0]}>
                {classAvgs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-section">
        <h3>All Semester Results</h3>
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>Score</th><th>Grade</th><th>Level</th><th>Status</th></tr></thead>
            <tbody>
              {results.map((r, i) => {
                const pct = r.percentage
                const level = pct >= 85 ? { label: '⭐ Excellent', cls: 'level-excellent' }
                  : pct >= 70 ? { label: '✅ Good', cls: 'level-good' }
                  : pct >= 50 ? { label: '📊 Average', cls: 'level-average' }
                  : pct >= 35 ? { label: '⚠️ Low Level', cls: 'level-low' }
                  : { label: '🔴 Critical', cls: 'level-critical' }
                return (
                  <tr key={r.id} className={pct < 40 ? 'row-at-risk' : ''}>
                    <td><span className="rank-num">#{i + 1}</span></td>
                    <td><div className="student-cell"><div className="avatar">{r.students?.full_name?.[0]}</div><div><div className="cell-name">{r.students?.full_name}</div><div className="cell-email">{r.students?.roll_number}</div></div></div></td>
                    <td>{r.classes?.name}</td>
                    <td><span className="score-pill">{r.percentage}%</span></td>
                    <td><span className={`badge badge-${r.grade?.startsWith('A') ? 'success' : r.grade?.startsWith('B') ? 'info' : r.grade === 'C' ? 'warning' : 'danger'}`}>{r.grade}</span></td>
                    <td><span className={`level-badge ${level.cls}`}>{level.label}</span></td>
                    <td><span className={`status-badge status-${r.result_status === 'pass' ? 'present' : 'absent'}`}>{r.result_status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
