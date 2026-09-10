/**
 * Runs once when the Next.js server boots: importing lib/env here fails fast
 * on invalid environment configuration before any request is served.
 */
export async function register(): Promise<void> {
  await import('@/lib/env');
}
