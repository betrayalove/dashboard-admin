import { randomBytes } from 'node:crypto';

export const production = process.env.NODE_ENV === 'production';
const configuredSecret = process.env.JWT_SECRET;
if (production && (!configuredSecret || configuredSecret.length < 32 || /change|your-secret|dashboard-secret/i.test(configuredSecret))) {
  throw new Error('Production requires a unique JWT_SECRET with at least 32 characters');
}
export const JWT_SECRET = configuredSecret || randomBytes(48).toString('hex');
export const AUTH_COOKIE = 'dashboard_session';
export const USER_PROFILE = { id: 1, login: 'admin', name: 'Администратор', role: 'admin' };
export const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
if (production && !process.env.ALLOWED_ORIGINS) throw new Error('Production requires ALLOWED_ORIGINS');
export const cookieOptions = { httpOnly: true, sameSite: 'lax', path: '/', secure: production };
