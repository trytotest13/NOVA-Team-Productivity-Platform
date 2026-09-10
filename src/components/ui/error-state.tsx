import { AlertCircle, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}
    >
      <AlertCircle className="h-10 w-10 text-red-600" aria-hidden />
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="max-w-sm text-sm text-slate-600">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
