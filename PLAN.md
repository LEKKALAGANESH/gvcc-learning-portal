# Plan — GVCC Learning Portal

## Question (true intent)
Build the best-possible Learning Portal from the assignment brief, using the global module
library to hit senior quality with minimal, reusable code. Full scope incl. bonus features.

## Answer (chosen approach)
- **Stack:** Next.js 15 (App Router) + TypeScript strict, Prisma + SQLite (zero-secret, runs
  anywhere; swap DATABASE_URL for Postgres in prod), custom minimal auth (bcryptjs + jose JWT
  in httpOnly cookie), zod validation, hand-crafted token-based CSS (distinctive, no framework).
- **Screenshot protection (web = deter, honestly documented):** blur video on tab blur /
  visibilitychange, PrintScreen interception + clipboard wipe + warning flash, context-menu &
  selection & drag guard, best-effort DevTools deterrent. README documents the platform limit
  and how native (FLAG_SECURE / setContentProtection) would truly prevent.
- **Bookmarks:** multiple per user+video (label optional, timeSec, videoId); list, seek-to,
  rename, delete. Resume playback from exact timestamp.
- **Bonus:** auth, continue-watching, watch-progress bar, recently-watched, responsive UI.

## Modules routed (from orchestrator/router.md)
New Feature → playbooks/new_feature.md · Stack → nextjs/react/prisma adapters · Capability →
auth.md, forms.md, testing.md · UX → saas.md + player/empty/loading patterns · Security
auto-trigger (auth + protection) → validators/security.md · Verify → validators + evidence.

## Implementation (disjoint lanes — parent builds serially, dependent build)
1. **Config** — package.json, tsconfig, next.config, .gitignore, .env, globals.css
2. **Data** — prisma/schema.prisma, prisma/seed.ts, src/lib/db.ts
3. **Auth core** — src/lib/auth.ts, session.ts, middleware.ts, time.ts, validation.ts
4. **API** — api/auth/{signup,login,logout}, api/bookmarks/{route,[id]}, api/progress
5. **UI** — layout, globals, login, signup, library (portal), watch/[videoId]
6. **Components** — VideoPlayer, BookmarkPanel, VideoCard, ScreenshotGuard, ui primitives
7. **Docs+Verify** — README, run + drive the app, functional-completeness verdict

## Definition of done
Runs with `npm i && npm run db && npm run dev`. Every control wired+exercised. Resume-from-
timestamp verified. 0 console errors. Responsive 320–1440. README with setup + screenshot-
protection approach.
