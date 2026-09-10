import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { ProjectTabs } from '@/components/layout/project-tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.projectId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) redirect('/dashboard');

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: {
      name: true,
      color: true,
      status: true,
      dueDate: true,
      members: {
        orderBy: { joinedAt: 'asc' },
        select: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!project) redirect('/dashboard');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
          {project.status === 'ARCHIVED' ? <Badge tone="slate">Archived</Badge> : null}
          {project.dueDate ? (
            <span className="text-sm tabular-nums text-slate-500">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <div className="flex -space-x-2">
          {project.members.slice(0, 6).map((member) => (
            <Avatar
              key={member.user.id}
              name={member.user.name ?? 'Member'}
              src={member.user.image ?? undefined}
              className="ring-2 ring-white"
            />
          ))}
        </div>
        <ProjectTabs projectId={params.projectId} />
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}
