'use client';

import { Trash2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useBoardUi } from '@/stores/board-ui.store';
import { useProjectMembers } from '@/hooks/use-projects';
import {
  useAddComment,
  useDeleteComment,
  useDeleteTask,
  useTaskComments,
  useUpdateTask,
} from '@/hooks/use-tasks';
import { HttpError } from '@/lib/http';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
} from '@/types/api';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TaskDrawer({ projectId, task }: { projectId: string; task: TaskItem | null }) {
  const { openTaskId, closeTask } = useBoardUi();
  const { data: session } = useSession();
  const { toast } = useToast();
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: comments, isPending: commentsPending } = useTaskComments(openTaskId);
  const addComment = useAddComment(openTaskId, projectId);
  const deleteComment = useDeleteComment(openTaskId, projectId);

  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [mountedOnce, setMountedOnce] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (openTaskId) {
      setMountedOnce(true);
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      panelRef.current?.focus();
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [openTaskId]);

  if (!mounted || !mountedOnce || !openTaskId) return null;

  const currentUserId = session?.user?.id;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeTask();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) return;
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const patch = (values: Parameters<typeof updateTask.mutate>[0]['values']): void => {
    if (!task) return;
    updateTask.mutate(
      { taskId: task.id, values },
      {
        onError: (error: unknown) => {
          toast({
            title: error instanceof HttpError ? error.message : 'Update failed',
            variant: 'error',
          });
        },
      },
    );
  };

  const submitComment = (): void => {
    const body = commentText.trim();
    if (!body) return;
    addComment.mutate(body, {
      onSuccess: () => setCommentText(''),
      onError: () => toast({ title: 'Could not post the comment', variant: 'error' }),
    });
  };

  const drawerBody = !task ? (
    <div className="space-y-3 p-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Spinner className="mt-4" />
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className="space-y-4 overflow-y-auto p-4">
        <div>
          <label htmlFor="task-title" className="text-xs font-medium text-slate-900">
            Title
          </label>
          <Input
            id="task-title"
            defaultValue={task.title}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value && value !== task.title) patch({ title: value });
            }}
          />
        </div>

        <div>
          <label htmlFor="task-description" className="text-xs font-medium text-slate-900">
            Description
          </label>
          <Textarea
            id="task-description"
            defaultValue={task.description ?? ''}
            placeholder="Add context, links, acceptance criteria…"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value !== (task.description ?? '')) patch({ description: value || null });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-status" className="text-xs font-medium text-slate-900">
              Status
            </label>
            <Select
              id="task-status"
              value={task.status}
              onChange={(event) => patch({ status: event.target.value as TaskStatus })}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-priority" className="text-xs font-medium text-slate-900">
              Priority
            </label>
            <Select
              id="task-priority"
              value={task.priority}
              onChange={(event) => patch({ priority: event.target.value as TaskPriority })}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-assignee" className="text-xs font-medium text-slate-900">
              Assignee
            </label>
            <Select
              id="task-assignee"
              value={task.assigneeId ?? ''}
              onChange={(event) => patch({ assigneeId: event.target.value || null })}
            >
              <option value="">Unassigned</option>
              {(members ?? []).map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name ?? member.user.email}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="task-due" className="text-xs font-medium text-slate-900">
              Due date
            </label>
            <Input
              id="task-due"
              type="date"
              defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              onChange={(event) =>
                patch({
                  dueDate: event.target.value
                    ? new Date(`${event.target.value}T17:00:00`).toISOString()
                    : null,
                })
              }
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Comments</h3>
          </div>
          {commentsPending ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-4/5" />
            </div>
          ) : (comments ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No comments yet — start the conversation.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {(comments ?? []).map((comment) => (
                <li key={comment.id} className="flex items-start gap-2">
                  <Avatar
                    name={comment.author.name ?? 'User'}
                    src={comment.author.image ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {comment.author.name ?? 'Member'}
                      </span>{' '}
                      · {new Date(comment.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
                  </div>
                  {currentUserId === comment.author.id ? (
                    <button
                      type="button"
                      aria-label="Delete comment"
                      onClick={() =>
                        deleteComment.mutate(comment.id, {
                          onError: () =>
                            toast({ title: 'Could not delete the comment', variant: 'error' }),
                        })
                      }
                      className="rounded-md p-1 text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 space-y-2">
            <Textarea
              rows={2}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submitComment();
              }}
              placeholder="Write a comment… (⌘/Ctrl+Enter to post)"
              aria-label="New comment"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={submitComment}
                loading={addComment.isPending}
                disabled={!commentText.trim()}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-between border-t border-slate-100 p-4">
        <Button
          variant="danger"
          size="sm"
          loading={deleteTask.isPending}
          onClick={() => {
            deleteTask.mutate(task.id, {
              onSuccess: () => closeTask(),
              onError: (error: unknown) => {
                toast({
                  title:
                    error instanceof HttpError
                      ? error.message
                      : 'Only the creator or the project owner can delete this task',
                  variant: 'error',
                });
              },
            });
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Delete task
        </Button>
        <Button variant="secondary" size="sm" onClick={closeTask}>
          Close
        </Button>
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeTask();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={task ? `Task details: ${task.title}` : 'Task details'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-lg outline-none"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Task details</p>
          <button
            type="button"
            aria-label="Close task details"
            onClick={closeTask}
            className="rounded-lg p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {drawerBody}
      </div>
    </div>,
    document.body,
  );
}
