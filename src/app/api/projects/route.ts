import { MemberRole } from '@prisma/client';
import type { NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import { apiSuccess, handleApiError, parseJsonBody, requireSession } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { createProjectSchema } from '@/lib/validations/project';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireSession();
    const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true';

    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: user.id } },
        ...(includeArchived ? {} : { status: 'ACTIVE' as const }),
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        status: true,
        dueDate: true,
        updatedAt: true,
        members: { select: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { tasks: true } },
        tasks: { where: { status: 'DONE' }, select: { id: true } },
      },
    });

    return apiSuccess(
      projects.map((project) => {
        const taskCount = project._count.tasks;
        const doneCount = project.tasks.length;
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          color: project.color,
          status: project.status,
          dueDate: project.dueDate,
          updatedAt: project.updatedAt,
          memberCount: project.members.length,
          members: project.members.slice(0, 5).map((m) => m.user),
          taskCount,
          doneCount,
          progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0,
        };
      }),
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireSession();
    const data = await parseJsonBody(request, createProjectSchema);

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          ...data,
          ownerId: user.id,
          members: { create: { userId: user.id, role: MemberRole.OWNER } },
        },
      });
      await logActivity(tx, {
        projectId: created.id,
        actorId: user.id,
        type: 'PROJECT_CREATED',
        metadata: { projectName: created.name },
      });
      return created;
    });

    return apiSuccess(project, 201);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
