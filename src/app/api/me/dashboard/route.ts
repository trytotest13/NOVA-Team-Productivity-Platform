import type { NextResponse } from 'next/server';
import { startOfWeek } from 'date-fns';

import { apiSuccess, handleApiError, requireSession } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request): Promise<NextResponse> {
  try {
    const user = await requireSession();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const [myOpenTasks, overdueCount, completedThisWeek, projects] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: user.id, status: { not: 'DONE' } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.task.count({
        where: { assigneeId: user.id, status: { not: 'DONE' }, dueDate: { lt: now } },
      }),
      prisma.task.count({
        where: { assigneeId: user.id, status: 'DONE', completedAt: { gte: weekStart } },
      }),
      prisma.project.findMany({
        where: { members: { some: { userId: user.id } }, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { tasks: true } },
          tasks: { where: { status: 'DONE' }, select: { id: true } },
        },
      }),
    ]);

    return apiSuccess({
      openTasks: myOpenTasks.length,
      overdueCount,
      completedThisWeek,
      myTasks: myOpenTasks,
      projects: projects.map((project) => {
        const total = project._count.tasks;
        const done = project.tasks.length;
        return {
          id: project.id,
          name: project.name,
          color: project.color,
          total,
          done,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      }),
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
