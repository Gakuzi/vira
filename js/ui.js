// js/ui.js
import { isAuditor } from './auth.js';

export function renderWeeks(weeks, user) {
  const container = document.getElementById('weeks-container');
  if (!container) return;
  
  container.innerHTML = weeks.length ? weeks.map(week => `
    <div class="week-card">
      <div class="week-header">
        <div class="week-title" onclick="toggleWeek(${week.id})">
          📅 ${week.title} (${week.start_date} – ${week.end_date})
        </div>
        <div class="week-meta">
          <span class="week-status ${week.status === 'approved' ? 'status-approved' : 'status-draft'}">
            ${week.status === 'approved' ? 'Согласовано' : 'На согласовании'}
          </span>
          ${isAuditor(user) ? 
            `<button class="btn btn-outline" onclick="editWeek(${week.id})">✏️</button>` : ''
          }
          ${!isAuditor(user) && week.status !== 'approved' ? 
            `<button class="btn btn-success" onclick="approveWeek(${week.id})">Согласовать</button>` : ''
          }
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${week.progress}%"></div>
      </div>
      <div class="days-grid" id="days-${week.id}" style="display:none;">
        ${renderDays(week)}
      </div>
    </div>
  `).join('') : '<p>Нет недель. Создайте первую!</p>';

  if (isAuditor(user)) {
    container.innerHTML += `
      <button class="btn btn-primary" onclick="createNewWeek()">➕ Создать неделю</button>
    `;
  }
}

function renderDays(week) {
  const days = [];
  const start = new Date(week.start_date);
  const end = new Date(week.end_date);
  let current = new Date(start);
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Пн-Пт
      const dateStr = current.toISOString().split('T')[0];
      days.push(`
        <div class="day-card">
          <div class="day-header">
            <div class="day-date">${formatDate(current)}</div>
            <span>${getDayName(current)}</span>
          </div>
          <div class="day-actions">
            ${isAuditor(window.currentUser) ? `
              <button class="btn-outline" onclick="addInterview(${week.id}, '${dateStr}')">🎤</button>
              <button class="btn-outline" onclick="addNote(${week.id}, '${dateStr}')">📝</button>
              <button class="btn-outline" onclick="addScheme(${week.id}, '${dateStr}')">📊</button>
            ` : ''}
            <button class="btn-warning" onclick="addMeeting(${week.id}, '${dateStr}')">📅</button>
          </div>
          <div id="events-${week.id}-${dateStr}"></div>
          <div class="comment-form">
            <textarea placeholder="Комментарий..." onkeypress="handleComment(event, ${week.id}, '${dateStr}')"></textarea>
          </div>
        </div>
      `);
    }
    current.setDate(current.getDate() + 1);
  }
  return days.join('');
}

// Вспомогательные функции
function formatDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDayName(date) {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return names[date.getDay()];
}

export function renderEvents(events, weekId, dateStr) {
  const container = document.getElementById(`events-${weekId}-${dateStr}`);
  if (!container) return;
  
  container.innerHTML = events
    .filter(e => e.day_date === dateStr)
    .map(e => `
      <div class="event">
        <div class="event-icon">${getIcon(e.type)}</div>
        <div class="event-content">
          <div class="event-header">
            <span class="event-author">${e.author_email}</span>
            <span class="event-time">${new Date(e.created_at).toLocaleTimeString()}</span>
          </div>
          <div class="event-text">${e.content || ''}</div>
          ${e.file_urls?.map(url => `<a href="${url}" target="_blank">📎 Файл</a>`).join(' ') || ''}
        </div>
      </div>
    `).join('');
}

function getIcon(type) {
  const icons = { interview: '🎤', note: '📝', scheme: '📊', meeting: '📅', comment: '💬' };
  return icons[type] || '📄';
}

// Глобальные функции для onclick
window.toggleWeek = (weekId) => {
  const el = document.getElementById(`days-${weekId}`);
  if (el) el.style.display = el.style.display === 'grid' ? 'none' : 'grid';
};

window.handleComment = async (e, weekId, dateStr) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const textarea = e.target;
    const comment = textarea.value.trim();
    if (comment) {
      await window.addEvent({
        week_id: weekId,
        day_date: dateStr,
        type: 'comment',
        author_email: 'Руководитель',
        content: comment
      });
      textarea.value = '';
    }
  }
};
