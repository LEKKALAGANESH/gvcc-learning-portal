import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import WatchExperience from "@/components/WatchExperience";
import type { BookmarkDTO, VideoDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireSession();
  const { slug } = await params;

  const video = await db.video.findUnique({ where: { slug } });
  if (!video) notFound();

  const [bookmarks, progress] = await Promise.all([
    db.bookmark.findMany({
      where: { userId: session.userId, videoId: video.id },
      orderBy: { timeSec: "asc" },
    }),
    db.progress.findUnique({
      where: { userId_videoId: { userId: session.userId, videoId: video.id } },
    }),
  ]);

  const videoDTO: VideoDTO = video;
  const bookmarkDTOs: BookmarkDTO[] = bookmarks.map((b) => ({
    id: b.id, label: b.label, timeSec: b.timeSec, videoId: b.videoId,
  }));
  const resumeAt = progress && !progress.completed ? progress.positionSec : 0;

  return (
    <>
      <Header name={session.name} />
      <main className="container" style={{ padding: "20px 20px 64px" }}>
        <Link href="/library" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
          ← Back to library
        </Link>
        <WatchExperience video={videoDTO} initialBookmarks={bookmarkDTOs} resumeAt={resumeAt} />
      </main>
    </>
  );
}
