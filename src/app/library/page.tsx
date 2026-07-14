import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import LibraryBrowser, { type CardItem } from "@/components/LibraryBrowser";
import type { VideoDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const toDTO = (v: {
  id: string; slug: string; title: string; description: string;
  url: string; thumbnail: string; durationSec: number; category: string;
}): VideoDTO => ({
  id: v.id, slug: v.slug, title: v.title, description: v.description,
  url: v.url, thumbnail: v.thumbnail, durationSec: v.durationSec, category: v.category,
});

export default async function LibraryPage() {
  const session = await requireSession();

  const [videos, progress] = await Promise.all([
    db.video.findMany({ orderBy: { createdAt: "asc" } }),
    db.progress.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      include: { video: true },
    }),
  ]);

  const pctFor = (videoId: string) => {
    const p = progress.find((r) => r.videoId === videoId);
    return p && p.durationSec > 0 ? (p.positionSec / p.durationSec) * 100 : 0;
  };

  const all: CardItem[] = videos.map((v) => ({ video: toDTO(v), progressPct: pctFor(v.id) }));

  const inProgress = progress.filter((p) => !p.completed && p.positionSec > 3);
  const continueWatching: CardItem[] = inProgress.map((p) => ({
    video: toDTO(p.video), progressPct: pctFor(p.videoId),
  }));

  // Recently watched excludes anything already surfaced under Continue Watching (no dupes).
  const inProgressIds = new Set(inProgress.map((p) => p.videoId));
  const recent: CardItem[] = progress
    .filter((p) => !inProgressIds.has(p.videoId))
    .slice(0, 6)
    .map((p) => ({ video: toDTO(p.video), progressPct: pctFor(p.videoId) }));

  return (
    <>
      <Header name={session.name} />
      <main className="container" style={{ padding: "28px 20px 64px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, letterSpacing: "-0.02em" }}>
            Hey {session.name.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Pick a lesson, bookmark the moments that matter, and resume anytime.
          </p>
        </div>
        <LibraryBrowser all={all} continueWatching={continueWatching} recent={recent} />
      </main>
    </>
  );
}
