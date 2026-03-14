export const WS_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3082`
    : '';

export const TOKEN_KEY = 'dashboard_token';
