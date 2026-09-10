import 'server-only';

import { Prisma } from '@prisma/client';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z, ZodError, type ZodTypeAny } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ApiErrorCode =
  'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL';

/** Thrown anywhere inside a route handler; converted to a typed envelope by handleApiError. */
export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiRequestError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() } },
      { status: 422 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'That value already exists' } },
        { status: 409 },
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
        { status: 404 },
      );
    }
  }
  console.error('[api] unhandled error:', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL', message: 'Internal server error' } },
    { status: 500 },
  );
}

export async function requireSession(): Promise<Session['user']> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiRequestError('UNAUTHORIZED', 401, 'You must be signed in');
  }
  return session.user;
}

export async function requireProjectMember(
  projectId: string,
): Promise<{ user: Session['user']; role: 'OWNER' | 'MEMBER'; isOwner: boolean }> {
  const user = await requireSession();
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!member) {
    throw new ApiRequestError('FORBIDDEN', 403, 'You do not have access to this project');
  }
  return { user, role: member.role, isOwner: member.role === 'OWNER' };
}

/** Parses a JSON request body, throwing a typed ZodError on malformed JSON or validation failure. */
export async function parseJsonBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ApiRequestError('VALIDATION_ERROR', 422, 'Request body must be valid JSON');
  }
  return schema.parse(json);
}
