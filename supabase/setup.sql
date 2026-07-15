-- GVCC Learning Portal — Supabase setup.
--
-- Run once: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Creates the four tables the app needs, locks them down, and seeds the demo account
-- plus the lesson catalog.
--
-- Safe to re-run: tables use IF NOT EXISTS, constraints are dropped first, seed rows upsert.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- A student. Passwords are stored only as bcrypt hashes, never plaintext.
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- A lesson in the catalog. `slug` is the public URL key (/watch/<slug>).
CREATE TABLE IF NOT EXISTS "Video" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- Many bookmarks per (user, video). `label` is optional; `timeSec` is the resume point.
CREATE TABLE IF NOT EXISTS "Bookmark" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "timeSec" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- Exactly one row per (user, video) — powers continue-watching, the progress bar,
-- and recently-watched.
CREATE TABLE IF NOT EXISTS "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "positionSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"  ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Video_slug_key"  ON "Video"("slug");

-- Every bookmark read is scoped to one user's view of one video.
CREATE INDEX IF NOT EXISTS "Bookmark_userId_videoId_idx" ON "Bookmark"("userId", "videoId");

-- Continue-watching sorts a user's rows by recency.
CREATE INDEX IF NOT EXISTS "Progress_userId_updatedAt_idx" ON "Progress"("userId", "updatedAt");

-- Enforces one-progress-row-per-(user, video) at the database, not just in app code.
CREATE UNIQUE INDEX IF NOT EXISTS "Progress_userId_videoId_key" ON "Progress"("userId", "videoId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Foreign keys
--
-- ON DELETE CASCADE: deleting a user or a lesson clears its dependent rows rather than
-- leaving orphans. Dropped before adding so this script stays re-runnable.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Bookmark" DROP CONSTRAINT IF EXISTS "Bookmark_userId_fkey";
ALTER TABLE "Bookmark" ADD  CONSTRAINT "Bookmark_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bookmark" DROP CONSTRAINT IF EXISTS "Bookmark_videoId_fkey";
ALTER TABLE "Bookmark" ADD  CONSTRAINT "Bookmark_videoId_fkey"
    FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Progress" DROP CONSTRAINT IF EXISTS "Progress_userId_fkey";
ALTER TABLE "Progress" ADD  CONSTRAINT "Progress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Progress" DROP CONSTRAINT IF EXISTS "Progress_videoId_fkey";
ALTER TABLE "Progress" ADD  CONSTRAINT "Progress_videoId_fkey"
    FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security
--
-- The `public` schema is reachable through Supabase's Data API (PostgREST) by anyone
-- holding the project's anon key. This app talks to Postgres directly and never uses
-- the Data API, so these tables should not be exposed there at all. RLS enabled with
-- *no policies* denies the Data API everything, while the app is unaffected: it
-- connects as `postgres`, which owns these tables, and a table owner bypasses its own
-- RLS. Authorization stays where it already lives — the session check in each route
-- handler.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "User"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Progress" ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Seed — demo account (demo@gvcc.dev / password123)
--
-- The literal below is a bcrypt hash of "password123" at cost 10. Re-running re-asserts
-- it, so the demo credential keeps working even if the row already existed.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "User" ("id", "email", "name", "passwordHash")
VALUES (
    gen_random_uuid()::text,
    'demo@gvcc.dev',
    'Demo Student',
    '$2a$10$bgF2Nby/P8CILA65Q.avIe6FdGR4EKRg3n4CWZZFRTITVhD1.t5nW'
)
ON CONFLICT ("email") DO UPDATE
    SET "passwordHash" = EXCLUDED."passwordHash",
        "name"         = EXCLUDED."name";

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Seed — lesson catalog
--
-- Clips are CC0 samples bundled at public/videos/, so playback has no external
-- dependency and can't break on a blocked CDN. `durationSec` is a placeholder — the
-- player reads real duration from video metadata. `thumbnail` is intentionally empty:
-- cards render deterministic gradients instead.
--
-- Upserts on slug rather than delete-and-recreate, so re-running never cascades away
-- a student's bookmarks or progress.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "Video" ("id", "slug", "title", "description", "url", "thumbnail", "durationSec", "category")
VALUES
    (gen_random_uuid()::text, 'intro-motion-design', 'Introduction to Motion Design',
     'How movement guides attention — the foundations of motion on screen.',
     '/videos/big-buck-bunny.mp4', '', 10, 'Design'),

    (gen_random_uuid()::text, 'color-and-light', 'Color & Light Fundamentals',
     'Reading color, contrast, and light to set mood and hierarchy.',
     '/videos/sintel.mp4', '', 10, 'Design'),

    (gen_random_uuid()::text, 'storytelling-basics', 'Storytelling for Creators',
     'Structure, pacing, and the shape of a compelling short narrative.',
     '/videos/jellyfish.mp4', '', 10, 'Fundamentals'),

    (gen_random_uuid()::text, 'composition-101', 'Composition 101',
     'Framing, balance, and the rule of thirds in practice.',
     '/videos/big-buck-bunny.mp4', '', 10, 'Design'),

    (gen_random_uuid()::text, 'sound-and-pacing', 'Sound & Pacing',
     'How audio and cut rhythm shape the feel of a scene.',
     '/videos/sintel.mp4', '', 10, 'Production'),

    (gen_random_uuid()::text, 'animation-principles', 'Animation Principles',
     'Timing, squash & stretch, and easing that make motion feel alive.',
     '/videos/jellyfish.mp4', '', 10, 'Development')
ON CONFLICT ("slug") DO UPDATE
    SET "title"       = EXCLUDED."title",
        "description" = EXCLUDED."description",
        "url"         = EXCLUDED."url",
        "thumbnail"   = EXCLUDED."thumbnail",
        "durationSec" = EXCLUDED."durationSec",
        "category"    = EXCLUDED."category";

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Verify — expect: users = 1, videos = 6, rls_enabled = 4
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
    (SELECT count(*) FROM "User")  AS users,
    (SELECT count(*) FROM "Video") AS videos,
    (SELECT count(*) FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'Video', 'Bookmark', 'Progress')
        AND rowsecurity) AS rls_enabled;
