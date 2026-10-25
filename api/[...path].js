// Keep the session cookie first-party: browsers only call /api on Vercel.
export default async function handler(req, res) {
  const backend = process.env.API_ORIGIN;
  if (!backend || !/^https:\/\//.test(backend)) return res.status(503).json({ error: 'API_ORIGIN is not configured' });
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin && origin !== `https://${host}`) return res.status(403).json({ error: 'Origin not allowed' });
  const url = new URL(req.url, 'https://gateway.local');
  const headers = { 'content-type': 'application/json' };
  if (req.headers.cookie) headers.cookie = req.headers.cookie;
  if (origin) headers.origin = origin;
  try {
    const upstream = await fetch(`${backend.replace(/\/$/, '')}${url.pathname}${url.search}`, {
      method: req.method, headers, redirect: 'manual', signal: AbortSignal.timeout(20000),
      ...(!['GET', 'HEAD'].includes(req.method) ? { body: JSON.stringify(req.body || {}) } : {}),
    });
    res.setHeader('Cache-Control', 'no-store');
    for (const cookie of upstream.headers.getSetCookie()) res.appendHeader('Set-Cookie', cookie);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.status(upstream.status).send(await upstream.text());
  } catch { res.status(502).json({ error: 'Backend is temporarily unavailable' }); }
}
