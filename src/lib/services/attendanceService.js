import supabase from '../supabase';

// ─── FETCH ATTENDANCE RECORDS ───────────────────────────────────────────────

export async function fetchAttendance({ date = '', classId = '', limit = 200 } = {}) {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      students(full_name, roll_number),
      classes:class_id(id, name, grade_level, section)
    `)
    .order('date', { ascending: false })
    .limit(limit);

  if (date) query = query.eq('date', date);
  if (classId) query = query.eq('class_id', classId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── GET ATTENDANCE STATS ───────────────────────────────────────────────────

export async function getAttendanceStats() {
  const { data, error } = await supabase
    .from('attendance')
    .select('status');

  if (error) throw error;

  const all = data || [];
  const present = all.filter(a => a.status === 'present').length;
  const absent = all.filter(a => a.status === 'absent').length;
  const late = all.filter(a => a.status === 'late').length;
  const rate = all.length ? Math.round((present / all.length) * 100) : 0;

  return { present, absent, late, rate, total: all.length };
}

// ─── GET ATTENDANCE BY CLASS (aggregated) ───────────────────────────────────

export async function getAttendanceByClass() {
  const { data, error } = await supabase
    .from('attendance')
    .select('status, classes:class_id(name)');

  if (error) throw error;

  const classMap = {};
  (data || []).forEach(a => {
    const cn = a.classes?.name || 'Unknown';
    if (!classMap[cn]) classMap[cn] = { present: 0, total: 0 };
    classMap[cn].total++;
    if (a.status === 'present') classMap[cn].present++;
  });

  return Object.entries(classMap).map(([name, d]) => ({
    class: name,
    rate: Math.round((d.present / d.total) * 100)
  }));
}

// ─── GET STUDENT ATTENDANCE ─────────────────────────────────────────────────

export async function getStudentAttendance(studentId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, date, status, classes:class_id(name)')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── MARK ATTENDANCE ────────────────────────────────────────────────────────

export async function markAttendance(studentId, classId, date, status) {
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      student_id: studentId,
      class_id: classId,
      date,
      status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── BULK MARK ATTENDANCE ───────────────────────────────────────────────────

export async function bulkMarkAttendance(records) {
  // records: [{ student_id, class_id, date, status }]
  const { data, error } = await supabase
    .from('attendance')
    .insert(records)
    .select();

  if (error) throw error;
  return data;
}

// ─── UPDATE ATTENDANCE STATUS ───────────────────────────────────────────────

export async function updateAttendance(id, status) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE ATTENDANCE RECORD ───────────────────────────────────────────────

export async function deleteAttendance(id) {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── GET ATTENDANCE BY DATE RANGE ───────────────────────────────────────────

export async function getAttendanceByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, students(full_name, roll_number), classes:class_id(name)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}
