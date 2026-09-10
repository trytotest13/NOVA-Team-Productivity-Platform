'use client';

import { MessageSquare, Move } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { TASK_STATUSES, type TaskItem, type TaskStatus } from '@/types/api';

const PRIORITY_TONE: Record<TaskItem['priority'], 'slate' | 'blue' | 'orange' | 'red'> = {
  LOW: 'slate',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

function dueState(dueDate: string | null): 'none' | 'soon' | 'overdue' {
  if (!dueDate) return 'none';
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 48 * 60 * 60 * 1000) return 'soon';
  return 'none';
}

export function TaskCard({ task, onOpen }: { task: TaskItem; onOpen: () => void }) {
  const due = dueState(task.dueDate);

  /** Keyboard/AT-friendly alternative to dragging: the board listens for this event. */
  const moveTo = (status: TaskStatus): void => {
    window.dispatchEvent(
      new CustomEvent('nova:move-task', { detail: { taskId: task.id, status } }),
    );
  };

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-card transition-shadow duration-150 hover:shadow-lg"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">{task.title}</p>
        <DropdownMenu
          triggerLabel={`Task options for ${task.title}`}
          trigger={
            <span
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Move className="h-4 w-4" aria-hidden />
            </span>
          }
          items={[
            { label: 'Open details', onSelect: onOpen },
            ...TASK_STATUSES.map((status) => ({
              label: `Move to ${status.replace('_', ' ').toLowerCase()}`,
              onSelect: () => moveTo(status),
            })),
          ]}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
        {due !== 'none' ? (
          <Badge tone={due === 'overdue' ? 'red' : 'amber'} dot>
            {due === 'overdue' ? 'Overdue' : 'Due soon'}
          </Badge>
        ) : null}
        <span className="ml-auto flex items-center gap-1.5">
          {task.commentCount && task.commentCount > 0 ? (
            <span className="flex items-center gap-1 text-xs tabular-nums text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {task.commentCount}
            </span>
          ) : null}
          {task.assignee ? (
            <Avatar
              name={task.assignee.name ?? 'Assignee'}
              src={task.assignee.image ?? undefined}
              size="sm"
            />
          ) : null}
        </span>
      </div>
    </div>
  );
}
