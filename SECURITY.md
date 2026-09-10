# NOVA — Security Checklist

Pre-commit secret scanning uses the built-in checklist below; an optional `gitleaks` hook automates it (§3).

## 1. Before every commit (hard rule, rules.md §8)

- [ ] `git status` — no `.env`, `*.pem`, `*.key`, `credentials.json`, or unknown files staged
- [ ] Grep staged diff for secret patterns:
  ```bash
  git diff --staged -U0 | grep -inE "(postgres(ql)?://|mysql://|mongodb(\+srv)?://|sk-[a-zA-Z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|NEXTAUTH_SECRET=[^y])"
  ```
  Any hit → do **not** commit; remove the secret.
- [ ] No real credentials in seed files (seeds read `SEED_DEMO_PASSWORD` from env)

## 2. If a secret is ever committed

1. **STOP** all work. 2. **Rotate/revoke the key immediately** (history removal alone is NOT enough —
it is already exposed). 3. Purge from history (e.g. `git filter-repo`) only after rotation.
4. Note the incident in the Session Log.

## 3. Optional automation — gitleaks pre-commit hook

```bash
# one-time setup (requires gitleaks: https://github.com/gitleaks/gitleaks#installing)
gitleaks install --pre-commit   # or a manual .git/hooks/pre-commit that runs: gitleaks protect --staged
```
CI alternative: run `gitleaks detect --no-git -r report.json` (or `gitleaks detect`) in any pipeline.

## 4. Ongoing practices

- [ ] Secrets only in `.env` (gitignored) / host dashboard (Vercel env vars) — never in code, docs, or Slack
- [ ] `lib/env.ts` validates env at boot (fail-fast, no fallback defaults for secrets)
- [ ] Passwords hashed with bcrypt (cost ≥ 10); no password logging anywhere
- [ ] Zod validation at every API boundary; authorization (`requireSession`/`requireProjectMember`) before every DB touch
- [ ] Error responses never expose stack traces, SQL, or internal identifiers
- [ ] `pnpm audit` before each phase completion; dependabot-style updates as needed
- [ ] Prod DB uses TLS (`sslmode=require` in connection string) and is never shared in screenshots
- [ ] JWT storage: token lives in `localStorage` on the web tier (assignment-scale tradeoff; XSS mitigated by React escaping + zero `dangerouslySetInnerHTML` - production-grade would use in-memory + refresh tokens)
- [ ] `AUTH_JWT_SECRET` and `DATABASE_URL` exist only on the API tier (Render); the web tier never receives DB credentials
