import type { NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import {
  apiSuccess,
  handleApiError,
  ApiRequestError,
  parseJsonBody,
  requireProjectMember,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { assertAssigneeIsMember } from '@/lib/task-access';
import { createTaskSchema, taskFiltersSchema } from '@/lib/validations/task';

type RouteParams = { params: { projectId: string } };

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireProjectMember(params.projectId);

    const filters = taskFiltersSchema.safeParse({
      status: new URL(request.url).searchParams.get('status') ?? undefined,
      priority: new URL(request.url).searchParams.get('priority') ?? undefined,
      assigneeId: new URL(request.url).searchParams.get('assigneeId') ?? undefined,
      q: new URL(request.url).searchParams.get('q') ?? undefined,
    });
    if (!filters.success) {
      throw new ApiRequestError('VALIDATION_ERROR', 422, 'Invalid task filters');
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.projectId,
        ...(filters.data.status ? { status: filters.data.status } : {}),
        ...(filters.data.priority ? { priority: filters.data.priority } : {}),
        ...(filters.data.assigneeId ? { assigneeId: filters.data.assigneeId } : {}),
        ...(filters.data.q ? { title: { contains: filters.data.q, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        position: true,
        assigneeId: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        assignee: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
    });
    return apiSuccess(tasks);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { user } = await requireProjectMember(params.projectId);
    const data = await parseJsonBody(request, createTaskSchema);
    if (data.assigneeId) await assertAssigneeIsMember(params.projectId, data.assigneeId);

    const maxPosition = await prisma.task.aggregate({
      where: { projectId: params.projectId, status: data.status },
      _max: { position: true },
    });

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          ...data,
          projectId: params.projectId,
          creatorId: user.id,
          position: (maxPosition._max.position ?? 0) + 500,
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          position: true,
          assigneeId: true,
          dueDate: true,
        },
      });
      await logActivity(tx, {
        projectId: params.projectId,
        actorId: user.id,
        taskId: created.id,
        type: 'TASK_CREATED',
        metadata: { taskTitle: created.title },
      });
      if (data.assigneeId) {
        await logActivity(tx, {
          projectId: params.projectId,
          actorId: user.id,
          taskId: created.id,
          type: 'TASK_ASSIGNED',
          metadata: { taskTitle: created.title, assigneeId: data.assigneeId },
        });
      }
      return created;
    });

    return apiSuccess(task, 201);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
