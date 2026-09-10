'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { registerSchema, type RegisterInput } from '@/lib/validations/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput): Promise<void> => {
    setFormError(null);

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body: { error?: { message?: string } } = await response.json().catch(() => ({}));
      setFormError(body.error?.message ?? 'Could not create your account. Please try again.');
      return;
    }

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (result?.error) {
      router.push('/login');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="name" className="text-xs font-medium text-slate-900">
          Name
        </label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Priya Sharma"
          invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name ? <p className="text-[13px] text-red-600">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-slate-900">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@team.com"
          invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? <p className="text-[13px] text-red-600">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-medium text-slate-900">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-[13px] text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-[13px] text-red-600">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
            <span className="text-xs text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            Continue with Google
          </Button>
        </>
      ) : null}
    </form>
  );
}
