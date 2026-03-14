import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { usersRouter } from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';
import { getStats } from './data/stats.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-secret-key-change-in-production';
const PORT = process.env.PORT || 3081;
const WS_PORT = process.env.WS_PORT || 3082;

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/auth', authRouter);
app.use('/api/dashboard', authMiddleware(JWT_SECRET), dashboardRouter);
app.use('/api/users', authMiddleware(JWT_SECRET), usersRouter);

const httpServer = createServer(app);

const WS_PATH = '/ws';
let wss = null;
const wssServer = new WebSocketServer({ noServer: true });

wssServer.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(4001, 'Missing token');
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    ws.close(4002, 'Invalid token');
    return;
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch {}
  });
});

httpServer.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith(WS_PATH)) {
    wssServer.handleUpgrade(req, socket, head, (ws) => {
      wssServer.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});
wss = wssServer;

function broadcastStatsUpdate(payload) {
  (wss || wssServer).clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify({ type: 'stats-update', payload }));
  });
}

function broadcastNotification(message) {
  (wss || wssServer).clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify({ type: 'notification', message }));
  });
}

export { broadcastStatsUpdate, broadcastNotification };

setInterval(() => broadcastStatsUpdate(getStats()), 15000);
setInterval(() => {
  const messages = ['Новые данные синхронизированы', 'Система обновлена', 'Проверьте отчёты'];
  broadcastNotification(messages[Math.floor(Math.random() * messages.length)]);
}, 25000);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Use PORT=... and WS_PORT=... to change (e.g. PORT=3091 WS_PORT=3092 npm run start).`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`REST API: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}${WS_PATH}`);
});
