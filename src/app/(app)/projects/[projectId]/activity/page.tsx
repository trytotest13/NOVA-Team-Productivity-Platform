'use client';

import { Activity as ActivityIcon } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/http';
import type { ActivityItem, ActivityPage } from '@/types/api';

function describe(activity: ActivityItem): string {
  const actor = activity.actor.name ?? 'Someone';
  const taskTitle =
    (activity.metadata.taskTitle as string | undefined) ?? activity.task?.title ?? 'a task';
  const project = activity.metadata.projectName as string | undefined;

  switch (activity.type) {
    case 'PROJECT_CREATED':
      return project ? `created the project “${project}”` : 'created this project';
    case 'MEMBER_ADDED':
      return `added ${activity.metadata.memberName ?? 'a member'} to the project`;
    case 'MEMBER_REMOVED':
      return `removed ${activity.metadata.memberName ?? 'a member'} from the project`;
    case 'TASK_CREATED':
      return `created “${taskTitle}”`;
    case 'TASK_MOVED': {
      const from = (activity.metadata.from as string | undefined)?.replace('_', ' ').toLowerCase();
      const to = (activity.metadata.to as string | undefined)?.replace('_', ' ').toLowerCase();
      return `moved “${taskTitle}”${from && to ? ` from ${from} to ${to}` : ''}`;
    }
    case 'TASK_ASSIGNED':
      return `assigned “${taskTitle}”${activity.metadata.assigneeName ? ` to ${activity.metadata.assigneeName}` : ''}`;
    case 'TASK_COMPLETED':
      return `completed “${taskTitle}”`;
    case 'TASK_DELETED':
      return `deleted “${taskTitle}”`;
    case 'COMMENT_ADDED':
      return `commented on “${taskTitle}”`;
    default:
      return 'updated the project';
  }
}

export default function ActivityPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data, isPending, isError, refetch, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['activity', projectId, 'feed'],
      queryFn: ({ pageParam }: { pageParam: string }) =>
        apiFetch<ActivityPage>(
          `/api/projects/${projectId}/activity${pageParam ? `?cursor=${pageParam}` : ''}`,
        ),
      initialPageParam: '',
      getNextPageParam: (lastPage: ActivityPage) => lastPage.nextCursor,
    });

  if (isPending) {
    return (
      <div className="max-w-2xl space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const items = data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Project events like task moves and comments will appear here."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-1">
      <ol className="space-y-1">
        {items.map((activity) => (
          <li
            key={activity.id}
            className="flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-150 hover:bg-slate-50"
          >
            <Avatar
              name={activity.actor.name ?? 'Member'}
              src={activity.actor.image ?? undefined}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">
                  {activity.actor.name ?? 'Member'}
                </span>{' '}
                {describe(activity)}
              </p>
              <p className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {hasNextPage ? (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
