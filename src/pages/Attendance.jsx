import { useState, useEffect } from 'react'
import { CalendarCheck, Users, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import supabase from '../lib/supabase'
import StatCard from '../components/StatCard'
import './Attendance.css'

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, rate: 0 })
  const [classData, setClassData] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('attendance').select(`
      *, students(full_name, roll_number), classes:class_id(name)
    `).order('date', { ascending: false }).limit(200)

    const all = data || []
    setRecords(all)

    const present = all.filter(a => a.status === 'present').length
    const absent = all.filter(a => a.status === 'absent').length
    const late = all.filter(a => a.status === 'late').length
    setStats({ present, absent, late, rate: all.length ? Math.round((present / all.length) * 100) : 0 })

    // Per-class attendance
    const classMap = {}
    all.forEach(a => {
      const cn = a.classes?.name || 'Unknown'
      if (!classMap[cn]) classMap[cn] = { present: 0, total: 0 }
      classMap[cn].total++
      if (a.status === 'present') classMap[cn].present++
    })
    setClassData(Object.entries(classMap).map(([name, d]) => ({
      class: name, rate: Math.round((d.present / d.total) * 100)
    })))
    setLoading(false)
  }

  const filtered = dateFilter
    ? records.filter(r => r.date === dateFilter)
    : records.slice(0, 50)

  const COLORS = ['#10b981','#3b82f6','#a855f7','#f59e0b','#06b6d4','#f43f5e']

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading attendance...</p></div>

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div><h1>Attendance Tracking</h1><p className="page-subtitle">Monitor daily attendance patterns</p></div>
      </div>

      <div className="stats-grid">
        <StatCard title="Attendance Rate" value={`${stats.rate}%`} icon={CalendarCheck} trend="This month" trendUp={stats.rate > 80} color="emerald" />
        <StatCard title="Present" value={stats.present} icon={Users} color="blue" />
        <StatCard title="Late" value={stats.late} icon={Clock} color="amber" />
        <StatCard title="Absent" value={stats.absent} icon={XCircle} color="rose" />
      </div>

      <div className="charts-row">
        <div className="chart-card" style={{ flex: 1 }}>
          <h3>Attendance by Class</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="class" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: '0.8rem' }} />
              <Bar dataKey="rate" name="Attendance %" radius={[6, 6, 0, 0]}>
                {classData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-section">
        <div className="section-header">
          <h3>Recent Records</h3>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="date-input" />
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Roll No</th><th>Class</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}>
                  <td className="cell-name">{r.students?.full_name}</td>
                  <td><span className="roll-badge">{r.students?.roll_number}</span></td>
                  <td>{r.classes?.name}</td>
                  <td className="cell-muted">{r.date}</td>
                  <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
