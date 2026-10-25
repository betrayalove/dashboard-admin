import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/[...path].js';

test('gateway forwards cookie, body, query and Set-Cookie without caching authenticated responses', async () => {
  const originalFetch = global.fetch;
  const previousOrigin = process.env.API_ORIGIN;
  process.env.API_ORIGIN = 'https://dashboard-test.onrender.com';
  const state = { headers: {} };
  const res = {
    setHeader: (key, value) => { state.headers[key] = value; },
    appendHeader: (key, value) => { state.headers[key] = [...(state.headers[key] || []), value]; },
    status(code) { state.status = code; return this; },
    json(value) { state.body = value; return this; },
    send(value) { state.body = value; return this; },
  };
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://dashboard-test.onrender.com/api/users?sort=name');
      assert.equal(options.headers.cookie, 'dashboard_session=demo');
      assert.equal(options.headers.origin, 'https://dashboard-demo.vercel.app');
      assert.equal(options.body, '{"ids":[1]}');
      return new Response('{"deleted":1}', { status: 200, headers: { 'content-type': 'application/json', 'set-cookie': 'dashboard_session=demo; Secure; HttpOnly; SameSite=Lax; Path=/' } });
    };
    await handler({ method: 'DELETE', url: '/api/users?sort=name', body: { ids: [1] }, headers: { host: 'dashboard-demo.vercel.app', origin: 'https://dashboard-demo.vercel.app', cookie: 'dashboard_session=demo' } }, res);
    assert.equal(state.status, 200);
    assert.equal(state.headers['Cache-Control'], 'no-store');
    assert.match(state.headers['Set-Cookie'][0], /HttpOnly/);
    await handler({ method: 'DELETE', url: '/api/users', headers: { host: 'dashboard-demo.vercel.app', origin: 'https://evil.test' } }, res);
    assert.equal(state.status, 403);
  } finally {
    global.fetch = originalFetch;
    if (previousOrigin) process.env.API_ORIGIN = previousOrigin; else delete process.env.API_ORIGIN;
  }
});
