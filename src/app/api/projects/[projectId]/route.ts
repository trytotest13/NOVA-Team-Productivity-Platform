import type { NextResponse } from 'next/server';

import {
  apiSuccess,
  handleApiError,
  ApiRequestError,
  parseJsonBody,
  requireProjectMember,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { updateProjectSchema } from '@/lib/validations/project';

type RouteParams = { params: { projectId: string } };

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireProjectMember(params.projectId);

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!project) throw new ApiRequestError('NOT_FOUND', 404, 'Project not found');

    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: params.projectId },
      _count: { _all: true },
    });
    const countFor = (status: string): number =>
      statusCounts.find((entry) => entry.status === status)?._count._all ?? 0;
    const total = statusCounts.reduce((sum, entry) => sum + entry._count._all, 0);
    const done = countFor('DONE');

    return apiSuccess({
      ...project,
      stats: {
        total,
        done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        byStatus: {
          TODO: countFor('TODO'),
          IN_PROGRESS: countFor('IN_PROGRESS'),
          IN_REVIEW: countFor('IN_REVIEW'),
          DONE: done,
        },
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { isOwner } = await requireProjectMember(params.projectId);
    if (!isOwner) throw new ApiRequestError('FORBIDDEN', 403, 'Only the project owner can edit it');

    const data = await parseJsonBody(request, updateProjectSchema);
    const project = await prisma.project.update({
      where: { id: params.projectId },
      data,
    });
    return apiSuccess(project);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { isOwner } = await requireProjectMember(params.projectId);
    if (!isOwner)
      throw new ApiRequestError('FORBIDDEN', 403, 'Only the project owner can delete it');

    await prisma.project.delete({ where: { id: params.projectId } });
    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
