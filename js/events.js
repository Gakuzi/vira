// js/events.js
import { supabase } from './auth.js';

export async function addEvent(eventData) {
  const { error } = await supabase
    .from('events')
    .insert([eventData]);
  return !error;
}

export async function loadEvents(weekId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Ошибка загрузки событий:', error);
    return [];
  }
  return data;
}
