import { SUPABASE_URL, SUPABASE_ANON_KEY, REDIRECT_URL } from './config.js';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };

export async function handleAuthHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  window.history.replaceState({}, document.title, window.location.pathname);

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    return null;
  }
}

export async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Ошибка сессии:', error);
    return null;
  }
  return data.session?.user || null;
}

export function signInWithGoogle() {
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL }
  });
}

export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_URL }
  });
  return error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
