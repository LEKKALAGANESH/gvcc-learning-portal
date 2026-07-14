import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/session";
import { updateBookmarkSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, tooMany } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

const serverError = (where: string, e: unknown) => {
  console.error(where, e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
};

// PATCH /api/bookmarks/:id → rename (label). Ownership enforced in the WHERE clause.
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const rl = rateLimit(`bookmark:${session.userId}`, 30, 10_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const parsed = updateBookmarkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  try {
    // Single scoped write — 404 (not 403) hides existence of other users' rows.
    const { count } = await db.bookmark.updateMany({
      where: { id, userId: session.userId },
      data: { label: parsed.data.label?.trim() || null },
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const bookmark = await db.bookmark.findUnique({ where: { id } });
    return NextResponse.json({ bookmark });
  } catch (e) {
    return serverError("PATCH /api/bookmarks/[id]", e);
  }
}

// DELETE /api/bookmarks/:id → remove. Ownership enforced in the WHERE clause.
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const rl = rateLimit(`bookmark:${session.userId}`, 30, 10_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  try {
    const { count } = await db.bookmark.deleteMany({ where: { id, userId: session.userId } });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("DELETE /api/bookmarks/[id]", e);
  }
}
