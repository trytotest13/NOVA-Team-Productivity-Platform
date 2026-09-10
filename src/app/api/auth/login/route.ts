import { compare } from 'bcryptjs';
import type { NextResponse } from 'next/server';

import { apiSuccess, handleApiError, ApiRequestError, parseJsonBody } from '@/lib/api';
import { signAuthToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password } = await parseJsonBody(request, loginSchema);

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user?.passwordHash ? await compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new ApiRequestError('UNAUTHORIZED', 401, 'Incorrect email or password');
    }

    const token = await signAuthToken(user.id);
    return apiSuccess({
      token,
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
