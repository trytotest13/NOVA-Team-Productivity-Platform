import type { NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import { apiSuccess, handleApiError, parseJsonBody, requireProjectMember } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTaskAccess } from '@/lib/task-access';
import { createCommentSchema } from '@/lib/validations/comment';

type RouteParams = { params: { taskId: string } };

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { task } = await requireTaskAccess(params.taskId);

    const comments = await prisma.comment.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });
    return apiSuccess(comments);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { task, userId } = await requireTaskAccess(params.taskId);
    const data = await parseJsonBody(request, createCommentSchema);

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { taskId: task.id, authorId: userId, body: data.body },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true } },
        },
      });
      await logActivity(tx, {
        projectId: task.projectId,
        actorId: userId,
        taskId: task.id,
        type: 'COMMENT_ADDED',
        metadata: { taskTitle: task.title },
      });
      return created;
    });

    return apiSuccess(comment, 201);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
