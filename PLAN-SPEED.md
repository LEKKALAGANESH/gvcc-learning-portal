# Plan — Make future small builds fast (update .claude global modules)

## Question (true intent)
This project took ~4h of portal work, but only ~45min was the actual build — the rest was
5 review→fix→re-review rounds (score oscillated 89→92→87→90) plus Windows/env friction.
Encode the lessons into the global `.claude` modules so the NEXT small project ships at
~95/100 on pass #1, in ~1h instead of ~4h.

## Answer (chosen approach)
Front-load quality (a pre-flight "definition-of-done" checklist of the exact items reviewers
flagged every round), cap the review loop, ship a reusable Next.js15+Prisma+auth recipe, and
fix the Windows dev-loop friction. Write these as new/updated modules and route to them.

## Root-cause time sinks (from this session)
1. **Review treadmill (~3h)** — built to ~70-89 then climbed via 5 rounds. Each round found
   NEW P2/P3s → asymptote. Fix: build to ~95 first pass; cap rounds; don't chase literal 100.
2. **Windows env friction (~40min)** — EADDRINUSE port zombies, Prisma EPERM DLL locks,
   repeated `next build`. Fix: documented dev-loop (fixed port + kill-by-port, skip prisma
   generate when client exists, iterate on `next dev` not prod build).
3. **Media verify detour (~20min)** — external video URLs unreachable in sandbox → ffmpeg
   clip + DB repoint + restore, twice. Fix: seed LOCAL assets for media features up front.

## Implementation (parent writes all ~/.claude files serially; agents READ-only)
- **Lane R1 (agent, read-only):** audit `~/.claude` layout/format — where do a fast-build
  playbook, a checklist gate, and a windows-dev-loop ref slot; frontmatter/`Co-load` convention;
  what nextjs/quality-gate/scaffold modules already exist (extend, don't duplicate).
- **Lane R2 (agent, read-only):** retrospective of THIS project → (a) reusable Next15+Prisma+
  auth starter recipe (file tree + canonical patterns), (b) the ~18-item "reviewers always dock
  for this" checklist, (c) the time-sink taxonomy with minutes.
- **Parent writes (serial):**
  - `~/.claude/playbooks/fast_small_build.md` — master playbook (recipe + checklist + review budget)
  - `~/.claude/<os|platforms>/windows_dev_loop.md` — env friction fixes (path from R1)
  - update `~/.claude/orchestrator/router.md` — route "New app/small build" → the playbook + Ship-gate checklist
  - `~/.claude/MEMORY.md` + a `feedback` memory note — the review-asymptote + front-load lesson
  - commit in `~/.claude`

## Definition of done
Modules created + routed + committed; next "build me an X" auto-loads the recipe + checklist;
review-budget rule prevents the treadmill.
