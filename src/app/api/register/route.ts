import { hash } from 'bcryptjs';
import type { NextResponse } from 'next/server';

import { apiSuccess, handleApiError, ApiRequestError, parseJsonBody } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { name, email, password } = await parseJsonBody(request, registerSchema);

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ApiRequestError('CONFLICT', 409, 'An account with this email already exists');
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hash(password, 10) },
      select: { id: true, name: true, email: true },
    });

    return apiSuccess(user, 201);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
