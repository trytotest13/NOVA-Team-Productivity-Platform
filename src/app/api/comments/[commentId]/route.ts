import type { NextResponse } from 'next/server';

import { apiSuccess, handleApiError, ApiRequestError, requireProjectMember } from '@/lib/api';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: { commentId: string } };

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      include: { task: { select: { projectId: true } } },
    });
    if (!comment) throw new ApiRequestError('NOT_FOUND', 404, 'Comment not found');

    const { user, isOwner } = await requireProjectMember(comment.task.projectId);
    if (comment.authorId !== user.id && !isOwner) {
      throw new ApiRequestError(
        'FORBIDDEN',
        403,
        'Only the author or the project owner can delete a comment',
      );
    }

    await prisma.comment.delete({ where: { id: comment.id } });
    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
