import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
const directory = mkdtempSync(join(tmpdir(), 'dashboard-test-'));
process.env.DATA_FILE = join(directory, 'users.json');
process.env.JWT_SECRET = 'dashboard-test-random-value-with-more-than-32-chars';
process.env.ALLOWED_ORIGINS = 'http://127.0.0.1:5373';
const { createDashboardServer } = await import('./index.js');
let httpServer, wss, base, cookie;
before(async () => {
  ({ httpServer, wss } = createDashboardServer());
  httpServer.listen(0, '127.0.0.1');
  await once(httpServer, 'listening');
  base = `http://127.0.0.1:${httpServer.address().port}`;
});
after(async () => {
  for (const ws of wss.clients) ws.terminate();
  wss.close();
  await new Promise((resolve) => httpServer.close(resolve));
  rmSync(directory, { recursive: true, force: true });
});
const request = (path, init = {}) => fetch(`${base}/api${path}`, { ...init, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...init.headers } });
test('requires cookie auth, validates login and restores session without exposing JWT', async () => {
  assert.equal((await request('/dashboard/stats')).status, 401);
  assert.equal((await request('/auth/login', { method: 'POST', body: JSON.stringify({ login: [], password: 'admin' }) })).status, 400);
  assert.equal((await request('/auth/login', { method: 'POST', headers: { origin: 'https://evil.test' }, body: '{}' })).status, 403);
  const response = await request('/auth/login', { method: 'POST', body: JSON.stringify({ login: 'admin', password: 'admin' }) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  cookie = response.headers.get('set-cookie').split(';')[0];
  assert.equal((await response.json()).token, undefined);
  assert.equal((await (await request('/auth/me')).json()).user.login, 'admin');
  const forged = jwt.sign({ sub: '9999', purpose: 'session' }, process.env.JWT_SECRET);
  assert.equal((await request('/dashboard/stats', { headers: { cookie: `dashboard_session=${forged}` } })).status, 401);
});
test('deletes persisted users, rejects malformed IDs, and keeps deletion after module reload', async () => {
  const before = await (await request('/users?limit=50')).json();
  assert.equal((await request('/users', { method: 'DELETE', body: JSON.stringify({ ids: ['1'] }) })).status, 400);
  const id = before.items[0].id;
  const result = await (await request('/users', { method: 'DELETE', body: JSON.stringify({ ids: [id, id] }) })).json();
  assert.equal(result.deleted, 1);
  const after = await (await request('/users?limit=50')).json();
  assert.equal(after.total, before.total - 1);
  assert.equal(after.items.some((user) => user.id === id), false);
  assert.equal(JSON.parse(readFileSync(process.env.DATA_FILE)).some((user) => user.id === id), false);
  const reloaded = await import(`./data/users.js?reload=${Date.now()}`);
  assert.equal(reloaded.getUsers({ limit: 50 }).items.some((user) => user.id === id), false);
});
test('period changes returned chart data and invalid periods are rejected', async () => {
  const day = await (await request('/dashboard/chart?period=day')).json();
  const month = await (await request('/dashboard/chart?period=month')).json();
  assert.notDeepEqual(day, month);
  assert.equal((await request('/dashboard/chart?period=bad')).status, 400);
});
test('WS rejects anonymous clients and replayed tickets, authenticated client receives stats', async () => {
  const unauthorized = new WebSocket(base.replace('http:', 'ws:') + '/ws');
  const [error] = await once(unauthorized, 'error');
  assert.match(error.message, /401/);
  const { ticket } = await (await request('/auth/ws-ticket', { method: 'POST', body: '{}' })).json();
  const url = base.replace('http:', 'ws:') + `/ws?ticket=${ticket}`;
  const client = new WebSocket(url);
  const [message] = await once(client, 'message');
  assert.equal(JSON.parse(message).type, 'stats-update');
  client.close();
  const replay = new WebSocket(url);
  const [replayError] = await once(replay, 'error');
  assert.match(replayError.message, /401/);
});
test('production refuses missing or publicly known JWT secrets', () => {
  for (const secret of ['', 'dashboard-secret-key-change-in-production']) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./config.js')"], { cwd: import.meta.dirname, env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: secret } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr.toString(), /Production requires a unique JWT_SECRET/);
  }
});
