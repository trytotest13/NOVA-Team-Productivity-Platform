import 'server-only';

import { Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z, ZodError, type ZodTypeAny } from 'zod';

import { verifyAuthToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'UNAVAILABLE'
  | 'INTERNAL';

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

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  // Next.js signals "this route must be dynamic" by throwing an error carrying this
  // digest. Swallowing it here would mask that signal and report a 500 instead.
  if ((error as { digest?: unknown } | null)?.digest === 'DYNAMIC_SERVER_USAGE') {
    throw error;
  }
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

/** Verifies the Bearer JWT from the Authorization header and loads the user. */
export async function requireSession(): Promise<AuthUser> {
  const authHeader = headers().get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiRequestError('UNAUTHORIZED', 401, 'You must be signed in');
  }

  let userId: string;
  try {
    userId = await verifyAuthToken(authHeader.slice('Bearer '.length));
  } catch {
    throw new ApiRequestError('UNAUTHORIZED', 401, 'Session expired. Sign in again');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!user) {
    throw new ApiRequestError('UNAUTHORIZED', 401, 'Account not found');
  }
  return user;
}

export async function requireProjectMember(
  projectId: string,
): Promise<{ user: AuthUser; role: 'OWNER' | 'MEMBER'; isOwner: boolean }> {
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
