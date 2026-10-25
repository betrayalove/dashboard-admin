import jwt from 'jsonwebtoken';
import { AUTH_COOKIE, JWT_SECRET, USER_PROFILE } from '../config.js';

export function authMiddleware(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  try {
    const user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (user.sub !== String(USER_PROFILE.id) || user.purpose !== 'session') throw new Error('Invalid user');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
