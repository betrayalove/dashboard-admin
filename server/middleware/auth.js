import jwt from 'jsonwebtoken';

const AUTH_COOKIE = 'auth_token';

function getTokenFromRequest(req) {
  const cookieToken = req.cookies && req.cookies[AUTH_COOKIE];
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export function authMiddleware(secret) {
  return (req, res, next) => {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, secret);
      req.token = token;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
