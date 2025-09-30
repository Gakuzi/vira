// js/db.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Загрузка недель
export async function loadWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
}

// Загрузка событий для недели
export async function loadEvents(weekId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Создание недели
export async function createWeek(weekData) {
  const { data, error } = await supabase
    .from('weeks')
    .insert([weekData])
    .select();
  if (error) throw error;
  return data[0];
}

// Создание события
export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select();
  if (error) throw error;
  return data[0];
}

// Обновление недели
export async function updateWeek(weekId, updates) {
  const { error } = await supabase
    .from('weeks')
    .update(updates)
    .eq('id', weekId);
  if (error) throw error;
}
