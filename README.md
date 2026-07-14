# GVCC Learning Portal

A student learning portal — watch lessons, drop **multiple timestamped bookmarks** per video,
resume playback from any bookmark, and pick up exactly where you left off. Built for the GVCC
assignment with a focus on clean, reusable code and a polished, responsive UI.

**Demo login:** `demo@gvcc.dev` / `password123`

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) + React 19 | One codebase for UI + API routes; easy deploy |
| Language | **TypeScript** (strict) | Type-safe end to end |
| Database | **Prisma + SQLite** | Zero-config, runs anywhere; swap `DATABASE_URL` for Postgres in prod |
| Auth | **bcryptjs + JWT (jose)** in an httpOnly cookie | Minimal, dependency-light, edge-safe |
| Validation | **Zod** | Every external input validated before it touches the DB |
| Styling | Hand-authored token-based CSS | Distinctive look, no framework weight |

---

## Run locally

Requires Node 18+.

```bash
npm install          # installs deps + generates the Prisma client
npm run db           # creates the SQLite DB, applies schema, seeds videos + demo user
npm run dev          # http://localhost:3000
```

`npm run db` = `prisma db push` + seed. Re-run it any time to reset data.

Run the unit tests with `npm test` (Vitest — validation schemas + time formatting).

### Production build

```bash
npm run build && npm start
```

---

## Features

### Required
- **Learning portal** — browse a library of lessons (category, duration, thumbnail).
- **Video player** — native controls, download/PiP disabled on protected content.
- **Multiple bookmarks per video** — each stores `label?` + `timestamp` + `videoId`.
- **View all bookmarks** for a video, sorted by timestamp.
- **Resume from a bookmark** — click any timestamp → playback jumps to that exact second
  (e.g. click `10:45` → resumes at 10:45, not 00:00).
- **Persistent storage** — bookmarks + progress live in the database, per user.
- **Screenshot protection** — see below.

### Bonus (all included)
- **Auth** — signup / login / logout, sessions via httpOnly JWT cookie, route middleware.
- **Edit / delete / rename bookmarks** (inline, optimistic).
- **Continue watching** — resume-in-progress videos surfaced on the home page.
- **Watch-progress indicator** — a fill bar on each video card.
- **Recently watched** — most-recent lessons row.
- **Responsive** — verified 320 / 375 / 768 / 1024 / 1440px; 44px touch targets.
- **Bookmark timeline** — clickable ticks + a live playhead rendered under the player.
- **Keyboard shortcuts** — `B` bookmarks the current moment; `[` / `]` jump to prev / next bookmark.
- **Shareable timestamp links** — `/watch/[slug]?t=645` deep-links to a moment; each bookmark has a copy-link action.
- **Library search** — filter lessons by title or category.
- **Robust states** — loading skeletons, themed `error` / `not-found`, and inline error toasts on failed actions.
- **Hardening** — rate limiting on auth/mutations, server-authoritative watch progress, and a unit-test suite (`npm test`).

---

## Screenshot protection — approach & honest limits

> **Web platform reality:** a browser **cannot** truly block an OS-level screenshot — the
> capture happens outside the page's reach. Any web solution is a *deterrent*, not
> prevention. This app ships the strongest practical web deterrents and documents the limit
> rather than pretending otherwise (the assignment explicitly asks for the best solution
> *supported by the stack*, documented).

Implemented (see `src/components/ScreenshotGuard.tsx` + `globals.css`):
- **Blur-on-blur** — protected media is heavily blurred the moment the app loses focus
  (tab switch, alt-tab, minimize) — exactly when screen-capture tools grab a frame.
- **PrintScreen interception** — clears the clipboard and flashes a warning toast.
- **Context-menu / drag / save-shortcut guard** on protected regions (`Ctrl+S/U/P`).
- **`user-select: none`**, `controlsList="nodownload"`, `disablePictureInPicture`.
- **HTTP hardening** — `X-Frame-Options: DENY`, `nosniff` (no embedding/hotlinking).

**For true prevention** (documented, not shipped here since this is a web build):
- **Android:** `FLAG_SECURE` on the window → screenshots/recording fully blocked.
- **iOS:** detect `UIScreen.capturedDidChange` / screenshot notification → blur or blank.
- **Desktop (Electron):** `win.setContentProtection(true)` → window is invisible in
  Zoom/Teams/OBS capture on Windows 11.

---

## Project structure

```
prisma/
  schema.prisma        User · Video · Bookmark · Progress
  seed.ts              6 sample lessons + demo user
src/
  middleware.ts        auth gate (redirects signed-out users to /login)
  lib/                 db · auth (jwt/bcrypt) · session · validation (zod) · time · types
  app/
    login, signup      auth pages (shared AuthForm)
    library            portal: continue-watching · recently · all lessons
    watch/[slug]       player + bookmark panel
    api/
      auth/*           signup · login · logout
      bookmarks/*      list · create · rename · delete
      progress         upsert position · list for continue-watching
  components/
    WatchExperience    player + resume + throttled progress autosave
    BookmarkPanel      multi-bookmark CRUD + seek-to-timestamp
    VideoCard          data-driven lesson card
    ScreenshotGuard    global deterrent layer
    Header             brand + logout
```

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` \| `/login` \| `/logout` | Session management |
| GET | `/api/bookmarks?videoId=` | List a user's bookmarks for a video |
| POST | `/api/bookmarks` | Create a bookmark `{ videoId, timeSec, label? }` |
| PATCH \| DELETE | `/api/bookmarks/:id` | Rename \| delete (ownership-checked) |
| GET | `/api/progress` | Continue-watching / recently-watched |
| POST | `/api/progress` | Upsert watch position `{ videoId, positionSec, durationSec }` |

All mutation routes require a valid session and validate input with Zod; bookmark/progress
rows are scoped to the authenticated user.

---

## Notes
- `.env` holds `DATABASE_URL` and `AUTH_SECRET` (dev defaults committed for convenience —
  **change `AUTH_SECRET` for any real deployment**).
- Sample videos are small CC0 clips bundled locally under `public/videos/` (served from the app,
  no external host) — so playback works offline and never breaks on a dead/blocked CDN.
