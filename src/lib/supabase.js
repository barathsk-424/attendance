import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sydimjscinoppzwtquqi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZGltanNjaW5vcHB6d3RxdXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTE3NDEsImV4cCI6MjA5MjkyNzc0MX0.ehjT9-fgJj8qnSr9Hj4VS5hoCPOMKAFkLSt6vbU6hdw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Auth Helpers ────────────────────────────────────────────────────────────

export async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ─── Real-time Subscription Builder ─────────────────────────────────────────

export function subscribeToTable(table, event, callback) {
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', { event, schema: 'public', table }, (payload) => {
      callback(payload);
    })
    .subscribe();
}

export function unsubscribe(channel) {
  supabase.removeChannel(channel);
}

export default supabase;
