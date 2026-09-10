import 'server-only';

import { z } from 'zod';

/**
 * Boot-time environment validation (rules.md §8, trd.md §6).
 * The only module allowed to read process.env — everywhere else imports `env` from here.
 * Google credentials are optional: the OAuth option is hidden when they are absent.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (see .env.example)'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL (see .env.example)'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  SEED_DEMO_PASSWORD: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment configuration. Compare your .env with .env.example:\n${problems}`,
  );
}

export const env = parsed.data;

export const googleOAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
