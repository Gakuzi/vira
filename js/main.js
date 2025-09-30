// js/main.js
import { loadWeeks, loadEvents, createWeek, createEvent, updateWeek } from './db.js';
import { renderWeeks, renderDays } from './ui.js';

let currentWeeks = [];

// Глобальные функции для onclick
window.toggleWeek = (weekId) => {
  const el = document.getElementById(`days-${weekId}`);
  el.style.display = el.style.display === 'grid' ? 'none' : 'grid';
  
  // Загружаем события при первом открытии
  if (!el.innerHTML.trim()) {
    loadEvents(weekId).then(events => {
      const daysMap = {};
      events.forEach(e => {
        if (!daysMap[e.day_date]) daysMap[e.day_date] = [];
        daysMap[e.day_date].push(e);
      });
      renderDays(weekId, daysMap);
    });
  }
};

window.approveWeek = async (weekId) => {
  try {
    await updateWeek(weekId, { status: 'approved', progress: 100 });
    const week = currentWeeks.find(w => w.id === weekId);
    if (week) {
      week.status = 'approved';
      week.progress = 100;
      renderWeeks(currentWeeks);
    }
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
};

window.createNewWeek = async () => {
  const title = prompt('Название:');
  const start = prompt('Начало (ГГГГ-ММ-ДД):');
  const end = prompt('Окончание (ГГГГ-ММ-ДД):');
  
  if (title && start && end) {
    try {
      const newWeek = await createWeek({ title, start_date: start, end_date: end });
      currentWeeks.push(newWeek);
      renderWeeks(currentWeeks);
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  }
};

window.addEvent = async (weekId, dateStr) => {
  const type = document.getElementById(`type-${weekId}-${dateStr}`).value;
  const content = document.getElementById(`content-${weekId}-${dateStr}`).value.trim();
  
  if (!content) return alert('Введите текст!');
  
  try {
    const author = type === 'comment' ? 'Руководитель' : 'Климов Е.А.';
    await createEvent({ week_id: weekId, day_date: dateStr, type, author, content });
    
    // Обновляем события в интерфейсе
    const events = await loadEvents(weekId);
    const daysMap = {};
    events.forEach(e => {
      if (!daysMap[e.day_date]) daysMap[e.day_date] = [];
      daysMap[e.day_date].push(e);
    });
    renderDays(weekId, daysMap);
    
    document.getElementById(`content-${weekId}-${dateStr}`).value = '';
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
};

// Инициализация
async function init() {
  try {
    currentWeeks = await loadWeeks();
    renderWeeks(currentWeeks);
  } catch (error) {
    document.getElementById('weeks-container').innerHTML = 
      `<p style="color:red;">Ошибка подключения к базе: ${error.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
