import express from 'express';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { usersRouter } from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';
import { getStats } from './data/stats.js';
import { JWT_SECRET, USER_PROFILE, allowedOrigins } from './config.js';

export function createDashboardServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use((req, res, next) => {
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return res.status(403).json({ error: 'Origin not allowed' });
    next();
  });
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', authMiddleware, dashboardRouter);
  app.use('/api/users', authMiddleware, usersRouter);
  app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: err.status === 400 ? 'Invalid request' : 'Server error' }));
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16384 });
  const usedTickets = new Map();
  httpServer.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname !== '/ws' || (req.headers.origin && !allowedOrigins.includes(req.headers.origin))) throw new Error('Unauthorized');
      const payload = jwt.verify(url.searchParams.get('ticket'), JWT_SECRET, { algorithms: ['HS256'] });
      for (const [id, expires] of usedTickets) if (expires < Date.now() / 1000) usedTickets.delete(id);
      if (payload.purpose !== 'ws' || payload.sub !== String(USER_PROFILE.id) || !payload.jti || usedTickets.has(payload.jti)) throw new Error('Unauthorized');
      usedTickets.set(payload.jti, payload.exp);
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws));
    } catch { socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n'); }
  });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'stats-update', payload: getStats() }));
    ws.on('message', (data) => {
      try { if (JSON.parse(data.toString()).type === 'ping') ws.send(JSON.stringify({ type: 'pong' })); } catch { /* Ignore malformed client messages. */ }
    });
  });
  const broadcast = (data) => wss.clients.forEach((client) => { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data)); });
  const timers = [setInterval(() => broadcast({ type: 'stats-update', payload: getStats() }), 15000), setInterval(() => broadcast({ type: 'notification', message: 'Данные синхронизированы' }), 25000)];
  httpServer.on('close', () => timers.forEach(clearInterval));
  return { httpServer, wss };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { httpServer } = createDashboardServer();
  httpServer.listen(Number(process.env.PORT || 3081), () => console.log(`Dashboard API and WebSocket listening on ${httpServer.address().port}`));
}
