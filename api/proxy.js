// An explicit rewrite supports nested API routes on generic Vercel/Vite deployments.
export function createGateway(options = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const backend = options.origin || process.env.API_ORIGIN;
    const gatewayOrigin = options.gatewayOrigin || process.env.GATEWAY_ORIGIN || 'https://dashboard-admin-six-pi.vercel.app';
    try {
      const backendUrl = new URL(backend);
      if (backendUrl.protocol !== 'https:' || backendUrl.username || backendUrl.password || backendUrl.pathname !== '/' || backendUrl.search || backendUrl.hash) throw new Error('Invalid backend origin');
      if (new URL(gatewayOrigin).origin !== gatewayOrigin || !gatewayOrigin.startsWith('https://')) throw new Error('Invalid gateway origin');
    } catch { return res.status(503).json({ error: 'API_ORIGIN or GATEWAY_ORIGIN is not configured correctly' }); }
    const origin = req.headers.origin;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (origin && origin !== `https://${host}`) return res.status(403).json({ error: 'Origin not allowed' });
    const url = new URL(req.url, 'https://gateway.local');
    // Vercel can preserve the original URL while exposing rewritten parameters in req.query.
    for (const [key, value] of Object.entries(req.query || {})) {
      if (url.searchParams.has(key)) continue;
      for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
    }
    const paths = url.searchParams.getAll('path');
    if (paths.length !== 1 || !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(paths[0])) {
      return res.status(400).json({ error: 'Invalid API path' });
    }
    const path = paths[0];
    url.searchParams.delete('path');
    const query = url.searchParams.toString();
    const headers = { 'content-type': 'application/json', origin: gatewayOrigin };
    if (req.headers.cookie) headers.cookie = req.headers.cookie;
    try {
      const upstream = await (options.fetch || fetch)(`${backend.replace(/\/$/, '')}/api/${path}${query ? `?${query}` : ''}`, {
        method: req.method, headers, redirect: 'manual', signal: AbortSignal.timeout(20000),
        ...(!['GET', 'HEAD'].includes(req.method) ? { body: JSON.stringify(req.body || {}) } : {}),
      });
      for (const cookie of upstream.headers.getSetCookie()) res.appendHeader('Set-Cookie', cookie);
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.status(upstream.status).send(await upstream.text());
    } catch { res.status(502).json({ error: 'Backend is temporarily unavailable' }); }
  };
}
export default createGateway();
