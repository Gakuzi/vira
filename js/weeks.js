// js/weeks.js
import { supabase } from './auth.js';

export async function loadWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('start_date', { ascending: true });
  
  if (error) {
    console.error('Ошибка загрузки недель:', error);
    return [];
  }
  return data;
}

export async function approveWeek(weekId) {
  const { error } = await supabase
    .from('weeks')
    .update({ status: 'approved', progress: 25 })
    .eq('id', weekId);
  return !error;
}
