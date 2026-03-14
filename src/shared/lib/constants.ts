const envWsUrl = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_WS_URL?: string } }).env?.VITE_WS_URL;
export const WS_URL =
  typeof window !== 'undefined'
    ? (envWsUrl || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3082`)
    : '';

export const TOKEN_KEY = 'dashboard_token';
