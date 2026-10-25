import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { AUTH_COOKIE, JWT_SECRET, USER_PROFILE, cookieOptions } from '../config.js';

export const authRouter = Router();
authRouter.post('/login', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), (req, res) => {
  const { login, password } = req.body || {};
  if (typeof login !== 'string' || typeof password !== 'string' || !login.trim() || !password || login.length > 100 || password.length > 200) {
    return res.status(400).json({ error: 'Login and password must be non-empty strings' });
  }
  if (login !== 'admin' || password !== 'admin') return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: String(USER_PROFILE.id), purpose: 'session' }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: 86400000 });
  res.json({ user: USER_PROFILE });
});
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.json({ ok: true });
});
authRouter.get('/me', authMiddleware, (_req, res) => res.json({ user: USER_PROFILE }));
authRouter.post('/ws-ticket', authMiddleware, (_req, res) => {
  const ticket = jwt.sign({ sub: String(USER_PROFILE.id), purpose: 'ws', jti: randomUUID() }, JWT_SECRET, { expiresIn: '60s' });
  res.json({ ticket });
});
