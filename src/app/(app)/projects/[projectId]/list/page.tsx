'use client';

import { ListTodo } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

import { TaskDrawer } from '@/components/tasks/task-drawer';
import { TaskFilters } from '@/components/tasks/task-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectMembers } from '@/hooks/use-projects';
import { useProjectTasks } from '@/hooks/use-tasks';
import { useBoardUi } from '@/stores/board-ui.store';
import type { TaskFilters as TaskFiltersType } from '@/types/api';

function filtersFromSearchParams(params: URLSearchParams): TaskFiltersType {
  return {
    status: (params.get('status') as TaskFiltersType['status']) ?? undefined,
    priority: (params.get('priority') as TaskFiltersType['priority']) ?? undefined,
    assigneeId: params.get('assigneeId') ?? undefined,
    q: params.get('q') ?? undefined,
  };
}

export default function ListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);

  const { openTaskId, openTask, closeTask } = useBoardUi();
  const { data: members } = useProjectMembers(projectId);
  const { data: tasks, isPending, isError, refetch } = useProjectTasks(projectId, filters);

  const openTaskItem = tasks?.find((task) => task.id === openTaskId) ?? null;

  return (
    <div className="space-y-4">
      <TaskFilters projectId={projectId} members={members ?? []} />

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks match"
          description="Try clearing the filters, or add tasks from the board view."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Task
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Status
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Priority
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Assignee
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const overdue =
                  task.dueDate !== null &&
                  task.status !== 'DONE' &&
                  new Date(task.dueDate) < new Date();
                return (
                  <tr
                    key={task.id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-slate-50"
                    onClick={() => openTask(task.id)}
                  >
                    <td className="max-w-64 truncate px-4 py-2.5 font-medium text-slate-900">
                      {task.title}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-600 md:table-cell">
                      {task.status.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-600 sm:table-cell">
                      {task.priority}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-600 lg:table-cell">
                      {task.assignee?.name ?? '-'}
                    </td>
                    <td
                      className={`px-4 py-2.5 tabular-nums ${
                        overdue ? 'font-medium text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskDrawer projectId={projectId} task={openTaskItem} />
    </div>
  );
}
