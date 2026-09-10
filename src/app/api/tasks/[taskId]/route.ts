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
import { assertAssigneeIsMember, requireTaskAccess } from '@/lib/task-access';
import { updateTaskSchema } from '@/lib/validations/task';

type RouteParams = { params: { taskId: string } };

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { task, userId, isOwner } = await requireTaskAccess(params.taskId);
    const data = await parseJsonBody(request, updateTaskSchema);
    if (data.assigneeId) await assertAssigneeIsMember(task.projectId, data.assigneeId);

    const statusChanged = data.status !== undefined && data.status !== task.status;
    const assigneeChanged = data.assigneeId !== undefined && data.assigneeId !== task.assigneeId;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: task.id },
        data: {
          ...data,
          ...(statusChanged ? { completedAt: data.status === 'DONE' ? new Date() : null } : {}),
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          assigneeId: true,
          dueDate: true,
          completedAt: true,
        },
      });

      const base = { projectId: task.projectId, actorId: userId, taskId: task.id };
      if (statusChanged) {
        await logActivity(tx, {
          ...base,
          type: 'TASK_MOVED',
          metadata: { taskTitle: task.title, from: task.status, to: result.status },
        });
        if (result.status === 'DONE') {
          await logActivity(tx, {
            ...base,
            type: 'TASK_COMPLETED',
            metadata: { taskTitle: task.title },
          });
        }
      }
      if (assigneeChanged && data.assigneeId) {
        await logActivity(tx, {
          ...base,
          type: 'TASK_ASSIGNED',
          metadata: { taskTitle: task.title, assigneeId: data.assigneeId },
        });
      }
      return result;
    });

    return apiSuccess({ ...updated, isOwner });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { task, userId, isOwner } = await requireTaskAccess(params.taskId);
    if (!isOwner && task.creatorId !== userId) {
      throw new ApiRequestError(
        'FORBIDDEN',
        403,
        'Only the creator or the project owner can delete a task',
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: task.id } });
      await logActivity(tx, {
        projectId: task.projectId,
        actorId: userId,
        type: 'TASK_DELETED',
        metadata: { taskTitle: task.title },
      });
    });

    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
