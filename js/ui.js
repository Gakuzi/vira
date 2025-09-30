// js/ui.js
export function renderWeeks(weeks) {
  const container = document.getElementById('weeks-container');
  container.innerHTML = weeks.map(week => `
    <div class="week-card" data-week-id="${week.id}">
      <div class="week-header">
        <div class="week-title" onclick="toggleWeek(${week.id})">
          📅 ${week.title} (${week.start_date} – ${week.end_date})
        </div>
        <div>
          <span class="week-status ${week.status === 'approved' ? 'status-approved' : 'status-draft'}">
            ${week.status === 'approved' ? 'Согласовано' : 'На согласовании'}
          </span>
          <button class="btn btn-success" onclick="approveWeek(${week.id})" ${week.status === 'approved' ? 'disabled' : ''}>
            ${week.status === 'approved' ? '✓' : 'Согласовать'}
          </button>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${week.progress}%"></div>
      </div>
      <div class="days-grid" id="days-${week.id}" style="display:none;"></div>
    </div>
  `).join('');
  
  container.innerHTML += `<button class="btn btn-primary" onclick="createNewWeek()">➕ Новая неделя</button>`;
}

export function renderDays(weekId, daysMap) {
  const container = document.getElementById(`days-${weekId}`);
  if (!container) return;
  
  // Генерация рабочих дней
  const daysHTML = [];
  const start = new Date(document.querySelector(`.week-card[data-week-id="${weekId}"] .week-title`).textContent.split('(')[1].split(' – ')[0]);
  const end = new Date(document.querySelector(`.week-card[data-week-id="${weekId}"] .week-title`).textContent.split(' – ')[1].split(')')[0]);
  let current = new Date(start);
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      const dateStr = current.toISOString().split('T')[0];
      daysHTML.push(`
        <div class="day-card">
          <div class="day-header">
            <span>${formatDate(dateStr)}</span>
            <span>${getDayName(dateStr)}</span>
          </div>
          <div id="events-${weekId}-${dateStr}">
            ${(daysMap[dateStr] || []).map(event => `
              <div class="event">
                <div class="event-header">
                  <span>${event.author}</span>
                  <span class="event-time">${new Date(event.created_at).toLocaleTimeString()}</span>
                </div>
                <div>${event.content}</div>
              </div>
            `).join('')}
          </div>
          <div class="comment-form">
            <select id="type-${weekId}-${dateStr}">
              <option value="interview">🎤</option>
              <option value="note">📝</option>
              <option value="meeting">📅</option>
              <option value="comment">💬</option>
            </select>
            <textarea id="content-${weekId}-${dateStr}" placeholder="Текст..."></textarea>
            <button class="btn btn-primary" onclick="addEvent(${weekId}, '${dateStr}')">+</button>
          </div>
        </div>
      `);
    }
    current.setDate(current.getDate() + 1);
  }
  
  container.innerHTML = daysHTML.join('');
}

// Вспомогательные функции
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDayName(dateStr) {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return names[new Date(dateStr).getDay()];
}
