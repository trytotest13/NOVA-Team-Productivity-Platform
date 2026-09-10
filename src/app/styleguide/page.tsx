'use client';

import { FolderOpen, Plus } from 'lucide-react';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function StyleguidePage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">NOVA Styleguide</h1>
        <p className="mt-1 text-sm text-slate-600">
          Design-system reference — every primitive from design.md §6 in all its states.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button>
            <Plus className="h-4 w-4" aria-hidden /> With icon
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid max-w-md gap-4">
          <Input placeholder="Text input" />
          <Input placeholder="Invalid input" invalid />
          <Input placeholder="Disabled input" disabled />
          <Textarea placeholder="Textarea" />
          <Select defaultValue="">
            <option value="" disabled>
              Select an option
            </option>
            <option>One</option>
            <option>Two</option>
          </Select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="slate">TODO</Badge>
          <Badge tone="sky">In Progress</Badge>
          <Badge tone="violet">In Review</Badge>
          <Badge tone="green">Done</Badge>
          <Badge tone="blue">Medium</Badge>
          <Badge tone="orange">High</Badge>
          <Badge tone="red">Urgent</Badge>
          <Badge tone="amber" dot>
            Due soon
          </Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Cards & avatars</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Card className="w-64">
            <CardHeader>
              <CardTitle>Card title</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">Card content goes here.</CardContent>
          </Card>
          <div className="flex -space-x-2">
            <Avatar name="Priya Sharma" className="ring-2 ring-white" />
            <Avatar name="Marcus Chen" className="ring-2 ring-white" />
            <Avatar name="Dana K" className="ring-2 ring-white" />
          </div>
          <Avatar name="Priya Sharma" size="lg" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Feedback</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => toast({ title: 'Saved', variant: 'success' })}>
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast({ title: 'Failed', description: 'Try again.', variant: 'error' })}
          >
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: 'Heads up', variant: 'info' })}>
            Info toast
          </Button>
          <Spinner />
        </div>
        <div className="max-w-md space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex flex-wrap gap-4">
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create your first project to get your team organized."
            action={{ label: 'New project', onClick: () => setDialogOpen(true) }}
          />
          <ErrorState onRetry={() => toast({ title: 'Retried', variant: 'info' })} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Overlays</h2>
        <div className="flex gap-2">
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <DropdownMenu
            triggerLabel="Open menu"
            trigger={
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                Menu
              </span>
            }
            items={[
              { label: 'Edit', onSelect: () => toast({ title: 'Edit', variant: 'info' }) },
              {
                label: 'Archive',
                onSelect: () => toast({ title: 'Archived', variant: 'success' }),
              },
              {
                label: 'Delete',
                destructive: true,
                onSelect: () => toast({ title: 'Deleted', variant: 'error' }),
              },
            ]}
          />
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Create project"
        description="Dialog with focus trap, Escape and overlay close."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input placeholder="Project name" />
          <Textarea placeholder="Description" />
        </div>
      </Dialog>
    </main>
  );
}
