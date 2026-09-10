import { NextResponse } from 'next/server';

import { env, googleOAuthEnabled } from '@/lib/env';
import { handleApiError, ApiRequestError } from '@/lib/api';

/** Starts the Google OAuth flow (optional feature — 503 when credentials are absent). */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    if (!googleOAuthEnabled) {
      throw new ApiRequestError('UNAVAILABLE', 503, 'Google sign-in is not configured');
    }

    const redirectUri = new URL('/api/auth/google/callback', request.url).toString();
    const state = crypto.randomUUID();

    const consentUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    consentUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    consentUrl.searchParams.set('redirect_uri', redirectUri);
    consentUrl.searchParams.set('response_type', 'code');
    consentUrl.searchParams.set('scope', 'openid email profile');
    consentUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(consentUrl.toString());
    response.cookies.set('nova-oauth-state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    });
    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
