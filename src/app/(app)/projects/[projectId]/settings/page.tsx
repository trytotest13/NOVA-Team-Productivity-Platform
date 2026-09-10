'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, UserPlus, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  useAddMember,
  useDeleteProject,
  useProject,
  useRemoveMember,
  useUpdateProject,
} from '@/hooks/use-projects';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';

const PROJECT_COLORS = [
  '#4F46E5',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
] as const;

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  color: z.enum(PROJECT_COLORS),
  dueDate: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user: authUser } = useAuth();
  const { data: project, isPending, isError, refetch } = useProject(projectId);
  const router = useRouter();

  const currentUserId = authUser?.id;
  const myRole = project?.members.find((member) => member.user.id === currentUserId)?.role;
  const isOwner = myRole === 'OWNER';

  if (isPending) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="max-w-2xl">
        <ErrorState onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsForm projectId={projectId} project={project} isOwner={isOwner} />
      <MemberManager projectId={projectId} isOwner={isOwner} />
      <DangerZone
        projectId={projectId}
        projectName={project.name}
        status={project.status}
        isOwner={isOwner}
      />
    </div>
  );
}

function SettingsForm({
  projectId,
  project,
  isOwner,
}: {
  projectId: string;
  project: { name: string; description: string | null; color: string; dueDate: string | null };
  isOwner: boolean;
}) {
  const { toast } = useToast();
  const updateProject = useUpdateProject(projectId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: project.name,
      description: project.description ?? undefined,
      color: (project.color as SettingsValues['color']) ?? '#4F46E5',
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : undefined,
    },
  });
  const selectedColor = watch('color');

  const onSubmit = (values: SettingsValues): void => {
    updateProject.mutate(
      {
        name: values.name,
        description: values.description ?? null,
        color: values.color,
        dueDate: values.dueDate ? new Date(`${values.dueDate}T17:00:00`).toISOString() : null,
      },
      {
        onSuccess: () => toast({ title: 'Project updated', variant: 'success' }),
        onError: (error: unknown) =>
          toast({
            title: error instanceof HttpError ? error.message : 'Update failed',
            variant: 'error',
          }),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card"
      noValidate
    >
      <h2 className="text-base font-semibold text-slate-900">Project settings</h2>

      <div className="space-y-1">
        <label htmlFor="settings-name" className="text-xs font-medium text-slate-900">
          Name
        </label>
        <Input
          id="settings-name"
          disabled={!isOwner}
          invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name ? <p className="text-[13px] text-red-600">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="settings-description" className="text-xs font-medium text-slate-900">
          Description
        </label>
        <Textarea id="settings-description" disabled={!isOwner} {...register('description')} />
      </div>

      <div className="space-y-1">
        <label htmlFor="settings-due" className="text-xs font-medium text-slate-900">
          Due date
        </label>
        <Input id="settings-due" type="date" disabled={!isOwner} {...register('dueDate')} />
      </div>

      <fieldset disabled={!isOwner}>
        <legend className="text-xs font-medium text-slate-900">Color</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use color ${color}`}
              aria-pressed={selectedColor === color}
              onClick={() => setValue('color', color, { shouldDirty: true })}
              className={cn(
                'h-7 w-7 rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                selectedColor === color ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : '',
                !isOwner ? 'cursor-not-allowed opacity-60' : '',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </fieldset>

      {isOwner ? (
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={updateProject.isPending} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Only the project owner can change these settings.</p>
      )}
    </form>
  );
}

function MemberManager({ projectId, isOwner }: { projectId: string; isOwner: boolean }) {
  const { data: project } = useProject(projectId);
  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const members = project?.members ?? [];
  const ownerCount = members.filter((member) => member.role === 'OWNER').length;

  const handleAdd = (): void => {
    const value = email.trim();
    if (!value) return;
    addMember.mutate(
      { email: value },
      {
        onSuccess: () => {
          setEmail('');
          toast({ title: 'Member added', variant: 'success' });
        },
        onError: (error: unknown) =>
          toast({
            title: error instanceof HttpError ? error.message : 'Could not add the member',
            variant: 'error',
          }),
      },
    );
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h2 className="text-base font-semibold text-slate-900">Members</h2>

      <ul className="mt-3 divide-y divide-slate-100">
        {members.map((member) => {
          const isLastOwner = member.role === 'OWNER' && ownerCount <= 1;
          return (
            <li key={member.user.id} className="flex items-center gap-3 py-2.5">
              <Avatar
                name={member.user.name ?? member.user.email ?? 'Member'}
                src={member.user.image ?? undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="truncate text-xs text-slate-500">{member.user.email}</p>
              </div>
              <Badge tone={member.role === 'OWNER' ? 'green' : 'slate'}>{member.role}</Badge>
              {isOwner && !isLastOwner ? (
                <button
                  type="button"
                  aria-label={`Remove ${member.user.name ?? 'member'}`}
                  onClick={() =>
                    removeMember.mutate(member.user.id, {
                      onError: (error: unknown) =>
                        toast({
                          title:
                            error instanceof HttpError ? error.message : 'Could not remove member',
                          variant: 'error',
                        }),
                    })
                  }
                  className="rounded-md p-1 text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isOwner ? (
        <div className="mt-3 flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="teammate@company.com"
            aria-label="Add member by email"
          />
          <Button size="md" onClick={handleAdd} loading={addMember.isPending}>
            <UserPlus className="h-4 w-4" aria-hidden /> Add
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function DangerZone({
  projectId,
  projectName,
  status,
  isOwner,
}: {
  projectId: string;
  projectName: string;
  status: 'ACTIVE' | 'ARCHIVED';
  isOwner: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject(projectId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isOwner) return null;

  return (
    <section className="rounded-xl border border-red-100 bg-red-50/50 p-4">
      <h2 className="text-base font-semibold text-red-700">Danger zone</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={updateProject.isPending}
          onClick={() =>
            updateProject.mutate(
              { status: status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' },
              {
                onSuccess: () =>
                  toast({
                    title: status === 'ACTIVE' ? 'Project archived' : 'Project unarchived',
                    variant: 'success',
                  }),
              },
            )
          }
        >
          {status === 'ACTIVE' ? 'Archive project' : 'Unarchive project'}
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" aria-hidden /> Delete project
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Delete “${projectName}”?`}
        description="All tasks, comments and activity will be permanently deleted. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteProject.isPending}
              onClick={() =>
                deleteProject.mutate(undefined, {
                  onSuccess: () => router.push('/projects'),
                  onError: () => toast({ title: 'Could not delete the project', variant: 'error' }),
                })
              }
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Type-safe confirmation: this action is immediate.</p>
      </Dialog>
    </section>
  );
}
