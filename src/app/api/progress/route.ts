import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/session";
import { progressSchema, fieldErrors } from "@/lib/validation";
import { watchState } from "@/lib/progress";
import { rateLimit, tooMany } from "@/lib/ratelimit";

const serverError = (where: string, e: unknown) => {
  console.error(where, e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
};

// GET /api/progress → this user's watch rows (newest first) for continue-watching / recently.
export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  try {
    const progress = await db.progress.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      include: { video: true },
    });
    return NextResponse.json({ progress });
  } catch (e) {
    return serverError("GET /api/progress", e);
  }
}

// POST /api/progress → upsert the current position for a video (throttled by the client).
export async function POST(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const rl = rateLimit(`progress:${session.userId}`, 120, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const parsed = progressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { videoId, positionSec } = parsed.data;

  try {
    // Trust the server's own duration, never the client's — prevents forged "completed" state.
    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    const state = watchState(positionSec, video.durationSec);

    const progress = await db.progress.upsert({
      where: { userId_videoId: { userId: session.userId, videoId } },
      update: state,
      create: { userId: session.userId, videoId, ...state },
    });
    return NextResponse.json({ progress });
  } catch (e) {
    return serverError("POST /api/progress", e);
  }
}
