'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/components/auth/auth-provider';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HttpError, apiFetch } from '@/lib/http';

interface RegisterResponse {
  token: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

export function RegisterForm() {
  const { adoptToken } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput): Promise<void> => {
    setFormError(null);
    try {
      const result = await apiFetch<RegisterResponse>('/api/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      await adoptToken(result.token);
      router.push('/dashboard');
    } catch (error: unknown) {
      setFormError(
        error instanceof HttpError
          ? error.message
          : 'Could not create your account. Please try again.',
      );
    }
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
    </form>
  );
}
