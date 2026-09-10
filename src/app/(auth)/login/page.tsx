import Link from 'next/link';

import { googleOAuthEnabled } from '@/lib/env';

import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-slate-900">Log in to NOVA</h1>
      <p className="mt-1 text-sm text-slate-600">Plan. Collaborate. Deliver.</p>
      <LoginForm googleEnabled={googleOAuthEnabled} />
      <p className="mt-4 text-center text-sm text-slate-600">
        No account?{' '}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
