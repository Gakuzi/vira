import { supabase } from './auth.js';

// === РАБОТА С ФАЙЛАМИ ===
export async function uploadFile(file) {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('audit-files')
    .upload(`documents/${fileName}`, file, { upsert: true });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('audit-files')
    .getPublicUrl(`documents/${fileName}`);
  
  return {
    name: file.name,
    url: publicUrl,
    type: file.type,
    size: file.size
  };
}

// === РАБОТА С НЕДЕЛЯМИ ===
export async function createWeek(weekData) {
  const { data, error } = await supabase
    .from('weeks')
    .insert([weekData])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateWeek(weekId, updates) {
  const { error } = await supabase
    .from('weeks')
    .update(updates)
    .eq('id', weekId);
  if (error) throw error;
}

export async function loadWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
}

// === РАБОТА С СОБЫТИЯМИ ===
export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select();
  if (error) throw error;
  return data[0];
}

export async function loadEvents(weekId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
