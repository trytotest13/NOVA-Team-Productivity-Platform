import 'server-only';

import { z } from 'zod';

/**
 * Boot-time environment validation (rules.md §8, trd.md §6).
 * The only module allowed to read process.env: everywhere else imports `env` from here.
 * Role-aware via APP_ROLE: the API tier requires DB + JWT secrets; the web tier needs neither.
 */
const envSchema = z
  .object({
    APP_ROLE: z.enum(['api', 'web']).default('api'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().optional(),
    AUTH_JWT_SECRET: z.string().optional(),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().optional().default(''),
    GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
    SEED_DEMO_PASSWORD: z.string().optional().default(''),
  })
  .superRefine((value, ctx) => {
    if (value.APP_ROLE !== 'api') return;
    if (!value.DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL is required when APP_ROLE=api (see .env.example)',
      });
    }
    if (!value.AUTH_JWT_SECRET || value.AUTH_JWT_SECRET.length < 16) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_JWT_SECRET'],
        message: 'AUTH_JWT_SECRET (min 16 chars) is required when APP_ROLE=api',
      });
    }
  });

// During `next build` (e.g. on Vercel) Next.js imports every route module while
// collecting page data. Env vars may not be present in that context, so skip
// validation at build time — it still runs at runtime via instrumentation.ts.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && !isBuildPhase) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment configuration. Compare your .env with .env.example:\n${problems}`,
  );
}

export const env = parsed.success
  ? parsed.data
  : {
      // Build-time fallback only; runtime validation is enforced above.
      APP_ROLE: 'api' as const,
      NODE_ENV: 'production' as const,
      DATABASE_URL: undefined,
      AUTH_JWT_SECRET: undefined,
      FRONTEND_URL: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      SEED_DEMO_PASSWORD: '',
    };

export const googleOAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
