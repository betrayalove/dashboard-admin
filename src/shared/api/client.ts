const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? 'http://localhost:3081/api' : '/api';

export type ApiError = { error: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, body, ...rest } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
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
