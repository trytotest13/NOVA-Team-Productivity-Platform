'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ProjectTabs } from '@/components/layout/project-tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useProject } from '@/hooks/use-projects';
import { HttpError } from '@/lib/http';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isPending, isError, error, refetch } = useProject(projectId);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 md:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="pt-6">{children}</div>
      </div>
    );
  }

  if (isError) {
    const denied = error instanceof HttpError && error.status === 403;
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <ErrorState
          title={denied ? 'You do not have access' : 'Could not load project'}
          description={
            denied
              ? 'This project belongs to another team. Head back to your own dashboard.'
              : 'The project may have been deleted, or the API is unreachable.'
          }
          onRetry={denied ? undefined : () => void refetch()}
        />
        <p className="mt-2 text-center">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Go to dashboard
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
          {project.status === 'ARCHIVED' ? <Badge tone="slate">Archived</Badge> : null}
          {project.dueDate ? (
            <span className="text-sm tabular-nums text-slate-500">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <div className="flex -space-x-2">
          {project.members.slice(0, 6).map((member) => (
            <Avatar
              key={member.user.id}
              name={member.user.name ?? 'Member'}
              src={member.user.image ?? undefined}
              className="ring-2 ring-white"
            />
          ))}
        </div>
        <ProjectTabs projectId={projectId} />
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}
