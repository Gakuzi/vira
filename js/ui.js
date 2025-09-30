// js/ui.js
import { isAuditor } from './auth.js';

export function showAuthScreen() {
  document.getElementById('auth-screen')?.classList.remove('hidden');
  document.getElementById('main-app')?.classList.add('hidden');
}

export function showMainApp(user) {
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('main-app')?.classList.remove('hidden');
  
  if (user) {
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role').textContent = 
      isAuditor(user) ? 'Аудитор (полный доступ)' : 'Руководитель (наблюдатель)';
  }
}

export function renderWeeks(weeks, user) {
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
          ${isAuditor(user) || week.status !== 'approved' ? 
            `<button class="btn btn-success" onclick="approveWeek(${week.id})">
              ${week.status === 'approved' ? 'Согласовано' : 'Согласовать'}
            </button>` : ''
          }
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${week.progress}%"></div>
      </div>
      <div class="days-grid" id="days-${week.id}" style="display:none;"></div>
    </div>
  `).join('');
}

export function showNotification(message) {
  const notif = document.getElementById('notification');
  if (notif) {
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => notif.style.display = 'none', 5000);
  }
}
