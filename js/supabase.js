// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === НЕДЕЛИ ===
export async function createWeek(title, startDate, endDate) {
  const { data, error } = await supabase
    .from('weeks')
    .insert([{ title, start_date: startDate, end_date: endDate }])
    .select();
  return error ? null : data[0];
}

export async function updateWeek(weekId, updates) {
  const { error } = await supabase
    .from('weeks')
    .update(updates)
    .eq('id', weekId);
  return !error;
}

export async function loadWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('start_date', { ascending: true });
  return error ? [] : data;
}

// === СОБЫТИЯ ===
export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select();
  return error ? null : data[0];
}

export async function loadEvents(weekId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true });
  return error ? [] : data;
}

// === ЗАГРУЗКА ФАЙЛОВ ===
export async function uploadFile(file, filePath) {
  const { data, error } = await supabase.storage
    .from('audit-files')
    .upload(filePath, file, { upsert: true });
  
  if (error) throw error;
  return supabase.storage.from('audit-files').getPublicUrl(filePath).data.publicUrl;
}
