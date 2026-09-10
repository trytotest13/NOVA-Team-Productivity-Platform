import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { NextResponse } from 'next/server';

import { ApiRequestError, handleApiError } from '@/lib/api';
import { env, googleOAuthEnabled } from '@/lib/env';
import { signAuthToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

interface GoogleIdToken extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

/** Exchanges the OAuth code for a Google id_token, links/creates the user, and issues our JWT. */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    if (!googleOAuthEnabled || !env.GOOGLE_CLIENT_SECRET) {
      throw new ApiRequestError('UNAVAILABLE', 503, 'Google sign-in is not configured');
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expectedState = request.headers
      .get('cookie')
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('nova-oauth-state='))
      ?.split('=')[1];

    if (!code || !state || !expectedState || state !== expectedState) {
      throw new ApiRequestError('VALIDATION_ERROR', 400, 'Invalid OAuth state — try again');
    }

    const redirectUri = new URL('/api/auth/google/callback', request.url).toString();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      throw new ApiRequestError('UNAUTHORIZED', 401, 'Google sign-in failed');
    }
    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokens.id_token) {
      throw new ApiRequestError('UNAUTHORIZED', 401, 'Google sign-in returned no identity');
    }

    const verified = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_ID,
    });
    const profile = verified.payload as GoogleIdToken;
    if (!profile.email || profile.email_verified === false) {
      throw new ApiRequestError('UNAUTHORIZED', 401, 'Google account has no verified email');
    }

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: { name: profile.name ?? undefined, image: profile.picture ?? undefined },
      create: {
        email: profile.email,
        name: profile.name,
        image: profile.picture,
        accounts: {
          create: {
            type: 'oauth',
            provider: 'google',
            providerAccountId: profile.sub,
          },
        },
      },
      select: { id: true, name: true, email: true, image: true },
    });

    const token = await signAuthToken(user.id);
    const target = new URL('/auth/callback', env.FRONTEND_URL);
    target.hash = `token=${token}`;

    const response = NextResponse.redirect(target.toString());
    response.cookies.set('nova-oauth-state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
