import { useState, useEffect } from 'react'
import { Users, ArrowRight, Lightbulb, Award, TrendingDown, BookOpen } from 'lucide-react'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import './Mentorship.css'

const GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#a855f7)', 'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#06b6d4)', 'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#a855f7)', 'linear-gradient(135deg,#06b6d4,#3b82f6)',
]

export default function Mentorship() {
  const { user, isStudent } = useAuth()
  const [pairings, setPairings] = useState([])
  const [subjects, setSubjects] = useState([])
  const [activeSubject, setActiveSubject] = useState('all')
  const [stats, setStats] = useState({ mentors: 0, mentees: 0, pairs: 0, subjects: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAndPair() }, [user])

  async function fetchAndPair() {
    // Fetch all subject marks with student info
    const { data: marks } = await supabase
      .from('semester_subject_marks')
      .select(`
        marks_obtained, max_marks,
        subjects(id, name),
        semester_results!inner(
          student_id,
          students(id, full_name, roll_number)
        )
      `)

    if (!marks?.length) { setLoading(false); return }

    // Build per-subject per-student score map
    const subjectMap = {}
    marks.forEach(m => {
      const subj = m.subjects?.name
      const student = m.semester_results?.students
      if (!subj || !student) return
      const pct = m.max_marks ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0
      if (!subjectMap[subj]) subjectMap[subj] = []
      subjectMap[subj].push({
        id: student.id,
        name: student.full_name,
        roll: student.roll_number,
        score: pct,
        marks: m.marks_obtained,
        maxMarks: m.max_marks,
      })
    })

    // Generate pairings: top performers mentor bottom performers
    const allPairings = []
    const mentorSet = new Set()
    const menteeSet = new Set()

    Object.entries(subjectMap).forEach(([subject, students]) => {
      // Sort by score descending
      const sorted = [...students].sort((a, b) => b.score - a.score)
      // Top 30% = mentors, Bottom 30% = mentees
      const mentorCutoff = Math.ceil(sorted.length * 0.3)
      const menteeCutoff = Math.floor(sorted.length * 0.7)
      const mentors = sorted.slice(0, mentorCutoff).filter(s => s.score >= 70)
      const mentees = sorted.slice(menteeCutoff).filter(s => s.score < 50)

      // Pair them 1:1 (best mentor with worst mentee)
      const pairCount = Math.min(mentors.length, mentees.length)
      for (let i = 0; i < pairCount; i++) {
        allPairings.push({
          subject,
          mentor: mentors[i],
          mentee: mentees[mentees.length - 1 - i], // worst first
          gap: mentors[i].score - mentees[mentees.length - 1 - i].score,
        })
        mentorSet.add(mentors[i].id)
        menteeSet.add(mentees[mentees.length - 1 - i].id)
      }
    })

    // Sort by gap (biggest improvement opportunity first)
    allPairings.sort((a, b) => b.gap - a.gap)

    setPairings(allPairings)
    setSubjects(['all', ...Object.keys(subjectMap)])
    setStats({
      mentors: mentorSet.size,
      mentees: menteeSet.size,
      pairs: allPairings.length,
      subjects: Object.keys(subjectMap).length,
    })
    setLoading(false)
  }

  let filtered = activeSubject === 'all'
    ? pairings
    : pairings.filter(p => p.subject === activeSubject)

  if (isStudent && user?.student?.id) {
    filtered = filtered.filter(p => p.mentor.id === user.student.id || p.mentee.id === user.student.id)
  }

  if (loading) return <div className="loading-state"><div className="spinner" /><p>Analyzing performance data...</p></div>

  return (
    <div className="mentorship-page">
      <div className="page-header">
        <div>
          <h1>Peer Mentorship</h1>
          <p className="page-subtitle">AI-powered mentor–mentee pairing for collaborative learning</p>
        </div>
      </div>

      {!isStudent && (
        <div className="mentorship-stats">
          <StatCard title="Mentors Identified" value={stats.mentors} icon={Award} color="emerald" trend="High performers" trendUp />
          <StatCard title="Students Need Help" value={stats.mentees} icon={TrendingDown} color="amber" trend="Below threshold" />
          <StatCard title="Pairings Generated" value={stats.pairs} icon={Users} color="indigo" trend="Active matches" trendUp />
          <StatCard title="Subjects Analyzed" value={stats.subjects} icon={BookOpen} color="blue" />
        </div>
      )}

      <div className="subject-tabs">
        {subjects.map(s => (
          <button key={s} className={`subject-tab ${activeSubject === s ? 'active' : ''}`}
            onClick={() => setActiveSubject(s)}>
            {s === 'all' ? '📚 All Subjects' : s}
          </button>
        ))}
      </div>

      <div className="pairings-grid">
        {filtered.map((p, i) => (
          <div key={i} className="pairing-card" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="pairing-subject-tag"><BookOpen size={12} /> {p.subject}</span>

            <div className="pairing-row">
              {/* Mentor */}
              <div className="pair-person mentor">
                <div className="pair-avatar" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                  {p.mentor.name?.[0]}
                </div>
                <div className="pair-info">
                  <span className="role-tag mentor-tag">★ Mentor</span>
                  <div className="pair-name">{p.mentor.name}</div>
                  <div className="pair-roll">{p.mentor.roll}</div>
                </div>
                <div className="pair-score">
                  <span className="pair-score-value high">{p.mentor.score}%</span>
                  <span className="pair-score-label">Score</span>
                </div>
              </div>

              {/* Connector */}
              <div className="pair-connector">
                <div className="connector-icon"><ArrowRight size={18} /></div>
                <span className="connector-label">guides</span>
              </div>

              {/* Mentee */}
              <div className="pair-person mentee">
                <div className="pair-avatar" style={{ background: GRADIENTS[(i + 3) % GRADIENTS.length] }}>
                  {p.mentee.name?.[0]}
                </div>
                <div className="pair-info">
                  <span className="role-tag mentee-tag">Mentee</span>
                  <div className="pair-name">{p.mentee.name}</div>
                  <div className="pair-roll">{p.mentee.roll}</div>
                </div>
                <div className="pair-score">
                  <span className="pair-score-value low">{p.mentee.score}%</span>
                  <span className="pair-score-label">Score</span>
                </div>
              </div>
            </div>

            <div className="improvement-hint">
              <Lightbulb size={14} />
              <span>
                Performance gap of <strong>{p.gap}%</strong> — {p.mentor.name?.split(' ')[0]} can help {p.mentee.name?.split(' ')[0]} improve by up to <strong>{Math.round(p.gap * 0.6)}%</strong> in {p.subject}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="mentorship-empty">
            <Users size={48} />
            <p>No pairings found for this subject</p>
          </div>
        )}
      </div>
    </div>
  )
}
