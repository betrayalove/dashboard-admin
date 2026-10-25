// Keep session cookies first-party even when an older deployment still defines VITE_API_BASE.
export const API_BASE = '/api';

export type ApiError = { error: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { body, ...rest } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  const fetchOptions: RequestInit = {
    ...rest,
    headers,
    credentials: 'include',
  };
  if (body !== undefined && body !== null) {
    fetchOptions.body = body;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, fetchOptions);
  } catch {
    throw new Error('Не удалось подключиться к серверу. Запустите backend (npm run server или npm start).');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as ApiError).error || res.statusText;
    if (res.status === 401 && !path.includes('/auth/')) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(message);
  }
  return data as T;
}
