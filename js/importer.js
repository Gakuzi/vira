import { createWeek } from './db.js';

export function exportAuditStructure(weeks) {
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    weeks: weeks.map(week => ({
      title: week.title,
      description: week.description,
      start_date: week.start_date,
      end_date: week.end_date,
      plan: week.plan
    }))
  };
}

export async function importAuditStructure(structure) {
  if (structure.version !== '1.0') {
    throw new Error('Неподдерживаемая версия структуры');
  }
  
  const results = [];
  for (const weekData of structure.weeks) {
    try {
      const newWeek = await createWeek({
        ...weekData,
        status: 'draft',
        progress: 0
      });
      results.push({ success: true, week: newWeek });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
}
