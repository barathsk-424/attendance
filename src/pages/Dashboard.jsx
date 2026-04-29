import { useState, useEffect } from 'react'
import { Users, GraduationCap, CalendarCheck, TrendingUp, Award, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts'
import supabase from '../lib/supabase'
import StatCard from '../components/StatCard'
import './Dashboard.css'

const COLORS = ['#6366f1','#a855f7','#3b82f6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899']

export default function Dashboard() {
  const [stats, setStats] = useState({students:0,teachers:0,classes:0,avgAttendance:0,avgPerformance:0,alerts:0})
  const [gradeData, setGradeData] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [subjectData, setSubjectData] = useState([])
  const [topStudents, setTopStudents] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [studentsRes, teachersRes, classesRes, attendanceRes, semesterRes, alertsRes, subjectsRes, marksRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('status'),
        supabase.from('semester_results').select('student_id, percentage, grade, students(full_name, roll_number)').order('percentage', { ascending: false }),
        supabase.from('alerts').select('*, students(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('subjects').select('id, name'),
        supabase.from('semester_subject_marks').select('subject_id, marks_obtained, subjects(name)')
      ])

      const att = attendanceRes.data || []
      const present = att.filter(a => a.status === 'present').length
      const avgAtt = att.length ? Math.round((present / att.length) * 100) : 0

      const sem = semesterRes.data || []
      const avgPerf = sem.length ? Math.round(sem.reduce((s, r) => s + r.percentage, 0) / sem.length) : 0

      setStats({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        classes: classesRes.count || 0,
        avgAttendance: avgAtt,
        avgPerformance: avgPerf,
        alerts: (alertsRes.data || []).length
      })

      // Grade distribution
      const grades = {}
      sem.forEach(r => { grades[r.grade] = (grades[r.grade] || 0) + 1 })
      setGradeData(Object.entries(grades).sort().map(([g, c]) => ({ grade: g, count: c })))

      // Top students
      setTopStudents(sem.slice(0, 5).map(r => ({
        name: r.students?.full_name,
        roll: r.students?.roll_number,
        percentage: r.percentage,
        grade: r.grade
      })))

      // Subject performance
      const subjMap = {}
      ;(marksRes.data || []).forEach(m => {
        const name = m.subjects?.name || 'Unknown'
        if (!subjMap[name]) subjMap[name] = { total: 0, count: 0 }
        subjMap[name].total += m.marks_obtained
        subjMap[name].count++
      })
      setSubjectData(Object.entries(subjMap).map(([name, d]) => ({
        subject: name, avg: Math.round(d.total / d.count)
      })))

      // Attendance trend (mock weekly)
      const days = ['Mon','Tue','Wed','Thu','Fri']
      setAttendanceData(days.map((d, i) => ({
        day: d, present: 78 + Math.round(Math.random() * 15), absent: 3 + Math.round(Math.random() * 5)
      })))

      setRecentAlerts(alertsRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading dashboard...</p>
    </div>
  )

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="page-subtitle">Student Academic Growth Intelligence System</p>
        </div>
        <div className="header-badge">
          <span className="live-dot" />
          Live Data
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Students" value={stats.students} icon={Users} trend="12% vs last year" trendUp color="indigo" delay={0} />
        <StatCard title="Teachers" value={stats.teachers} icon={GraduationCap} trend="2 new this term" trendUp color="purple" delay={100} />
        <StatCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon={CalendarCheck} trend={stats.avgAttendance > 80 ? 'Above target' : 'Below target'} trendUp={stats.avgAttendance > 80} color="emerald" delay={200} />
        <StatCard title="Avg Performance" value={`${stats.avgPerformance}%`} icon={TrendingUp} trend="5% improvement" trendUp color="blue" delay={300} />
        <StatCard title="Active Alerts" value={stats.alerts} icon={AlertTriangle} trend="3 critical" color="rose" delay={400} />
        <StatCard title="Active Classes" value={stats.classes} icon={Award} trend="All sections active" trendUp color="amber" delay={500} />
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Subject Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjectData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg Score" radius={[6, 6, 0, 0]}>
                {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={gradeData} dataKey="count" nameKey="grade" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} label={({ grade, percent }) => `${grade} ${(percent*100).toFixed(0)}%`}>
                {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fill="url(#gPresent)" strokeWidth={2} />
              <Area type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" fill="rgba(244,63,94,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top Performers</h3>
          <div className="top-students-list">
            {topStudents.map((s, i) => (
              <div key={i} className="top-student-row">
                <div className="rank-badge">#{i + 1}</div>
                <div className="student-info">
                  <span className="student-name">{s.name}</span>
                  <span className="student-roll">{s.roll}</span>
                </div>
                <div className="student-score">
                  <span className="score-value">{s.percentage}%</span>
                  <span className={`grade-badge grade-${s.grade?.replace('+','p')}`}>{s.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <div className="chart-card">
          <h3>Recent Alerts</h3>
          <div className="alerts-list">
            {recentAlerts.map((a, i) => (
              <div key={i} className={`alert-item alert-${a.severity}`}>
                <div className={`alert-severity-dot severity-${a.severity}`} />
                <div className="alert-content">
                  <span className="alert-student">{a.students?.full_name}</span>
                  <span className="alert-message">{a.message}</span>
                </div>
                <span className={`alert-type-badge type-${a.alert_type}`}>{a.alert_type?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
