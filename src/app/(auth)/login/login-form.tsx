'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/components/auth/auth-provider';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl } from '@/lib/http';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput): Promise<void> => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
      router.push(callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard');
    } catch {
      setFormError('Incorrect email or password.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
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
          autoComplete="current-password"
          placeholder="••••••••"
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
        Log in
      </Button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
        <span className="text-xs text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => {
          window.location.href = apiUrl('/api/auth/google');
        }}
      >
        Continue with Google
      </Button>
    </form>
  );
}
