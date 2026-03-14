import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-secret-key-change-in-production';
const JWT_EXPIRES = '24h';
const AUTH_COOKIE = 'auth_token';
const isProduction = process.env.NODE_ENV === 'production';

const DEMO_USER = { login: 'admin', password: 'admin' };
const USER_PROFILE = { id: 1, login: 'admin', name: 'Администратор', role: 'admin' };

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

authRouter.post('/login', (req, res) => {
  const body = req.body;
  const login = body?.login ?? (typeof body?.username === 'string' ? body.username : undefined);
  const password = body?.password;
  if (!login || !password) {
    return res.status(400).json({
      error: 'Login and password required',
      debug: process.env.NODE_ENV !== 'production' ? { hasBody: !!body, keys: body ? Object.keys(body) : [] } : undefined,
    });
  }
  if (login !== DEMO_USER.login || password !== DEMO_USER.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: USER_PROFILE.id, login }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  setAuthCookie(res, token);
  return res.json({ token, user: USER_PROFILE });
});

authRouter.post('/logout', (req, res) => {
  res.cookie(AUTH_COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  res.json({ ok: true });
});

authRouter.get('/me', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ user: USER_PROFILE, token: req.token });
});
