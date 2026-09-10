/** Typed fetch for the /api envelope: unwraps `{ data }`, throws HttpError from `{ error }`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

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
