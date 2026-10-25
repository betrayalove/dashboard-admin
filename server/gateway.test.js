import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createGateway } from '../api/proxy.js';

const CANONICAL = 'https://dashboard-admin-six-pi.vercel.app';
const BACKEND = 'https://dashboard-test.onrender.com';
const PREVIEW = 'dashboard-preview.vercel.app';
function record() {
  const state = { headers: {} };
  const res = {
    setHeader(key, value) { state.headers[key.toLowerCase()] = value; },
    appendHeader(key, value) { const name = key.toLowerCase(); state.headers[name] = [...(state.headers[name] || []), value]; },
    status(code) { state.status = code; return this; },
    json(value) { state.body = value; return this; },
    send(value) { state.body = value; return this; },
  };
  return { state, res };
}
const headers = { host: PREVIEW, origin: `https://${PREVIEW}`, cookie: 'dashboard_session=demo' };

test('Vercel explicitly rewrites nested API routes to the proxy function', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
  assert.deepEqual(config.rewrites[0], { source: '/api/:path*', destination: '/api/proxy?path=:path*' });
});

test('rewritten URL preserves cookie, JSON, all remaining queries, status and Set-Cookie', async () => {
  const { state, res } = record();
  const gateway = createGateway({ origin: BACKEND, fetch: async (url, options) => {
    assert.equal(url, `${BACKEND}/api/users?sort=name&filter=admin&filter=editor`);
    assert.equal(options.headers.cookie, 'dashboard_session=demo');
    assert.equal(options.headers.origin, CANONICAL, 'Backend sees the canonical origin even when this is an authorized preview');
    assert.equal(options.body, '{"ids":[1]}');
    assert.equal(options.redirect, 'manual');
    return new Response('{"deleted":1}', { status: 200, headers: { 'content-type': 'application/json', 'set-cookie': 'dashboard_session=demo; Secure; HttpOnly; SameSite=Lax; Path=/' } });
  } });
  await gateway({ method: 'DELETE', url: '/api/proxy?path=users&sort=name&filter=admin&filter=editor', body: { ids: [1] }, headers }, res);
  assert.equal(state.status, 200);
  assert.equal(state.headers['cache-control'], 'no-store');
  assert.match(state.headers['set-cookie'][0], /HttpOnly/);
  assert.deepEqual(JSON.parse(state.body), { deleted: 1 });
});

test('auth/me rewrite works when Vercel preserves req.url and puts rewrite parameters in req.query', async () => {
  const { state, res } = record();
  const gateway = createGateway({ origin: BACKEND, gatewayOrigin: 'https://custom.example', fetch: async (url, options) => {
    assert.equal(url, `${BACKEND}/api/auth/me?locale=ru`);
    assert.equal(options.body, undefined);
    assert.equal(options.headers.origin, 'https://custom.example');
    return new Response('{"error":"Unauthorized"}', { status: 401 });
  } });
  await gateway({ method: 'GET', url: '/api/auth/me?locale=ru', query: { path: 'auth/me', locale: 'ru' }, headers }, res);
  assert.equal(state.status, 401);
  assert.equal(state.headers['cache-control'], 'no-store');
});

test('rejects traversal, external URLs, duplicate or missing reserved paths before calling backend', async () => {
  let calls = 0;
  const gateway = createGateway({ origin: BACKEND, fetch: async () => { calls++; throw new Error('Must not be called'); } });
  for (const path of ['../auth/me', 'auth/../me', 'https://evil.test/me', '//evil.test/me', 'auth\\me', 'auth/%2e%2e/me', '/auth/me', 'auth/me?other=1', 'auth/me#hash']) {
    const { state, res } = record();
    await gateway({ method: 'GET', url: `/api/proxy?path=${encodeURIComponent(path)}`, headers }, res);
    assert.equal(state.status, 400, path);
  }
  for (const url of ['/api/proxy', '/api/proxy?path=auth/me&path=users', '/api/proxy?path=']) {
    const { state, res } = record();
    await gateway({ method: 'GET', url, headers }, res);
    assert.equal(state.status, 400, url);
  }
  assert.equal(calls, 0);
});

test('rejects hostile client origins and keeps backend failures uncached', async () => {
  let calls = 0;
  const gateway = createGateway({ origin: BACKEND, fetch: async () => { calls++; throw new Error('Unavailable'); } });
  const rejected = record();
  await gateway({ method: 'GET', url: '/api/proxy?path=auth/me', headers: { ...headers, origin: 'https://evil.test' } }, rejected.res);
  assert.equal(rejected.state.status, 403);
  assert.equal(calls, 0);
  const unavailable = record();
  await gateway({ method: 'GET', url: '/api/proxy?path=auth/me', headers }, unavailable.res);
  assert.equal(unavailable.state.status, 502);
  assert.equal(unavailable.state.headers['cache-control'], 'no-store');
  assert.equal(calls, 1);
});

test('actual backend accepts rewritten login/me from a preview via the canonical gateway Origin', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'dashboard-gateway-test-'));
  process.env.DATA_FILE = join(directory, 'users.json');
  process.env.ALLOWED_ORIGINS = CANONICAL;
  const { createDashboardServer } = await import('./index.js');
  const { httpServer, wss } = createDashboardServer();
  t.after(async () => {
    wss.close();
    await new Promise(resolve => { httpServer.close(resolve); httpServer.closeIdleConnections(); });
    rmSync(directory, { recursive: true, force: true });
  });
  httpServer.listen(0, '127.0.0.1');
  await once(httpServer, 'listening');
  const target = `http://127.0.0.1:${httpServer.address().port}`;
  const gateway = createGateway({ origin: BACKEND, fetch: (url, options) => fetch(url.replace(BACKEND, target), options) });
  const loggedIn = record();
  await gateway({ method: 'POST', url: '/api/proxy?path=auth/login', headers, body: { login: 'admin', password: 'admin' } }, loggedIn.res);
  assert.equal(loggedIn.state.status, 200);
  const cookie = loggedIn.state.headers['set-cookie'][0].split(';')[0];
  const me = record();
  await gateway({ method: 'GET', url: '/api/proxy?path=auth/me', headers: { ...headers, cookie } }, me.res);
  assert.equal(me.state.status, 200);
  assert.equal(JSON.parse(me.state.body).user.login, 'admin');
  assert.equal(me.state.headers['cache-control'], 'no-store');
});
