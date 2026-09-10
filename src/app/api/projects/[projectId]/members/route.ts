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
import { addMemberSchema } from '@/lib/validations/project';

type RouteParams = { params: { projectId: string } };

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireProjectMember(params.projectId);

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.projectId },
      orderBy: { joinedAt: 'asc' },
      select: {
        role: true,
        joinedAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    return apiSuccess(members);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { user: sessionUser, isOwner } = await requireProjectMember(params.projectId);
    if (!isOwner) {
      throw new ApiRequestError('FORBIDDEN', 403, 'Only the project owner can add members');
    }

    const { email } = await parseJsonBody(request, addMemberSchema);

    const invited = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });
    if (!invited) {
      throw new ApiRequestError(
        'NOT_FOUND',
        404,
        'No NOVA user with that email yet. Ask them to sign up first',
      );
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.projectId, userId: invited.id } },
    });
    if (existing) {
      throw new ApiRequestError('CONFLICT', 409, 'That person is already a member');
    }

    const membership = await prisma.$transaction(async (tx) => {
      const created = await tx.projectMember.create({
        data: { projectId: params.projectId, userId: invited.id },
        select: {
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });
      await logActivity(tx, {
        projectId: params.projectId,
        actorId: sessionUser.id,
        type: 'MEMBER_ADDED',
        metadata: { memberName: invited.name ?? email },
      });
      return created;
    });

    return apiSuccess(membership, 201);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
