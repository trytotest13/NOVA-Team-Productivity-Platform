import Link from 'next/link';

import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Start planning with your team today.</p>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
