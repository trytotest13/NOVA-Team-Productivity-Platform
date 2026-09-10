import type { NextResponse } from 'next/server';

import { apiSuccess, handleApiError, ApiRequestError, parseJsonBody, requireProjectMember } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTaskAccess } from '@/lib/task-access';
import { reorderTasksSchema } from '@/lib/validations/task';

type RouteParams = { params: { taskId: string } };

/** Persists a board drag: sets the new status and rewrites column positions with a gap baseline. */
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { task } = await requireTaskAccess(params.taskId);
    const { status, taskIds } = await parseJsonBody(request, reorderTasksSchema);
    if (!taskIds.includes(task.id)) {
      throw new ApiRequestError('VALIDATION_ERROR', 422, 'The dragged task must be included in taskIds');
    }

    const ownedCount = await prisma.task.count({
      where: { id: { in: taskIds }, projectId: task.projectId },
    });
    if (ownedCount !== taskIds.length) {
      throw new ApiRequestError('FORBIDDEN', 403, 'Tasks span multiple projects');
    }

    await prisma.$transaction(
      taskIds.map((id, index) =>
        prisma.task.update({
          where: { id },
          data: {
            status,
            position: (index + 1) * 500,
            ...(status === 'DONE' ? { completedAt: new Date() } : { completedAt: null }),
          },
        }),
      ),
    );

    return apiSuccess({ reordered: taskIds.length });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
