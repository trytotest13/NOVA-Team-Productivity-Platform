'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useCreateProject } from '@/hooks/use-projects';
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

interface FormValues {
  name: string;
  description?: string;
  color: (typeof PROJECT_COLORS)[number];
  dueDate?: string;
}

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  color: z.enum(PROJECT_COLORS),
  dueDate: z.string().optional(),
});

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProject = useCreateProject();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { color: '#4F46E5' },
  });

  const selectedColor = watch('color');

  const onSubmit = (values: FormValues): void => {
    createProject.mutate(
      {
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      },
      {
        onSuccess: (project) => {
          toast({ title: 'Project created', variant: 'success' });
          reset();
          onClose();
          router.push(`/projects/${project.id}/board`);
        },
        onError: (error: unknown) => {
          const message =
            error instanceof HttpError ? error.message : 'Could not create the project';
          toast({ title: message, variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create project"
      description="Give your project a name and a color your team will recognize."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="project-name" className="text-xs font-medium text-slate-900">
            Name
          </label>
          <Input
            id="project-name"
            placeholder="Website Relaunch"
            invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name ? <p className="text-[13px] text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="project-description" className="text-xs font-medium text-slate-900">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Textarea
            id="project-description"
            placeholder="What is this project about?"
            {...register('description')}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="project-due" className="text-xs font-medium text-slate-900">
            Due date <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Input id="project-due" type="date" {...register('dueDate')} />
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-slate-900">Color</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use color ${color}`}
                aria-pressed={selectedColor === color}
                onClick={() => setValue('color', color)}
                className={cn(
                  'h-7 w-7 rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  selectedColor === color ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : '',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" loading={createProject.isPending}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
