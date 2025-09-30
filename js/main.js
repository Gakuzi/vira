import { 
  handleAuthHash, 
  checkSession, 
  signInWithGoogle, 
  signInWithEmail, 
  signOut,
  supabase 
} from './auth.js';
import { loadWeeks, loadEvents, createWeek, createEvent, updateWeek } from './db.js';
import { SUPABASE_URL, AUDITOR_EMAIL } from './config.js';

let currentUser = null;

// UI функции
function showAuthScreen() {
  document.getElementById('auth-screen')?.classList.remove('hidden');
  document.getElementById('main-app')?.classList.add('hidden');
}

function showMainApp(user) {
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('main-app')?.classList.remove('hidden');
  
  if (user) {
    document.getElementById('user-email').textContent = user.email;
    const isAuditor = user.email.toLowerCase() === AUDITOR_EMAIL.toLowerCase();
    document.getElementById('user-role').textContent = 
      isAuditor ? 'Аудитор (полный доступ)' : 'Руководитель (наблюдатель)';
  }
}

function showNotification(message) {
  const notif = document.getElementById('notification');
  if (notif) {
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => notif.style.display = 'none', 5000);
  }
}

function isAuditor(user) {
  return user && user.email?.toLowerCase() === AUDITOR_EMAIL.toLowerCase();
}

// Рендеринг
async function renderWeeks(weeks, user) {
  const container = document.getElementById('weeks-container');
  if (!container) return;
  
  container.innerHTML = weeks.map(week => `
    <div class="week-card">
      <div class="week-header">
        <div class="week-title" onclick="toggleWeek(${week.id})">
          📅 ${week.title} (${week.start_date} – ${week.end_date})
        </div>
        <div class="week-meta">
          <span class="week-status ${week.status === 'approved' ? 'status-approved' : 'status-draft'}">
            ${week.status === 'approved' ? 'Согласовано' : 'На согласовании'}
          </span>
          ${isAuditor(user) ? '' : (week.status !== 'approved' ? 
            `<button class="btn btn-success" onclick="approveWeek(${week.id})">Согласовать</button>` : ''
          )}
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${week.progress}%"></div>
      </div>
      <div class="days-grid" id="days-${week.id}" style="display:none;"></div>
    </div>
  `).join('');
  
  if (isAuditor(user)) {
    container.innerHTML += `<button class="btn btn-primary" onclick="createNewWeek()">➕ Создать неделю</button>`;
  }
}

async function renderDays(weekId, events) {
  const container = document.getElementById(`days-${weekId}`);
  if (!container) return;
  
  // Группируем события по дням
  const daysMap = {};
  events.forEach(e => {
    if (!daysMap[e.day_date]) daysMap[e.day_date] = [];
    daysMap[e.day_date].push(e);
  });
  
  // Генерируем дни
  const weekEl = document.querySelector(`.week-card .week-title[onclick="toggleWeek(${weekId})"]`);
  const dates = weekEl.textContent.match(/\((\d{4}-\d{2}-\d{2}) – (\d{4}-\d{2}-\d{2})\)/);
  if (!dates) return;
  
  const start = new Date(dates[1]);
  const end = new Date(dates[2]);
  let current = new Date(start);
  const daysHTML = [];
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      const dateStr = current.toISOString().split('T')[0];
      daysHTML.push(`
        <div class="day-card">
          <div class="day-header">
            <div class="day-date">${formatDate(dateStr)}</div>
            <span>${getDayName(dateStr)}</span>
          </div>
          <div class="day-actions">
            ${isAuditor(currentUser) ? `
              <button class="btn-outline" onclick="addInterview(${weekId}, '${dateStr}')">🎤</button>
              <button class="btn-outline" onclick="addNote(${weekId}, '${dateStr}')">📝</button>
            ` : ''}
            <button class="btn-warning" onclick="addMeeting(${weekId}, '${dateStr}')">📅</button>
          </div>
          <div id="events-${weekId}-${dateStr}">
            ${(daysMap[dateStr] || []).map(e => `
              <div class="event">
                <div class="event-icon">${getIcon(e.type)}</div>
                <div class="event-content">
                  <div class="event-header">
                    <span class="event-author">${e.author}</span>
                    <span class="event-time">${new Date(e.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div class="event-text">${e.content}</div>
                  ${e.file_urls?.map(url => `<div class="event-attachment">📎 Файл</div>`).join('') || ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="comment-form">
            <label>Комментарий:</label>
            <textarea placeholder="Ваш комментарий..." onkeypress="handleComment(event, ${weekId}, '${dateStr}')"></textarea>
          </div>
        </div>
      `);
    }
    current.setDate(current.getDate() + 1);
  }
  
  container.innerHTML = daysHTML.join('');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDayName(dateStr) {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return names[new Date(dateStr).getDay()];
}

function getIcon(type) {
  const icons = { interview: '🎤', note: '📝', meeting: '📅', comment: '💬' };
  return icons[type] || '📄';
}

// Глобальные функции
window.toggleWeek = async (weekId) => {
  const el = document.getElementById(`days-${weekId}`);
  el.style.display = el.style.display === 'grid' ? 'none' : 'grid';
  
  if (!el.innerHTML.trim()) {
    const events = await loadEvents(weekId);
    renderDays(weekId, events);
  }
};

window.approveWeek = async (weekId) => {
  try {
    await updateWeek(weekId, { status: 'approved', progress: 25 });
    showNotification('План согласован!');
    initApp();
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
};

window.createNewWeek = async () => {
  const title = prompt('Название недели:');
  const start = prompt('Дата начала (ГГГГ-ММ-ДД):');
  const end = prompt('Дата окончания (ГГГГ-ММ-ДД):');
  if (title && start && end) {
    try {
      await createWeek({ title, start_date: start, end_date: end });
      initApp();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  }
};

window.addInterview = (weekId, dateStr) => {
  const content = prompt('Расшифровка интервью:');
  if (content) {
    addEvent(weekId, dateStr, 'interview', content);
  }
};

window.addNote = (weekId, dateStr) => {
  const content = prompt('Заметка:');
  if (content) {
    addEvent(weekId, dateStr, 'note', content);
  }
};

window.addMeeting = (weekId, dateStr) => {
  const content = prompt('Повестка встречи:');
  if (content) {
    addEvent(weekId, dateStr, 'meeting', content);
  }
};

window.handleComment = async (e, weekId, dateStr) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const textarea = e.target;
    const content = textarea.value.trim();
    if (content) {
      await addEvent(weekId, dateStr, 'comment', content);
      textarea.value = '';
    }
  }
};

async function addEvent(weekId, dateStr, type, content) {
  try {
    const author = type === 'comment' ? 'Руководитель' : 'Климов Е.А.';
    await createEvent({ week_id: weekId, day_date: dateStr, type, author, content });
    
    // Перезагружаем события
    const events = await loadEvents(weekId);
    renderDays(weekId, events);
    
    // Уведомление в Telegram (упрощённо - через fetch к Edge Function)
    if (type === 'comment') {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `🔔 Новое сообщение от руководителя:\n${content}` 
          })
        });
      } catch (err) {
        console.log('Telegram уведомление не отправлено (Edge Function не настроена)');
      }
    }
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
}

window.logout = async () => {
  await signOut();
  currentUser = null;
  showAuthScreen();
};

// Инициализация
async function initApp() {
  try {
    const weeks = await loadWeeks();
    renderWeeks(weeks, currentUser);
  } catch (error) {
    document.getElementById('weeks-container').innerHTML = 
      `<p style="color:red;">Ошибка загрузки данных: ${error.message}</p>`;
  }
}

async function init() {
  // Обработка OAuth
  const userFromHash = await handleAuthHash();
  if (userFromHash) {
    currentUser = userFromHash;
    showMainApp(currentUser);
    initApp();
    return;
  }

  // Проверка сессии
  const existingUser = await checkSession();
  if (existingUser) {
    currentUser = existingUser;
    showMainApp(currentUser);
    initApp();
    return;
  }

  // Показать форму входа
  showAuthScreen();
}

// Обработчики кнопок
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('google-login')?.addEventListener('click', signInWithGoogle);
  
  document.getElementById('email-login')?.addEventListener('click', () => {
    document.getElementById('email-form').classList.remove('hidden');
  });
  
  document.getElementById('submit-email')?.addEventListener('click', async () => {
    const email = document.getElementById('email-input')?.value.trim();
    if (!email) return alert('Введите email');
    
    const error = await signInWithEmail(email);
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('Проверьте email для входа');
    }
  });
  
  init();
});
