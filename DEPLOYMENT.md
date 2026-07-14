# Vercel Deployment — Error Review & Fix

## The error

```
Error: AUTH_SECRET must be set to a 32+ character secret in production.
    at .next/server/app/api/auth/login/route.js
> Build error occurred
[Error: Failed to collect page data for /api/auth/login]
Command "npm run build" exited with 1
```

## Root cause

The build failed at `next build` → **"Collecting page data"**. To collect page data,
Next.js **imports every route module**, including `/api/auth/login`, which imports
`src/lib/auth.ts`.

That module used to validate `AUTH_SECRET` at the **top level** (module load), so the check
ran during the build, not at request time:

```ts
// old — runs the moment the module is imported, including during `next build`
if (process.env.NODE_ENV === "production" && (!RAW_SECRET || RAW_SECRET.length < 32)) {
  throw new Error("AUTH_SECRET must be set to a 32+ character secret in production.");
}
```

On Vercel, `.env` is git-ignored (correct — secrets must never be committed), so
`AUTH_SECRET` was never provided. `NODE_ENV` is `production` during a Vercel build → the
guard threw → build aborted.

## Fix — two parts

### 1. Code (done) — validate lazily, not at import

`src/lib/auth.ts` now resolves the secret on **first token operation** via `getSecret()`,
not at module load. `next build` can import the module without a secret present; a real
production request still fails fast if the secret is missing or too short. Verified: a
production build with **no `.env`** now completes with exit 0.

### 2. Config (you must do this in Vercel) — set the environment variables

The app still needs a real `AUTH_SECRET` to actually run. In the Vercel dashboard:

**Project → Settings → Environment Variables**, add for **Production** (and **Preview**):

| Key | Value | Notes |
|---|---|---|
| `AUTH_SECRET` | a 32+ char random string | generate: `openssl rand -base64 32` |
| `DATABASE_URL` | your database URL | **see the SQLite caveat below** |

Then **Deployments → ⋯ → Redeploy** (env vars only apply to new builds).

---

## ⚠️ Bigger blocker: SQLite does not work on Vercel

Fixing `AUTH_SECRET` makes the **build** pass, but the app will **not function** on Vercel
with `DATABASE_URL="file:./dev.db"`:

- Vercel's serverless filesystem is **read-only** (except `/tmp`) and **ephemeral** — a file
  written by one request is gone on the next invocation.
- The seeded `dev.db` is git-ignored, so it isn't even in the deployment.

**Options to make it truly run in production:**

1. **Turso / libSQL** (least change) — hosted SQLite-compatible. Keep Prisma's `sqlite`
   provider, point `DATABASE_URL` at the Turso URL + auth token. Best if you want to keep
   the current schema untouched.
2. **Vercel Postgres / Neon / Supabase** (most standard) — change `schema.prisma` provider
   to `postgresql`, set `DATABASE_URL` to the Postgres connection string, run
   `prisma migrate deploy` (or `prisma db push`) + seed against it.
3. **Demo-only, no persistence** — leave it as a local-only project and submit the repo +
   screen recording (the DB runs perfectly with `npm run db` locally). Deployment is
   optional per the assignment.

For a graded submission, **Option 1 (Turso)** is the fastest path to a working live link; the
README already notes SQLite → Postgres is a one-line `DATABASE_URL` swap for Option 2.

---

## Also seen in the log (non-blocking)

- `prisma generate` deprecation of `package.json#prisma` and Prisma 6→7 update notice —
  informational, safe to ignore for now.
- `eslint@8` / `rimraf` / `glob` deprecation warnings from transitive deps — no action needed.

## Summary

| Item | Status |
|---|---|
| Top-level `AUTH_SECRET` throw crashing the build | **Fixed in code** (lazy validation) |
| `AUTH_SECRET` env var in Vercel | **You must set it** (32+ chars) |
| `DATABASE_URL` / SQLite on serverless | **Needs a hosted DB** (Turso/Postgres) to run live |
| Production build passes with no `.env` | **Verified locally, exit 0** |
