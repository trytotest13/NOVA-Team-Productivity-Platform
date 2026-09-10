import 'server-only';

import { SignJWT, jwtVerify } from 'jose';

import { env } from '@/lib/env';

/** HS256 auth token, sub = user id, 7-day expiry (trd.md §5). */
function jwtSecret(): Uint8Array {
  if (!env.AUTH_JWT_SECRET) {
    throw new Error('AUTH_JWT_SECRET is not configured');
  }
  return new TextEncoder().encode(env.AUTH_JWT_SECRET);
}

export async function signAuthToken(userId: string): Promise<string> {
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret());
}

export async function verifyAuthToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, jwtSecret());
  if (!payload.sub) {
    throw new Error('Auth token is missing its subject');
  }
  return payload.sub;
}
