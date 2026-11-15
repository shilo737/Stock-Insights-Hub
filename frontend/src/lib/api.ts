const TOKEN_KEY = 'sih_token';

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  status: number;
  details?: Array<{ path: string; message: string }>;
  constructor(status: number, message: string, details?: ApiError['details']) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.details?.[0]?.message;
    throw new ApiError(
      res.status,
      detail ? `${data.error}: ${detail}` : data?.error ?? 'הבקשה נכשלה',
      data?.details,
    );
  }
  return data as T;
}
