/*
Этот файл содержит общие функции для отрисовки пользовательского интерфейса (UI),
которые используются как в панели руководителя (index.html), так и в панели аудитора (auditor.html).
*/
import { loadEvents } from './db.js';

// === Уведомления ===

/**
 * Показывает всплывающее уведомление в углу экрана.
 * @param {string} message - Сообщение для отображения.
 */
export function showNotification(message) {
  const notif = document.getElementById('notification');
  if (notif) {
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => {
      notif.style.display = 'none';
    }, 5000);
  }
}

// === Форматирование дат и текста ===

/**
 * Форматирует строку с датой в формат ДД.ММ.ГГГГ.
 * @param {string} dateStr - Дата в формате ISO (YYYY-MM-DD).
 * @returns {string} Отформатированная дата.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Форматирует строку с датой и временем в формат ДД.ММ ЧЧ:ММ.
 * @param {string} dateTimeStr - Дата и время в формате ISO.
 * @returns {string} Отформатированные дата и время.
 */
export function formatDateTime(dateTimeStr) {
  const d = new Date(dateTimeStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month} ${hours}:${minutes}`;
}

/**
 * Возвращает короткое название дня недели ('Пн', 'Вт', ...).
 * @param {string} dateStr - Дата в формате ISO (YYYY-MM-DD).
 * @returns {string} Название дня недели.
 */
export function getDayName(dateStr) {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return names[new Date(dateStr).getDay()];
}

/**
 * Преобразует статус недели в читаемый текст.
 * @param {string} status - Статус (например, 'draft').
 * @returns {string} Русский перевод статуса.
 */
export function getStatusText(status) {
  const texts = {
    draft: 'Черновик',
    pending_approval: 'На согласовании',
    approved: 'Согласовано',
    in_progress: 'В работе',
    completed: 'Завершено'
  };
  return texts[status] || status;
}

/**
 * Преобразует тип события в читаемый текст.
 * @param {string} type - Тип события (например, 'task').
 * @returns {string} Русский перевод типа.
 */
export function getEventTypeText(type) {
  const types = {
    task: 'Задача',
    interview: 'Интервью',
    note: 'Заметка',
    meeting: 'Встреча',
    comment: 'Комментарий',
    scheme: 'Схема',
    document: 'Документ'
  };
  return types[type] || type;
}

/**
 * Возвращает иконку для типа события.
 * @param {string} type - Тип события.
 * @returns {string} Emoji-иконка.
 */
export function getEventIcon(type) {
  const icons = {
    task: '✅',
    interview: '🎤',
    note: '📝',
    meeting: '📅',
    comment: '💬',
    scheme: '📊',
    document: '📎'
  };
  return icons[type] || '📄';
}

/**
 * Форматирует размер файла в КБ, МБ и т.д.
 * @param {number} bytes - Размер в байтах.
 * @returns {string} Отформатированный размер.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// === Функции отрисовки для страницы Руководителя ===

export async function renderWeeksForManager(weeks) {
  const container = document.getElementById('weeks-container');
  if (!container) return;

  container.innerHTML = weeks.map(week => `
    <div class="card">
      <div class="week-header">
        <div class="week-title" onclick="toggleWeek(${week.id})">
          📅 ${week.title} (${week.start_date} – ${week.end_date})
        </div>
        <div class="week-meta">
          <span class="status-badge status-${week.status}">${getStatusText(week.status)}</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${week.progress}%"></div>
      </div>
      <div class="days-grid" id="days-${week.id}" style="display:none;"></div>
    </div>
  `).join('');
}

export async function renderDaysForManager(weekId, week, events) {
  const container = document.getElementById(`days-${weekId}`);
  if (!container) return;

  const daysMap = {};
  events.forEach(e => {
    if (!daysMap[e.day_date]) daysMap[e.day_date] = [];
    daysMap[e.day_date].push(e);
  });

  const start = new Date(week.start_date);
  const end = new Date(week.end_date);
  let current = new Date(start);
  const daysHTML = [];

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      const dateStr = current.toISOString().split('T')[0];
      const plan = week.plan?.[dateStr] || [];

      daysHTML.push(`
        <div class="day-card">
          <div class="day-header">
            <div class="day-date">${formatDate(dateStr)} (${getDayName(dateStr)})</div>
          </div>
          
          ${plan.length ? `
            <div style="margin-bottom: 16px;">
              <strong>План:</strong>
              <ul style="margin-top: 8px; padding-left: 20px;">
                ${plan.map(task => `<li>${task}</li>`).join('')}
              </ul>
            </div>
          ` : '<p style="color:#64748b; font-style:italic;">План не задан</p>'}
          
          <div id="events-${weekId}-${dateStr}">
            ${(daysMap[dateStr] || []).map(e => `
              <div class="event">
                <div class="event-header">
                  <span class="event-author">${e.author}</span>
                  <span class="event-time">${new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
                <div class="event-content">
                  <strong>${getEventTypeText(e.type)}:</strong> ${e.content}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="day-actions">
            <button class="btn btn-warning" onclick="addMeeting(${weekId}, '${dateStr}')">📅 Встреча</button>
          </div>
          
          <div class="comment-form">
            <div class="form-group">
              <label>Комментарий / Вопрос:</label>
              <textarea class="form-control" placeholder="Напишите ваш комментарий..." 
                onkeypress="handleComment(event, ${weekId}, '${dateStr}')"></textarea>
            </div>
          </div>
        </div>
      `);
    }
    current.setDate(current.getDate() + 1);
  }

  container.innerHTML = daysHTML.join('');
}

// === Функции отрисовки для страницы Аудитора ===

export async function renderWeeksForAuditor(weeks, user, isAuditor) {
  const container = document.getElementById('weeks-container');
  if (!container) return;

  container.innerHTML = weeks.map(week => `
    <div class="card">
      <div class="week-header">
        <div class="week-title" onclick="toggleWeek(${week.id})">
          📅 ${week.title} (${formatDate(week.start_date)} – ${formatDate(week.end_date)})
        </div>
        <div class="week-meta">
          <span class="status-badge status-${week.status}">${getStatusText(week.status)}</span>
          ${isAuditor(user) ? `
            <button class="btn btn-outline" onclick="editWeek(${week.id})">✏️</button>
            ${week.status === 'draft' || week.status === 'pending_approval' ?
              `<button class="btn btn-success" onclick="submitForApproval(${week.id})">📤 На согласование</button>` :
              `<button class="btn btn-warning" onclick="resubmitForApproval(${week.id})">🔄 Повторно на согласование</button>`
            }
          ` : ''}
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${week.progress}%"></div>
      </div>
      <div class="recent-events">
        <h3>Последние события</h3>
        <div id="recent-${week.id}">Загрузка...</div>
      </div>
      <div class="days-grid" id="days-${week.id}" style="display:none;"></div>
    </div>
  `).join('');

  weeks.forEach(async (week) => {
    const events = await loadEvents(week.id);
    const recentEvents = events.slice(-10).reverse();
    const recentContainer = document.getElementById(`recent-${week.id}`);
    if (recentContainer) {
      recentContainer.innerHTML = recentEvents.length ?
        recentEvents.map(e => `
          <div class="mini-event">
            <div class="mini-event-icon">${getEventIcon(e.type)}</div>
            <div class="mini-event-content">
              <strong>${e.author}</strong>: ${e.content?.substring(0, 80)}${e.content?.length > 80 ? '...' : ''}
              <div style="font-size:12px; color:#64748b; margin-top:4px;">
                ${formatDateTime(e.created_at)}
              </div>
            </div>
          </div>
        `).join('') : '<p style="color:#64748b;">Нет событий</p>';
    }
  });
}

export async function renderDaysForAuditor(weekId, week, events, user, isAuditor) {
  const container = document.getElementById(`days-${weekId}`);
  if (!container) return;

  const daysMap = {};
  events.forEach(e => {
    if (!daysMap[e.day_date]) daysMap[e.day_date] = [];
    daysMap[e.day_date].push(e);
  });

  const start = new Date(week.start_date);
  const end = new Date(week.end_date);
  let current = new Date(start);
  const daysHTML = [];

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      const dateStr = current.toISOString().split('T')[0];
      const dayPlan = week.plan?.[dateStr] || { tasks: [], approved: false };

      daysHTML.push(`
        <div class="day-card">
          <div class="day-header">
            <div class="day-date">${formatDate(dateStr)} (${getDayName(dateStr)})</div>
            ${isAuditor(user) ? `
              <button class="btn btn-outline" onclick="editDayPlan(${weekId}, '${dateStr}')">✏️ План</button>
            ` : ''}
          </div>
          
          ${dayPlan.tasks.length ? `
            <div style="margin-bottom: 16px;">
              <strong>План ${dayPlan.approved ? '✅ Согласован' : '⏳ На согласовании'}:</strong>
              <ul style="margin-top: 8px; padding-left: 20px;">
                ${dayPlan.tasks.map(task => `<li>${task}</li>`).join('')}
              </ul>
            </div>
          ` : '<p style="color:#64748b; font-style:italic;">План не задан</p>'}
          
          <div id="events-${weekId}-${dateStr}">
            ${(daysMap[dateStr] || []).map(e => `
              <div class="event">
                <div class="event-header">
                  <span class="event-author">${e.author}</span>
                  <span class="event-time">${formatDateTime(e.created_at)}</span>
                </div>
                <div class="event-content">
                  <strong>${getEventTypeText(e.type)}:</strong> ${e.content}
                  ${e.is_approved ? '<span class="event-badge approved">Согласовано</span>' : '<span class="event-badge not-approved">Не согласовано</span>'}
                  
                  ${e.file_metadata ? `
                    <div style="margin-top: 12px; padding: 12px; background: #f0f9ff; border-radius: 8px;">
                      <strong>📎 Прикреплённый файл:</strong><br>
                      <a href="${e.file_metadata.url}" target="_blank" style="color: #2563eb; text-decoration: underline;">
                        ${e.file_metadata.name}
                      </a>
                      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                        ${formatFileSize(e.file_metadata.size)} • ${e.file_metadata.type}
                      </div>
                    </div>
                  ` : ''}
                </div>
                <div class="event-actions">
                  ${isAuditor(user) ? `
                    <button class="btn btn-outline" onclick="editEvent(${weekId}, '${dateStr}', '${e.id}')">✏️</button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="day-actions">
            ${isAuditor(user) ? `
              <button class="btn btn-outline" onclick="openEventModal(${weekId}, '${dateStr}')">➕ Событие</button>
            ` : ''}
            <button class="btn btn-warning" onclick="addMeeting(${weekId}, '${dateStr}')">📅 Встреча</button>
          </div>
          
          <div class="comment-form">
            <div class="form-group">
              <label>Комментарий / Вопрос:</label>
              <textarea class="form-control" placeholder="Напишите ваш комментарий..." 
                onkeypress="handleComment(event, ${weekId}, '${dateStr}')"></textarea>
            </div>
          </div>
        </div>
      `);
    }
    current.setDate(current.getDate() + 1);
  }

  container.innerHTML = daysHTML.join('');
}

