import supabase from '../supabase';

export async function fetchTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*, institution:institutions(id, name)')
    .order('full_name');
  if (error) throw error;
  return data || [];
}

export async function fetchTeacherById(id) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*, institution:institutions(id, name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTeacher(teacherData) {
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacherData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeacher(id, updates) {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeacher(id) {
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) throw error;
}

export async function getTeacherCount() {
  const { count, error } = await supabase
    .from('teachers')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

export async function toggleTeacherStatus(id, isActive) {
  const { data, error } = await supabase
    .from('teachers')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
