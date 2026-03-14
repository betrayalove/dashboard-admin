const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) ||
  ((typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? 'http://localhost:3081/api' : '/api');

export interface AuthMeResponse {
  user: { id: number; login: string; name: string; role: string };
  token: string;
}

/**
 * Проверяет авторизацию через cookie (httpOnly).
 * Возвращает user и token (token для WebSocket, в памяти).
 */
export async function checkAuth(): Promise<AuthMeResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as AuthMeResponse;
  } catch {
    return null;
  }
}

/** Сбрасывает auth cookie на сервере (вызывать при выходе). */
export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {}
}
