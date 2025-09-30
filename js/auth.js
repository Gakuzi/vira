// js/auth.js
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUDITOR_EMAIL, REDIRECT_URL } from './config.js';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };

// Проверка роли
export function isAuditor(user) {
  return user && user.email?.toLowerCase() === AUDITOR_EMAIL.toLowerCase();
}

// Обработка хеша после OAuth
export async function handleAuthHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  // Очистка URL
  window.history.replaceState({}, document.title, window.location.pathname);

  try {
    // ПРАВИЛЬНАЯ ДЕСТРУКТУРИЗАЦИЯ:
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) throw error;
    return data.user; // ← user находится внутри data
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return null;
  }
}

// Проверка существующей сессии
export async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Ошибка сессии:', error);
    return null;
  }
  return data.session?.user || null;
}

// Вход через Google
export function signInWithGoogle() {
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL }
  });
}

// Вход через Email
export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_URL }
  });
  return error;
}

// Выход
export async function signOut() {
  await supabase.auth.signOut();
}
