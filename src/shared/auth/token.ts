import { apiFetch } from '@/shared/api/client';
import type { User } from '@/app/store/auth-store';
export async function checkAuth(): Promise<{ user: User } | null> {
  try { return await apiFetch<{ user: User }>('/auth/me'); } catch { return null; }
}
export async function logoutApi(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}
