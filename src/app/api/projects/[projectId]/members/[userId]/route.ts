import { MemberRole } from '@prisma/client';
import type { NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import { apiSuccess, handleApiError, ApiRequestError, requireProjectMember } from '@/lib/api';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: { projectId: string; userId: string } };

export async function DELETE(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { user: sessionUser, isOwner } = await requireProjectMember(params.projectId);
    if (!isOwner) {
      throw new ApiRequestError('FORBIDDEN', 403, 'Only the project owner can remove members');
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.projectId, userId: params.userId } },
    });
    if (!membership) throw new ApiRequestError('NOT_FOUND', 404, 'That person is not a member');

    if (membership.role === MemberRole.OWNER) {
      const owners = await prisma.projectMember.count({
        where: { projectId: params.projectId, role: MemberRole.OWNER },
      });
      if (owners <= 1) {
        throw new ApiRequestError('CONFLICT', 409, 'Cannot remove the last owner of the project');
      }
    }

    const removedName = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { name: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({ where: { id: membership.id } });
      await logActivity(tx, {
        projectId: params.projectId,
        actorId: sessionUser.id,
        type: 'MEMBER_REMOVED',
        metadata: { memberName: removedName?.name ?? 'a member' },
      });
    });

    return apiSuccess({ removed: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
