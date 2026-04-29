import supabase from '../supabase';

// ─── FETCH ALL STUDENTS (with relations) ────────────────────────────────────

export async function fetchStudents({ search = '', page = 0, perPage = 10 } = {}) {
  let query = supabase.from('students').select(`
    *,
    institution:institutions(id, name),
    student_enrollments(
      id, academic_year,
      class:classes(id, name, grade_level, section)
    ),
    semester_results(id, percentage, grade, semester, result_status)
  `, { count: 'exact' })
    .order('roll_number');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.range(page * perPage, (page + 1) * perPage - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { students: data || [], totalCount: count || 0 };
}

// ─── FETCH SINGLE STUDENT ───────────────────────────────────────────────────

export async function fetchStudentById(id) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      institution:institutions(id, name),
      student_enrollments(
        id, academic_year,
        class:classes(id, name, grade_level, section)
      ),
      semester_results(
        id, percentage, grade, semester, result_status, total_marks, academic_year,
        semester_subject_marks(
          id, marks_obtained, max_marks,
          subjects(id, name, code)
        )
      ),
      attendance(id, date, status, class_id),
      alerts(id, alert_type, message, severity, is_read, created_at),
      student_badges(
        id, awarded_at,
        badge:badges(id, name, description, icon_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ─── CREATE STUDENT ─────────────────────────────────────────────────────────

export async function createStudent(studentData) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      full_name: studentData.full_name,
      roll_number: studentData.roll_number,
      email: studentData.email,
      phone: studentData.phone,
      date_of_birth: studentData.date_of_birth,
      admission_year: studentData.admission_year,
      institution_id: studentData.institution_id,
      avatar_url: studentData.avatar_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── UPDATE STUDENT ─────────────────────────────────────────────────────────

export async function updateStudent(id, updates) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE STUDENT ─────────────────────────────────────────────────────────

export async function deleteStudent(id) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── ENROLL STUDENT IN CLASS ────────────────────────────────────────────────

export async function enrollStudent(studentId, classId, academicYear) {
  const { data, error } = await supabase
    .from('student_enrollments')
    .insert({
      student_id: studentId,
      class_id: classId,
      academic_year: academicYear
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── GET STUDENT COUNT ──────────────────────────────────────────────────────

export async function getStudentCount() {
  const { count, error } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

// ─── GET STUDENTS BY CLASS ──────────────────────────────────────────────────

export async function fetchStudentsByClass(classId) {
  const { data, error } = await supabase
    .from('student_enrollments')
    .select(`
      id, academic_year,
      student:students(id, full_name, roll_number, email, avatar_url)
    `)
    .eq('class_id', classId);

  if (error) throw error;
  return (data || []).map(e => ({ ...e.student, enrollment_id: e.id, academic_year: e.academic_year }));
}

// ─── GET TOP PERFORMING STUDENTS ────────────────────────────────────────────

export async function fetchTopStudents(limit = 5) {
  const { data, error } = await supabase
    .from('semester_results')
    .select('student_id, percentage, grade, students(full_name, roll_number)')
    .order('percentage', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(r => ({
    name: r.students?.full_name,
    roll: r.students?.roll_number,
    percentage: r.percentage,
    grade: r.grade
  }));
}
