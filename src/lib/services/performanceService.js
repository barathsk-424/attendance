import supabase from '../supabase';

// ─── FETCH SEMESTER RESULTS ─────────────────────────────────────────────────

export async function fetchSemesterResults() {
  const { data, error } = await supabase
    .from('semester_results')
    .select(`
      *,
      students(full_name, roll_number),
      classes:class_id(name, grade_level, section)
    `)
    .order('percentage', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── GET PERFORMANCE STATS ──────────────────────────────────────────────────

export async function getPerformanceStats() {
  const { data, error } = await supabase
    .from('semester_results')
    .select('percentage, result_status');

  if (error) throw error;

  const sem = data || [];
  const avg = sem.length ? Math.round(sem.reduce((s, r) => s + r.percentage, 0) / sem.length) : 0;
  const sorted = [...sem].sort((a, b) => b.percentage - a.percentage);
  const top = sorted[0]?.percentage || 0;
  const pass = sem.filter(r => r.result_status === 'pass').length;
  const fail = sem.filter(r => r.result_status === 'fail').length;

  return { avg, top, pass, fail };
}

// ─── GET SUBJECT AVERAGES ───────────────────────────────────────────────────

export async function getSubjectAverages() {
  const { data, error } = await supabase
    .from('semester_subject_marks')
    .select('marks_obtained, max_marks, subjects(name)');

  if (error) throw error;

  const subjMap = {};
  (data || []).forEach(m => {
    const name = m.subjects?.name || 'Unknown';
    if (!subjMap[name]) subjMap[name] = { total: 0, count: 0 };
    subjMap[name].total += m.marks_obtained;
    subjMap[name].count++;
  });

  return Object.entries(subjMap).map(([name, d]) => ({
    subject: name,
    average: Math.round(d.total / d.count),
    fullMark: 100
  }));
}

// ─── GET CLASS AVERAGES ─────────────────────────────────────────────────────

export async function getClassAverages() {
  const { data, error } = await supabase
    .from('semester_results')
    .select('percentage, classes:class_id(name)');

  if (error) throw error;

  const classMap = {};
  (data || []).forEach(r => {
    const cn = r.classes?.name || 'Unknown';
    if (!classMap[cn]) classMap[cn] = { total: 0, count: 0 };
    classMap[cn].total += r.percentage;
    classMap[cn].count++;
  });

  return Object.entries(classMap).map(([name, d]) => ({
    class: name,
    avg: Math.round(d.total / d.count)
  }));
}

// ─── GET GRADE DISTRIBUTION ─────────────────────────────────────────────────

export async function getGradeDistribution() {
  const { data, error } = await supabase
    .from('semester_results')
    .select('grade');

  if (error) throw error;

  const grades = {};
  (data || []).forEach(r => {
    grades[r.grade] = (grades[r.grade] || 0) + 1;
  });

  return Object.entries(grades).sort().map(([grade, count]) => ({ grade, count }));
}

// ─── CREATE SEMESTER RESULT ─────────────────────────────────────────────────

export async function createSemesterResult(resultData) {
  const { data, error } = await supabase
    .from('semester_results')
    .insert({
      student_id: resultData.student_id,
      class_id: resultData.class_id,
      academic_year: resultData.academic_year,
      semester: resultData.semester,
      total_marks: resultData.total_marks,
      percentage: resultData.percentage,
      grade: resultData.grade,
      result_status: resultData.result_status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── ADD SUBJECT MARKS ──────────────────────────────────────────────────────

export async function addSubjectMarks(marks) {
  // marks: [{ semester_result_id, subject_id, marks_obtained, max_marks }]
  const { data, error } = await supabase
    .from('semester_subject_marks')
    .insert(marks)
    .select();

  if (error) throw error;
  return data;
}

// ─── GET STUDENT PERFORMANCE ────────────────────────────────────────────────

export async function getStudentPerformance(studentId) {
  const { data, error } = await supabase
    .from('semester_results')
    .select(`
      *,
      classes:class_id(name),
      semester_subject_marks(
        marks_obtained, max_marks,
        subjects(name, code)
      )
    `)
    .eq('student_id', studentId)
    .order('semester');

  if (error) throw error;
  return data || [];
}

// ─── UPDATE SEMESTER RESULT ─────────────────────────────────────────────────

export async function updateSemesterResult(id, updates) {
  const { data, error } = await supabase
    .from('semester_results')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE SEMESTER RESULT ─────────────────────────────────────────────────

export async function deleteSemesterResult(id) {
  const { error } = await supabase
    .from('semester_results')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
