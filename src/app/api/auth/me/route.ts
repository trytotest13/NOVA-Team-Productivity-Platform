import type { NextResponse } from 'next/server';

import { apiSuccess, handleApiError, requireSession } from '@/lib/api';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireSession();
    return apiSuccess(user);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
