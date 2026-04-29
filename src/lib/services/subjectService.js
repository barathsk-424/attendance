import supabase from '../supabase';

export async function fetchSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, institution:institutions(id, name)')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchSubjectById(id) {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, institution:institutions(id, name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSubject(subjectData) {
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      institution_id: subjectData.institution_id,
      name: subjectData.name,
      code: subjectData.code || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}
