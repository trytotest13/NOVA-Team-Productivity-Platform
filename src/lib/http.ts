/** Typed fetch for the /api envelope: unwraps `{ data }`, throws HttpError from `{ error }`.
 *  Sends the Bearer token from localStorage; a 401 clears it and notifies listeners. */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'nova.auth-token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // SSR or storage disabled
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage disabled — session will not persist across reloads
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage disabled — nothing to clear
  }
}

/** Base URL of the API tier (trd.md §5b). Empty default keeps local single-origin dev working. */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}${path}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });

  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new CustomEvent('nova:unauthorized'));
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const envelope = body as { error?: { code?: string; message?: string } } | null;
    throw new HttpError(
      response.status,
      envelope?.error?.code ?? 'INTERNAL',
      envelope?.error?.message ?? 'Request failed',
    );
  }

  return (body as { data: T }).data;
}
