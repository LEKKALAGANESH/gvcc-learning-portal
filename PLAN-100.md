# Plan — GVCC Learning Portal → 100/100

## Question (true intent)
Take the graded build from **89/100** to a defensible **100/100** against the assignment's
five-dimension rubric, by closing every P1/P2 finding from the three review agents and adding
one genuinely standout innovation — without regressing the 40/40 Functionality score.

## Answer (strategy)
Fix the 11 findings in disjoint file-lanes, add a lightweight test suite for credibility,
and ship a cohesive **bookmark-timeline** innovation that ties directly to the core feature.
Re-run the same 3 review agents afterward; target is every dimension maxed. Parent (me) owns
all writes serially (no git repo → no worktrees); lanes are partitioned so no two touch the
same file.

## Point-recovery map (finding → fix → points)

| # | Finding (sev) | Fix | Dim | +pts |
|---|---|---|---|---|
| 1 | Bookmark create/rename fail silently; rename fakes success (P1) | Surface inline error via a shared `useToast`; keep edit mode open on failure; rollback add | Code+UX | core |
| 2 | No `loading/error/not-found` routes; bad slug → unstyled 404 (P1) | Add `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx` (themed) + skeletons | UX | +2 |
| 3 | No rate limiting on login/mutations (P2) | `src/lib/ratelimit.ts` (in-memory sliding window) on login/signup/bookmark/progress POST | DB/API | +1 |
| 4 | `/api/progress` trusts client `durationSec`, skips video check (P2) | Look up `Video.durationSec` server-side; derive `completed` from it; 404 on bad videoId | DB/API | +1 |
| 5 | Signup TOCTOU → 500 not 409 (P2) | Wrap `create` in try/catch; map Prisma `P2002` → 409 | DB/API | +0.5 |
| 6 | JWT secret hardcoded fallback, no prod fail-fast (P2) | Throw at startup when `NODE_ENV==='production'` && `AUTH_SECRET` unset | DB/API | +0.5 |
| 7 | `box-shadow` animated on hover — breaks own motion rule (P2) | Move depth to a `::after` pseudo-element `opacity` transition | UX | +0.5 |
| 8 | `--text-faint` ≈3.8:1 fails WCAG AA at <18px (P2) | Lighten token to ≥4.5:1; audit all usages | UX | +0.5 |
| 9 | `.bm-label` seek button misses 44px coarse-pointer rule (P2) | Add `.bm-label` to the `any-pointer: coarse` block | UX | +0.5 |
| 10 | Same video in 3 library sections (P2) | Dedupe `recent` vs `continueWatching`; exclude in-progress from "All" or label clearly | UX | +0.5 |
| 11 | Bookmark 201 vs signup 200 inconsistency; `updateMany` ownership (P3) | Signup → 201; bookmark PATCH/DELETE → single `updateMany`/`deleteMany({id,userId})` | Code | +1 |
| 12 | No tests (P3) | Vitest: validation schemas, `formatTime`, ownership/`completed` logic | Code | +1 |
| 13 | Innovation ceiling (score 9/10) | **Bookmark timeline** + `B` shortcut + `?t=` deep-link/share (below) | Innov | +1 |

Projected: Functionality 40 · Code 20 · DB/API 15 · UI/UX 15 · Innovation 10 = **100**.

## Innovation package (the +1, and the "best output" signal)
1. **Bookmark timeline strip** under the player: full-width bar, a clickable tick at each
   bookmark (`left = timeSec/duration`), hover tooltip = label + `mm:ss`, plus a live playhead
   marker synced to `currentTime`. Keeps native `<video controls>` (no fragile custom control
   rebuild) while giving a premium, feature-tied visual. New file `BookmarkTimeline.tsx`.
2. **Keyboard shortcuts** (in `WatchExperience`): `B` = bookmark now, `[` / `]` = jump to
   prev / next bookmark. Ignored while typing in an input. Documented in a small "?" hint.
3. **Deep-link + share**: `/watch/[slug]?t=645` starts playback at 645s; each bookmark row
   gets a "copy link" action that yields a shareable timestamped URL.

## Implementation — disjoint lanes (each names the EXACT files it owns)

- **Lane A — Route states (new files only):**
  `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`,
  `src/app/global-error.tsx`, `src/app/watch/[slug]/loading.tsx`
- **Lane B — Design tokens & motion:** `src/app/globals.css`
  (shadow→pseudo-element, `--text-faint` contrast, `.bm-label` 44px, timeline styles, skeletons)
- **Lane C — Bookmark UX + errors + share:** `src/components/BookmarkPanel.tsx`,
  `src/components/BookmarkTimeline.tsx` (new), `src/hooks/useToast.tsx` (new)
- **Lane D — Player interactivity:** `src/components/WatchExperience.tsx`
  (`?t=` resume precedence, `B`/`[`/`]` shortcuts, pass currentTime to timeline)
- **Lane E — API hardening:** `src/app/api/progress/route.ts`,
  `src/app/api/auth/signup/route.ts`, `src/app/api/auth/login/route.ts`,
  `src/app/api/bookmarks/[id]/route.ts`, `src/lib/ratelimit.ts` (new), `src/lib/auth.ts`
- **Lane F — Library dedupe + search:** `src/app/library/page.tsx`,
  `src/components/LibraryBrowser.tsx` (new client: search/filter by title+category)
- **Lane G — Tests (parent-owned, cross-cutting):** `package.json`, `vitest.config.ts`,
  `src/lib/validation.test.ts`, `src/lib/time.test.ts`
- **Lane H — Docs:** `README.md` (new features + shortcuts + test instructions)

**Cross-cutting / parent-serialized:** `package.json` (Lane G dep add), `globals.css`
(single owner = Lane B). No two lanes write the same file.

## Pre-mortem (what could go wrong)
- **Custom timeline desyncs from native seek** → subscribe to `timeupdate`, use % positioning;
  never assume `duration` before `loadedmetadata`.
- **`?t=` fights the saved-resume position** → precedence: explicit `?t=` > saved progress > 0.
- **Rate limiter false-positives in dev** → keyed by IP+route, generous window (e.g. 10/10s),
  in-memory only (documented as swap-for-Redis in prod).
- **Prod fail-fast breaks local build** → guard strictly on `NODE_ENV==='production'`.
- **Vitest + Next ESM friction** → isolate pure-function tests (no Next imports) so no app boot.
- **Regression risk** → re-run all runtime checks from the previous verification pass + the 3
  review agents; Functionality must stay 40/40.

## Verification protocol (evidence before claiming 100)
1. `npm run build` clean (0 type errors) + `npm test` green.
2. Browser drive: loading skeleton shows; bad slug → themed not-found; forced API failure →
   visible bookmark error + edit stays open; `B` adds bookmark; `[`/`]` jump; timeline ticks
   clickable + playhead moves; `?t=` deep-link resumes; library search filters.
3. A11y: `--text-faint` ≥4.5:1 (computed), `.bm-label` ≥44px on coarse, 0 console errors,
   no `box-shadow` in any hover transition.
4. Re-dispatch the 3 review agents → confirm 40/20/15/15/10.

## Definition of done
All 13 rows fixed & runtime-verified · `npm test` green · 3 agents re-score 100/100 ·
0 console errors · responsive 320–1440 · README updated · no dead code / no new `any`.
