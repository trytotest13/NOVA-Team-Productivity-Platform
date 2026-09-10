import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS for the split deployment (trd.md §5): the API tier on Render allows only the
 * web tier origin (FRONTEND_URL) to call /api/** with Bearer tokens.
 */
const ALLOWED_ORIGIN = process.env.FRONTEND_URL ?? 'http://localhost:3000';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

export function middleware(request: NextRequest): NextResponse {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
