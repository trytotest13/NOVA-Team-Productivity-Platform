'use client';

import { AlertTriangle, CircleCheck, FolderKanban, ListTodo } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/use-dashboard';
import type { TaskPriority } from '@/types/api';

const priorityTone: Record<TaskPriority, 'slate' | 'blue' | 'orange' | 'red'> = {
  LOW: 'slate',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export default function DashboardPage() {
  const { data, isPending, isError, refetch } = useDashboard();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <ErrorState onRetry={() => void refetch()} />
      </div>
    );
  }

  const stats = [
    { label: 'Open tasks', value: data.openTasks, icon: ListTodo, tone: 'text-slate-600' },
    { label: 'Overdue', value: data.overdueCount, icon: AlertTriangle, tone: 'text-red-600' },
    {
      label: 'Completed this week',
      value: data.completedThisWeek,
      icon: CircleCheck,
      tone: 'text-green-600',
    },
    {
      label: 'Active projects',
      value: data.projects.length,
      icon: FolderKanban,
      tone: 'text-indigo-600',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Your work and project health at a glance.</p>
      </header>

      <section aria-label="Stats" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <stat.icon className={`h-5 w-5 ${stat.tone}`} aria-hidden />
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{stat.value}</p>
            <p className="text-[13px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-label="My tasks"
          className="rounded-xl border border-slate-200 bg-white shadow-card"
        >
          <h2 className="border-b border-slate-200 p-4 text-base font-semibold text-slate-900">
            My tasks
          </h2>
          {data.myTasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="Nothing assigned to you"
              description="When teammates assign you tasks, they show up here."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.myTasks.map((task) => {
                const overdue = task.dueDate !== null && new Date(task.dueDate) < new Date();
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/projects/${task.project.id}/board?task=${task.id}`)
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {task.title}
                        </span>
                        <span className="block text-xs text-slate-500">{task.project.name}</span>
                      </span>
                      {task.dueDate ? (
                        <span
                          className={`shrink-0 text-xs tabular-nums ${
                            overdue ? 'font-medium text-red-600' : 'text-slate-400'
                          }`}
                        >
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : null}
                      <Badge
                        tone={priorityTone[task.priority]}
                        className="hidden shrink-0 sm:inline-flex"
                      >
                        {task.priority}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-label="Project progress"
          className="rounded-xl border border-slate-200 bg-white shadow-card"
        >
          <h2 className="border-b border-slate-200 p-4 text-base font-semibold text-slate-900">
            Project progress
          </h2>
          {data.projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No active projects"
              description="Create a project to start tracking progress."
              action={{ label: 'Go to projects', onClick: () => router.push('/projects') }}
              className="py-8"
            />
          ) : (
            <ul className="space-y-4 p-4">
              {data.projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/${project.id}/board`)}
                    className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color }}
                          aria-hidden
                        />
                        <span className="truncate text-sm font-medium text-slate-900">
                          {project.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">
                        {project.done}/{project.total} · {project.progress}%
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={project.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${project.name} progress`}
                    >
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-150"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
