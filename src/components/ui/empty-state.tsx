import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from './button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}
    >
      <Icon className="h-10 w-10 text-slate-300" aria-hidden />
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-slate-600">{description}</p> : null}
      {action ? (
        <Button size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
