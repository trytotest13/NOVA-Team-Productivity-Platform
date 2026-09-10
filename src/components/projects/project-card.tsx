'use client';

import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useDeleteProject, useUpdateProject } from '@/hooks/use-projects';
import type { ProjectListItem } from '@/types/api';

export function ProjectCard({ project, onOpen }: { project: ProjectListItem; onOpen: () => void }) {
  const router = useRouter();
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject(project.id);

  const isArchived = project.status === 'ARCHIVED';
  const dueSoon =
    project.dueDate !== null &&
    !isArchived &&
    new Date(project.dueDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div
      className={`group flex flex-col rounded-xl border bg-white shadow-card transition-shadow duration-150 hover:shadow-lg ${
        isArchived ? 'border-slate-200 opacity-75' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 rounded-t-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
              aria-hidden
            />
            <h2 className="truncate text-base font-semibold text-slate-900">{project.name}</h2>
          </span>
          {isArchived ? <Badge tone="slate">Archived</Badge> : null}
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.description}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-between text-xs tabular-nums text-slate-500">
          <span>
            {project.doneCount}/{project.taskCount} done
          </span>
          <span>{project.progress}%</span>
        </div>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={project.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${project.name} progress`}
        >
          <div
            className="h-full rounded-full bg-indigo-600"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members.map((member) => (
              <Avatar
                key={member.id}
                name={member.name ?? 'Member'}
                src={member.image ?? undefined}
                className="ring-2 ring-white"
              />
            ))}
          </div>
          {project.dueDate ? (
            <span
              className={`text-xs tabular-nums ${dueSoon ? 'font-medium text-amber-600' : 'text-slate-400'}`}
            >
              Due {new Date(project.dueDate).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <span className="text-xs text-slate-400">{project.memberCount} members</span>
        <DropdownMenu
          triggerLabel={`Project options for ${project.name}`}
          trigger={
            <span className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </span>
          }
          items={[
            {
              label: isArchived ? 'Unarchive' : 'Archive',
              onSelect: () => updateProject.mutate({ status: isArchived ? 'ACTIVE' : 'ARCHIVED' }),
            },
            {
              label: 'Delete',
              destructive: true,
              onSelect: () => {
                if (
                  window.confirm(
                    `Delete "${project.name}" and all its tasks? This cannot be undone.`,
                  )
                ) {
                  deleteProject.mutate(undefined, {
                    onSuccess: () => router.refresh(),
                  });
                }
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
