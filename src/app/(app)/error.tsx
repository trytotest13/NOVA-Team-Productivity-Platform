'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/components/ui/error-state';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred while loading this page."
        onRetry={reset}
      />
    </div>
  );
}
