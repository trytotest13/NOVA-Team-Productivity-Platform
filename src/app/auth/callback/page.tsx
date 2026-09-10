'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { Spinner } from '@/components/ui/spinner';

/**
 * Landing target of the API tier's Google OAuth redirect: the JWT arrives in the URL
 * fragment (never sent to servers), is stored locally, then the user moves to the dashboard.
 */
export default function AuthCallbackPage() {
  const { adoptToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (!token) {
      setError('No sign-in token was returned. Please try logging in again.');
      return;
    }
    adoptToken(token)
      .then(() => router.replace('/dashboard'))
      .catch(() => setError('Sign-in could not be completed. Please try again.'));
  }, [adoptToken, router]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Sign-in problem</h1>
        <p className="max-w-sm text-sm text-slate-600">{error}</p>
        <a
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-700"
        >
          Back to login
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Spinner />
      <p className="text-sm text-slate-600">Completing sign-in…</p>
    </main>
  );
}
