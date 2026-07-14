import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/session";
import { createBookmarkSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, tooMany } from "@/lib/ratelimit";

const serverError = (where: string, e: unknown) => {
  console.error(where, e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
};

// GET /api/bookmarks?videoId=... → this user's bookmarks for one video (earliest first).
export async function GET(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const videoId = new URL(req.url).searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  try {
    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.userId, videoId },
      orderBy: { timeSec: "asc" },
    });
    return NextResponse.json({ bookmarks });
  } catch (e) {
    return serverError("GET /api/bookmarks", e);
  }
}

// POST /api/bookmarks → create a bookmark at a timestamp (multiple allowed per video).
export async function POST(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const rl = rateLimit(`bookmark:${session.userId}`, 30, 10_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const parsed = createBookmarkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { videoId, timeSec, label } = parsed.data;

  try {
    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    const bookmark = await db.bookmark.create({
      data: { userId: session.userId, videoId, timeSec, label: label?.trim() || null },
    });
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (e) {
    return serverError("POST /api/bookmarks", e);
  }
}
