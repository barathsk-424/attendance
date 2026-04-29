import supabase from '../supabase';

export async function fetchClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('*, institution:institutions(id, name)')
    .order('grade_level');
  if (error) throw error;
  return data || [];
}

export async function fetchClassById(id) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      institution:institutions(id, name),
      class_subjects(
        id, academic_year,
        subject:subjects(id, name, code),
        teacher:teachers(id, full_name)
      ),
      student_enrollments(
        id,
        student:students(id, full_name, roll_number, email)
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClass(classData) {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      institution_id: classData.institution_id,
      name: classData.name,
      grade_level: classData.grade_level,
      section: classData.section || null,
      academic_year: classData.academic_year,
      class_teacher: classData.class_teacher || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClass(id, updates) {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(id) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
}

export async function getClassCount() {
  const { count, error } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

export async function assignSubjectToClass(classId, subjectId, teacherId, academicYear) {
  const { data, error } = await supabase
    .from('class_subjects')
    .insert({
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId || null,
      academic_year: academicYear,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
