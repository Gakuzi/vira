import { supabase } from './auth.js';

export async function loadWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
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

export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select();
  if (error) throw error;
  return data[0];
}
