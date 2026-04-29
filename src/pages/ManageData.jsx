import { useState, useEffect, useRef } from 'react'
import { UserPlus, BookOpen, Upload, CalendarCheck, CheckCircle, FileText } from 'lucide-react'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './ManageData.css'

const TABS = [
  { id: 'students', label: 'Add Students', icon: UserPlus },
  { id: 'marks', label: 'Add Marks', icon: BookOpen },
  { id: 'upload', label: 'CSV Upload', icon: Upload },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
]

export default function ManageData() {
  const [tab, setTab] = useState('students')
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [success, setSuccess] = useState('')
  const { user } = useAuth()

  useEffect(() => { loadOptions() }, [])

  async function loadOptions() {
    const [c, s, i, st] = await Promise.all([
      supabase.from('classes').select('id, name').order('name'),
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('institutions').select('id, name'),
      supabase.from('students').select('id, full_name, roll_number').order('full_name'),
    ])
    setClasses(c.data || [])
    setSubjects(s.data || [])
    setInstitutions(i.data || [])
    setStudents(st.data || [])
  }

  function showSuccess(msg) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div className="manage-page">
      <div className="page-header">
        <div><h1>Manage Data</h1><p className="page-subtitle">Add students, marks, upload CSV, and manage attendance</p></div>
      </div>

      <div className="manage-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`manage-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {success && <div className="success-msg"><CheckCircle size={16} /> {success}</div>}

      {tab === 'students' && <AddStudentForm classes={classes} institutions={institutions} onSuccess={showSuccess} onRefresh={loadOptions} />}
      {tab === 'marks' && <AddMarksForm students={students} subjects={subjects} onSuccess={showSuccess} />}
      {tab === 'upload' && <CSVUpload onSuccess={showSuccess} onRefresh={loadOptions} />}
      {tab === 'attendance' && <AttendanceForm students={students} classes={classes} onSuccess={showSuccess} />}
    </div>
  )
}

// ─── Add Student Form ────────────────────────────────────────
function AddStudentForm({ classes, institutions, onSuccess, onRefresh }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', roll_number: '', date_of_birth: '', admission_year: new Date().getFullYear(), institution_id: '', class_id: '' })
  const [saving, setSaving] = useState(false)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { class_id, ...studentData } = form
    const { data, error } = await supabase.from('students').insert(studentData).select().single()
    if (error) { alert(error.message); setSaving(false); return }
    if (class_id) {
      await supabase.from('student_enrollments').insert({ student_id: data.id, class_id, academic_year: `${form.admission_year}-${form.admission_year + 1}` })
    }
    setForm({ full_name: '', email: '', phone: '', roll_number: '', date_of_birth: '', admission_year: new Date().getFullYear(), institution_id: '', class_id: '' })
    onSuccess(`Student "${data.full_name}" added successfully!`)
    onRefresh()
    setSaving(false)
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h3><UserPlus size={16} /> Add New Student</h3>
      <div className="form-grid">
        <div className="form-field"><label>Full Name *</label><input required value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Student full name" /></div>
        <div className="form-field"><label>Roll Number *</label><input required value={form.roll_number} onChange={e => update('roll_number', e.target.value)} placeholder="e.g. STU031" /></div>
        <div className="form-field"><label>Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="student@email.com" /></div>
        <div className="form-field"><label>Phone</label><input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" /></div>
        <div className="form-field"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} /></div>
        <div className="form-field"><label>Admission Year</label><input type="number" value={form.admission_year} onChange={e => update('admission_year', e.target.value)} /></div>
        <div className="form-field"><label>Institution</label>
          <select value={form.institution_id} onChange={e => update('institution_id', e.target.value)}>
            <option value="">Select institution</option>
            {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="form-field"><label>Class</label>
          <select value={form.class_id} onChange={e => update('class_id', e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-actions"><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Student'}</button></div>
    </form>
  )
}

// ─── Add Marks Form ──────────────────────────────────────────
function AddMarksForm({ students, subjects, onSuccess }) {
  const [form, setForm] = useState({ student_id: '', subject_id: '', marks_obtained: '', max_marks: '100', semester: 'Semester 1', academic_year: '2025-2026' })
  const [saving, setSaving] = useState(false)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    // Get or create semester_result
    let { data: existing } = await supabase.from('semester_results')
      .select('id').eq('student_id', form.student_id).eq('semester', form.semester).single()

    let resultId = existing?.id
    if (!resultId) {
      const { data: newResult } = await supabase.from('semester_results')
        .insert({ student_id: form.student_id, semester: form.semester, academic_year: form.academic_year, percentage: 0, grade: 'P', result_status: 'pass', total_marks: 0 })
        .select().single()
      resultId = newResult?.id
    }

    const { error } = await supabase.from('semester_subject_marks').insert({
      semester_result_id: resultId,
      subject_id: form.subject_id,
      marks_obtained: parseFloat(form.marks_obtained),
      max_marks: parseFloat(form.max_marks),
    })
    if (error) { alert(error.message); setSaving(false); return }

    onSuccess(`Marks added successfully!`)
    setForm(f => ({ ...f, marks_obtained: '' }))
    setSaving(false)
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h3><BookOpen size={16} /> Add / Update Marks</h3>
      <div className="form-grid">
        <div className="form-field"><label>Student *</label>
          <select required value={form.student_id} onChange={e => update('student_id', e.target.value)}>
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>)}
          </select>
        </div>
        <div className="form-field"><label>Subject *</label>
          <select required value={form.subject_id} onChange={e => update('subject_id', e.target.value)}>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-field"><label>Marks Obtained *</label><input required type="number" min="0" value={form.marks_obtained} onChange={e => update('marks_obtained', e.target.value)} placeholder="85" /></div>
        <div className="form-field"><label>Max Marks</label><input type="number" value={form.max_marks} onChange={e => update('max_marks', e.target.value)} /></div>
        <div className="form-field"><label>Semester</label><input value={form.semester} onChange={e => update('semester', e.target.value)} /></div>
        <div className="form-field"><label>Academic Year</label><input value={form.academic_year} onChange={e => update('academic_year', e.target.value)} /></div>
      </div>
      <div className="form-actions"><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Marks'}</button></div>
    </form>
  )
}

// ─── CSV Upload ──────────────────────────────────────────────
function CSVUpload({ onSuccess, onRefresh }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [uploading, setUploading] = useState(false)
  const [type, setType] = useState('marks')
  const fileRef = useRef()

  function handleFile(f) {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1, 11).map(l => {
        const vals = l.split(',').map(v => v.trim())
        const row = {}
        headers.forEach((h, i) => { row[h] = vals[i] || '' })
        return row
      })
      setPreview(rows)
    }
    reader.readAsText(f)
  }

  async function handleUpload() {
    if (!file || !preview.length) return
    setUploading(true)

    if (type === 'marks') {
      for (const row of preview) {
        if (!row.roll_number || !row.subject || !row.marks) continue
        const { data: student } = await supabase.from('students').select('id').eq('roll_number', row.roll_number).single()
        const { data: subject } = await supabase.from('subjects').select('id').eq('name', row.subject).single()
        if (!student || !subject) continue

        let { data: result } = await supabase.from('semester_results').select('id').eq('student_id', student.id).limit(1).single()
        if (result) {
          await supabase.from('semester_subject_marks').insert({ semester_result_id: result.id, subject_id: subject.id, marks_obtained: parseFloat(row.marks), max_marks: parseFloat(row.max_marks || 100) })
        }
      }
      onSuccess(`Uploaded ${preview.length} marks records from CSV!`)
    } else {
      for (const row of preview) {
        if (!row.roll_number || !row.status) continue
        const { data: student } = await supabase.from('students').select('id').eq('roll_number', row.roll_number).single()
        if (!student) continue
        await supabase.from('attendance').insert({ student_id: student.id, status: row.status.toLowerCase(), date: row.date || new Date().toISOString().split('T')[0] })
      }
      onSuccess(`Uploaded ${preview.length} attendance records from CSV!`)
    }

    setFile(null); setPreview([]); setUploading(false); onRefresh()
  }

  return (
    <div className="form-card">
      <h3><Upload size={16} /> Upload CSV File</h3>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-field"><label>Upload Type</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="marks">Marks (roll_number, subject, marks, max_marks)</option>
            <option value="attendance">Attendance (roll_number, date, status)</option>
          </select>
        </div>
      </div>

      <div className="upload-area" onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragging') }}
        onDragLeave={e => e.currentTarget.classList.remove('dragging')}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragging'); handleFile(e.dataTransfer.files[0]) }}>
        <div className="upload-icon"><FileText size={24} /></div>
        <h4>Drop CSV file here or click to browse</h4>
        <p>{type === 'marks' ? 'Columns: roll_number, subject, marks, max_marks' : 'Columns: roll_number, date, status'}</p>
        {file && <div className="upload-file-name">📄 {file.name}</div>}
      </div>
      <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => handleFile(e.target.files[0])} />

      {preview.length > 0 && (
        <div className="preview-table">
          <table>
            <thead><tr>{Object.keys(preview[0]).map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{preview.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}

      {preview.length > 0 && (
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => { setFile(null); setPreview([]) }}>Cancel</button>
          <button className="btn-primary" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : `Upload ${preview.length} Records`}</button>
        </div>
      )}
    </div>
  )
}

// ─── Attendance Form ─────────────────────────────────────────
function AttendanceForm({ students, classes, onSuccess }) {
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [classStudents, setClassStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)

  async function loadStudents(cid) {
    setClassId(cid)
    if (!cid) { setClassStudents([]); return }
    const { data } = await supabase.from('student_enrollments')
      .select('student:students(id, full_name, roll_number)')
      .eq('class_id', cid)
    const studs = (data || []).map(d => d.student).filter(Boolean)
    setClassStudents(studs)
    const att = {}
    studs.forEach(s => { att[s.id] = 'present' })
    setAttendance(att)
  }

  async function handleSubmit() {
    setSaving(true)
    const records = Object.entries(attendance).map(([student_id, status]) => ({
      student_id, status, date, class_id: classId
    }))
    const { error } = await supabase.from('attendance').insert(records)
    if (error) { alert(error.message); setSaving(false); return }
    onSuccess(`Attendance recorded for ${records.length} students!`)
    setSaving(false)
  }

  return (
    <div className="form-card">
      <h3><CalendarCheck size={16} /> Mark Attendance</h3>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-field"><label>Class</label>
          <select value={classId} onChange={e => loadStudents(e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-field"><label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {classStudents.length > 0 && (
        <>
          <div className="preview-table">
            <table>
              <thead><tr><th>Student</th><th>Roll No</th><th>Status</th></tr></thead>
              <tbody>
                {classStudents.map(s => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td>{s.roll_number}</td>
                    <td>
                      <select value={attendance[s.id] || 'present'} onChange={e => setAttendance(a => ({ ...a, [s.id]: e.target.value }))}>
                        <option value="present">✅ Present</option>
                        <option value="absent">❌ Absent</option>
                        <option value="late">⏰ Late</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : `Save Attendance (${classStudents.length})`}</button>
          </div>
        </>
      )}
    </div>
  )
}
