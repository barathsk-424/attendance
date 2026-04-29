import supabase from '../supabase';

// ─── FETCH ALL ALERTS ───────────────────────────────────────────────────────

export async function fetchAlerts({ severity = '', limit = 100 } = {}) {
  let query = supabase
    .from('alerts')
    .select('*, students(full_name, roll_number)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity && severity !== 'all') {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── FETCH RECENT ALERTS ───────────────────────────────────────────────────

export async function fetchRecentAlerts(limit = 5) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*, students(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ─── GET UNREAD COUNT ───────────────────────────────────────────────────────

export async function getUnreadAlertCount() {
  const { count, error } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

// ─── MARK ALERT AS READ ────────────────────────────────────────────────────

export async function markAlertRead(id) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── MARK ALL ALERTS AS READ ────────────────────────────────────────────────

export async function markAllAlertsRead() {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('is_read', false)
    .select();

  if (error) throw error;
  return data;
}

// ─── CREATE ALERT ───────────────────────────────────────────────────────────

export async function createAlert(alertData) {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      student_id: alertData.student_id,
      institution_id: alertData.institution_id || null,
      alert_type: alertData.alert_type,
      message: alertData.message,
      severity: alertData.severity || 'warning',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE ALERT ───────────────────────────────────────────────────────────

export async function deleteAlert(id) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── ACKNOWLEDGE ALERT ──────────────────────────────────────────────────────

export async function acknowledgeAlert(id, profileId) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true, acknowledged_by: profileId })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── GET ALERTS BY STUDENT ──────────────────────────────────────────────────

export async function getAlertsByStudent(studentId) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── GET ALERT SEVERITY COUNTS ──────────────────────────────────────────────

export async function getAlertSeverityCounts() {
  const { data, error } = await supabase
    .from('alerts')
    .select('severity');

  if (error) throw error;

  const counts = { critical: 0, warning: 0, info: 0 };
  (data || []).forEach(a => {
    if (counts[a.severity] !== undefined) counts[a.severity]++;
  });

  return counts;
}
