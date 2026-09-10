'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { TaskCard } from '@/components/board/task-card';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { Button } from '@/components/ui/button';
import { useBoardUi } from '@/stores/board-ui.store';
import { taskListKey, useCreateTask, useProjectTasks, useReorderTasks } from '@/hooks/use-tasks';
import { TASK_STATUSES, type TaskItem, type TaskStatus } from '@/types/api';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks, isPending, isError, refetch } = useProjectTasks(projectId);
  const reorderTasks = useReorderTasks(projectId);
  const createTask = useCreateTask(projectId);
  const queryClient = useQueryClient();
  const { openTaskId, openTask, closeTask, quickAddStatus, setQuickAddStatus } = useBoardUi();

  const columns = useMemo(() => {
    const map = new Map<TaskStatus, TaskItem[]>();
    for (const status of TASK_STATUSES) map.set(status, []);
    for (const task of tasks ?? []) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [tasks]);

  const openTaskFromCache = tasks?.find((task) => task.id === openTaskId) ?? null;

  /** Applies a status change optimistically and persists it. */
  const moveTask = (taskId: string, targetStatus: TaskStatus): void => {
    if (!tasks) return;
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;

    const column = columns.get(targetStatus) ?? [];
    const columnWithoutActive = column.filter((candidate) => candidate.id !== taskId);
    const taskIds = [...columnWithoutActive, task].map((candidate) => candidate.id);

    const unchanged =
      task.status === targetStatus && taskIds.every((id, index) => column[index]?.id === id);
    if (unchanged) return;

    const key = taskListKey(projectId);
    queryClient.setQueryData<TaskItem[]>(key, (current) => {
      if (!current) return current;
      return current.map((candidate) => {
        const nextIndex = taskIds.indexOf(candidate.id);
        if (nextIndex === -1) return candidate;
        return { ...candidate, status: targetStatus, position: (nextIndex + 1) * 500 };
      });
    });

    reorderTasks.mutate({ taskId, status: targetStatus, taskIds });
  };

  // Status changes dispatched by the card "Move to…" menu
  useEffect(() => {
    const handler = (event: Event): void => {
      const detail = (event as CustomEvent<{ taskId: string; status: TaskStatus }>).detail;
      moveTask(detail.taskId, detail.status);
    };
    window.addEventListener('nova:move-task', handler);
    return () => window.removeEventListener('nova:move-task', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over the latest tasks via moveTask
  });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="animate-pulse rounded-xl bg-slate-100 p-3">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
              <div className="h-16 rounded-lg bg-slate-200/70" />
              <div className="h-16 rounded-lg bg-slate-200/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-card">
        <p className="text-sm text-slate-600">Could not load the board.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => {
          const columnTasks = columns.get(status) ?? [];
          return (
            <section
              key={status}
              aria-label={`${STATUS_LABELS[status]} column`}
              className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-50 md:w-80"
              data-status={status}
            >
              <header className="flex items-center justify-between px-3 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ColumnDot status={status} />
                  {STATUS_LABELS[status]}
                  <span className="text-xs font-normal tabular-nums text-slate-400">
                    {columnTasks.length}
                  </span>
                </h2>
                <button
                  type="button"
                  aria-label={`Add task to ${STATUS_LABELS[status]}`}
                  onClick={() => setQuickAddStatus(status)}
                  className="rounded-md p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </header>

              <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onOpen={() => openTask(task.id)} />
                ))}

                {quickAddStatus === status ? (
                  <QuickAdd
                    onSubmit={(title) => {
                      createTask.mutate(
                        { title, status },
                        { onSettled: () => setQuickAddStatus(null) },
                      );
                    }}
                    onCancel={() => setQuickAddStatus(null)}
                    submitting={createTask.isPending}
                  />
                ) : columnTasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                    No tasks yet
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <TaskDrawer projectId={projectId} task={openTaskFromCache} />
    </>
  );
}

function ColumnDot({ status }: { status: TaskStatus }): React.ReactNode {
  const dotColors: Record<TaskStatus, string> = {
    TODO: 'bg-slate-500',
    IN_PROGRESS: 'bg-sky-600',
    IN_REVIEW: 'bg-violet-600',
    DONE: 'bg-green-600',
  };
  return <span className={`h-2 w-2 rounded-full ${dotColors[status]}`} aria-hidden />;
}

function QuickAdd({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (title: string) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState('');

  const submit = (): void => {
    const trimmed = title.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onSubmit(trimmed);
    setTitle('');
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="rounded-lg border border-slate-200 bg-white p-2 shadow-card"
    >
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
        placeholder="Task title…"
        aria-label="New task title"
        className="w-full rounded-md border-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
      />
      <div className="mt-2 flex justify-end gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={submitting}>
          Add
        </Button>
      </div>
    </form>
  );
}
