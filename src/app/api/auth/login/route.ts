import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken, SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 8, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email } });
    // Same generic message whether email or password is wrong (no account enumeration).
    const ok = user && (await verifyPassword(password, user.passwordHash));
    if (!ok) {
      return NextResponse.json({ errors: { form: "Invalid email or password" } }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return res;
  } catch (e) {
    console.error("POST /api/auth/login", e);
    return NextResponse.json({ errors: { form: "Server error" } }, { status: 500 });
  }
}
