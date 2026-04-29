import supabase from '../supabase';

export async function fetchInstitutions() {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchInstitutionById(id) {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createInstitution(instData) {
  const { data, error } = await supabase
    .from('institutions')
    .insert({
      name: instData.name,
      address: instData.address || null,
      logo_url: instData.logo_url || null,
      contact_email: instData.contact_email || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInstitution(id, updates) {
  const { data, error } = await supabase
    .from('institutions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInstitution(id) {
  const { error } = await supabase.from('institutions').delete().eq('id', id);
  if (error) throw error;
}
