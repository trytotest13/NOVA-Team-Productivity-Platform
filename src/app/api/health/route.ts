import type { NextResponse } from 'next/server';

import { apiSuccess } from '@/lib/api';
import { env } from '@/lib/env';

/** Health probe for the Render service (implementation.md P4-T6). */
export async function GET(): Promise<NextResponse> {
  return apiSuccess({ status: 'ok', role: env.APP_ROLE });
}
