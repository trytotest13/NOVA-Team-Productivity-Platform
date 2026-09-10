import type { NextResponse } from 'next/server';

import { apiSuccess, handleApiError, requireProjectMember } from '@/lib/api';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: { projectId: string } };
const PAGE_SIZE = 30;

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireProjectMember(params.projectId);

    const cursorParam = new URL(request.url).searchParams.get('cursor');

    const activities = await prisma.activity.findMany({
      where: { projectId: params.projectId },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      ...(cursorParam ? { cursor: { id: cursorParam }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true } },
      },
    });

    const hasMore = activities.length > PAGE_SIZE;
    const page = hasMore ? activities.slice(0, PAGE_SIZE) : activities;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return apiSuccess({ items: page, nextCursor });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
