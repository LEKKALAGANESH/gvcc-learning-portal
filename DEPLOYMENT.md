# Deploying to Vercel

## The error

The build succeeds, but every request that touches the database returns 500:

```
POST /api/auth/login  500
PrismaClientInitializationError:
  Invalid `prisma.user.findUnique()` invocation:
  Error querying the database: Error code 14: Unable to open the database file
```

`/api/auth/signup` fails identically on `prisma.user.create()`. Both are the same fault —
Prisma cannot open the database, so it fails before any auth logic runs.

## Root cause

SQLite error code 14 is `SQLITE_CANTOPEN`. `DATABASE_URL` was `file:./dev.db` — a **file on
local disk**. That cannot work on Vercel, for two independent reasons:

1. **The file was never deployed.** `prisma/dev.db` is git-ignored (correctly — it's a build
   artifact). The serverless bundle has no such file, so there is nothing to open.
2. **Even if it were, it couldn't persist.** Vercel's serverless filesystem is read-only
   outside `/tmp`, and `/tmp` is ephemeral and per-instance. A signup written by one
   invocation would be invisible to the next and gone within minutes.

This is not a Prisma bug or a config typo. A single-file embedded database is structurally
incompatible with a stateless, horizontally-scaled runtime. The build passing is expected —
`next build` never opens a connection, so the fault only surfaces at request time.

## Fix — Supabase Postgres

Postgres is a network service, so any number of serverless instances can reach the same
data. Supabase provides managed Postgres plus **Supavisor**, a connection pooler — which
serverless specifically needs, because each invocation would otherwise open its own
connection and exhaust Postgres' connection limit under modest traffic.

### 1. Code (done)

| File | Change |
|---|---|
| `prisma/schema.prisma` | `provider = "sqlite"` → `"postgresql"`; added `directUrl` |
| `.env.example` | Documents `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) |
| `src/lib/db.ts` | Client is now reused across warm invocations, not just dev hot-reloads |

**Why two URLs.** The app runs through the *transaction* pooler (port 6543), which
multiplexes many short-lived connections onto few Postgres backends. Transaction mode
cannot hold a session, so it cannot run DDL — `prisma db push`, `migrate`, and `seed` use
`DIRECT_URL` (session pooler, port 5432) instead.

No application code changed. Prisma's query API is identical across providers, and the
schema uses no SQLite-specific types.

### 2. Create the Supabase project (you must do this)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) — free tier
   is sufficient. Save the database password it generates; it is shown once.
2. **Connect → ORMs → Prisma** gives both strings. Copy them into a local `.env`
   (`cp .env.example .env`), substituting your password.
3. Create the tables and seed the catalog. Either:
   - **SQL Editor** (no local setup needed) — paste [`supabase/setup.sql`](supabase/setup.sql)
     and Run. Creates all four tables, enables RLS, seeds 6 lessons + the demo account.
   - **From your machine** — `npm run db`, which does the same thing.
4. The last statement of `setup.sql` reports `users = 1, videos = 6, rls_enabled = 4`.
   Anything else means a step didn't apply.

### 3. Set the Vercel environment variables

**Project → Settings → Environment Variables**, for **Production** *and* **Preview**:

| Key | Value |
|---|---|
| `DATABASE_URL` | Supavisor transaction string, port **6543**, ending `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supavisor session string, port **5432** |
| `AUTH_SECRET` | 32+ random chars — `openssl rand -base64 32` |

Then **Deployments → ⋯ → Redeploy**. Env vars only apply to new builds.

### 4. Check the readiness probe first

```
https://<your-app>.vercel.app/api/health
```

`{"status":"ready","db":"up"}` means Postgres is connected. A `503` names the fault and its
fix, and reports the scheme and length of each connection string the running instance
actually received — which is the fastest way to catch the most common failure of all: an
env var edited in the dashboard but never redeployed, or edited for the wrong environment.
**Saving a variable does not redeploy.** Vercel binds the environment when a deployment is
created, so a running function keeps its old values until you redeploy.

### 5. Verify the flows on the live URL

Not "the deploy went green" — drive it:

1. Log in as `demo@gvcc.dev` / `password123` → expect **200**, not 500.
2. Sign up a new account → then log out and log back in. This proves the write *persisted*
   in Postgres rather than in one instance's memory.
3. Bookmark a video, hard-refresh → the bookmark is still there.

## Security note

The `public` schema is reachable through Supabase's Data API (PostgREST) for anyone holding
the project's anon key. This app never uses supabase-js and never ships that key to the
browser, but the tables should not be publicly readable regardless — so `setup.sql` enables
RLS on all four with no policies, which denies the Data API everything. Prisma is
unaffected: it connects as `postgres`, which owns the tables, and a table owner bypasses its
own RLS. Authorization stays where it already is — the session check in each route handler.

If you ran `npm run db` instead of `setup.sql`, apply section 4 of that file separately;
`prisma db push` does not manage RLS.

## Known limitation — rate limiting

`src/lib/ratelimit.ts` keeps its counters in process memory. On Vercel each instance has its
own, so the effective limit scales with instance count and resets on cold start. Adequate
for this project; a real deployment would move the counters to Redis or Postgres.

## Also in the build log (non-blocking)

- `package.json#prisma` deprecation and the Prisma 6→7 notice — informational.
- `eslint@8` / `rimraf` / `glob` deprecation warnings from transitive deps — no action.

## Summary

| Item | Status |
|---|---|
| SQLite on serverless (`code 14`) | **Fixed** — schema now targets Postgres |
| Connection pooling for serverless | **Handled** — transaction pooler + client reuse |
| Supabase project + `npm run db` | **You must do this** |
| `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET` in Vercel | **You must set these** |
| RLS enabled on all four tables | **You must run the SQL above** |
