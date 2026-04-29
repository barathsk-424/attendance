import supabase from '../supabase';

// ─── DASHBOARD: Fetch all stats in one call ─────────────────────────────────

export async function fetchDashboardData() {
  const [
    studentsRes,
    teachersRes,
    classesRes,
    attendanceRes,
    semesterRes,
    alertsRes,
    marksRes
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('teachers').select('id', { count: 'exact', head: true }),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('attendance').select('status'),
    supabase.from('semester_results')
      .select('student_id, percentage, grade, students(full_name, roll_number)')
      .order('percentage', { ascending: false }),
    supabase.from('alerts')
      .select('*, students(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('semester_subject_marks')
      .select('subject_id, marks_obtained, subjects(name)')
  ]);

  // Attendance rate
  const att = attendanceRes.data || [];
  const present = att.filter(a => a.status === 'present').length;
  const avgAttendance = att.length ? Math.round((present / att.length) * 100) : 0;

  // Performance average
  const sem = semesterRes.data || [];
  const avgPerformance = sem.length
    ? Math.round(sem.reduce((s, r) => s + r.percentage, 0) / sem.length)
    : 0;

  // Stats
  const stats = {
    students: studentsRes.count || 0,
    teachers: teachersRes.count || 0,
    classes: classesRes.count || 0,
    avgAttendance,
    avgPerformance,
    alerts: (alertsRes.data || []).length,
  };

  // Grade distribution
  const grades = {};
  sem.forEach(r => { grades[r.grade] = (grades[r.grade] || 0) + 1; });
  const gradeData = Object.entries(grades)
    .sort()
    .map(([grade, count]) => ({ grade, count }));

  // Top students
  const topStudents = sem.slice(0, 5).map(r => ({
    name: r.students?.full_name,
    roll: r.students?.roll_number,
    percentage: r.percentage,
    grade: r.grade,
  }));

  // Subject performance
  const subjMap = {};
  (marksRes.data || []).forEach(m => {
    const name = m.subjects?.name || 'Unknown';
    if (!subjMap[name]) subjMap[name] = { total: 0, count: 0 };
    subjMap[name].total += m.marks_obtained;
    subjMap[name].count++;
  });
  const subjectData = Object.entries(subjMap).map(([name, d]) => ({
    subject: name,
    avg: Math.round(d.total / d.count),
  }));

  // Attendance trend (weekly mock — replace with real data when available)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const attendanceData = days.map(d => ({
    day: d,
    present: 78 + Math.round(Math.random() * 15),
    absent: 3 + Math.round(Math.random() * 5),
  }));

  const recentAlerts = alertsRes.data || [];

  return {
    stats,
    gradeData,
    topStudents,
    subjectData,
    attendanceData,
    recentAlerts,
  };
}
